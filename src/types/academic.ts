// lib/types/academic.ts
// ─────────────────────────────────────────────────────────────────────────────
// Academic data types: grading systems, GPA records, curriculum submissions.
//
// Design intent:
//   Students crowdsource course/credit data per session → admin approves →
//   merges into Institution as canonical curriculum → powers future pre-fills
//   and a future public Nigerian Institutional Data API.
// ─────────────────────────────────────────────────────────────────────────────

import { ObjectId } from "mongodb";

// ─────────────────────────────────────────────────────────────────────────────
// § 1 — Grading Systems
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The three grading scales in active use across Nigerian tertiary institutions.
 * Set once per Institution document by webmaster. Never user-controlled.
 */
export type GradingScale = "5-point" | "4-point" | "7-point";

/**
 * Grade boundary definition for one letter grade on a given scale.
 * Each GradingSystem contains an array of these — one per grade letter.
 *
 * @example (5-point, University of Benin)
 *   { grade: "A", minScore: 70, maxScore: 100, gradePoint: 5.0 }
 *   { grade: "B", minScore: 60, maxScore: 69, gradePoint: 4.0 }
 */
export interface GradeBoundary {
  grade: string; // "A" | "B" | "C" | "D" | "E" | "F"
  minScore: number; // inclusive lower bound (percentage)
  maxScore: number; // inclusive upper bound (percentage)
  gradePoint: number; // grade point value on this institution's scale
}

/**
 * Full grading system definition stored on the Institution document.
 * Webmaster sets scale + boundaries; boundaries may differ slightly
 * between institutions on the same scale (e.g. some schools use 70+ for A,
 * others use 75+).
 */
export interface GradingSystem {
  scale: GradingScale;

  /**
   * Grade boundaries in descending order (A first, F last).
   * Stored explicitly per institution so the CGPA calc is always
   * institution-accurate, not scale-assumed.
   */
  boundaries: GradeBoundary[];

  /** ISO-8601 date the webmaster last updated these boundaries. */
  lastUpdatedAt: string;

  /** ObjectId of the webmaster/admin who configured this. */
  configuredBy: ObjectId;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2 — Course & Credit Unit types (shared across GPA records + curriculum)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single course entry as stored in a student's personal GPA record.
 * The student enters this themselves — it is NOT derived from curriculum.
 * It may later be submitted as a CurriculumSubmission for admin approval.
 */
export interface StudentCourseEntry {
  /** Student-entered course code, e.g. "CSC 301". Trimmed and uppercased on save. */
  courseCode: string;

  /** Full course title as the student knows it, e.g. "Data Structures and Algorithms". */
  courseTitle: string;

  /** Credit unit load for this course. Typically 1–6 in Nigerian universities. */
  creditUnit: number;

  /**
   * Grade earned. Stored as the letter grade string ("A", "B", "C" etc.)
   * matching the institution's GradingSystem.boundaries[].grade values.
   */
  grade: string;

  /**
   * Grade point for this course — looked up from institution's GradingSystem
   * boundaries at time of entry and stored here so the record is self-contained
   * even if boundaries are later updated.
   */
  gradePoint: number;

  /**
   * Weighted quality point for this course: creditUnit × gradePoint.
   * Stored explicitly to avoid fp rounding drift on re-reads.
   */
  qualityPoint: number;
}

/**
 * A canonical course as stored in approved Institution curriculum.
 * Omits student-specific fields (grade, gradePoint, qualityPoint).
 * Used to pre-fill course lists for students entering GPA records.
 */
export interface CurriculumCourse {
  courseCode: string;
  courseTitle: string;
  creditUnit: number;

  /**
   * Whether this course is compulsory for all students in this dept/level/semester
   * or elective. Electives show as optional pre-fills.
   */
  isCompulsory: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3 — Semester GPA Record (stored on UserData)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One semester's academic record for a student.
 * Stored as an array on UserData.Institution.gpaRecord[].
 *
 * CGPA is recalculated from the full gpaRecord array whenever a new
 * SemesterGPARecord is added or updated. Formula:
 *   CGPA = Σ(qualityPoints across all semesters) / Σ(creditUnits across all semesters)
 */
export interface SemesterGPARecord {
  /** Academic level, e.g. "100", "200", "300", "400", "500". */
  level: string;

  semester: "First" | "Second";

  /**
   * Academic session this record belongs to, e.g. "2024/2025".
   * Stored explicitly — not derived from enrollmentYear — because
   * carryovers and deferrals can shift a student off the expected session.
   */
  session: string;

  /** All courses the student registered for this semester. */
  courses: StudentCourseEntry[];

  // ── Computed fields (recalculated on every save, stored for fast reads) ────

  /** Total credit units registered this semester. */
  totalCreditUnits: number;

  /** Sum of qualityPoints (creditUnit × gradePoint) across all courses. */
  totalQualityPoints: number;

  /**
   * Grade Point Average for this semester only.
   *   semesterGPA = totalQualityPoints / totalCreditUnits
   * Rounded to 2 decimal places.
   */
  semesterGPA: number;

  // ── Status ────────────────────────────────────────────────────────────────

  /**
   * Whether this semester's record has been fully submitted by the student.
   * Draft records are recalculated on every course add/edit.
   * Submitted records trigger a CGPA recalculation on the parent UserData doc.
   */
  status: "draft" | "submitted";

  /** ISO-8601 timestamp of when the student last edited this record. */
  lastUpdatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4 — Curriculum Submission (separate collection)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submission status lifecycle:
 *   pending → approved  (merges into Institution.curriculum)
 *           → rejected  (soft-deleted, reason stored)
 *   pending → flagged   (3+ peer flags, escalated to admin review queue)
 *   flagged → approved | rejected
 */
export type SubmissionStatus = "pending" | "approved" | "rejected" | "flagged";

/**
 * A peer flag raised by a student who believes a curriculum submission
 * contains incorrect data (wrong course code, wrong credit units, etc.).
 */
export interface CurriculumFlag {
  /** UserData._id of the student raising the flag. */
  flaggedBy: ObjectId;

  /** Human-readable reason — required, not optional. Forces accountability. */
  reason: string;

  /** ISO-8601 timestamp. */
  flaggedAt: string;
}

/**
 * A curriculum submission document — lives in the `curriculumSubmissions` collection.
 *
 * Lifecycle:
 *   1. Student submits courses for their dept / level / semester / session.
 *   2. Other students in same dept/level/semester can flag it (reason required).
 *   3. If flags.length >= 3, status → "flagged" and admin is alerted.
 *   4. Admin reviews → approves or rejects with a reason.
 *   5. On approval, courses are merged into Institution.curriculum[matching entry].
 */
export interface CurriculumSubmissionDocument {
  _id?: ObjectId;

  // ── Scope ─────────────────────────────────────────────────────────────────
  institutionId: ObjectId; // → Institution._id
  institutionName: string; // denormalised for admin UI without a join
  department: string;
  faculty: string;
  level: string; // "100" | "200" | "300" | "400" | "500"
  semester: "First" | "Second";

  /**
   * Academic session this submission covers, e.g. "2024/2025".
   * This is the key differentiator — same dept/level/semester can have
   * different courses across sessions (course codes change, new courses added).
   */
  session: string;

  // ── Submitted data ────────────────────────────────────────────────────────
  courses: CurriculumCourse[];

  // ── Authorship ────────────────────────────────────────────────────────────
  submittedBy: ObjectId; // → UserData._id
  submittedAt: string; // ISO-8601

  // ── Peer review ───────────────────────────────────────────────────────────
  flags: CurriculumFlag[];

  /**
   * When flags.length reaches this threshold the status is automatically
   * set to "flagged" and an admin review alert is triggered.
   * Stored on the document (not hardcoded) so it can be adjusted per-institution
   * by a webmaster without a code deploy.
   */
  flagThreshold: number; // default: 3

  // ── Admin decision ────────────────────────────────────────────────────────
  status: SubmissionStatus;
  reviewedBy?: ObjectId; // → Vault._id of admin/webmaster
  reviewedAt?: string; // ISO-8601
  reviewNote?: string; // rejection reason or approval comment

  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5 — Institution Curriculum (embedded in Institution document)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One approved curriculum entry for a specific dept / level / semester / session.
 * Built from approved CurriculumSubmission documents.
 * This is the data that will eventually be exposed via the public Nigerian
 * Institutional Data API.
 */
export interface ApprovedCurriculumEntry {
  department: string;
  faculty: string;
  level: string;
  semester: "First" | "Second";
  session: string; // e.g. "2024/2025"
  courses: CurriculumCourse[];

  /** ObjectId of the CurriculumSubmission this was approved from. */
  sourceSubmissionId: ObjectId;

  /** ObjectId of admin/webmaster who approved it. */
  approvedBy: ObjectId;
  approvedAt: string; // ISO-8601
}