"use client";
// src/app/admin/tasks/[id]/page.tsx
// Admin task detail page.
// Shows: task metadata, status controls (approve/cancel/archive/delete),
// assignment list with evaluation status, and manual evaluation sheet.

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  LuArrowLeft,
  LuLoader,
  LuCircleAlert,
  LuCheck,
  LuX,
  LuArchive,
  LuTrash2,
  LuRefreshCw,
  LuUsers,
  LuClock,
  LuSend,
  LuGlobe,
  LuBuilding2,
  LuCoins,
  LuTriangleAlert,
  LuEye,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
  ManualEvaluateSheet,
//   type ManualEvaluateSheetProps,
} from "@/components/sections/tasks/ManualEvaluateSheet";
import type { AssignmentWithMemberInfo } from "@/context/TaskAdminContext";
import { PollConfig, SurveyConfig, TaskDeliverable } from "@/types/tasks";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskDetail {
  _id: string;
  title: string;
  description: string;
  committeeSlug: string;
  scope: "committee" | "global";
  status: string;
  taskType: string;
  priority: string;
  deadline: string;
  publishedAt?: string;
  createdAt: string;
  pointsReward: number;
  qualityWeight?: number;
  timeWeight?: number;
  decayBaseHours?: number;
  passThresholdPercent?: number;
  autoEvaluate: boolean;
  evaluationCriteria?: string;
  maxScore: number;
  deliverables?: TaskDeliverable[];
  pollConfig?: PollConfig[];
  surveyConfig?: SurveyConfig;
  tags: string[];
}

interface AssignmentSummary {
  _id: string;
  userId: string;
  status: string;
  submittedAt?: string;
  evaluatedAt?: string;
  score?: { total: number; max: number; percentage: number };
  flaggedForHumanReview?: boolean;
  memberName?: string;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["active", "cancelled"],
  pending_approval: ["active", "cancelled"],
  active: ["completed", "cancelled", "archived"],
  completed: ["archived"],
  cancelled: [],
  archived: [],
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  archived: "Archived",
};

const ASSIGNMENT_STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: "Not Started", color: "text-muted-foreground/50" },
  in_progress: { label: "In Progress", color: "text-blue-500" },
  submitted: { label: "Submitted", color: "text-primary" },
  under_review: { label: "Under Review", color: "text-yellow-500" },
  evaluated: { label: "Evaluated", color: "text-emerald-500" },
  revision_requested: { label: "Revision Requested", color: "text-orange-500" },
  rejected: { label: "Rejected", color: "text-red-500" },
};

export default function AdminTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const taskId = params?.id as string;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<AssignmentWithMemberInfo | null>(null);
  const [selectedAssignmentMaxScore, setSelectedAssignmentMaxScore] =
    useState<number>(100);
  const [evalSheetOpen, setEvalSheetOpen] = useState(false);

  // ── Fetch task ─────────────────────────────────────────────────────────────

  const fetchTask = useCallback(async () => {
    if (!token || !taskId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tasks/task/${taskId}/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Task not found");
      setTask(data.task);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task");
    } finally {
      setLoading(false);
    }
  }, [token, taskId]);

  // ── Fetch assignments ──────────────────────────────────────────────────────

  const fetchAssignments = useCallback(async () => {
    if (!token || !taskId) return;
    setAssignmentsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/tasks/task/${taskId}/assignments`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load assignments");
      setAssignments(data.assignments ?? []);
    } catch {
      // Non-fatal — show empty state
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [token, taskId]);

  useEffect(() => {
    fetchTask();
    fetchAssignments();
  }, [fetchTask, fetchAssignments]);

  // ── Status action ──────────────────────────────────────────────────────────

  async function handleStatusChange(newStatus: string) {
    if (!token || !task) return;
    setActionLoading(newStatus);
    try {
      const endpoint =
        newStatus === "active" && task.status === "pending_approval"
          ? `/api/admin/tasks/task/${taskId}/approve`
          : `/api/admin/tasks/task/${taskId}`;

      const method =
        newStatus === "active" && task.status === "pending_approval"
          ? "POST"
          : "PATCH";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        ...(method === "PATCH" && {
          body: JSON.stringify({ status: newStatus }),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");

      toast.success(
        newStatus === "active"
          ? `Task approved and published. ${data.assignments?.spawned ?? 0} assignment(s) created.`
          : `Task status updated to "${STATUS_LABELS[newStatus] ?? newStatus}".`,
      );

      await fetchTask();
      if (newStatus === "active") await fetchAssignments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!token) return;
    setActionLoading("delete");
    try {
      const res = await fetch(`/api/admin/tasks/task/${taskId}/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");

      toast.success("Task deleted.");
      router.replace("/admin/tasks");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
      setShowDeleteConfirm(false);
    } finally {
      setActionLoading(null);
    }
  }

  // ── Loading / error ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LuLoader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <LuCircleAlert className="w-10 h-10 text-red-500" />
        <p className="text-sm font-bold text-red-500">{error ?? "Task not found"}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const allowedTransitions = STATUS_TRANSITIONS[task.status] ?? [];
  const isOverdue = new Date(task.deadline) < new Date();
  const isPendingApproval = task.status === "pending_approval";
  const canDelete =
    task.status !== "active" && task.status !== "pending_approval";

  const submittedCount = assignments.filter((a) =>
    ["submitted", "under_review", "evaluated"].includes(a.status),
  ).length;
  const evaluatedCount = assignments.filter(
    (a) => a.status === "evaluated",
  ).length;
  const flaggedCount = assignments.filter(
    (a) => a.flaggedForHumanReview,
  ).length;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-[90px] pb-20 space-y-8">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/tasks")}
        className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors cursor-pointer"
      >
        <LuArrowLeft className="w-4 h-4" /> All Tasks
      </button>

      {/* ── Task header ─────────────────────────────────────────────────────── */}
      <div className="bg-background border-2 border-border rounded-[2rem] p-7 space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {task.scope === "global" ? (
                <LuGlobe className="w-4 h-4 text-primary" />
              ) : (
                <LuBuilding2 className="w-4 h-4 text-muted-foreground/50" />
              )}
              <span className="text-[9px] font-mono text-muted-foreground/60 uppercase">
                {task.committeeSlug} · {task.taskType} · {task.priority}
              </span>
              <span
                className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                  isPendingApproval
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    : task.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border",
                )}
              >
                {STATUS_LABELS[task.status] ?? task.status}
              </span>
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {task.title}
            </h1>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* ← ADD THIS: Show deliverables with social URLs */}
            {task.deliverables && task.deliverables.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                  Deliverables
                </p>
                <div className="space-y-1.5">
                  {task.deliverables.map((d, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                        {i + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-foreground">
                          {d.label}
                          {d.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </p>
                        {d.description && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {d.description}
                          </p>
                        )}
                        {d.socialMediaUrl && (
                          <a
                            href={d.socialMediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline mt-1 inline-block"
                          >
                            → Visit {new URL(d.socialMediaUrl).hostname}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              fetchTask();
              fetchAssignments();
            }}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-all shrink-0"
          >
            <LuRefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Meta strip */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
          <MetaItem
            icon={LuClock}
            label="Deadline"
            value={new Date(task.deadline).toLocaleString()}
            urgent={isOverdue}
          />
          {task.pointsReward > 0 && (
            <MetaItem
              icon={LuCoins}
              label="Points"
              value={`${task.pointsReward}pts`}
            />
          )}
          {task.publishedAt && (
            <MetaItem
              icon={LuSend}
              label="Published"
              value={new Date(task.publishedAt).toLocaleString()}
            />
          )}
          <MetaItem
            icon={LuUsers}
            label="Assignments"
            value={`${assignments.length} total`}
          />
          {submittedCount > 0 && (
            <MetaItem
              icon={LuCheck}
              label="Submitted"
              value={`${submittedCount}`}
            />
          )}
          {flaggedCount > 0 && (
            <MetaItem
              icon={LuTriangleAlert}
              label="Flagged"
              value={`${flaggedCount}`}
              urgent
            />
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-mono uppercase tracking-wide px-2 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Pending approval action ──────────────────────────────────────────── */}
      {isPendingApproval && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/5 border-2 border-amber-500/20 rounded-[2rem] p-7 space-y-4"
        >
          <div className="flex items-center gap-3">
            <LuTriangleAlert className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-black text-amber-600">
                This task is awaiting your approval
              </p>
              <p className="text-[11px] text-amber-600/70 mt-0.5">
                Review the task details above before approving. Once approved,
                assignments will be spawned and members notified.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => handleStatusChange("active")}
              disabled={!!actionLoading}
              className="flex-1 text-[11px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {actionLoading === "active" ? (
                <LuLoader className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <LuCheck className="w-3.5 h-3.5 mr-2" />
                  Approve & Publish
                </>
              )}
            </Button>
            <Button
              onClick={() => handleStatusChange("cancelled")}
              disabled={!!actionLoading}
              variant="outline"
              className="flex-1 text-[11px] font-black uppercase tracking-widest border-red-500/30 text-red-500 hover:bg-red-500/5"
            >
              {actionLoading === "cancelled" ? (
                <LuLoader className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <LuX className="w-3.5 h-3.5 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* ── Status controls (non-pending) ─────────────────────────────────── */}
      {!isPendingApproval && allowedTransitions.length > 0 && (
        <div className="bg-background border-2 border-border rounded-[2rem] p-6 space-y-3">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Status Controls
          </p>
          <div className="flex flex-wrap gap-2">
            {allowedTransitions.map((s) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(s)}
                disabled={!!actionLoading}
                className={cn(
                  "text-[10px] font-black uppercase tracking-wider h-8",
                  s === "active" &&
                    "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5",
                  s === "cancelled" &&
                    "border-red-500/30 text-red-500 hover:bg-red-500/5",
                  s === "archived" &&
                    "border-muted-foreground/20 text-muted-foreground",
                )}
              >
                {actionLoading === s ? (
                  <LuLoader className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    {s === "active" && <LuCheck className="w-3 h-3 mr-1.5" />}
                    {s === "cancelled" && <LuX className="w-3 h-3 mr-1.5" />}
                    {s === "archived" && (
                      <LuArchive className="w-3 h-3 mr-1.5" />
                    )}
                    {STATUS_LABELS[s] ?? s}
                  </>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* ── Assignments list ─────────────────────────────────────────────────── */}
      <div className="bg-background border-2 border-border rounded-[2rem] p-7 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-sm font-black text-foreground uppercase tracking-tight">
              Assignments
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
              {assignments.length} total · {evaluatedCount} evaluated ·{" "}
              {flaggedCount} flagged
            </p>
          </div>
        </div>

        {assignmentsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 bg-foreground/5 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <LuUsers className="w-7 h-7 text-muted-foreground/20" />
            <p className="text-xs font-bold text-muted-foreground/50">
              No assignments yet
            </p>
            <p className="text-[10px] text-muted-foreground/35">
              Assignments are spawned when the task is activated.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => {
              const statusCfg =
                ASSIGNMENT_STATUS_CONFIG[a.status] ??
                ASSIGNMENT_STATUS_CONFIG.pending;
              const canEval =
                ["submitted", "under_review"].includes(a.status) &&
                task.taskType === "submission";

              return (
                <div
                  key={a._id}
                  className="flex items-center gap-4 p-4 border border-border rounded-xl hover:border-border/80 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-foreground truncate">
                      {a.memberName ?? a.userId}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span
                        className={cn("text-[9px] font-bold", statusCfg.color)}
                      >
                        {statusCfg.label}
                      </span>
                      {a.score && (
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {a.score.total}/{a.score.max} ·{" "}
                          {a.score.percentage.toFixed(0)}%
                        </span>
                      )}
                      {a.flaggedForHumanReview && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500">
                          <LuTriangleAlert className="w-2.5 h-2.5" />
                          Flagged
                        </span>
                      )}
                    </div>
                  </div>

                  {canEval && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] font-black uppercase tracking-wider shrink-0"
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            `/api/members/assignments/${a._id}`,
                            {
                              headers: { Authorization: `Bearer ${token}` },
                            },
                          );
                          const data = await res.json();
                          if (res.ok) {
                            setSelectedAssignment(
                              data.assignment as AssignmentWithMemberInfo,
                            );
                            setSelectedAssignmentMaxScore(
                              task?.maxScore ?? 100,
                            );
                            setEvalSheetOpen(true);
                          }
                        } catch {
                          toast.error("Failed to load assignment details");
                        }
                      }}
                    >
                      <LuEye className="w-3 h-3 mr-1.5" />
                      Evaluate
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Delete zone ───────────────────────────────────────────────────────── */}
      {canDelete && (
        <div className="bg-red-500/5 border-2 border-red-500/15 rounded-[2rem] p-6 space-y-3">
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
            Danger Zone
          </p>
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] text-muted-foreground">
                Permanently delete this task and all its assignments. This
                cannot be undone.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="shrink-0 text-[10px] font-black uppercase tracking-wider border-red-500/30 text-red-500 hover:bg-red-500/5"
              >
                <LuTrash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-red-600">
                Are you sure? This will delete the task and {assignments.length}{" "}
                assignment(s) permanently.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-[10px] font-black uppercase tracking-wider"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleDelete}
                  disabled={actionLoading === "delete"}
                  className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-wider"
                >
                  {actionLoading === "delete" ? (
                    <LuLoader className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Yes, Delete Permanently"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Manual evaluation sheet ───────────────────────────────────────── */}
      {selectedAssignment && (
        <ManualEvaluateSheet
          assignment={selectedAssignment}
          maxScore={selectedAssignmentMaxScore}
          open={evalSheetOpen}
          onOpenChange={(open) => {
            setEvalSheetOpen(open);
            if (!open) {
              setSelectedAssignment(null);
              setSelectedAssignmentMaxScore(100);
              fetchAssignments();
            }
          }}
        />
      )}
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
  urgent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  urgent?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon
        className={cn(
          "w-3.5 h-3.5",
          urgent ? "text-red-500" : "text-muted-foreground/50",
        )}
      />
      <div>
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
          {label}
        </p>
        <p
          className={cn(
            "text-[11px] font-bold",
            urgent ? "text-red-500" : "text-foreground",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}