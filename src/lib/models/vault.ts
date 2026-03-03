// lib/models/vault.ts
import { ObjectId } from "mongodb";
import { EduStatus, AccountRole, PhoneNumber } from "@/types/domain";

export type { EduStatus, AccountRole, PhoneNumber };

export interface VaultDocument {
  _id?: ObjectId;

  // ── Primary identifiers ───────────────────────────────────────────────────
  email: string; // required, unique — personal email
  passwordHash: string;

  // ── Phone (required, unique — second signin identifier) ───────────────────
  // Unique index on phone.phoneNumber.
  // Mirrored to UserData for display.
  phone: PhoneNumber;

  // ── Access control ────────────────────────────────────────────────────────
  role: AccountRole; // source of truth — mirrored to UserData
  eduStatus: EduStatus;

  // ── Account state ─────────────────────────────────────────────────────────
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isAccountActive: boolean;

  // ── Email verification (OTP + magic link) ─────────────────────────────────
  emailVerificationCode?: string;
  emailVerificationExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationTokenExpires?: Date;

  // ── Phone verification (OTP only — SMS) ──────────────────────────────────
  phoneVerificationCode?: string;
  phoneVerificationExpires?: Date;

  // ── Password reset (OTP + magic link) ─────────────────────────────────────
  resetPasswordCode?: string;
  resetPasswordExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordTokenExpires?: Date;

  // ── Security ──────────────────────────────────────────────────────────────
  tokenVersion: number;
  lastLoginAt?: Date;

  verificationResendCount: number;
  verificationResendLastAt?: Date;

  // ── Cross-reference ───────────────────────────────────────────────────────
  userId: ObjectId; // → UserData._id

  createdAt: Date;
  updatedAt: Date;
}
