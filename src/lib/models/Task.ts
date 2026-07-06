// src/lib/models/Task.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type {
  ITask,
  TaskDeliverable,
  PollConfig,
  SurveyQuestion,
  SurveyConfig,
} from "@/types/tasks";

// ─── Document Interface ───────────────────────────────────────────────────────
export interface TaskDocument
  extends Omit<ITask, "_id" | "createdBy" | "assignmentTarget">, Document {
  createdBy: Types.ObjectId;
  assignmentTarget: {
    mode: "broadcast" | "specific" | "role";
    userIds: Types.ObjectId[];
    roles: string[];
  };
}

type TaskUpdate = {
  priority?: TaskDocument["priority"];
  priorityWeight?: number;
  $set?: {
    priority?: TaskDocument["priority"];
    priorityWeight?: number;
  };
};

// ─── Weight Map ───────────────────────────────────────────────────────────────
export const PRIORITY_WEIGHTS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
} as const;

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const TaskDeliverableSchema = new Schema<TaskDeliverable>(
  {
    label: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: ["text", "url", "file_url", "image_url"],
      required: true,
    },
    required: { type: Boolean, default: true },
    placeholder: { type: String, default: "" },
  },
  { _id: false },
);

const AssignmentTargetSchema = new Schema(
  {
    mode: {
      type: String,
      enum: ["broadcast", "specific", "role"],
      required: true,
    },
    userIds: [{ type: Schema.Types.ObjectId, ref: "UserData" }],
    roles: [{ type: String }],
  },
  { _id: false },
);

const PollOptionSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false },
);

const PollConfigSchema = new Schema<PollConfig>(
  {
    question: { type: String, required: true },
    options: { type: [PollOptionSchema], default: [] },
    allowMultiple: { type: Boolean, default: false },
    showResultsBeforeDeadline: { type: Boolean, default: false },
    requiresQuorum: { type: Boolean, default: false },
    quorumPercent: { type: Number, default: null },
  },
  { _id: false },
);

const SurveyQuestionSchema = new Schema<SurveyQuestion>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "short_text",
        "long_text",
        "single_choice",
        "multi_choice",
        "rating",
      ],
      required: true,
    },
    options: [{ type: String }],
    required: { type: Boolean, default: true },
  },
  { _id: false },
);

const SurveyConfigSchema = new Schema<SurveyConfig>(
  {
    questions: { type: [SurveyQuestionSchema], default: [] },
    anonymous: { type: Boolean, default: false },
  },
  { _id: false },
);

// ─── Primary Schema ────────────────────────────────────────────────────────────

const TaskSchema = new Schema<TaskDocument>(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [120, "Title must be 120 characters or fewer"],
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
    },

    committeeSlug: {
      type: String,
      required: [true, "committeeSlug is required"],
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Vault",
      required: true,
    },

    // ── Scope ─────────────────────────────────────────────────────────────────
    // RECONCILED in Phase 3: previously "individual" | "group" (assignment
    // grouping concept). Now "committee" | "global" (visibility/targeting
    // concept). The old grouping concept is preserved separately as
    // AssignmentGrouping in types/tasks.ts but is not yet persisted anywhere
    // — no schema field currently needs it since every task is effectively
    // "individual" grouping in practice. If group-submission tasks are built
    // later, add a separate `assignmentGrouping` field rather than reusing
    // this one again.
    scope: {
      type: String,
      enum: ["committee", "global"],
      default: "committee",
    },

    assignmentTarget: {
      type: AssignmentTargetSchema,
      required: true,
      default: () => ({ mode: "broadcast" }),
    },

    taskType: {
      type: String,
      enum: ["submission", "poll", "survey", "acknowledgement", "learning"],
      required: true,
      default: "submission",
    },

    pollConfig: {
      type: PollConfigSchema,
      default: undefined,
    },
    surveyConfig: {
      type: SurveyConfigSchema,
      default: undefined,
    },
    // learningConfig intentionally has no Mongoose sub-schema yet — TODO
    // Phase-7 (or whenever PandaAcademy/UniArchive integration begins).
    // Task creation currently blocks taskType === "learning" with a 501 at
    // the route layer, so no documents will ever populate this field via
    // the normal creation flow until that's implemented.

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    priorityWeight: {
      type: Number,
      required: true,
      default: 2,
    },

    // ── Status ────────────────────────────────────────────────────────────────
    // pending_approval added in Phase 3 — global tasks created by non-admins
    // sit here until a webmaster/head-admin approves via the dedicated
    // /approve route (or, as a fallback, the generic PATCH route with the
    // same permission gate enforced).
    status: {
      type: String,
      enum: [
        "draft",
        "pending_approval",
        "active",
        "completed",
        "cancelled",
        "archived",
      ],
      default: "draft",
    },

    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },

    // ── publishedAt ───────────────────────────────────────────────────────────
    // Set only on the draft→active or pending_approval→active transition.
    // This is the clock-start for time-decay scoring — NEVER createdAt.
    // Absent for draft and pending_approval tasks.
    publishedAt: {
      type: Date,
      default: undefined,
    },

    deliverables: {
      type: [TaskDeliverableSchema],
      default: [],
    },

    tags: [{ type: String, trim: true, lowercase: true }],

    maxScore: {
      type: Number,
      default: 100,
      min: [1, "maxScore must be at least 1"],
      max: [1000, "maxScore cannot exceed 1000"],
    },
    autoEvaluate: { type: Boolean, default: false },
    evaluationCriteria: { type: String, default: "" },

    // ── Points + time-decay configuration ──────────────────────────────────────
    // pointsReward applies to every task type. qualityWeight/timeWeight/
    // decayBaseHours/passThresholdPercent are only meaningful for
    // taskType === "submission" — left undefined for other types.
    pointsReward: {
      type: Number,
      default: 0,
      min: [0, "pointsReward cannot be negative"],
    },
    qualityWeight: {
      type: Number,
      min: [0, "qualityWeight must be between 0 and 100"],
      max: [100, "qualityWeight must be between 0 and 100"],
      default: undefined,
    },
    timeWeight: {
      type: Number,
      min: [0, "timeWeight must be between 0 and 100"],
      max: [100, "timeWeight must be between 0 and 100"],
      default: undefined,
    },
    decayBaseHours: {
      type: Number,
      min: [0.5, "decayBaseHours must be at least 0.5"],
      default: undefined,
    },
    passThresholdPercent: {
      type: Number,
      min: [0, "passThresholdPercent must be between 0 and 100"],
      max: [100, "passThresholdPercent must be between 0 and 100"],
      default: undefined,
    },

    // ── Instant-complete lateness config (poll, survey, acknowledgement) ──────
    // Ignored for taskType === "submission". acceptResponsesAfterDeadline
    // gates whether the submit route accepts a response at all once
    // task.deadline has passed. latenessStretchFactor dampens how harshly
    // a late response's reward decays — see timeDecayService.ts.
    acceptResponsesAfterDeadline: {
      type: Boolean,
      default: false,
    },
    latenessStretchFactor: {
      type: Number,
      min: [0, "latenessStretchFactor must be between 0 and 1"],
      max: [1, "latenessStretchFactor must be between 0 and 1"],
      default: 0.5,
    },

    isVisible: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "tasks",
  },
);

function syncPriorityWeight(this: mongoose.Query<unknown, TaskDocument>) {
  const update = this.getUpdate() as TaskUpdate | undefined;
  if (!update) return;
  const priority = update.priority ?? update.$set?.priority;
  if (priority) {
    this.set({ priorityWeight: PRIORITY_WEIGHTS[priority] });
  }
}

// ─── Pre-save hook — keep priorityWeight in sync with priority ────────────────
TaskSchema.pre("save", function (this: TaskDocument) {
  this.priorityWeight =
    PRIORITY_WEIGHTS[this.priority as keyof typeof PRIORITY_WEIGHTS];
});

TaskSchema.pre("findOneAndUpdate", syncPriorityWeight);
TaskSchema.pre("updateOne", syncPriorityWeight);
TaskSchema.pre("updateMany", syncPriorityWeight);

// ─── Validation hook — enforce qualityWeight + timeWeight = 100 ───────────────
// Mirrors validateWeightSplit() in timeDecayService.ts. Duplicated here as a
// last-line-of-defense schema-level guard in case a document is ever saved
// through a path that bypasses the route-layer validation (e.g. a future
// admin bulk-edit script). The route layer remains the primary enforcement
// point and should always catch this first with a clearer error message.
TaskSchema.pre("save", function (this: TaskDocument) {
  if (this.taskType === "submission" && this.pointsReward > 0) {
    const qw = this.qualityWeight ?? 80;
    const tw = this.timeWeight ?? 20;
    if (qw + tw !== 100) {
      throw new Error(
        `qualityWeight + timeWeight must equal 100 for submission tasks with points (got ${qw + tw})`,
      );
    }
  }
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
TaskSchema.index({ committeeSlug: 1, status: 1, deadline: 1 });
TaskSchema.index({ createdBy: 1, committeeSlug: 1 });
TaskSchema.index({ committeeSlug: 1, priority: 1, deadline: 1 });
TaskSchema.index({ priorityWeight: -1, deadline: 1 });
TaskSchema.index({ committeeSlug: 1, taskType: 1, status: 1 });
// New for Phase 3: global task approval queue lookup.
TaskSchema.index({ scope: 1, status: 1 });

// ─── Model Export ─────────────────────────────────────────────────────────────
const Task: Model<TaskDocument> =
  mongoose.models.Task || mongoose.model<TaskDocument>("Task", TaskSchema);

export default Task;