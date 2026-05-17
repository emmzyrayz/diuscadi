import { ObjectId } from "mongodb";

export type AnnouncementType =
  | "Update"
  | "New"
  | "Alert"
  | "Event"
  | "Deadline"
  | "Achievement"
  | "Maintenance";

export type AnnouncementAudience =
  | "global" // everyone
  | "students" // eduStatus === "STUDENT"
  | "graduates" // eduStatus === "GRADUATE"
  | "committee" // specific committee only
  | "members"; // membershipStatus === "approved" only

export interface AnnouncementDocument {
  _id?: ObjectId;

  // ── Content ───────────────────────────────────────────────────────────────
  title: string;
  desc: string;
  type: AnnouncementType;

  // ── Targeting ─────────────────────────────────────────────────────────────
  audience: AnnouncementAudience;
  targetCommittee?: string; // slug — only used when audience === "committee"
  // Future: targetSkills?: string[];  // when skills-based targeting is needed

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  published: boolean; // false = draft, not visible to users
  publishedAt?: Date; // set when published flips to true
  expiresAt?: Date | null; // if set, hidden after this date automatically

  // ── Link (optional CTA) ───────────────────────────────────────────────────
  ctaLabel?: string; // e.g. "Register Now"
  ctaHref?: string; // e.g. "/events/lascadss-7"

  // ── Ownership ─────────────────────────────────────────────────────────────
  createdBy: ObjectId; // → Vault._id
  updatedBy?: ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

// ── Read tracking ─────────────────────────────────────────────────────────────
// Separate collection — one doc per user per announcement.
// Kept separate to avoid unbounded array growth on AnnouncementDocument.

export interface AnnouncementReadDocument {
  _id?: ObjectId;
  announcementId: ObjectId; // → Announcement._id
  userId: ObjectId; // → UserData._id
  readAt: Date;
}
