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
  // Discriminated union flattened — matches AssignmentTargetSchema exactly.
  // The TypeScript union lives in ITask (API layer); Mongoose needs a flat shape.
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

// AssignmentTarget — discriminated union flattened into one sub-document.
// mode is the discriminator; userIds and roles are conditionally populated.
const AssignmentTargetSchema = new Schema(
  {
    mode: {
      type: String,
      enum: ["broadcast", "specific", "role"],
      required: true,
    },
    userIds: [{ type: Schema.Types.ObjectId, ref: "UserData" }], // mode === "specific"
    roles: [{ type: String }], // mode === "role"
  },
  { _id: false },
);

// Poll sub-schemas
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

// Survey sub-schemas
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

    // ── Replaces specificAssignees ──────────────────────────────────────────
    assignmentTarget: {
      type: AssignmentTargetSchema,
      required: true,
      default: () => ({ mode: "broadcast" }),
    },

    scope: {
      type: String,
      enum: ["individual", "group"],
      default: "individual",
    },

    // ── Task type discriminator ─────────────────────────────────────────────
    taskType: {
      type: String,
      enum: ["submission", "poll", "survey", "acknowledgement"],
      required: true,
      default: "submission",
    },

    // ── Type-specific config (only one will be populated per task) ──────────
    pollConfig: {
      type: PollConfigSchema,
      default: undefined, // absent unless taskType === "poll"
    },
    surveyConfig: {
      type: SurveyConfigSchema,
      default: undefined, // absent unless taskType === "survey"
    },

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

    status: {
      type: String,
      enum: ["draft", "active", "completed", "cancelled", "archived"],
      default: "draft",
    },

    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },

    // Only populated when taskType === "submission"
    deliverables: {
      type: [TaskDeliverableSchema],
      default: [],
    },

    tags: [{ type: String, trim: true, lowercase: true }],

    // Only meaningful when taskType === "submission"
    maxScore: {
      type: Number,
      default: 100,
      min: [1, "maxScore must be at least 1"],
      max: [1000, "maxScore cannot exceed 1000"],
    },
    autoEvaluate: { type: Boolean, default: false },
    evaluationCriteria: { type: String, default: "" },

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


// ─── Indexes ──────────────────────────────────────────────────────────────────
TaskSchema.index({ committeeSlug: 1, status: 1, deadline: 1 });
TaskSchema.index({ createdBy: 1, committeeSlug: 1 });
TaskSchema.index({ committeeSlug: 1, priority: 1, deadline: 1 });
TaskSchema.index({ priorityWeight: -1, deadline: 1 });
TaskSchema.index({ committeeSlug: 1, taskType: 1, status: 1 }); // filter by type

// ─── Model Export ─────────────────────────────────────────────────────────────
const Task: Model<TaskDocument> =
  mongoose.models.Task || mongoose.model<TaskDocument>("Task", TaskSchema);

export default Task;
