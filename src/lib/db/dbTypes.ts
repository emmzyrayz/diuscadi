// src/lib/db/dbTypes.ts
// ─── Native MongoDB document shapes (ObjectId, not string) ───────────────────
// Used by collections.ts and taskService.ts.
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
  LearningConfig,
} from "@/types/tasks";

export type DbTask = {
  _id?: ObjectId;
  title: string;
  description: string;
  committeeSlug: string;
  createdBy: ObjectId;
  scope: TaskScope;

  assignmentTarget: {
    mode: "broadcast" | "specific" | "role";
    userIds: ObjectId[];
    roles: string[];
  };

  priority: TaskPriority;
  priorityWeight: number;
  status: TaskStatus;
  deadline: Date;
  taskType: TaskType;

  // Set on transition to "active" — the clock-start for time-decay scoring.
  // Absent while status is "draft" or "pending_approval".
  publishedAt?: Date;

  pollConfig?: PollConfig;
  surveyConfig?: SurveyConfig;
  learningConfig?: LearningConfig;

  deliverables: TaskDeliverable[];
  maxScore: number;
  autoEvaluate: boolean;
  evaluationCriteria: string;

  // ── Points + time-decay configuration ──────────────────────────────────────
  pointsReward: number;
  qualityWeight?: number; // 0-100, submission tasks only
  timeWeight?: number; // 0-100, submission tasks only
  decayBaseHours?: number; // hours, submission/instant tasks, default 4
  passThresholdPercent?: number; // 0-100, submission tasks only, default 50

  // ── Instant-complete lateness config (poll, survey, acknowledgement) ──────
  acceptResponsesAfterDeadline?: boolean; // default false
  latenessStretchFactor?: number; // 0-1, default 0.5

  tags: string[];
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

  // ── Instant-complete response payloads (poll, survey, acknowledgement) ────
  pollResponse?: {
    selectedOptionIds: string[];
    votedAt: Date;
  };
  surveyResponse?: {
    answers: { questionId: string; value: string | string[] }[];
    submittedAt: Date;
  };
  acknowledgedAt?: Date;

  // Snapshot of the lateness decay calculation at response time.
  instantPointsResult?: {
    accepted: boolean;
    pointsEarned: number;
    isLate: boolean;
    hoursPastDeadline: number;
    effectiveHoursPastDeadline: number;
    timeMultiplier: number;
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

    // Time-decay scoring snapshot — frozen at evaluation time.
    // Only present for submission tasks with pointsReward > 0.
    pointsAwarded?: {
      passed: boolean;
      qualityPoints: number;
      timeBonusPoints: number;
      totalPoints: number;
      timeMultiplier: number;
      hoursElapsed: number;
    };
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
