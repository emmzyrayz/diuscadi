// lib/models/Application.ts
import { ObjectId } from "mongodb";
import { Committee, Skill } from "@/types/domain";

export type ApplicationType = "committee" | "skill";
export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface ApplicationDocument {
  _id?: ObjectId;

  // ── Who applied ───────────────────────────────────────────────────────────
  userId: ObjectId; // → UserData._id
  vaultId: ObjectId; // → Vault._id (for auth checks)

  // ── What they applied for ─────────────────────────────────────────────────
  type: ApplicationType;
  value: Committee | Skill; // the specific committee or skill requested

  // ── Current value at time of application (for context in admin review) ────
  currentValue: Committee | Skill | null;

  // ── Status ────────────────────────────────────────────────────────────────
  status: ApplicationStatus;

  // ── Optional note from the applicant ─────────────────────────────────────
  note?: string;

  // ── Admin review ──────────────────────────────────────────────────────────
  reviewedBy?: ObjectId; // → Vault._id of admin/mod who reviewed
  reviewedAt?: Date;
  reviewNote?: string;

  createdAt: Date;
  updatedAt: Date;
}
