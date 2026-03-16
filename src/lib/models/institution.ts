// lib/models/Institution.ts
// ─────────────────────────────────────────────────────────────────────────────
// MongoDB collection: `institutions`
//
// This document is the source of truth for:
//   - Institutional identity (name, type, state, country)
//   - Grading system (set by webmaster — drives all CGPA calculations)
//   - Approved curriculum (crowdsourced from students, approved by admin)
//
// Future: curriculum[] will be the backbone of the Nigerian Institutional
// Data API — keep this data clean and well-structured from day one.
// ─────────────────────────────────────────────────────────────────────────────

import { ObjectId } from "mongodb";
import { CloudinaryImage } from "@/types/cloudinary";
import { GradingSystem, ApprovedCurriculumEntry } from "@/types/academic";

export type InstitutionType = "University" | "Polytechnic";

export interface InstitutionDocument {
  _id?: ObjectId;

  // ── Identity ──────────────────────────────────────────────────────────────
  name: string; // e.g. "University of Benin"
  abbreviation: string; // e.g. "UNIBEN" — used in API responses + UI badges
  type: InstitutionType;
  state: string; // e.g. "Edo"
  country: string; // e.g. "Nigeria"
  website?: string; // official institution website — useful for the public API
  isActive: boolean;

  // ── Media ─────────────────────────────────────────────────────────────────
  hasLogo: boolean;
  logo?: CloudinaryImage; // tag: "inst-logo"

  hasBanner: boolean;
  banner?: CloudinaryImage; // tag: "inst-banner"

  // ── Grading system (set by webmaster, never by users) ─────────────────────
  /**
   * The grading system in use at this institution.
   * Drives all CGPA calculations for students who belong to this institution.
   * Must be configured by a webmaster before students can submit GPA records.
   */
  gradingSystem?: GradingSystem;

  /**
   * True once gradingSystem has been configured and verified by a webmaster.
   * Students cannot submit GPA records until this is true.
   */
  gradingSystemConfirmed: boolean;

  // ── Faculties ─────────────────────────────────────────────────────────────
  // IDs of faculties assigned to this institution by a webmaster.
  faculties: ObjectId[];

  // ── Approved curriculum ───────────────────────────────────────────────────
  /**
   * Canonical course lists per dept / level / semester / session.
   * Built from approved CurriculumSubmission documents.
   *
   * Used to:
   *   1. Pre-fill course lists when students enter GPA records.
   *   2. Power the future Nigerian Institutional Data API.
   *
   * Kept embedded (not a separate collection) for fast single-document reads
   * during GPA entry. If this array grows very large (500+ entries), consider
   * migrating to a separate `institutionCurriculum` collection.
   */
  curriculum: ApprovedCurriculumEntry[];

  createdAt: Date;
  updatedAt: Date;
}
