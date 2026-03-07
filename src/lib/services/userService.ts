// lib/services/userService.ts
// All UserData read/write logic lives here.
// Validates against domain.ts values exactly as defined.

import { Db, ObjectId } from "mongodb";
import { Collections } from "@/lib/db/collections";
import { UserDataDocument, PhoneNumber } from "@/lib/models/UserData";
import { COMMITTEES, SKILLS, Committee, Skill } from "@/types/domain";

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getUserProfile(
  db: Db,
  vaultId: ObjectId,
): Promise<UserDataDocument | null> {
  return Collections.userData(db).findOne({ vaultId });
}

// ─── Validation helpers ───────────────────────────────────────────────────────

export function validatePhone(phone: unknown): PhoneNumber | string {
  if (typeof phone !== "object" || phone === null) {
    return "phone must be { countryCode: number, phoneNumber: number }";
  }
  const p = phone as Record<string, unknown>;
  if (typeof p.countryCode !== "number" || typeof p.phoneNumber !== "number") {
    return "phone.countryCode and phone.phoneNumber must be numbers";
  }
  if (p.countryCode < 1 || p.phoneNumber < 1000000) {
    return "phone values are invalid";
  }
  return { countryCode: p.countryCode, phoneNumber: p.phoneNumber };
}

export function validateSkills(value: unknown): Skill[] | string {
  if (!Array.isArray(value)) return "skills must be an array";
  // domain.ts SKILLS: "photography" | "design" | "electronics" | "fashion" | "tech" | "programming"
  const invalid = (value as string[]).filter(
    (s) => !SKILLS.includes(s as Skill),
  );
  if (invalid.length > 0) {
    return `Invalid skills: ${invalid.join(", ")}. Valid values: ${SKILLS.join(", ")}`;
  }
  return value as Skill[];
}

// Returns a result object to avoid the string collision bug:
// valid committee values like "innovation" are strings, so the old
// typeof === "string" error check would falsely treat them as errors.
export function validateCommittee(
  value: unknown,
): { ok: true; value: Committee | null } | { ok: false; error: string } {
  if (value === null) return { ok: true, value: null };
  if (typeof value !== "string" || !COMMITTEES.includes(value as Committee)) {
    return {
      ok: false,
      error: `Invalid committee. Must be one of: ${COMMITTEES.join(", ")} or null`,
    };
  }
  return { ok: true, value: value as Committee };
}

// ─── Service result ───────────────────────────────────────────────────────────

export interface ServiceResult {
  error?: string;
  status?: number;
  updated?: UserDataDocument;
}

// ─── Update: basic profile ────────────────────────────────────────────────────

export interface UpdateProfilePayload {
  fullName?: unknown;
  avatar?: unknown;
  bio?: unknown;
  phone?: unknown;
}

export async function updateUserProfile(
  db: Db,
  vaultId: ObjectId,
  payload: UpdateProfilePayload,
): Promise<ServiceResult> {
  const $set: Record<string, unknown> = { updatedAt: new Date() };
  const errors: string[] = [];

  if (payload.fullName !== undefined) {
    if (typeof payload.fullName !== "string" || !payload.fullName.trim()) {
      errors.push("fullName must be a non-empty string");
    } else {
      $set["fullName"] = payload.fullName.trim();
    }
  }

  if (payload.avatar !== undefined) {
    if (typeof payload.avatar !== "string") {
      errors.push("avatar must be a string URL");
    } else {
      $set["avatar"] = payload.avatar.trim() || undefined;
    }
  }

  if (payload.bio !== undefined) {
    if (typeof payload.bio !== "string") {
      errors.push("bio must be a string");
    } else {
      $set["profile.bio"] = payload.bio.trim();
    }
  }

  if (payload.phone !== undefined) {
    const phone = validatePhone(payload.phone);
    if (typeof phone === "string") {
      errors.push(phone);
    } else {
      // Check uniqueness — another vault can't have this phone number
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

  if (errors.length > 0) return { error: errors.join(". "), status: 400 };

  await Collections.userData(db).updateOne({ vaultId }, { $set });
  const updated = await Collections.userData(db).findOne({ vaultId });
  return { updated: updated ?? undefined };
}

// ─── Update: institution ──────────────────────────────────────────────────────

export interface UpdateInstitutionPayload {
  Type?: unknown;
  name?: unknown;
  department?: unknown;
  faculty?: unknown;
  level?: unknown;
  semester?: unknown;
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

  const VALID_TYPES = ["University", "Polytechnic"] as const;
  const VALID_SEMESTERS = ["First", "Second"] as const;

  if (payload.Type !== undefined) {
    if (!VALID_TYPES.includes(payload.Type as (typeof VALID_TYPES)[number])) {
      errors.push(`Institution.Type must be one of: ${VALID_TYPES.join(", ")}`);
    } else {
      $set["Institution.Type"] = payload.Type;
    }
  }

  const stringFields = [
    "name",
    "department",
    "faculty",
    "level",
    "currentStatus",
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

  if (payload.graduationYear !== undefined) {
    const yr = Number(payload.graduationYear);
    if (isNaN(yr) || yr < 1990 || yr > 2100) {
      errors.push(
        "Institution.graduationYear must be a valid year (1990–2100)",
      );
    } else {
      $set["Institution.graduationYear"] = yr;
    }
  }

  if (errors.length > 0) return { error: errors.join(". "), status: 400 };

  // Recompute profileCompleted: fullName + Institution.name + Institution.department
  const current = await Collections.userData(db).findOne(
    { vaultId },
    { projection: { fullName: 1, Institution: 1 } },
  );
  const mergedInst = {
    ...current?.Institution,
    ...Object.fromEntries(
      Object.entries($set)
        .filter(([k]) => k.startsWith("Institution."))
        .map(([k, v]) => [k.replace("Institution.", ""), v]),
    ),
  };
  $set["profileCompleted"] = !!(
    current?.fullName &&
    mergedInst.name &&
    mergedInst.department
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
  const validated = validateSkills(skills);
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
  const result = validateCommittee(committee);
  if (!result.ok) return { error: result.error, status: 400 };

  await Collections.userData(db).updateOne(
    { vaultId },
    { $set: { committee: result.value, updatedAt: new Date() } },
  );
  const updated = await Collections.userData(db).findOne({ vaultId });
  return { updated: updated ?? undefined };
}

// ─── Strip internal fields before sending to client ──────────────────────────

export function sanitizeProfile(
  doc: UserDataDocument,
): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { vaultId: _vaultId, ...rest } = doc as UserDataDocument & {
    vaultId: unknown;
  };
  return rest as Record<string, unknown>;
}
