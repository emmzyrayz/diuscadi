// lib/models/CurriculumSubmission.ts
// ─────────────────────────────────────────────────────────────────────────────
// MongoDB collection: `curriculumSubmissions`
//
// Indexes to create:
//   { institutionId: 1, department: 1, level: 1, semester: 1, session: 1 }
//   { submittedBy: 1 }
//   { status: 1 }
//   { "flags.flaggedBy": 1 }   ← prevent duplicate flags per user
// ─────────────────────────────────────────────────────────────────────────────

export type { CurriculumSubmissionDocument } from "@/types/academic";
