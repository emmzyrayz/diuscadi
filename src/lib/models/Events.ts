// lib/models/Event.ts
import { ObjectId } from "mongodb";
import { CloudinaryImage } from "@/types/cloudinary";

export type EventFormat = "physical" | "virtual" | "hybrid";
export type EventStatus = "draft" | "published" | "cancelled";
export type EventLevel = "Beginner" | "Intermediate" | "Advanced";
export type LocationScope = "local" | "state" | "national";
export type TargetEduStatus = "STUDENT" | "GRADUATE" | "ALL";

export interface EventDocument {
  _id?: ObjectId;

  // ── Identity ──────────────────────────────────────────────────────────────
  slug: string; // e.g. "summit-2026" — unique, URL-safe
  title: string;
  overview: string;
  learningOutcomes: string[];

  // ── Classification ────────────────────────────────────────────────────────
  category: string;
  tags: string[];
  level?: EventLevel;
  description: string;
  shortDescription: string;

  // ── Targeting (personalized feed filtering) ───────────────────────────────
  requiredSkills: string[]; // matched against user.skills
  targetEduStatus: TargetEduStatus; // "student" | "graduate" | "all"
  locationScope: LocationScope; // "local" | "state" | "national"

  // ── Speaker / instructor ──────────────────────────────────────────────────
  instructor?: string;

  // ── Format + location ─────────────────────────────────────────────────────
  format: EventFormat;
  location?: {
    venue?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };

  // ── Scheduling ────────────────────────────────────────────────────────────
  eventDate: Date;
  endDate?: Date;
  registrationDeadline: Date;
  duration?: string; // e.g. "2 hours", "3 days"

  // ── Capacity ──────────────────────────────────────────────────────────────
  // slotsRemaining is NOT stored — calculated dynamically via aggregation.
  capacity: number;

  // ── Media ─────────────────────────────────────────────────────────────────
  /**
   * Primary event identity image (square / round logo).
   * Optional — some events may be created before assets are ready.
   */
  hasEventLogo: boolean;
  eventLogo?: CloudinaryImage; // tag: "event-logo"

  /**
   * Wide hero / cover image shown at the top of the event page.
   * Optional — limited or low-budget events may skip this.
   */
  hasEventBanner: boolean;
  eventBanner?: CloudinaryImage; // tag: "event-banner"

  /**
   * Photo gallery for the event (before, during, or after shots).
   * Optional array — may be empty or absent for future/draft events.
   */
  hasEventGallery: boolean;
  eventGallery?: CloudinaryImage[]; // tag: "event-gallery" on each item

  // ── Status ────────────────────────────────────────────────────────────────
  status: EventStatus;

  // ── Ownership ─────────────────────────────────────────────────────────────
  createdBy: ObjectId; // → Vault._id of admin who created it

  createdAt: Date;
  updatedAt: Date;
}
