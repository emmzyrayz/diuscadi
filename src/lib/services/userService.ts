// lib/services/userService.ts
// All UserData read/write logic lives here.
// Routes import from here — keeping handlers thin and logic testable.

import { Db, ObjectId, Filter, UpdateFilter } from "mongodb";
import { Collections } from "@/lib/db/collections";
import { UserDataDocument, PhoneNumber } from "@/lib/models/UserData";
import {
  COMMITTEES,
  SKILLS,
  Committee,
  Skill,
  EduStatus,
} from "@/types/domain";

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
    return "phone must be an object { countryCode: number, phoneNumber: number }";
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

export function validateEduStatus(value: unknown): value is EduStatus {
  return value === "STUDENT" || value === "GRADUATE";
}

export function validateSkills(value: unknown): Skill[] | string {
  if (!Array.isArray(value)) return "skills must be an array";
  const invalid = (value as string[]).filter(
    (s) => !SKILLS.includes(s as Skill),
  );
  if (invalid.length > 0) {
    return `Invalid skills: ${invalid.join(", ")}. Valid: ${SKILLS.join(", ")}`;
  }
  return value as Skill[];
}

export function validateCommittee(value: unknown): Committee | null | string {
  if (value === null) return null;
  if (!COMMITTEES.includes(value as Committee)) {
    return `Invalid committee. Must be one of: ${COMMITTEES.join(", ")} or null`;
  }
  return value as Committee;
}

// ─── Update: basic profile ────────────────────────────────────────────────────

export interface UpdateProfilePayload {
  fullName?: string;
  avatar?: string;
  bio?: string;
  phone?: unknown;
}

export interface ServiceResult {
  error?: string;
  status?: number;
  updated?: UserDataDocument;
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
      // Check uniqueness across other users
      const conflict = await Collections.vault(db).findOne({
        "phone.phoneNumber": phone.phoneNumber,
        _id: { $ne: vaultId },
      });
      if (conflict) {
        errors.push("Phone number is already registered to another account");
      } else {
        $set["phone"] = phone;
        // Mirror to Vault — phone is stored in both for auth lookups
        await Collections.vault(db).updateOne(
          { _id: vaultId },
          { $set: { phone, updatedAt: new Date() } },
        );
      }
    }
  }

  if (errors.length > 0) {
    return { error: errors.join(". "), status: 400 };
  }

  await Collections.userData(db).updateOne({ vaultId }, { $set });

  const updated = await Collections.userData(db).findOne({ vaultId });
  return { updated: updated ?? undefined };
}

// ─── Update: institution ──────────────────────────────────────────────────────

export interface UpdateInstitutionPayload {
  Type?: string;
  name?: string;
  department?: string;
  faculty?: string;
  level?: string;
  semester?: string;
  graduationYear?: unknown;
  currentStatus?: string;
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
    if (payload[field] !== undefined) {
      if (typeof payload[field] !== "string") {
        errors.push(`Institution.${field} must be a string`);
      } else {
        $set[`Institution.${field}`] =
          (payload[field] as string).trim() || undefined;
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
        "Institution.graduationYear must be a valid year between 1990 and 2100",
      );
    } else {
      $set["Institution.graduationYear"] = yr;
    }
  }

  if (errors.length > 0) {
    return { error: errors.join(". "), status: 400 };
  }

  // Recompute profileCompleted after institution update
  const current = await Collections.userData(db).findOne({ vaultId });
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
  if (typeof validated === "string") {
    return { error: validated, status: 400 };
  }

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
  const validated = validateCommittee(committee);
  if (typeof validated === "string") {
    return { error: validated, status: 400 };
  }

  await Collections.userData(db).updateOne(
    { vaultId },
    { $set: { committee: validated, updatedAt: new Date() } },
  );
  const updated = await Collections.userData(db).findOne({ vaultId });
  return { updated: updated ?? undefined };
}

// ─── Strip internal fields before sending to client ──────────────────────────
// Never expose vaultId, analytics internals, or signupInviteCode unless needed.

export function sanitizeProfile(
  doc: UserDataDocument,
): Record<string, unknown> {
  const {
    vaultId: _vaultId, // internal reference — not needed by client
    ...rest
  } = doc as UserDataDocument & { vaultId: unknown };
  return rest as Record<string, unknown>;
}
