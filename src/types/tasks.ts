// src/types/tasks.ts
// ─── Task Management & AI Evaluation — Domain Types ──────────────────────────
// Follows the same interface-first pattern as src/types/domain.ts

// ─── Enumerations ─────────────────────────────────────────────────────────────

export type TaskStatus =
  | "draft" // Created by admin/head — not yet visible to members
  | "active" // Published — assignments auto-spawned or manually assigned
  | "completed" // All targeted assignments have been evaluated
  | "cancelled" // Abandoned without evaluation
  | "archived"; // Completed + moved out of the active view

// src/types/tasks.ts
export type TaskType =
  | "submission"      // Current system — deliverables + Gemini evaluation
  | "poll"            // Committee votes on options → majority decision
  | "survey"          // Structured questions → collected responses
  | "acknowledgement" // Read and confirm → binary completion

export type TaskPriority = "low" | "medium" | "high" | "critical";

// individual: one submission per member
// group: one shared submission per committee (future-use)
export type TaskScope = "individual" | "group";

export type AssignmentStatus =
  | "pending" // Auto-created on task activation; member not yet started
  | "in_progress" // Member acknowledged the task
  | "submitted" // Deliverables submitted; awaiting evaluation
  | "under_review" // Queued (for Gemini Bot or manual admin queue)
  | "evaluated" // Score + feedback written
  | "revision_requested" // Returned with notes; member must resubmit
  | "rejected"; // Admin/head closed without score

export type EvaluatorType =
  | "GEMINI_BOT" // Fully automated
  | "MANUAL" // Human admin / committee head
  | "HYBRID"; // Gemini pre-scored, human confirmed/overrode

export type BotTrigger =
  | "AUTO_SUBMIT" // Triggered automatically when member submits
  | "MANUAL_TRIGGER" // Admin/head manually fires bot on existing submission
  | "RE_EVALUATE"; // Re-run after criteria change

// Poll config — defined by the task creator
export interface PollConfig {
  question: string;
  options: { id: string; label: string }[];
  allowMultiple: boolean;       // single choice vs multi-select
  showResultsBeforeDeadline: boolean;
  requiresQuorum: boolean;      // minimum % of members must vote for result to be valid
  quorumPercent?: number;
}

// Survey config — a structured form
export interface SurveyQuestion {
  id: string;
  label: string;
  type: "short_text" | "long_text" | "single_choice" | "multi_choice" | "rating";
  options?: string[];           // for choice types
  required: boolean;
}

export interface SurveyConfig {
  questions: SurveyQuestion[];
  anonymous: boolean;           // if true, responses aren't linked to userId
}

// ─── Sub-document Shapes ──────────────────────────────────────────────────────

export interface TaskDeliverable {
  label: string; // e.g. "Design Mockup Link"
  description?: string; // Helper text shown to member
  type: "text" | "url" | "file_url" | "image_url";
  required: boolean;
  placeholder?: string;
}

export interface SubmissionItem {
  deliverableLabel: string; // Must match a TaskDeliverable.label
  type: "text" | "url" | "file_url" | "image_url";
  value: string;
}

export interface CriteriaScore {
  criterion: string; // e.g. "Creativity"
  awarded: number;
  maximum: number;
  rationale: string; // Gemini's or human's reasoning
}

export interface EvaluationResult {
  totalScore: number;
  maxScore: number;
  percentageScore: number; // (totalScore / maxScore) * 100
  feedback: string; // 2–4 sentence overall feedback
  criteriaBreakdown: CriteriaScore[];
  evaluatorId: string; // Literal "GEMINI_BOT" | ObjectId string of admin
  evaluatorType: EvaluatorType;
  evaluatedAt: Date;
  flaggedForHumanReview: boolean; // Bot sets this when uncertain
  reviewNote?: string; // Reason for flagging
}

export interface RevisionHistoryEntry {
  requestedAt: Date;
  requestedBy: string; // Vault ObjectId of admin/head who requested
  reason: string;
  resubmittedAt?: Date; // Populated when member re-submits
}

// Add to ITask
export type AssignmentTarget =
  | { mode: "broadcast" }                    // all approved members
  | { mode: "specific"; userIds: string[] }  // named individuals
  | { mode: "role"; roles: string[] }        // e.g. ["HEAD", "COORDINATOR"]

// ─── Primary Document Interfaces ─────────────────────────────────────────────

export interface ITask {
  _id: string;
  title: string;
  description: string;
  committeeSlug: string; // Scoping key — matches CommitteeDocument.slug
  createdBy: string; // Vault ObjectId of admin / committee HEAD who created
  // If empty array → task is broadcast to ALL approved members of the committee.
  // If populated → task is targeted to specific UserData ObjectIds only.
  assignmentTarget: AssignmentTarget;
  scope: TaskScope;
  priority: TaskPriority;
  priorityWeight: number;
  status: TaskStatus;
  deadline: Date;
  taskType: TaskType;
  pollConfig?: PollConfig; // only present when taskType === "poll"
  surveyConfig?: SurveyConfig; // only present when taskType === "survey"
  deliverables: TaskDeliverable[];
  tags: string[];
  maxScore: number; // Ceiling for scoring (default 100)
  autoEvaluate: boolean; // If true → trigger Gemini Bot on submit
  evaluationCriteria: string; // Natural language criteria — fed verbatim to Gemini
  isVisible: boolean; // Can be hidden from members without cancelling
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssignment {
  _id: string;
  taskId: string; // Task ObjectId
  userId: string; // UserData ObjectId of the assigned member
  committeeSlug: string; // Denormalised — avoids join when listing per committee
  status: AssignmentStatus;
  submission?: {
    items: SubmissionItem[];
    submittedAt: Date;
    additionalNotes?: string;
  };
  evaluation?: EvaluationResult;
  revisionHistory: RevisionHistoryEntry[];
  overriddenDeadline?: Date; // Per-assignment deadline set by admin
  createdAt: Date;
  updatedAt: Date;
}

// Replaces SubmissionItem for polls
export interface PollResponse {
  selectedOptionIds: string[];
  votedAt: Date;
}

// Replaces SubmissionItem for surveys  
export interface SurveyResponse {
  answers: { questionId: string; value: string | string[] }[];
  submittedAt: Date;
}

export interface IBotActionLog {
  _id: string;
  assignmentId: string; // Assignment ObjectId
  taskId: string; // Task ObjectId (denormalised)
  userId: string; // UserData ObjectId (denormalised)
  committeeSlug: string;
  trigger: BotTrigger;
  inputPayload: {
    submissionText: string; // Flattened submission fed to Gemini
    evaluationCriteria: string; // Criteria snapshot at time of evaluation
    taskTitle: string;
    taskDescription: string;
    maxScore: number;
  };
  rawGeminiResponse: string; // Unparsed string from Gemini — kept for audit
  parsedResult?: Partial<EvaluationResult>;
  tokensUsed?: number;
  processingMs: number;
  modelVersion: string; // e.g. "gemini-1.5-flash"
  success: boolean;
  errorMessage?: string; // Populated on parse failure or API error
  createdAt: Date;
}

// ─── API Request/Response Contracts ──────────────────────────────────────────

export interface CreateTaskPayload {
  title: string;
  description: string;
  committeeSlug: string;
  taskType?: TaskType; // ← add
  assignmentTarget?: AssignmentTarget; // ← replaces specificAssignees
  scope?: TaskScope;
  priority?: TaskPriority;
  deadline: string;
  pollConfig?: PollConfig; // ← add
  surveyConfig?: SurveyConfig; // ← add
  deliverables?: TaskDeliverable[];
  tags?: string[];
  maxScore?: number;
  autoEvaluate?: boolean;
  evaluationCriteria?: string;
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

// Shape that Gemini must return — used for JSON.parse validation
export interface GeminiEvaluationResponse {
  totalScore: number;
  percentageScore: number;
  feedback: string;
  criteriaBreakdown: CriteriaScore[];
  flaggedForHumanReview: boolean;
  reviewNote: string | null;
}
