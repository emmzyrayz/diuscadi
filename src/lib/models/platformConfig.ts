// lib/models/PlatformConfig.ts
// ─────────────────────────────────────────────────────────────────────────────
// Documents for platform-managed lists: committees, skills, committeeRoles.
// All three collections are webmaster-managed and publicly readable.
// ─────────────────────────────────────────────────────────────────────────────

import { ObjectId } from "mongodb";

// ─── Committee ────────────────────────────────────────────────────────────────

export interface CommitteeDocument {
  _id?: ObjectId;

  /** Unique machine-readable key — used in CommitteeMembership.committee */
  slug: string; // e.g. "socials", "media"

  /** Display name shown in UI */
  name: string; // e.g. "Socials", "Media & Content"

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
   * Display name of the current committee head.
   * Denormalised string — updated manually by webmaster when head changes.
   * Keeping it as a string (not ObjectId) avoids a join on every public read.
   */
  headName?: string;

  /**
   * Live member count — maintained via $inc on membership assignment/removal.
   * Stored for fast display without aggregation.
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
  description: string;

  isActive: boolean;

  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
