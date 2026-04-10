// lib/models/Institution.ts
// ─────────────────────────────────────────────────────────────────────────────
// MongoDB collection: `institutions`
// Extended with all fields from the Nigerian schools dataset + schema fields.
// Faculties and departments live in their own collections — linked via ObjectId[].
// Campuses live in their own collection — linked via institutionId.
// ─────────────────────────────────────────────────────────────────────────────

import { ObjectId } from "mongodb";
import { CloudinaryImage } from "@/types/cloudinary";
import { GradingSystem, ApprovedCurriculumEntry } from "@/types/academic";

export type InstitutionType =
  | "University"
  | "Polytechnic"
  | "College"
  | "Institute";
export type InstitutionMembership = "public" | "private";
export type InstitutionLevel = "federal" | "state" | "private";

export interface InstitutionDocument {
  _id?: ObjectId;

  // ── Identity ──────────────────────────────────────────────────────────────
  name: string; // e.g. "University of Lagos, Lagos"
  abbreviation: string; // e.g. "UNILAG"
  type: InstitutionType;
  state: string; // e.g. "Lagos"
  city?: string; // e.g. "Lagos" — from seed data
  country: string; // e.g. "Nigeria"
  isActive: boolean;

  // ── Extended identity (from schoolModel schema) ───────────────────────────
  usid?: string; // Unique School ID — generated at seed time (USID-<abbr>-<random>)
  psid?: string; // Platform School ID — human-readable e.g. "NG-UNI-UNILAG"
  membership?: InstitutionMembership; // "public" | "private" — filled by admin
  level?: InstitutionLevel; // "federal" | "state" | "private"
  foundingYear?: number;
  website?: string;
  motto?: string;
  chancellor?: string;
  viceChancellor?: string;
  description?: string;

  // ── Media ─────────────────────────────────────────────────────────────────
  hasLogo: boolean;
  logo?: CloudinaryImage;
  hasBanner: boolean;
  banner?: CloudinaryImage;

  // ── Grading system ────────────────────────────────────────────────────────
  gradingSystem?: GradingSystem;
  gradingSystemConfirmed: boolean;

  // ── Linked collections (ObjectId references) ──────────────────────────────
  // Faculties assigned to this institution — populated by webmaster
  faculties: ObjectId[];

  // Campuses are in a separate `campuses` collection, linked by institutionId
  // Query: Collections.campuses(db).find({ institutionId: institution._id })

  // ── Curriculum ────────────────────────────────────────────────────────────
  curriculum: ApprovedCurriculumEntry[];

  // ── Seed metadata ─────────────────────────────────────────────────────────
  seededAt?: Date; // set during initial seed — helps distinguish seeded vs manually created
  seedSource?: string; // e.g. "ng-universities-v1" — for future re-seeding or diff

  createdAt: Date;
  updatedAt: Date;
}
