// lib/services/userService.ts
// All UserData read/write logic lives here.
//
// updateUserProfile accepts all user-editable fields.
// Fields that require human/live verification are gated by a `locked` flag —
// set locked.phone = true (for example) to reject phone updates until
// your verification system clears it. Everything else remains optional.

import { Db, ObjectId } from "mongodb";
import { Collections } from "@/lib/db/collections";
import { UserDataDocument, PhoneNumber } from "@/lib/models/UserData";
import type { UserLocation } from "@/lib/models/UserData";
import {
  Committee,
  Skill,
  UserPreferences,
  DEFAULT_PREFERENCES,
  NotificationFrequency,
  ThemeMode,
  AccentColor,
  NOTIF_FREQS,
  THEME_MODES,
  ACCENT_COLORS,
} from "@/types/domain";

// ─── Feature locks ────────────────────────────────────────────────────────────
// Set any field to true to reject updates to it until your verification
// system clears the user. Flip these per-route or pass them into
// updateUserProfile as an argument when you build the verification layer.
//
// Default: all false (all updates allowed).
// Future: load from PlatformConfig or per-user verification flags.

export interface FieldLocks {
  phone?: boolean; // lock after phone is verified — prevent silent replacement
  fullName?: boolean; // lock after KYC/document verification
  location?: boolean; // lock if admin-only approval required
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getUserProfile(
  db: Db,
  vaultId: ObjectId,
): Promise<UserDataDocument | null> {
  return Collections.userData(db).findOne({ vaultId });
}

// ─── DB-driven list fetchers ──────────────────────────────────────────────────

async function getValidSkillSlugs(db: Db): Promise<string[]> {
  const skills = await Collections.skills(db)
    .find({ isActive: true }, { projection: { slug: 1, _id: 0 } })
    .toArray();
  return skills.map((s) => s.slug as string);
}

async function getValidCommitteeSlugs(db: Db): Promise<string[]> {
  const committees = await Collections.committees(db)
    .find({ isActive: true }, { projection: { slug: 1, _id: 0 } })
    .toArray();
  return committees.map((c) => c.slug as string);
}

// ─── Validation helpers ───────────────────────────────────────────────────────

export function validatePhone(phone: unknown): PhoneNumber | string {
  if (typeof phone !== "object" || phone === null)
    return "phone must be { countryCode: number, phoneNumber: number }";
  const p = phone as Record<string, unknown>;
  if (typeof p.countryCode !== "number" || typeof p.phoneNumber !== "number")
    return "phone.countryCode and phone.phoneNumber must be numbers";
  if (p.countryCode < 1 || p.phoneNumber < 1000000)
    return "phone values are invalid";
  return { countryCode: p.countryCode, phoneNumber: p.phoneNumber };
}

export async function validateSkills(
  db: Db,
  value: unknown,
): Promise<Skill[] | string> {
  if (!Array.isArray(value)) return "skills must be an array";
  const validSlugs = await getValidSkillSlugs(db);
  const invalid = (value as string[]).filter((s) => !validSlugs.includes(s));
  if (invalid.length > 0)
    return `Invalid skills: ${invalid.join(", ")}. Valid values: ${validSlugs.join(", ")}`;
  return value as Skill[];
}

export async function validateCommittee(
  db: Db,
  value: unknown,
): Promise<
  { ok: true; value: Committee | null } | { ok: false; error: string }
> {
  if (value === null) return { ok: true, value: null };
  const validSlugs = await getValidCommitteeSlugs(db);
  if (typeof value !== "string" || !validSlugs.includes(value))
    return {
      ok: false,
      error: `Invalid committee. Must be one of: ${validSlugs.join(", ")} or null`,
    };
  return { ok: true, value: value as Committee };
}

function validateLocation(loc: unknown): UserLocation | string {
  if (typeof loc !== "object" || loc === null)
    return "location must be an object";
  const l = loc as Record<string, unknown>;
  const clean: UserLocation = {};
  if (l.country !== undefined) {
    if (typeof l.country !== "string")
      return "location.country must be a string";
    clean.country = l.country.trim() || undefined;
  }
  if (l.state !== undefined) {
    if (typeof l.state !== "string") return "location.state must be a string";
    clean.state = l.state.trim() || undefined;
  }
  if (l.city !== undefined) {
    if (typeof l.city !== "string") return "location.city must be a string";
    clean.city = l.city.trim() || undefined;
  }
  if (l.lga !== undefined) {
    if (typeof l.lga !== "string") return "location.lga must be a string";
    clean.lga = l.lga.trim() || undefined;
  }
  // pendingVerification + raw fields — passed through as-is for admin review
  if (l.pendingVerification) clean.pendingVerification = true;
  if (l.rawCountry && typeof l.rawCountry === "string")
    clean.rawCountry = l.rawCountry.trim();
  if (l.rawState && typeof l.rawState === "string")
    clean.rawState = l.rawState.trim();
  if (l.rawCity && typeof l.rawCity === "string")
    clean.rawCity = l.rawCity.trim();
  return clean;
}

// ─── Service result ───────────────────────────────────────────────────────────

export interface ServiceResult {
  error?: string;
  status?: number;
  updated?: UserDataDocument;
}

// ─── Update: basic profile ────────────────────────────────────────────────────
// All fields optional. Add a field here to make it editable.
// Pass locks = { phone: true } to block a specific field (e.g. after verification).

export interface UpdateProfilePayload {
  fullName?: unknown;
  bio?: unknown;
  phone?: unknown;
  location?: unknown; // ← NEW
  socials?: unknown; // ← NEW (LinkedIn, GitHub, Twitter, portfolio)
}

export async function updateUserProfile(
  db: Db,
  vaultId: ObjectId,
  payload: UpdateProfilePayload,
  locks: FieldLocks = {}, // all unlocked by default
): Promise<ServiceResult> {
  const $set: Record<string, unknown> = { updatedAt: new Date() };
  const errors: string[] = [];

  // ── fullName ───────────────────────────────────────────────────────────────
  if (payload.fullName !== undefined) {
    if (locks.fullName) {
      errors.push("fullName is locked and cannot be updated at this time");
    } else if (
      typeof payload.fullName !== "object" ||
      payload.fullName === null
    ) {
      errors.push("fullName must be { firstname, lastname, secondname? }");
    } else {
      const fn = payload.fullName as Record<string, unknown>;
      if (typeof fn.firstname !== "string" || !fn.firstname.trim())
        errors.push("fullName.firstname is required");
      if (typeof fn.lastname !== "string" || !fn.lastname.trim())
        errors.push("fullName.lastname is required");
      if (fn.secondname !== undefined && typeof fn.secondname !== "string")
        errors.push("fullName.secondname must be a string if provided");
      if (errors.length === 0) {
        $set["fullName.firstname"] = (fn.firstname as string).trim();
        $set["fullName.lastname"] = (fn.lastname as string).trim();
        if (fn.secondname)
          $set["fullName.secondname"] = (fn.secondname as string).trim();
        else $set["fullName.secondname"] = undefined; // clear if omitted
      }
    }
  }

  // ── bio ────────────────────────────────────────────────────────────────────
  if (payload.bio !== undefined) {
    if (typeof payload.bio !== "string") {
      errors.push("bio must be a string");
    } else {
      $set["profile.bio"] = payload.bio.trim();
    }
  }

  // ── phone ──────────────────────────────────────────────────────────────────
  if (payload.phone !== undefined) {
    if (locks.phone) {
      errors.push("Phone number is locked — contact support to update it");
    } else {
      const phone = validatePhone(payload.phone);
      if (typeof phone === "string") {
        errors.push(phone);
      } else {
        const conflict = await Collections.vault(db).findOne({
          "phone.phoneNumber": phone.phoneNumber,
          _id: { $ne: vaultId },
        });
        if (conflict) {
          errors.push("Phone number is already registered to another account");
        } else {
          $set["phone"] = phone;
          // Mirror to Vault — auth lookups use phone stored there
          await Collections.vault(db).updateOne(
            { _id: vaultId },
            { $set: { phone, updatedAt: new Date() } },
          );
        }
      }
    }
  }

  // ── location ───────────────────────────────────────────────────────────────
  if (payload.location !== undefined) {
    if (locks.location) {
      errors.push("Location is locked and cannot be updated at this time");
    } else {
      const loc = validateLocation(payload.location);
      if (typeof loc === "string") {
        errors.push(loc);
      } else {
        // Replace the whole location object atomically — no partial merge
        $set["location"] = loc;
      }
    }
  }

  // ── socials ────────────────────────────────────────────────────────────────
  if (payload.socials !== undefined) {
    if (typeof payload.socials !== "object" || payload.socials === null) {
      errors.push("socials must be an object");
    } else {
      const s = payload.socials as Record<string, unknown>;
      const SOCIAL_KEYS = [
        "linkedin",
        "github",
        "twitter",
        "portfolio",
      ] as const;
      const clean: Record<string, string | undefined> = {};
      for (const key of SOCIAL_KEYS) {
        if (s[key] !== undefined) {
          if (typeof s[key] !== "string") {
            errors.push(`socials.${key} must be a string`);
          } else {
            clean[key] = (s[key] as string).trim() || undefined;
          }
        }
      }
      if (errors.length === 0) $set["socials"] = clean;
    }
  }

  if (errors.length > 0) return { error: errors.join(". "), status: 400 };

  // Only write if there's something to write beyond updatedAt
  if (Object.keys($set).length === 1) {
    const unchanged = await Collections.userData(db).findOne({ vaultId });
    return { updated: unchanged ?? undefined };
  }

  await Collections.userData(db).updateOne({ vaultId }, { $set });
  const updated = await Collections.userData(db).findOne({ vaultId });
  return { updated: updated ?? undefined };
}

// ─── Update: institution ──────────────────────────────────────────────────────
// Extended to handle the new ObjectId ref + denormalised name fields
// coming from the 3-step modal (ProInfo.tsx → /api/users/institution).

export interface UpdateInstitutionPayload {
  // New ref + denormalised fields
  institutionId?: unknown;
  name?: unknown;
  abbreviation?: unknown;
  Type?: unknown;
  facultyId?: unknown;
  faculty?: unknown;
  departmentId?: unknown;
  department?: unknown;
  degreeType?: unknown;
  durationYears?: unknown;
  // Existing fields
  level?: unknown;
  semester?: unknown;
  enrollmentYear?: unknown;
  graduationYear?: unknown;
  currentStatus?: unknown;
}

export async function updateUserInstitution(
  db: Db,
  vaultId: ObjectId,
  payload: UpdateInstitutionPayload,
): Promise<ServiceResult> {
  const $set: Record<string, unknown> = { updatedAt: new Date() };
  const errors: string[] = [];

  // ObjectId ref fields — convert string → ObjectId
  const objectIdFields = [
    "institutionId",
    "facultyId",
    "departmentId",
  ] as const;
  for (const field of objectIdFields) {
    const val = payload[field];
    if (val !== undefined) {
      if (typeof val !== "string" || !ObjectId.isValid(val as string)) {
        errors.push(`Institution.${field} must be a valid ObjectId string`);
      } else {
        $set[`Institution.${field}`] = new ObjectId(val as string);
      }
    }
  }

  // Denormalised string fields
  const stringFields = [
    "name",
    "abbreviation",
    "faculty",
    "department",
    "degreeType",
    "level",
  ] as const;
  for (const field of stringFields) {
    const val = payload[field];
    if (val !== undefined) {
      if (typeof val !== "string") {
        errors.push(`Institution.${field} must be a string`);
      } else {
        $set[`Institution.${field}`] = val.trim() || undefined;
      }
    }
  }

  // durationYears — { min, max }
  if (payload.durationYears !== undefined) {
    const d = payload.durationYears as Record<string, unknown>;
    if (
      typeof d?.min !== "number" ||
      typeof d?.max !== "number" ||
      d.min > d.max
    ) {
      errors.push(
        "Institution.durationYears must be { min: number, max: number } with min ≤ max",
      );
    } else {
      $set["Institution.durationYears"] = { min: d.min, max: d.max };
    }
  }

  // Type
  const VALID_TYPES = [
    "University",
    "Polytechnic",
    "College",
    "Institute",
  ] as const;
  if (payload.Type !== undefined) {
    if (!VALID_TYPES.includes(payload.Type as (typeof VALID_TYPES)[number])) {
      errors.push(`Institution.Type must be one of: ${VALID_TYPES.join(", ")}`);
    } else {
      $set["Institution.Type"] = payload.Type;
    }
  }

  // currentStatus
  const VALID_STATUSES = ["Graduate", "Student"] as const;
  if (payload.currentStatus !== undefined) {
    if (
      !VALID_STATUSES.includes(
        payload.currentStatus as (typeof VALID_STATUSES)[number],
      )
    ) {
      errors.push(
        `Institution.currentStatus must be one of: ${VALID_STATUSES.join(", ")}`,
      );
    } else {
      $set["Institution.currentStatus"] = payload.currentStatus;
    }
  }

  // semester
  const VALID_SEMESTERS = ["First", "Second"] as const;
  if (payload.semester !== undefined) {
    if (
      !VALID_SEMESTERS.includes(
        payload.semester as (typeof VALID_SEMESTERS)[number],
      )
    ) {
      errors.push(
        `Institution.semester must be one of: ${VALID_SEMESTERS.join(", ")}`,
      );
    } else {
      $set["Institution.semester"] = payload.semester;
    }
  }

  // Year fields
  for (const field of ["enrollmentYear", "graduationYear"] as const) {
    if (payload[field] !== undefined) {
      const yr = Number(payload[field]);
      if (isNaN(yr) || yr < 1990 || yr > 2100) {
        errors.push(`Institution.${field} must be a valid year (1990–2100)`);
      } else {
        $set[`Institution.${field}`] = yr;
      }
    }
  }

  if (errors.length > 0) return { error: errors.join(". "), status: 400 };

  // Recompute profileCompleted
  const current = await Collections.userData(db).findOne(
    { vaultId },
    { projection: { fullName: 1, Institution: 1, hasAvatar: 1 } },
  );
  const mergedInst = {
    ...(current?.Institution ?? {}),
    ...Object.fromEntries(
      Object.entries($set)
        .filter(([k]) => k.startsWith("Institution."))
        .map(([k, v]) => [k.replace("Institution.", ""), v]),
    ),
  };
  $set["profileCompleted"] = !!(
    current?.fullName?.firstname &&
    current?.fullName?.lastname &&
    mergedInst.name &&
    mergedInst.department &&
    current?.hasAvatar
  );

  await Collections.userData(db).updateOne({ vaultId }, { $set });
  const updated = await Collections.userData(db).findOne({ vaultId });
  return { updated: updated ?? undefined };
}

// ─── Update: skills ───────────────────────────────────────────────────────────

export async function updateUserSkills(
  db: Db,
  vaultId: ObjectId,
  skills: unknown,
): Promise<ServiceResult> {
  const validated = await validateSkills(db, skills);
  if (typeof validated === "string") return { error: validated, status: 400 };
  await Collections.userData(db).updateOne(
    { vaultId },
    { $set: { skills: validated, updatedAt: new Date() } },
  );
  const updated = await Collections.userData(db).findOne({ vaultId });
  return { updated: updated ?? undefined };
}

// ─── Update: committee ────────────────────────────────────────────────────────

export async function updateUserCommittee(
  db: Db,
  vaultId: ObjectId,
  committee: unknown,
): Promise<ServiceResult> {
  const result = await validateCommittee(db, committee);
  if (!result.ok) return { error: result.error, status: 400 };
  await Collections.userData(db).updateOne(
    { vaultId },
    { $set: { committee: result.value, updatedAt: new Date() } },
  );
  const updated = await Collections.userData(db).findOne({ vaultId });
  return { updated: updated ?? undefined };
}

// ─── Preferences ──────────────────────────────────────────────────────────────

export function mergeWithDefaults(
  partial: Partial<UserPreferences> | undefined,
): UserPreferences {
  if (!partial) return DEFAULT_PREFERENCES;
  return {
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...partial.notifications,
    },
    appearance: { ...DEFAULT_PREFERENCES.appearance, ...partial.appearance },
    privacy: { ...DEFAULT_PREFERENCES.privacy, ...partial.privacy },
  };
}

export function validatePreferences(
  body: Record<string, unknown>,
):
  | { ok: true; patch: Partial<Record<string, unknown>> }
  | { ok: false; error: string } {
  const patch: Record<string, unknown> = {};

  if ("notifications" in body) {
    const n = body.notifications as Record<string, unknown>;
    if (
      n.frequency !== undefined &&
      !NOTIF_FREQS.includes(n.frequency as NotificationFrequency)
    )
      return {
        ok: false,
        error: `frequency must be one of: ${NOTIF_FREQS.join(", ")}`,
      };
    for (const key of [
      "tickets",
      "reminders",
      "messages",
      "marketing",
    ] as const) {
      if (key in n && typeof n[key] !== "boolean")
        return { ok: false, error: `notifications.${key} must be boolean` };
    }
    patch["preferences.notifications"] = n;
  }

  if ("appearance" in body) {
    const a = body.appearance as Record<string, unknown>;
    if (a.theme !== undefined && !THEME_MODES.includes(a.theme as ThemeMode))
      return {
        ok: false,
        error: `theme must be one of: ${THEME_MODES.join(", ")}`,
      };
    if (
      a.accent !== undefined &&
      !ACCENT_COLORS.includes(a.accent as AccentColor)
    )
      return {
        ok: false,
        error: `accent must be one of: ${ACCENT_COLORS.join(", ")}`,
      };
    patch["preferences.appearance"] = a;
  }

  if ("privacy" in body) {
    const p = body.privacy as Record<string, unknown>;
    for (const key of ["profilePrivate", "showEmail", "showPhone"] as const) {
      if (key in p && typeof p[key] !== "boolean")
        return { ok: false, error: `privacy.${key} must be boolean` };
    }
    patch["preferences.privacy"] = p;
  }

  if (Object.keys(patch).length === 0)
    return { ok: false, error: "No valid preference fields provided" };
  return { ok: true, patch };
}

export async function getUserPreferences(
  db: Db,
  vaultId: ObjectId,
): Promise<UserPreferences> {
  const doc = await Collections.userData(db).findOne(
    { vaultId },
    { projection: { preferences: 1 } },
  );
  return mergeWithDefaults(
    doc?.preferences as Partial<UserPreferences> | undefined,
  );
}

export async function updateUserPreferences(
  db: Db,
  vaultId: ObjectId,
  body: Record<string, unknown>,
): Promise<ServiceResult> {
  const validation = validatePreferences(body);
  if (!validation.ok) return { error: validation.error, status: 400 };
  await Collections.userData(db).updateOne(
    { vaultId },
    { $set: { ...validation.patch, updatedAt: new Date() } },
  );
  const prefs = await getUserPreferences(db, vaultId);
  return { updated: { preferences: prefs } as unknown as UserDataDocument };
}

// ─── Sanitize — strip internal fields before sending to client ────────────────

export function sanitizeProfile(
  doc: UserDataDocument,
): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { vaultId: _vaultId, ...rest } = doc as UserDataDocument & {
    vaultId: unknown;
  };
  return rest as Record<string, unknown>;
}
