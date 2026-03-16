// lib/models/UserData.ts
import { ObjectId } from "mongodb";
import { CloudinaryImage } from "@/types/cloudinary";
import { SemesterGPARecord } from "@/types/academic";
import {
  EduStatus,
  AccountRole,
  Committee,
  CommitteeMembership,
  Skill,
  PhoneNumber,
  UserPreferences,
} from "@/types/domain";

export type {
  EduStatus,
  AccountRole,
  Committee,
  CommitteeMembership,
  Skill,
  PhoneNumber,
  UserPreferences,
};

export interface UserDataDocument {
  _id?: ObjectId;

  vaultId: ObjectId; // → Vault._id

  // ── Identity ──────────────────────────────────────────────────────────────
  fullName: {
    firstname: string;
    secondname?: string;
    lastname: string;
  };
  email: string; // personal email (mirrored from Vault)

  // ── Avatar ────────────────────────────────────────────────────────────────
  hasAvatar: boolean;
  avatar?: CloudinaryImage; // tag: "avatar"

  // ── Phone (mirrored from Vault for display) ───────────────────────────────
  phone: PhoneNumber;

  location?: {
    country?: string;
    state?: string;
    city?: string;
  };

  // ── Role (mirrored from Vault — Vault is source of truth) ─────────────────
  role: AccountRole;

  // ── Org profile ───────────────────────────────────────────────────────────
  eduStatus: EduStatus;

  Institution?: {
    Type?: "University" | "Polytechnic";
    name?: string;
    department?: string;
    faculty?: string;
    semester?: "First" | "Second";

    // ── Students ──────────────────────────────────────────────────────────
    /**
     * Year the student enrolled, e.g. 2023.
     * Derive year-of-study as: currentAcademicYear - enrollmentYear + 1.
     * Never store a "level" string that goes stale — compute it.
     */
    enrollmentYear?: number;

    level?: string; // display convenience e.g. "300 Level" — not source of truth

    // ── School email ──────────────────────────────────────────────────────
    schoolEmail?: string; // sparse unique index
    verifiedSchoolEmail: boolean;
    RegistrationNumber?: string;

    // ── Graduates ─────────────────────────────────────────────────────────
    graduationYear?: number;
    currentStatus?: "Graduate" | "Student";

    // ── Academic record ───────────────────────────────────────────────────
    /**
     * One entry per semester. Each entry contains all courses for that
     * semester with credit units and grades entered by the student.
     *
     * Append-only in normal usage — never delete past semesters.
     * Sorted by session + semester for display (sort in application layer).
     */
    gpaRecord: SemesterGPARecord[];

    /**
     * Cumulative GPA across all submitted semesters.
     * Formula: Σ(qualityPoints) / Σ(creditUnits) across all submitted records.
     * Recalculated automatically:
     *   - When a student submits or edits a SemesterGPARecord.
     *   - When an admin manually triggers recalculation.
     * Rounded to 2 decimal places. Null until at least one semester is submitted.
     */
    cgpa: number | null;

    /**
     * ISO-8601 timestamp of the last CGPA recalculation.
     * Shown in UI so students/admins know how fresh the value is.
     */
    cgpaLastCalculatedAt?: string;
  };

  // ── Social links ──────────────────────────────────────────────────────────
  socials?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
  };

  // One committee membership per user. null = not in any committee yet.
  committeeMembership: CommitteeMembership | null;

  // Multiple skills. [] = not yet set.
  skills: Skill[];

  // ── Profile ───────────────────────────────────────────────────────────────
  profileCompleted: boolean;

  profile?: {
    bio?: string;
  };

  // ── Membership ────────────────────────────────────────────────────────────
  membershipStatus: "pending" | "approved" | "suspended";

  // ── Referral ──────────────────────────────────────────────────────────────
  signupInviteCode: string;
  referredBy?: ObjectId; // → UserData._id of referring member

  // ── Event tracking ────────────────────────────────────────────────────────
  analytics: {
    eventsRegistered: number;
    eventsAttended: number;
    lastEventRegisteredAt?: Date;
    lastActiveAt?: Date;
  };

  // ── Preferences ───────────────────────────────────────────────────────────
  preferences: UserPreferences;

  createdAt: Date;
  updatedAt: Date;
}
