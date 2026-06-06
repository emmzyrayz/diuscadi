"use client";
// context/TaskContext.tsx — Phase 3 update
// Adds: FullAssignmentDetail type, loadAssignmentDetail(), selectedAssignment
// state, clearSelectedAssignment(). Everything else unchanged from Phase 2.

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import type { SubmitAssignmentPayload, BotTrigger } from "@/types/tasks";

// ─── Phase 2 types (unchanged) ────────────────────────────────────────────────

export interface TaskAssignmentSummary {
  _id: string;
  status:
    | "pending"
    | "in_progress"
    | "submitted"
    | "under_review"
    | "evaluated"
    | "revision_requested"
    | "rejected";
  submittedAt: string | null;
  score: { total: number; max: number; percentage: number } | null;
  evaluatedAt: string | null;
  flaggedForHumanReview: boolean;
  effectiveDeadline: string;
  revisionsRequested: number;
}

export interface TaskDeliverableClient {
  label: string;
  description?: string;
  type: "text" | "url" | "file_url" | "image_url";
  required: boolean;
  placeholder?: string;
}

export interface EnrichedTask {
  _id: string;
  title: string;
  description: string;
  committeeSlug: string;
  priority: "low" | "medium" | "high" | "critical";
  priorityWeight: number;
  status: "draft" | "active" | "completed" | "cancelled" | "archived";
  taskType: "submission" | "poll" | "survey" | "acknowledgement";
  deadline: string;
  deliverables: TaskDeliverableClient[];
  tags: string[];
  maxScore: number;
  autoEvaluate: boolean;
  evaluationCriteria: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  assignment: TaskAssignmentSummary | null;
}

export interface TaskPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CommitteeMeta {
  slug: string;
  name?: string;
  color?: string;
  icon?: string;
}

export interface SubmitResult {
  success: boolean;
  error?: string;
  botTriggered?: boolean;
  evaluationPreview?: {
    score: number;
    maxScore: number;
    percentage: number;
    flaggedForHumanReview: boolean;
    feedback: string;
  } | null;
}

export interface BotEvaluateResult {
  success: boolean;
  error?: string;
  flaggedForHumanReview?: boolean;
  evaluation?: {
    totalScore: number;
    maxScore: number;
    percentageScore: number;
    feedback: string;
    flaggedForHumanReview: boolean;
  };
}

// ─── Phase 3 types (new) ──────────────────────────────────────────────────────

export interface FullCriteriaScore {
  criterion: string;
  awarded: number;
  maximum: number;
  rationale: string;
}

export interface FullEvaluation {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  feedback: string;
  criteriaBreakdown: FullCriteriaScore[];
  evaluatorId: string;
  evaluatorType: "GEMINI_BOT" | "MANUAL" | "HYBRID";
  evaluatedAt: string;
  flaggedForHumanReview: boolean;
  reviewNote?: string | null;
}

export interface FullSubmissionItem {
  deliverableLabel: string;
  type: "text" | "url" | "file_url" | "image_url";
  value: string;
}

export interface FullRevisionEntry {
  requestedAt: string;
  requestedBy: string;
  reason: string;
  resubmittedAt?: string;
}

export interface FullAssignmentDetail {
  _id: string;
  taskId: string;
  userId: string;
  committeeSlug: string;
  status: string;
  submission?: {
    items: FullSubmissionItem[];
    submittedAt: string;
    additionalNotes?: string;
  };
  evaluation?: FullEvaluation;
  revisionHistory: FullRevisionEntry[];
  overriddenDeadline?: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated by the API from the parent task
  task?: {
    _id: string;
    title: string;
    description: string;
    committeeSlug: string;
    deliverables: TaskDeliverableClient[];
    maxScore: number;
    evaluationCriteria: string;
    autoEvaluate: boolean;
    deadline: string;
    taskType: string;
  };
}

// ─── Context type ──────────────────────────────────────────────────────────────

interface TaskContextType {
  // Task feed (Phase 2)
  tasks: EnrichedTask[];
  pagination: TaskPagination | null;
  committee: CommitteeMeta | null;
  tasksLoading: boolean;
  tasksError: string | null;
  activeStatus: string;

  loadTasks: (status?: string, page?: number) => Promise<void>;
  refreshTasks: () => Promise<void>;
  setActiveStatus: (status: string) => void;
  submitAssignment: (
    assignmentId: string,
    payload: SubmitAssignmentPayload,
  ) => Promise<SubmitResult>;
  triggerBotEvaluate: (
    assignmentId: string,
    trigger?: BotTrigger,
  ) => Promise<BotEvaluateResult>;
  clearErrors: () => void;

  // Full assignment detail (Phase 3)
  selectedAssignment: FullAssignmentDetail | null;
  selectedAssignmentLoading: boolean;
  selectedAssignmentError: string | null;
  loadAssignmentDetail: (assignmentId: string) => Promise<void>;
  clearSelectedAssignment: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("diuscadi_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface TaskProviderProps {
  children: ReactNode;
  token: string | null;
}

export function TaskProvider({ children }: TaskProviderProps) {
  const { isAuthenticated } = useAuth();
  const { profile } = useUser();

  // Phase 2 state
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [pagination, setPagination] = useState<TaskPagination | null>(null);
  const [committee, setCommittee] = useState<CommitteeMeta | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);

  // Phase 3 state
  const [selectedAssignment, setSelectedAssignment] =
    useState<FullAssignmentDetail | null>(null);
  const [selectedAssignmentLoading, setSelectedAssignmentLoading] =
    useState(false);
  const [selectedAssignmentError, setSelectedAssignmentError] = useState<
    string | null
  >(null);

  // ── Load tasks ─────────────────────────────────────────────────────────────

  const loadTasks = useCallback(
    async (status = "active", page = 1) => {
      if (!isAuthenticated) return;
      if (profile?.membershipStatus !== "approved") return;

      setTasksLoading(true);
      setTasksError(null);

      try {
        const params = new URLSearchParams({
          status,
          page: String(page),
          limit: "20",
        });

        const res = await fetch(`/api/members/tasks?${params.toString()}`, {
          headers: authHeaders(),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error ?? "Failed to load tasks");

        setTasks(data.tasks ?? []);
        setPagination(data.pagination ?? null);
        setCommittee(data.committee ?? null);
        setActiveStatus(status);
        setCurrentPage(page);
      } catch (err) {
        setTasksError(
          err instanceof Error ? err.message : "Failed to load tasks",
        );
      } finally {
        setTasksLoading(false);
      }
    },
    [isAuthenticated, profile?.membershipStatus],
  );

  const refreshTasks = useCallback(
    () => loadTasks(activeStatus, currentPage),
    [loadTasks, activeStatus, currentPage],
  );

  // ── Submit assignment ──────────────────────────────────────────────────────

  const submitAssignment = useCallback(
    async (
      assignmentId: string,
      payload: SubmitAssignmentPayload,
    ): Promise<SubmitResult> => {
      try {
        const res = await fetch(
          `/api/members/assignments/${assignmentId}/submit`,
          {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload),
          },
        );
        const data = await res.json();

        if (!res.ok)
          return { success: false, error: data.error ?? "Submission failed" };

        setTasks((prev) =>
          prev.map((task) => {
            if (task.assignment?._id !== assignmentId) return task;
            return {
              ...task,
              assignment: {
                ...task.assignment,
                status: data.assignment?.status ?? "submitted",
                submittedAt:
                  data.assignment?.submission?.submittedAt ??
                  new Date().toISOString(),
                score: data.evaluationPreview
                  ? {
                      total: data.evaluationPreview.score,
                      max: data.evaluationPreview.maxScore,
                      percentage: data.evaluationPreview.percentage,
                    }
                  : task.assignment.score,
                flaggedForHumanReview:
                  data.evaluationPreview?.flaggedForHumanReview ??
                  task.assignment.flaggedForHumanReview,
              },
            };
          }),
        );

        return {
          success: true,
          botTriggered: data.botTriggered ?? false,
          evaluationPreview: data.evaluationPreview ?? null,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Submission failed",
        };
      }
    },
    [],
  );

  // ── Trigger bot evaluate ───────────────────────────────────────────────────

  const triggerBotEvaluate = useCallback(
    async (
      assignmentId: string,
      trigger?: BotTrigger,
    ): Promise<BotEvaluateResult> => {
      try {
        const res = await fetch("/api/members/bot/evaluate", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ assignmentId, trigger }),
        });
        const data = await res.json();

        if (!res.ok)
          return { success: false, error: data.error ?? "Evaluation failed" };

        setTasks((prev) =>
          prev.map((task) => {
            if (task.assignment?._id !== assignmentId) return task;
            return {
              ...task,
              assignment: {
                ...task.assignment,
                status: data.assignment?.status ?? task.assignment.status,
                score: data.evaluation
                  ? {
                      total: data.evaluation.totalScore,
                      max: data.evaluation.maxScore,
                      percentage: data.evaluation.percentageScore,
                    }
                  : task.assignment.score,
                evaluatedAt:
                  data.evaluation?.evaluatedAt ?? task.assignment.evaluatedAt,
                flaggedForHumanReview:
                  data.flaggedForHumanReview ??
                  task.assignment.flaggedForHumanReview,
              },
            };
          }),
        );

        return {
          success: true,
          flaggedForHumanReview: data.flaggedForHumanReview,
          evaluation: data.evaluation,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Evaluation failed",
        };
      }
    },
    [],
  );

  // ── Load full assignment detail (Phase 3) ──────────────────────────────────

  const loadAssignmentDetail = useCallback(async (assignmentId: string) => {
    setSelectedAssignmentLoading(true);
    setSelectedAssignmentError(null);

    try {
      const res = await fetch(`/api/members/assignments/${assignmentId}`, {
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to load assignment");

      // Merge task summary into the assignment object for convenience
      setSelectedAssignment({
        ...data.assignment,
        task: data.task ?? undefined,
      });
    } catch (err) {
      setSelectedAssignmentError(
        err instanceof Error ? err.message : "Failed to load assignment",
      );
    } finally {
      setSelectedAssignmentLoading(false);
    }
  }, []);

  const clearSelectedAssignment = useCallback(() => {
    setSelectedAssignment(null);
    setSelectedAssignmentError(null);
  }, []);

  const clearErrors = useCallback(() => setTasksError(null), []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        pagination,
        committee,
        tasksLoading,
        tasksError,
        activeStatus,
        loadTasks,
        refreshTasks,
        setActiveStatus,
        submitAssignment,
        triggerBotEvaluate,
        clearErrors,
        selectedAssignment,
        selectedAssignmentLoading,
        selectedAssignmentError,
        loadAssignmentDetail,
        clearSelectedAssignment,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks(): TaskContextType {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within a TaskProvider");
  return ctx;
}