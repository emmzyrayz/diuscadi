// lib/models/InstitutionDepartment.ts
// ─────────────────────────────────────────────────────────────────────────────
// Junction collection: one document per (institution, faculty, department) triple.
//
// Why three-way junction (not two-way)?
//   - "Computer Science" under UNILAG's Faculty of Science has different
//     rules than "Computer Science" under UNILAG's Faculty of Engineering.
//   - facultyId scopes the override to the correct branch.
//
// Querying:
//   - Find all departments for a faculty at an institution:
//       { institutionId, facultyId }
//   - Find specific pairing metadata:
//       { institutionId, facultyId, departmentId }
//   - Find where a department is offered across all institutions:
//       { departmentId }
// ─────────────────────────────────────────────────────────────────────────────
import { ObjectId } from "mongodb";

export type DegreeType =
  // University degrees
  | "B.Sc" | "B.Eng" | "B.Tech" | "B.A" | "B.Ed"
  | "B.Arch" | "B.Pharm" | "M.B.B.S" | "B.L"
  // Polytechnic/college awards
  | "ND" | "HND"
  // Postgraduate (future use)
  | "M.Sc" | "M.Eng" | "M.A" | "Ph.D"
  | "Other";

export interface DurationRange {
  min: number;  // minimum years to complete (e.g. 4)
  max: number;  // maximum years allowed    (e.g. 5 — 1 extra for spillover)
}

export interface InstitutionDepartmentDocument {
  _id?:          ObjectId;

  // ── The three-way key ──────────────────────────────────────────────────────
  institutionId: ObjectId;   // → Institution._id
  facultyId:     ObjectId;   // → Faculty._id (scopes to correct branch)
  departmentId:  ObjectId;   // → Department._id

  // ── Denormalised names for fast display (no joins needed for labels) ───────
  institutionName: string;   // e.g. "University of Lagos"
  institutionAbbr: string;   // e.g. "UNILAG"
  facultyName:     string;   // e.g. "Faculty of Engineering"
  departmentName:  string;   // e.g. "Computer Science"

  // ── Program-specific overrides ─────────────────────────────────────────────
  degreeType:    DegreeType;     // e.g. "B.Sc" at universities, "ND"/"HND" at polys
  durationYears: DurationRange;  // e.g. { min: 4, max: 5 }

  // ── Status ─────────────────────────────────────────────────────────────────
  isActive: boolean;

  // ── Audit ──────────────────────────────────────────────────────────────────
  createdBy?: ObjectId;  // → Vault._id of webmaster who created this entry
  createdAt:  Date;
  updatedAt:  Date;
}

// ── Degree type helpers ────────────────────────────────────────────────────

export const UNIVERSITY_DEGREES: DegreeType[] = [
  "B.Sc", "B.Eng", "B.Tech", "B.A", "B.Ed",
  "B.Arch", "B.Pharm", "M.B.B.S", "B.L",
];

export const POLYTECHNIC_DEGREES: DegreeType[] = ["ND", "HND"];

export const POSTGRAD_DEGREES: DegreeType[] = [
  "M.Sc", "M.Eng", "M.A", "Ph.D",
];

export function getDegreesForInstitutionType(
  type: "University" | "Polytechnic" | "College" | "Institute",
): DegreeType[] {
  if (type === "Polytechnic") return [...POLYTECHNIC_DEGREES, "Other"];
  return [...UNIVERSITY_DEGREES, "Other"];
}

// ── Level helpers ──────────────────────────────────────────────────────────

/**
 * Generate valid academic levels based on program duration.
 * e.g. durationYears.max = 4 → ["100", "200", "300", "400"]
 *      durationYears.max = 2 → ["ND1", "ND2"] for polytechnic ND programs
 */
export function getLevelsForDuration(
  duration: DurationRange,
  degreeType: DegreeType,
): string[] {
  if (degreeType === "ND")  return Array.from({ length: duration.max }, (_, i) => `ND${i + 1}`);
  if (degreeType === "HND") return Array.from({ length: duration.max }, (_, i) => `HND${i + 1}`);
  return Array.from({ length: duration.max }, (_, i) => `${(i + 1) * 100}`);
}