// lib/models/GuestProfile.ts
//
// Canonical identity record for a guest, independent of any single event
// registration. One GuestProfile per normalized email — every
// GuestEventRegistration for that person references it via guestProfileId.
//
// Two migration paths write to this document:
//   - Cold migrate (no account exists)   → migrationOtp fields, then
//                                           migratedToUserId/migratedAt
//   - Warm migrate (account already exists, matched at registration time)
//                                         → matchedUserId, mergeStatus,
//                                           firstShownAt, snoozedUntil,
//                                           then migratedToUserId/migratedAt
//
// migratedToUserId/migratedAt are also stamped on each individual
// GuestEventRegistration at migration time — this document is the
// canonical check, the per-registration stamp is the audit-trail copy.

import { ObjectId } from "mongodb";
import type { PhoneNumber } from "@/types/domain";

export type { PhoneNumber };

// ── Cold-migrate OTP state ──────────────────────────────────────────────────
export interface GuestMigrationOtp {
  code?: string;
  expiresAt?: Date;
  verifiedAt?: Date;
  /** Number of times a resend has been requested — drives the 2x backoff */
  resendCount: number;
  lastSentAt?: Date;
  /** Failed verification attempts — separate from resendCount */
  attempts: number;
}

// ── Warm-migrate (login-triggered) merge status ─────────────────────────────
export type GuestMergeStatus = "pending" | "snoozed" | "migrating" | "migrated";

export interface GuestProfileDocument {
  _id?: ObjectId;

  // ── Identity ──────────────────────────────────────────────────────────────
  email: string; // normalized: lowercase + trim — unique
  fullName: {
    firstname: string;
    lastname: string;
  };
  /**
   * Populated only at migration time, sourced from the new Vault/UserData
   * record (the migrate/guest page collects phone). Guest registrations
   * never collect phone in the current UI, so this stays unset until then.
   */
  phone?: PhoneNumber;

  // ── Warm match ────────────────────────────────────────────────────────────
  /**
   * Set at registration time if a real Vault account already existed for
   * this email. Drives the login-triggered merge popup. NOTE: this is a
   * convenience flag only — session-merge-check must independently scan by
   * email on every login regardless of this flag, since an account created
   * AFTER a guest registration would never have set it.
   */
  matchedUserId?: ObjectId; // → UserData._id

  // ── Cold-migrate OTP ──────────────────────────────────────────────────────
  migrationOtp?: GuestMigrationOtp;

  // ── Canonical migration status ───────────────────────────────────────────
  migratedToUserId?: ObjectId; // → UserData._id
  migratedAt?: Date;

  // ── Warm-migrate tracking ─────────────────────────────────────────────────
  /** Undefined until session-merge-check first evaluates this profile */
  mergeStatus?: GuestMergeStatus;
  /** When first detected eligible — starts the 48hr no-conflict auto-migrate window */
  firstShownAt?: Date;
  /** Set on "remind me later" — 24hr snooze */
  snoozedUntil?: Date;

  createdAt: Date;
  updatedAt: Date;
}