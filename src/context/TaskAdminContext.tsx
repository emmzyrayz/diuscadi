"use client";
// context/TaskAdminContext.tsx
// Manages admin-facing task operations: listing, status updates,
// viewing submissions, requesting revisions, manual evaluation.
//
// Kept separate from AdminContext (which manages users/events/applications)
// because it requires TaskContext-adjacent types and operates on different
// API endpoints. Follows identical authHeaders + useCallback pattern.

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type {
  TaskDeliverableClient,
  TaskPagination,
} from "@/context/TaskContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssignmentStats {
  total: number;
  pending: number;
  in_progress: number;
  submitted: number;
  under_review: number;
  evaluated: number;
  revision_requested: number;
  rejected: number;
}

export interface AdminEnrichedTask {
  _id: string;
  title: string;
  description: string;
  committeeSlug: string;
  createdBy: string;
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
  assignmentStats: AssignmentStats;
}

export interface AssignmentWithMemberInfo {
  _id: string;
  taskId: string;
  userId: string;
  committeeSlug: string;
  status: string;
  submission?: {
    items: { deliverableLabel: string; type: string; value: string }[];
    submittedAt: string;
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
    evaluatorType: string;
    evaluatedAt: string;
    flaggedForHumanReview: boolean;
    reviewNote?: string | null;
  };
  revisionHistory: {
    requestedAt: string;
    requestedBy: string;
    reason: string;
    resubmittedAt?: string;
  }[];
  overriddenDeadline?: string | null;
  memberInfo: { fullName: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ManualEvalPayload {
  totalScore: number;
  feedback: string;
  criteriaBreakdown?: {
    criterion: string;
    awarded: number;
    maximum: number;
    rationale?: string;
  }[];
  evaluatorType?: "MANUAL" | "HYBRID";
}

export interface AdminTasksQuery {
  status?: string;
  page?: number;
  committeeSlug?: string;
  priority?: string;
}

export interface AdminActionResult {
  success: boolean;
  error?: string;
}

// ─── Context type ──────────────────────────────────────────────────────────────

interface TaskAdminContextType {
  // Task list
  adminTasks: AdminEnrichedTask[];
  adminPagination: TaskPagination | null;
  adminTasksLoading: boolean;
  adminTasksError: string | null;
  adminStatusFilter: string;

  // Task assignments panel
  viewingTask: AdminEnrichedTask | null;
  taskAssignments: AssignmentWithMemberInfo[];
  taskAssignmentsLoading: boolean;
  taskAssignmentsError: string | null;

  // Methods
  loadAdminTasks: (opts?: AdminTasksQuery) => Promise<void>;
  refreshAdminTasks: () => Promise<void>;
  setAdminStatusFilter: (status: string) => void;
  updateTaskStatus: (
    taskId: string,
    status: string,
  ) => Promise<AdminActionResult>;
  loadTaskAssignments: (task: AdminEnrichedTask) => Promise<void>;
  closeTaskAssignments: () => void;
  requestRevision: (
    assignmentId: string,
    reason: string,
  ) => Promise<AdminActionResult>;
  manualEvaluate: (
    assignmentId: string,
    payload: ManualEvalPayload,
  ) => Promise<AdminActionResult>;
  clearAdminErrors: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TaskAdminContext = createContext<TaskAdminContextType | undefined>(
  undefined,
);

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

interface TaskAdminProviderProps {
  children: ReactNode;
  token: string | null;
}

export function TaskAdminProvider({ children }: TaskAdminProviderProps) {
  const [adminTasks, setAdminTasks] = useState<AdminEnrichedTask[]>([]);
  const [adminPagination, setAdminPagination] = useState<TaskPagination | null>(
    null,
  );
  const [adminTasksLoading, setAdminTasksLoading] = useState(false);
  const [adminTasksError, setAdminTasksError] = useState<string | null>(null);
  const [adminStatusFilter, setAdminStatusFilter] = useState("active");
  const [currentQuery, setCurrentQuery] = useState<AdminTasksQuery>({});

  const [viewingTask, setViewingTask] = useState<AdminEnrichedTask | null>(
    null,
  );
  const [taskAssignments, setTaskAssignments] = useState<
    AssignmentWithMemberInfo[]
  >([]);
  const [taskAssignmentsLoading, setTaskAssignmentsLoading] = useState(false);
  const [taskAssignmentsError, setTaskAssignmentsError] = useState<
    string | null
  >(null);

  // ── Load admin tasks ───────────────────────────────────────────────────────

  const loadAdminTasks = useCallback(async (opts: AdminTasksQuery = {}) => {
    setAdminTasksLoading(true);
    setAdminTasksError(null);
    setCurrentQuery(opts);

    try {
      const params = new URLSearchParams();
      if (opts.status && opts.status !== "all")
        params.set("status", opts.status);
      if (opts.committeeSlug) params.set("committee", opts.committeeSlug);
      if (opts.priority) params.set("priority", opts.priority);
      if (opts.page) params.set("page", String(opts.page));

      const res = await fetch(`/api/admin/tasks?${params.toString()}`, {
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to load tasks");

      setAdminTasks(data.tasks ?? []);
      setAdminPagination(data.pagination ?? null);
    } catch (err) {
      setAdminTasksError(
        err instanceof Error ? err.message : "Failed to load tasks",
      );
    } finally {
      setAdminTasksLoading(false);
    }
  }, []);

  const refreshAdminTasks = useCallback(
    () => loadAdminTasks(currentQuery),
    [loadAdminTasks, currentQuery],
  );

  // ── Update task status ─────────────────────────────────────────────────────

  const updateTaskStatus = useCallback(
    async (taskId: string, status: string): Promise<AdminActionResult> => {
      try {
        const res = await fetch(`/api/admin/tasks/task/${taskId}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ status }),
        });
        const data = await res.json();

        if (!res.ok)
          return { success: false, error: data.error ?? "Update failed" };

        // Optimistic update — patch the task in the list
        setAdminTasks((prev) =>
          prev.map((t) =>
            t._id === taskId
              ? { ...t, status: status as AdminEnrichedTask["status"] }
              : t,
          ),
        );

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Update failed",
        };
      }
    },
    [],
  );

  // ── Load task assignments panel ────────────────────────────────────────────

  const loadTaskAssignments = useCallback(async (task: AdminEnrichedTask) => {
    setViewingTask(task);
    setTaskAssignments([]);
    setTaskAssignmentsLoading(true);
    setTaskAssignmentsError(null);

    try {
      const res = await fetch(`/api/admin/tasks/task/${task._id}/assignments`, {
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to load assignments");

      setTaskAssignments(data.assignments ?? []);
    } catch (err) {
      setTaskAssignmentsError(
        err instanceof Error ? err.message : "Failed to load assignments",
      );
    } finally {
      setTaskAssignmentsLoading(false);
    }
  }, []);

  const closeTaskAssignments = useCallback(() => {
    setViewingTask(null);
    setTaskAssignments([]);
    setTaskAssignmentsError(null);
  }, []);

  // ── Request revision ───────────────────────────────────────────────────────

  const requestRevision = useCallback(
    async (
      assignmentId: string,
      reason: string,
    ): Promise<AdminActionResult> => {
      try {
        const res = await fetch(
          `/api/admin/assignments/assignment/${assignmentId}/request-revision`,
          {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ reason }),
          },
        );
        const data = await res.json();

        if (!res.ok)
          return { success: false, error: data.error ?? "Request failed" };

        // Update the assignment in the panel list
        setTaskAssignments((prev) =>
          prev.map((a) =>
            a._id === assignmentId ? { ...a, status: "revision_requested" } : a,
          ),
        );

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Request failed",
        };
      }
    },
    [],
  );

  // ── Manual evaluate ────────────────────────────────────────────────────────

  const manualEvaluate = useCallback(
    async (
      assignmentId: string,
      payload: ManualEvalPayload,
    ): Promise<AdminActionResult> => {
      try {
        const res = await fetch(
          `/api/admin/assignments/assignment/${assignmentId}/evaluate`,
          {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify(payload),
          },
        );
        const data = await res.json();

        if (!res.ok)
          return { success: false, error: data.error ?? "Evaluation failed" };

        // Update the assignment in the panel list
        setTaskAssignments((prev) =>
          prev.map((a) =>
            a._id === assignmentId
              ? {
                  ...a,
                  status: "evaluated",
                  evaluation: data.evaluation,
                }
              : a,
          ),
        );

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Evaluation failed",
        };
      }
    },
    [],
  );

  const clearAdminErrors = useCallback(() => {
    setAdminTasksError(null);
    setTaskAssignmentsError(null);
  }, []);

  return (
    <TaskAdminContext.Provider
      value={{
        adminTasks,
        adminPagination,
        adminTasksLoading,
        adminTasksError,
        adminStatusFilter,
        viewingTask,
        taskAssignments,
        taskAssignmentsLoading,
        taskAssignmentsError,
        loadAdminTasks,
        refreshAdminTasks,
        setAdminStatusFilter,
        updateTaskStatus,
        loadTaskAssignments,
        closeTaskAssignments,
        requestRevision,
        manualEvaluate,
        clearAdminErrors,
      }}
    >
      {children}
    </TaskAdminContext.Provider>
  );
}

export function useTaskAdmin(): TaskAdminContextType {
  const ctx = useContext(TaskAdminContext);
  if (!ctx)
    throw new Error("useTaskAdmin must be used within a TaskAdminProvider");
  return ctx;
}
