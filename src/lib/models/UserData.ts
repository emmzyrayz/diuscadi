// lib/models/UserData.ts
import { ObjectId } from "mongodb";
import {
  EduStatus,
  AccountRole,
  Committee,
  Skill,
  PhoneNumber,
} from "@/types/domain";

export type { EduStatus, AccountRole, Committee, Skill, PhoneNumber };

export interface UserDataDocument {
  _id?: ObjectId;

  vaultId: ObjectId; // → Vault._id

  // ── Identity ──────────────────────────────────────────────────────────────
  fullName: string;
  email: string; // personal email (mirrored from Vault)
  avatar?: string;

  // ── Phone (mirrored from Vault for display) ───────────────────────────────
  phone: PhoneNumber;

  location?: {
    country?: string;
    state?: string;
    city?: string;
  };

  // ── School email (optional — students with active institutional email) ─────
  // Sparse unique index — two users can both have null, but not the same address.
  schoolEmail?: string;

  // ── Role (mirrored from Vault — Vault is source of truth) ─────────────────
  role: AccountRole;

  // ── Org profile ───────────────────────────────────────────────────────────
  eduStatus: EduStatus;

  Institution?: {
    Type?: "University" | "Polytechnic";
    name?: string;
    department?: string;
    faculty?: string;
    level?: string;
    semester?: "First" | "Second";
    graduationYear?: number; // graduates only
    currentStatus?: string; // graduates only
  };

  // One committee per user. null = not yet assigned.
  committee: Committee | null;

  // Multiple skills. [] = not yet set.
  skills: Skill[];

  // ── Profile ───────────────────────────────────────────────────────────────
  profileCompleted: boolean;

  profile?: {
    bio?: string;
  };

  // ── Membership ────────────────────────────────────────────────────────────
  membershipStatus: "pending" | "approved" | "suspended";

  // ── Invite code (unique per user, generated at signup) ────────────────────
  signupInviteCode: string;

  // ── Event tracking ────────────────────────────────────────────────────────
  analytics: {
    eventsRegistered: number;
    eventsAttended: number;
    lastEventRegisteredAt?: Date;
  };

  // inviteCodes: {
  //   eventId: ObjectId;
  //   code: string;
  //   issuedAt: Date;
  //   checkedIn: boolean;
  //   checkedInAt?: Date;
  // }[];

  createdAt: Date;
  updatedAt: Date;
}
