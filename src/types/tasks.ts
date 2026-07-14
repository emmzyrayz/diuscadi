// src/types/tasks.ts
// ─── Task Management & AI Evaluation — Domain Types ──────────────────────────

// ─── Enumerations ─────────────────────────────────────────────────────────────

export type TaskStatus =
  | "draft" // Created — not yet visible to members
  | "pending_approval" // Global tasks submitted by HEAD/COORDINATOR/MOD;
  // awaiting webmaster/head-admin sign-off before publish
  | "active" // Published — assignments spawned, visible to targets
  | "completed" // All targeted assignments evaluated
  | "cancelled" // Abandoned without evaluation
  | "archived"; // Completed + moved out of the active view

export type TaskType =
  | "submission" // Deliverables + Gemini/manual evaluation pipeline.
  // ONLY task type eligible for time-decay scoring.
  | "poll" // Committee votes on options → majority decision
  | "survey" // Structured questions → collected responses
  | "acknowledgement" // Read and confirm → binary instant completion
  | "learning"; // External edu platform completion via webhook
// TODO: implement when PandaAcademy / UniArchive are ready.

export type TaskPriority = "low" | "medium" | "high" | "critical";

// ── Task scope ────────────────────────────────────────────────────────────────
// "committee" — visible only to approved members of the task's committeeSlug.
//               Created and activated directly by HEAD/COORDINATOR/Admin.
// "global"    — visible to all approved platform members across committees.
//               Must pass through "pending_approval" before going active
//               unless the creator is webmaster/head-admin.
export type TaskScope = "committee" | "global";

// Assignment grouping (previously named TaskScope before the rename above).
export type AssignmentGrouping = "individual" | "group";

export type AssignmentStatus =
  | "pending"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "evaluated"
  | "revision_requested"
  | "rejected";

export type EvaluatorType = "GEMINI_BOT" | "MANUAL" | "HYBRID";

export type BotTrigger = "AUTO_SUBMIT" | "MANUAL_TRIGGER" | "RE_EVALUATE";

// ── Poll config ───────────────────────────────────────────────────────────────

export interface PollConfig {
  question: string;
  options: { id: string; label: string }[];
  allowMultiple: boolean;
  showResultsBeforeDeadline: boolean;
  requiresQuorum: boolean;
  quorumPercent?: number;
}

// ── Survey config ─────────────────────────────────────────────────────────────

export interface SurveyQuestion {
  id: string;
  label: string;
  type:
    | "short_text"
    | "long_text"
    | "single_choice"
    | "multi_choice"
    | "rating";
  options?: string[];
  required: boolean;
}

export interface SurveyConfig {
  questions: SurveyQuestion[];
  anonymous: boolean;
}

// ── Learning task config (scaffold — TODO when edu platforms ready) ───────────

export interface LearningConfig {
  externalPlatform: "panda_academy" | "uni_archive";
  externalCourseId: string;
  webhookSecret?: string;
  courseUrl?: string;
}

// ─── Sub-document Shapes ──────────────────────────────────────────────────────

export interface TaskDeliverable {
  label: string;
  description?: string;
  type: "text" | "url" | "file_url" | "image_url";
  required: boolean;
  placeholder?: string;
  socialMediaUrl?: string;
}

export interface SubmissionItem {
  deliverableLabel: string;
  type: "text" | "url" | "file_url" | "image_url";
  value: string;
}

export interface CriteriaScore {
  criterion: string;
  awarded: number;
  maximum: number;
  rationale: string;
}

export interface EvaluationResult {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  feedback: string;
  criteriaBreakdown: CriteriaScore[];
  evaluatorId: string;
  evaluatorType: EvaluatorType;
  evaluatedAt: Date;
  flaggedForHumanReview: boolean;
  reviewNote?: string;

  // ── Time-decay scoring snapshot (submission tasks only) ───────────────────
  // Populated only when the parent task is taskType === "submission" and
  // pointsReward > 0. Captures the exact inputs and outputs of
  // calculateSubmissionPoints() at the moment of evaluation — this is the
  // permanent audit record, frozen even if platformConfig or task settings
  // change later.
  pointsAwarded?: {
    passed: boolean;
    qualityPoints: number;
    timeBonusPoints: number;
    totalPoints: number;
    timeMultiplier: number;
    hoursElapsed: number;
  };
}

export interface RevisionHistoryEntry {
  requestedAt: Date;
  requestedBy: string;
  reason: string;
  resubmittedAt?: Date;
}

// ── Assignment target ─────────────────────────────────────────────────────────

export type AssignmentTarget =
  | { mode: "broadcast" }
  | { mode: "specific"; userIds: string[] }
  | { mode: "role"; roles: string[] };

// ─── Primary Document Interfaces ─────────────────────────────────────────────

export interface ITask {
  _id: string;
  title: string;
  description: string;
  committeeSlug: string;
  createdBy: string;
  scope: TaskScope;
  assignmentTarget: AssignmentTarget;
  priority: TaskPriority;
  priorityWeight: number;
  status: TaskStatus;
  deadline: Date;
  taskType: TaskType;

  // Set the moment the task transitions to "active" (publish time).
  // This is the clock-start for time-decay scoring — NOT createdAt.
  // Remains undefined while status is "draft" or "pending_approval".
  publishedAt?: Date;

  pollConfig?: PollConfig;
  surveyConfig?: SurveyConfig;
  learningConfig?: LearningConfig;

  // submission-specific
  deliverables: TaskDeliverable[];
  maxScore: number;
  autoEvaluate: boolean;
  evaluationCriteria: string;

  // ── Points + time-decay configuration (submission tasks) ──────────────────
  // pointsReward — total possible points for completing this task.
  //   Used by ALL task types, not just submission (a poll might pay 5pts flat).
  // qualityWeight + timeWeight — must sum to 100. Only meaningful when
  //   taskType === "submission". For all other task types these are ignored
  //   and the full pointsReward is paid flat on completion.
  // decayBaseHours — duration in hours of the first (full-multiplier) time
  //   bracket. Only meaningful for submission tasks. Default 4.
  // passThresholdPercent — minimum evaluationPercentage required to earn ANY
  //   points (quality or time). Only meaningful for submission tasks.
  //   Default 50.
  pointsReward: number;
  qualityWeight?: number; // 0-100, submission tasks only
  timeWeight?: number; // 0-100, submission tasks only
  decayBaseHours?: number; // hours, submission/instant tasks, default 4
  passThresholdPercent?: number; // 0-100, submission tasks only, default 50

  // ── Instant-complete lateness config (poll, survey, acknowledgement) ──────
  // acceptResponsesAfterDeadline — if false, the submit route hard-rejects
  //   any response attempted after task.deadline with a 422. If true, late
  //   responses are accepted but pointsEarned decays per
  //   calculateInstantTaskPoints() in timeDecayService.ts.
  // latenessStretchFactor — 0-1, default 0.5. Dampens hoursPastDeadline
  //   before it's fed into the same bracket decay curve submission tasks
  //   use. A value of 0.5 means a 24h-late response is treated as if it
  //   were 12h late. No floor — sufficiently late responses can still earn 0.
  // Both fields are ignored for taskType === "submission" (which has its
  // own publishedAt-anchored decay via qualityWeight/timeWeight instead).
  acceptResponsesAfterDeadline?: boolean; // default false
  latenessStretchFactor?: number; // 0-1, default 0.5

  tags: string[];
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssignment {
  _id: string;
  taskId: string;
  userId: string;
  committeeSlug: string;
  status: AssignmentStatus;
  submission?: {
    items: SubmissionItem[];
    submittedAt: Date;
    additionalNotes?: string;
  };

  // ── Instant-complete response payloads ──────────────────────────────────
  // Only one of these is ever populated per assignment, matching the parent
  // task's taskType. All three share the same lateness-decay points
  // calculation via calculateInstantTaskPoints() — the result is snapshotted
  // into instantPointsResult at the moment of response, same pattern as
  // submission tasks snapshot pointsAwarded into evaluation.
  pollResponse?: PollResponse;
  surveyResponse?: SurveyResponse;
  // acknowledgement has no payload beyond the timestamp itself — the act of
  // confirming IS the response. Stored as a bare Date for clarity.
  acknowledgedAt?: Date;

  // Snapshot of the lateness decay calculation at response time. Populated
  // for poll/survey/acknowledgement tasks with pointsReward > 0. Frozen
  // permanently once written — never recalculated, even if task config
  // changes later.
  instantPointsResult?: {
    accepted: boolean;
    pointsEarned: number;
    isLate: boolean;
    hoursPastDeadline: number;
    effectiveHoursPastDeadline: number;
    timeMultiplier: number;
  };

  evaluation?: EvaluationResult;
  revisionHistory: RevisionHistoryEntry[];
  overriddenDeadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PollResponse {
  selectedOptionIds: string[];
  votedAt: Date;
}

export interface SurveyResponse {
  answers: { questionId: string; value: string | string[] }[];
  submittedAt: Date;
}

export interface IBotActionLog {
  _id: string;
  assignmentId: string;
  taskId: string;
  userId: string;
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
  parsedResult?: Partial<EvaluationResult>;
  tokensUsed?: number;
  processingMs: number;
  modelVersion: string;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

// ─── API Request/Response Contracts ──────────────────────────────────────────

export interface CreateTaskPayload {
  title: string;
  description: string;
  committeeSlug: string;
  scope?: TaskScope;
  taskType?: TaskType;
  assignmentTarget?: AssignmentTarget;
  priority?: TaskPriority;
  deadline: string;
  pollConfig?: PollConfig;
  surveyConfig?: SurveyConfig;
  learningConfig?: LearningConfig;
  deliverables?: TaskDeliverable[];
  tags?: string[];
  maxScore?: number;
  autoEvaluate?: boolean;
  evaluationCriteria?: string;

  // ── Points + decay config (submission tasks) ───────────────────────────────
  pointsReward?: number;
  qualityWeight?: number;
  timeWeight?: number;
  decayBaseHours?: number;
  passThresholdPercent?: number;

  // ── Instant-complete lateness config (poll, survey, acknowledgement) ──────
  acceptResponsesAfterDeadline?: boolean;
  latenessStretchFactor?: number;

  publishImmediately?: boolean;
}

export interface SubmitAssignmentPayload {
  items: SubmissionItem[];
  additionalNotes?: string;
}

export interface BotEvaluatePayload {
  assignmentId: string;
  trigger?: BotTrigger;
}

export interface GeminiEvaluationResponse {
  totalScore: number;
  percentageScore: number;
  feedback: string;
  criteriaBreakdown: CriteriaScore[];
  flaggedForHumanReview: boolean;
  reviewNote: string | null;
}
