// src/lib/models/assignment.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type {
  IAssignment,
  SubmissionItem,
  EvaluationResult,
  CriteriaScore,
  RevisionHistoryEntry,
  PollResponse,
  SurveyResponse,
} from "@/types/tasks";

// ─── Document Interface ───────────────────────────────────────────────────────
export interface AssignmentDocument
  extends Omit<IAssignment, "_id" | "taskId" | "userId">, Document {
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const SubmissionItemSchema = new Schema<SubmissionItem>(
  {
    deliverableLabel: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "url", "file_url", "image_url"],
      required: true,
    },
    value: { type: String, required: true },
  },
  { _id: false },
);

const CriteriaScoreSchema = new Schema<CriteriaScore>(
  {
    criterion: { type: String, required: true },
    awarded: { type: Number, required: true, min: 0 },
    maximum: { type: Number, required: true, min: 0 },
    rationale: { type: String, default: "" },
  },
  { _id: false },
);

// Time-decay points snapshot for submission tasks — embedded inside
// EvaluationResultSchema below.
const PointsAwardedSchema = new Schema(
  {
    passed: { type: Boolean, required: true },
    qualityPoints: { type: Number, required: true },
    timeBonusPoints: { type: Number, required: true },
    totalPoints: { type: Number, required: true },
    timeMultiplier: { type: Number, required: true },
    hoursElapsed: { type: Number, required: true },
  },
  { _id: false },
);

const EvaluationResultSchema = new Schema<EvaluationResult>(
  {
    totalScore: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 0 },
    percentageScore: { type: Number, required: true, min: 0, max: 100 },
    feedback: { type: String, required: true },
    criteriaBreakdown: { type: [CriteriaScoreSchema], default: [] },
    evaluatorId: { type: String, required: true },
    evaluatorType: {
      type: String,
      enum: ["GEMINI_BOT", "MANUAL", "HYBRID"],
      required: true,
    },
    evaluatedAt: { type: Date, required: true },
    flaggedForHumanReview: { type: Boolean, default: false },
    reviewNote: { type: String, default: null },
    pointsAwarded: { type: PointsAwardedSchema, default: undefined },
  },
  { _id: false },
);

const RevisionHistorySchema = new Schema<RevisionHistoryEntry>(
  {
    requestedAt: { type: Date, required: true },
    requestedBy: { type: String, required: true },
    reason: { type: String, required: true },
    resubmittedAt: { type: Date, default: null },
  },
  { _id: false },
);

// ── Instant-complete response sub-schemas (Phase 4) ──────────────────────────

const PollResponseSchema = new Schema<PollResponse>(
  {
    selectedOptionIds: { type: [String], required: true },
    votedAt: { type: Date, required: true },
  },
  { _id: false },
);

const SurveyAnswerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    // value can be a single string or an array of strings (multi-choice) —
    // Mixed handles both without two separate fields.
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const SurveyResponseSchema = new Schema<SurveyResponse>(
  {
    answers: { type: [SurveyAnswerSchema], required: true },
    submittedAt: { type: Date, required: true },
  },
  { _id: false },
);

// Lateness decay snapshot for instant-complete tasks (poll/survey/ack) —
// mirrors PointsAwardedSchema's role for submission tasks, but anchored to
// deadline instead of publishedAt. See calculateInstantTaskPoints() in
// timeDecayService.ts for the source of these values.
const InstantPointsResultSchema = new Schema(
  {
    accepted: { type: Boolean, required: true },
    pointsEarned: { type: Number, required: true },
    isLate: { type: Boolean, required: true },
    hoursPastDeadline: { type: Number, required: true },
    effectiveHoursPastDeadline: { type: Number, required: true },
    timeMultiplier: { type: Number, required: true },
  },
  { _id: false },
);

// ─── Primary Schema ────────────────────────────────────────────────────────────

const AssignmentSchema = new Schema<AssignmentDocument>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserData",
      required: true,
      index: true,
    },

    committeeSlug: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "submitted",
        "under_review",
        "evaluated",
        "revision_requested",
        "rejected",
      ],
      default: "pending",
    },

    // Optional — only present after member submits (submission tasks)
    submission: {
      items: { type: [SubmissionItemSchema], default: undefined },
      submittedAt: { type: Date },
      additionalNotes: { type: String, default: "" },
    },

    // ── Instant-complete response payloads (Phase 4) ───────────────────────────
    // Only one of pollResponse / surveyResponse / acknowledgedAt is ever
    // populated per assignment, matching the parent task's taskType.
    pollResponse: { type: PollResponseSchema, default: undefined },
    surveyResponse: { type: SurveyResponseSchema, default: undefined },
    acknowledgedAt: { type: Date, default: undefined },

    // Lateness decay snapshot — populated for poll/survey/acknowledgement
    // tasks with pointsReward > 0. Frozen at response time, never recomputed.
    instantPointsResult: {
      type: InstantPointsResultSchema,
      default: undefined,
    },

    // Optional — only present after evaluation (submission tasks)
    evaluation: {
      type: EvaluationResultSchema,
      default: undefined,
    },

    revisionHistory: {
      type: [RevisionHistorySchema],
      default: [],
    },

    overriddenDeadline: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "assignments",
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

AssignmentSchema.index(
  { taskId: 1, userId: 1 },
  { unique: true, name: "unique_task_user_assignment" },
);

AssignmentSchema.index({ userId: 1, committeeSlug: 1, status: 1 });

AssignmentSchema.index({
  committeeSlug: 1,
  status: 1,
  "submission.submittedAt": -1,
});

AssignmentSchema.index({ "evaluation.flaggedForHumanReview": 1, status: 1 });

// ─── Model Export ─────────────────────────────────────────────────────────────
const Assignment: Model<AssignmentDocument> =
  mongoose.models.Assignment ||
  mongoose.model<AssignmentDocument>("Assignment", AssignmentSchema);

export default Assignment;