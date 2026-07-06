// lib/models/platformConfig.ts
// ─────────────────────────────────────────────────────────────────────────────
// Documents for platform-managed lists: committees, skills, committeeRoles.
// All three collections are webmaster-managed and publicly readable.
// ─────────────────────────────────────────────────────────────────────────────

// Key-value store for all platform-wide feature flags and config values.
// One document per key. Read by GET /api/platform/config (public).
// Written by PATCH /api/admin/settings (admin/webmaster only).

import { ObjectId } from "mongodb";

// ─── Committee ────────────────────────────────────────────────────────────────

export interface CommitteeDocument {
  _id?: ObjectId;

  /** Unique machine-readable key — used in CommitteeMembership.committee */
  slug: string; // e.g. "socials", "media"

  /** Display name shown in UI */
  name: string; // e.g. "Socials", "Media & Content"

  /**
   * One-liner shown in the selector deck on the public showcase.
   * Keep under ~80 chars. Full detail goes in `description`.
   */
  shortDesc?: string;

  /** Full mandate — shown in the inspector panel on the public showcase */
  description: string; // shown on committee page + application form

  /**
   * Tailwind color token or hex — used to tint committee badges + cards.
   * e.g. "emerald", "violet", "#f59e0b"
   */
  color: string;

  /**
   * Icon identifier — matches whatever icon library you're using.
   * e.g. "megaphone", "camera", "truck"
   */
  icon: string;

  /**
   * WhatsApp group invite link for this committee.
   * Shown only to approved members inside PrivateCommitteeDashboard.
   */
  whatsappLink?: string;

  /**
   * Display name of the current committee head.
   * Denormalised string — updated manually by webmaster when head changes.
   */
  headName?: string;

  /**
   * Live member count — maintained via $inc on membership assignment/removal.
   */
  memberCount: number;

  isActive: boolean;

  /** Sort order for display — lower = shown first */
  displayOrder: number;

  createdBy: ObjectId; // → Vault._id of webmaster who created it
  createdAt: Date;
  updatedAt: Date;
}

// ─── Skill ────────────────────────────────────────────────────────────────────

export type SkillCategory =
  | "Creative"
  | "Technical"
  | "Business"
  | "Communication"
  | "Other";

export interface SkillDocument {
  _id?: ObjectId;

  /** Unique machine-readable key — stored in UserData.skills[] */
  slug: string; // e.g. "photography", "programming"

  /** Display name */
  name: string; // e.g. "Photography", "Programming"

  category: SkillCategory;

  isActive: boolean;

  /** Sort order within category — lower = shown first */
  displayOrder: number;

  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── CommitteeRole ────────────────────────────────────────────────────────────

export interface CommitteeRoleDocument {
  _id?: ObjectId;

  /** Unique machine-readable key — stored in CommitteeMembership.role */
  slug: string; // e.g. "MEMBER", "COORDINATOR", "HEAD", "ADMIN"

  /** Display name */
  name: string; // e.g. "Member", "Coordinator"

  /**
   * Numeric rank — used for sorting and permission comparisons.
   * Higher = more authority. e.g. MEMBER=1, COORDINATOR=2, HEAD=3, ADMIN=4
   */
  rank: number;

  /** Human-readable summary of what this role can do — shown in admin UI */
  description?: string;

  isActive: boolean;

  displayOrder: number;

  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Platform Config Keys ─────────────────────────────────────────────────────

export type PlatformConfigKey =
  // ── Access control ─────────────────────────────────────────────────────
  | "inviteMode" // "open" | "lockdown" | "referral"
  | "registrationOpen" // boolean
  | "eventsOpen" // boolean
  | "applicationsOpen" // boolean
  | "maintenanceMode" // boolean

  // ── Registration fees ──────────────────────────────────────────────────
  | "registrationFee" // number (NGN)

  // ── Referral rewards ───────────────────────────────────────────────────
  // Fixed point values per referral depth level.
  // Depth 1 = direct referral (user signed up using this user's invite code).
  // Depth 2 = indirect (the person this user referred, referred someone else).
  // Depth 3 = one level deeper indirect.
  // referralMaxDepth caps how far down the tree rewards propagate (1–3).
  // referralDiscountPercent = % discount applied to the referee's event
  //   ticket when they register using a referral code.
  | "referralBonusPoints" // number — depth-1 reward for referrer
  | "referralDepth2BonusPoints" // number — depth-2 reward for referrer
  | "referralDepth3BonusPoints" // number — depth-3 reward for referrer
  | "referralMaxDepth" // number — 1 | 2 | 3 (default 3)
  | "referralDiscountPercent" // number (0–100) — applied to referee's ticket

  // ── UI toggles ─────────────────────────────────────────────────────────
  | "showBanners" // boolean
  | "showGallery" // boolean

  // ── Debug mode ─────────────────────────────────────────────────────────
  | "debugMode" // boolean
  | "debugTargets"; // string[] — userIds or ["all"]

export type PlatformConfigValue = string | number | boolean | string[] | null;

export interface PlatformConfigDocument {
  _id?: ObjectId;
  key: PlatformConfigKey;
  value: PlatformConfigValue;
  updatedAt: Date;
  updatedBy: ObjectId; // → Vault._id
}

// ─── Defaults ────────────────────────────────────────────────────────────────
// Used when seeding or when a key is missing from the DB.
// Referral depth rewards decay: 50 → 25 → 10 points.
// Admin can override all of these from the settings page.

export const PLATFORM_CONFIG_DEFAULTS: Record<
  PlatformConfigKey,
  PlatformConfigValue
> = {
  inviteMode: "open",
  registrationOpen: true,
  eventsOpen: true,
  applicationsOpen: true,
  maintenanceMode: false,
  registrationFee: 0,

  // Referral reward ladder
  referralBonusPoints: 50, // depth 1 — direct referral
  referralDepth2BonusPoints: 25, // depth 2 — indirect
  referralDepth3BonusPoints: 10, // depth 3 — deeper indirect
  referralMaxDepth: 3, // propagate rewards up to 3 levels deep
  referralDiscountPercent: 10, // 10% off event ticket for the referee

  showBanners: true,
  showGallery: true,
  debugMode: false,
  debugTargets: [],
};
