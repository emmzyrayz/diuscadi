// lib/utils/cgpa.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pure CGPA calculation utilities — no DB calls, no side effects.
// Call these from API routes and pass the result to MongoDB $set.
//
// Calculation method: Weighted cumulative GPA
//   CGPA = Σ(qualityPoints across all SUBMITTED semesters)
//          / Σ(creditUnits across all SUBMITTED semesters)
//
// Draft semesters are excluded — a student must explicitly submit a semester
// for it to count towards their CGPA.
// ─────────────────────────────────────────────────────────────────────────────

import {
  SemesterGPARecord,
  StudentCourseEntry,
  GradingSystem,
} from "@/types/academic";

// ─────────────────────────────────────────────────────────────────────────────
// § 1 — Per-course quality point calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Look up the grade point for a letter grade from the institution's grading system.
 * Returns null if the grade letter is not found in the system's boundaries.
 */
export function lookupGradePoint(
  grade: string,
  gradingSystem: GradingSystem,
): number | null {
  const boundary = gradingSystem.boundaries.find(
    (b) => b.grade.toUpperCase() === grade.toUpperCase(),
  );
  return boundary?.gradePoint ?? null;
}

/**
 * Compute derived fields for a single course entry.
 * Returns a new object — does not mutate the input.
 *
 * @throws if the grade is not found in the institution's grading system.
 */
export function computeCourseEntry(
  course: Omit<StudentCourseEntry, "gradePoint" | "qualityPoint">,
  gradingSystem: GradingSystem,
): StudentCourseEntry {
  const gradePoint = lookupGradePoint(course.grade, gradingSystem);

  if (gradePoint === null) {
    throw new Error(
      `Grade "${course.grade}" not found in institution grading system (scale: ${gradingSystem.scale})`,
    );
  }

  const qualityPoint = parseFloat((course.creditUnit * gradePoint).toFixed(4));

  return {
    ...course,
    gradePoint,
    qualityPoint,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2 — Per-semester GPA calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recalculate totalCreditUnits, totalQualityPoints, and semesterGPA
 * for a semester record from its courses array.
 *
 * Returns a partial update object — merge this into the semester record.
 */
export function computeSemesterTotals(
  courses: StudentCourseEntry[],
): Pick<
  SemesterGPARecord,
  "totalCreditUnits" | "totalQualityPoints" | "semesterGPA"
> {
  const totalCreditUnits = courses.reduce((sum, c) => sum + c.creditUnit, 0);
  const totalQualityPoints = courses.reduce(
    (sum, c) => sum + c.qualityPoint,
    0,
  );

  const semesterGPA =
    totalCreditUnits === 0
      ? 0
      : parseFloat((totalQualityPoints / totalCreditUnits).toFixed(2));

  return { totalCreditUnits, totalQualityPoints, semesterGPA };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3 — CGPA calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate CGPA from the full gpaRecord array.
 * Only `submitted` semester records are included — drafts are excluded.
 *
 * Returns null if no submitted semesters exist yet.
 *
 * @example
 *   const cgpa = calculateCGPA(user.Institution.gpaRecord);
 *   // → 3.87
 */
export function calculateCGPA(gpaRecord: SemesterGPARecord[]): number | null {
  const submitted = gpaRecord.filter((r) => r.status === "submitted");

  if (submitted.length === 0) return null;

  const totalCreditUnits = submitted.reduce(
    (sum, r) => sum + r.totalCreditUnits,
    0,
  );
  const totalQualityPoints = submitted.reduce(
    (sum, r) => sum + r.totalQualityPoints,
    0,
  );

  if (totalCreditUnits === 0) return null;

  return parseFloat((totalQualityPoints / totalCreditUnits).toFixed(2));
}

/**
 * Convenience: returns the CGPA and the ISO-8601 timestamp of calculation.
 * Pass both directly into a MongoDB $set update.
 *
 * @example
 *   const { cgpa, cgpaLastCalculatedAt } = calculateCGPAWithTimestamp(gpaRecord);
 *   await db.collection("userData").updateOne(
 *     { _id: userId },
 *     { $set: { "Institution.cgpa": cgpa, "Institution.cgpaLastCalculatedAt": cgpaLastCalculatedAt } }
 *   );
 */
export function calculateCGPAWithTimestamp(gpaRecord: SemesterGPARecord[]): {
  cgpa: number | null;
  cgpaLastCalculatedAt: string;
} {
  return {
    cgpa: calculateCGPA(gpaRecord),
    cgpaLastCalculatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4 — Classification helpers (for display and event filtering)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return a human-readable class classification from a CGPA on any scale.
 *
 * 5-point scale (most Nigerian universities):
 *   4.50 – 5.00 → First Class
 *   3.50 – 4.49 → Second Class Upper
 *   2.40 – 3.49 → Second Class Lower
 *   1.50 – 2.39 → Third Class
 *   1.00 – 1.49 → Pass
 *
 * 4-point scale:
 *   3.60 – 4.00 → First Class
 *   3.00 – 3.59 → Second Class Upper
 *   2.00 – 2.99 → Second Class Lower
 *   1.00 – 1.99 → Third Class
 *
 * 7-point scale (ABU Zaria):
 *   6.00 – 7.00 → First Class
 *   5.00 – 5.99 → Second Class Upper
 *   3.50 – 4.99 → Second Class Lower
 *   2.40 – 3.49 → Third Class
 */
export type DegreeClass =
  | "First Class"
  | "Second Class Upper"
  | "Second Class Lower"
  | "Third Class"
  | "Pass"
  | "Fail"
  | "Unclassified";

export function classifyDegree(
  cgpa: number,
  scale: "5-point" | "4-point" | "7-point",
): DegreeClass {
  if (scale === "5-point") {
    if (cgpa >= 4.5) return "First Class";
    if (cgpa >= 3.5) return "Second Class Upper";
    if (cgpa >= 2.4) return "Second Class Lower";
    if (cgpa >= 1.5) return "Third Class";
    if (cgpa >= 1.0) return "Pass";
    return "Fail";
  }

  if (scale === "4-point") {
    if (cgpa >= 3.6) return "First Class";
    if (cgpa >= 3.0) return "Second Class Upper";
    if (cgpa >= 2.0) return "Second Class Lower";
    if (cgpa >= 1.0) return "Third Class";
    return "Fail";
  }

  if (scale === "7-point") {
    if (cgpa >= 6.0) return "First Class";
    if (cgpa >= 5.0) return "Second Class Upper";
    if (cgpa >= 3.5) return "Second Class Lower";
    if (cgpa >= 2.4) return "Third Class";
    return "Fail";
  }

  return "Unclassified";
}
