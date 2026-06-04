// src/lib/db/dbTypes.ts
// ─── Native MongoDB document shapes (ObjectId, not string) ───────────────────
// Used by both collections.ts and taskService.ts.
// Kept separate from @/types/tasks which uses string IDs for client serialisation.

import { ObjectId } from "mongodb";
import type {
  TaskPriority,
  TaskScope,
  TaskStatus,
  TaskType,
  AssignmentStatus,
  BotTrigger,
  EvaluatorType,
  SubmissionItem,
  TaskDeliverable,
  PollConfig,
  SurveyConfig,
} from "@/types/tasks";

export type DbTask = {
  _id?: ObjectId;
  title: string;
  description: string;
  committeeSlug: string;
  createdBy: ObjectId;

  // ── Replaces specificAssignees ──────────────────────────────────────────────
  // Flattened from the discriminated union in ITask — both arrays always present,
  // mode is the discriminator for which one is meaningful.
  assignmentTarget: {
    mode: "broadcast" | "specific" | "role";
    userIds: ObjectId[]; // populated when mode === "specific"
    roles: string[]; // populated when mode === "role"
  };

  scope: TaskScope;
  taskType: TaskType; // ← new: "submission" | "poll" | "survey" | "acknowledgement"

  // ── Type-specific config — only one present per task ───────────────────────
  pollConfig?: PollConfig;
  surveyConfig?: SurveyConfig;

  priority: TaskPriority;
  priorityWeight: number;
  status: TaskStatus;
  deadline: Date;

  // Only populated when taskType === "submission"
  deliverables: TaskDeliverable[];

  tags: string[];

  // Only meaningful when taskType === "submission"
  maxScore: number;
  autoEvaluate: boolean;
  evaluationCriteria: string;

  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type DbAssignment = {
  _id?: ObjectId;
  taskId: ObjectId;
  userId: ObjectId;
  committeeSlug: string;
  status: AssignmentStatus;
  submission?: {
    items: SubmissionItem[];
    submittedAt: Date;
    additionalNotes?: string;
  };
  evaluation?: {
    totalScore: number;
    maxScore: number;
    percentageScore: number;
    feedback: string;
    criteriaBreakdown: {
      criterion: string;
      awarded: number;
      maximum: number;
      rationale: string;
    }[];
    evaluatorId: string;
    evaluatorType: EvaluatorType;
    evaluatedAt: Date;
    flaggedForHumanReview: boolean;
    reviewNote?: string | null;
  };
  revisionHistory: {
    requestedAt: Date;
    requestedBy: string;
    reason: string;
    resubmittedAt?: Date;
  }[];
  overriddenDeadline?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DbBotActionLog = {
  _id?: ObjectId;
  assignmentId: ObjectId;
  taskId: ObjectId;
  userId: ObjectId;
  committeeSlug: string;
  trigger: BotTrigger;
  inputPayload: {
    submissionText: string;
    evaluationCriteria: string;
    taskTitle: string;
    taskDescription: string;
    maxScore: number;
  };
  rawGeminiResponse: string;
  parsedResult?: Record<string, unknown> | null;
  tokensUsed?: number | null;
  processingMs: number;
  modelVersion: string;
  success: boolean;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
};
