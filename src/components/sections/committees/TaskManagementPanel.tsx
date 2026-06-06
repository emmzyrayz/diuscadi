"use client";

import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  LuRefreshCw,
  LuInbox,
  LuCircleAlert,
  LuUsers,
  LuCircleCheck,
  LuSend,
  LuLoader,
  LuRotateCcw,
  LuChevronRight,
  LuEye,
  LuPenLine,
  LuZap,
} from "react-icons/lu";
import { useTaskAdmin } from "@/context/TaskAdminContext";
import { useToast } from "@/hooks/useToast";
import { ManualEvaluateSheet } from "@/components/sections/tasks/ManualEvaluateSheet";
import type {
  AdminEnrichedTask,
  AssignmentWithMemberInfo,
} from "@/context/TaskAdminContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

function deadlineLabel(dateStr: string): {
  text: string;
  urgent: boolean;
  past: boolean;
} {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  const fmt = formatDate(dateStr);
  if (diff < 0) return { text: `Overdue · ${fmt}`, urgent: false, past: true };
  if (days <= 1)
    return { text: `Due Today · ${fmt}`, urgent: true, past: false };
  if (days <= 3)
    return { text: `${days}d left · ${fmt}`, urgent: true, past: false };
  return { text: fmt, urgent: false, past: false };
}

const STATUS_FILTERS = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
] as const;

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

// ─── Assignment row ───────────────────────────────────────────────────────────

interface AssignmentRowProps {
  a: AssignmentWithMemberInfo;
  maxScore: number;
  onRevision: (a: AssignmentWithMemberInfo) => void;
  onEvaluate: (a: AssignmentWithMemberInfo) => void;
  revisionLoading: boolean;
}

function AssignmentRow({
  a,
  maxScore,
  onRevision,
  onEvaluate,
  revisionLoading,
}: AssignmentRowProps) {
  const canRevise = ["submitted", "under_review", "evaluated"].includes(
    a.status,
  );
  const canEval = ["submitted", "under_review"].includes(a.status);
  const hasScore = a.evaluation != null;

  return (
    <div
      className={cn(
        "glass-subtle",
        "rounded-lg",
        "p-3",
        "space-y-2",
        "border",
        "border-border/30",
      )}
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground truncate">
            {a.memberInfo?.fullName ?? "Unknown member"}
          </p>
          <p className="text-[10px] text-muted-foreground/60 truncate">
            {a.memberInfo?.email}
          </p>
        </div>

        <span
          className={cn(
            "text-[9px]",
            "font-mono",
            "font-bold",
            "uppercase",
            "tracking-wider",
            "px-1.5",
            "py-0.5",
            "rounded",
            "shrink-0",
            a.status === "evaluated" && "bg-green-500/10 text-green-500",
            a.status === "submitted" && "bg-primary/10 text-primary",
            a.status === "under_review" && "bg-yellow-500/10 text-yellow-500",
            a.status === "revision_requested" &&
              "bg-orange-500/10 text-orange-500",
            a.status === "pending" && "bg-foreground/5 text-muted-foreground",
            a.status === "rejected" && "bg-red-500/10 text-red-500",
          )}
        >
          {a.status.replace("_", " ")}
        </span>
      </div>

      {/* Score pill if evaluated */}
      {hasScore && a.evaluation && (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px]",
              "font-mono",
              "font-bold",
              "px-2",
              "py-0.5",
              "rounded-full",
              a.evaluation.percentageScore >= 70
                ? "bg-green-500/10 text-green-500"
                : a.evaluation.percentageScore >= 50
                  ? "bg-yellow-500/10 text-yellow-500"
                  : "bg-red-500/10 text-red-500",
            )}
          >
            {a.evaluation.totalScore}/{maxScore} ·{" "}
            {a.evaluation.percentageScore.toFixed(0)}%
          </span>
          {a.evaluation.flaggedForHumanReview && (
            <span className="text-[9px] font-mono text-yellow-500">
              ⚑ Flagged
            </span>
          )}
        </div>
      )}

      {/* Submission date */}
      {a.submission?.submittedAt && (
        <p className="text-[10px] font-mono text-muted-foreground/40">
          Submitted {formatDate(a.submission.submittedAt)}
        </p>
      )}

      {/* Revision history count */}
      {a.revisionHistory.length > 0 && (
        <p className="text-[10px] text-muted-foreground/40">
          {a.revisionHistory.length} revision
          {a.revisionHistory.length > 1 ? "s" : ""} requested
        </p>
      )}

      {/* Action buttons */}
      {(canRevise || canEval) && (
        <div className="flex gap-2 pt-1">
          {canEval && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 flex-1 text-[10px] font-bold uppercase tracking-wider"
              onClick={() => onEvaluate(a)}
            >
              <LuPenLine className="w-3 h-3 mr-1" /> Evaluate
            </Button>
          )}
          {canRevise && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 flex-1 text-[10px] font-bold uppercase tracking-wider text-orange-500 hover:bg-orange-500/5"
              onClick={() => onRevision(a)}
              disabled={revisionLoading}
            >
              {revisionLoading ? (
                <LuLoader className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <LuRotateCcw className="w-3 h-3 mr-1" /> Request Revision
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Admin task card ──────────────────────────────────────────────────────────

interface AdminTaskCardProps {
  task: AdminEnrichedTask;
  onViewSubmissions: (task: AdminEnrichedTask) => void;
  onActivate: (task: AdminEnrichedTask) => void;
  activatingId: string | null;
}

function AdminTaskCard({
  task,
  onViewSubmissions,
  onActivate,
  activatingId,
}: AdminTaskCardProps) {
  const s = task.assignmentStats;
  const dl = deadlineLabel(task.deadline);
  const isActivating = activatingId === task._id;

  return (
    <div
      className={cn(
        "glass-subtle",
        "rounded-xl",
        "border",
        "border-border/40",
        "p-4",
        "space-y-3",
        "hover:border-primary/15",
        "transition-all",
        "duration-200",
      )}
    >
      {/* Title row */}
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                PRIORITY_DOT[task.priority] ?? "bg-gray-400",
              )}
            />
            <h4 className="text-sm font-bold text-foreground truncate">
              {task.title}
            </h4>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 break-words pl-4">
            {task.description}
          </p>
        </div>
        <span
          className={cn(
            "text-[9px]",
            "font-mono",
            "font-bold",
            "uppercase",
            "tracking-wider",
            "px-2",
            "py-0.5",
            "rounded",
            "shrink-0",
            task.status === "active" && "bg-green-500/10 text-green-500",
            task.status === "draft" && "bg-foreground/5 text-muted-foreground",
            task.status === "completed" && "bg-blue-500/10 text-blue-500",
            task.status === "archived" &&
              "bg-foreground/5 text-muted-foreground/40",
            task.status === "cancelled" && "bg-red-500/10 text-red-500",
          )}
        >
          {task.status}
        </span>
      </div>

      {/* Stats row */}
      {s.total > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={cn(
              "flex",
              "items-center",
              "gap-1",
              "text-[10px]",
              "font-mono",
              "text-muted-foreground/60",
            )}
          >
            <LuUsers className="w-3 h-3" /> {s.total} assigned
          </span>
          {s.submitted > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-primary">
              <LuSend className="w-3 h-3" /> {s.submitted} submitted
            </span>
          )}
          {s.evaluated > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-green-500">
              <LuCircleCheck className="w-3 h-3" /> {s.evaluated} evaluated
            </span>
          )}
          {s.under_review > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-yellow-500">
              <LuLoader className="w-3 h-3" /> {s.under_review} in review
            </span>
          )}
        </div>
      )}

      {/* Deadline */}
      <p
        className={cn(
          "text-[10px]",
          "font-mono",
          dl.past
            ? "text-red-500"
            : dl.urgent
              ? "text-orange-500"
              : "text-muted-foreground/50",
        )}
      >
        ⏱ {dl.text}
      </p>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-border/20">
        {task.status === "draft" && (
          <Button
            size="sm"
            className="h-7 flex-1 text-[10px] font-bold uppercase tracking-wider"
            onClick={() => onActivate(task)}
            disabled={isActivating}
          >
            {isActivating ? (
              <>
                <LuLoader className="w-3 h-3 mr-1 animate-spin" /> Activating…
              </>
            ) : (
              <>
                <LuZap className="w-3 h-3 mr-1" /> Activate
              </>
            )}
          </Button>
        )}

        {task.status === "active" && s.total > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 flex-1 text-[10px] font-bold uppercase tracking-wider"
            onClick={() => onViewSubmissions(task)}
          >
            <LuEye className="w-3 h-3 mr-1" />
            View Submissions
            <LuChevronRight className="w-3 h-3 ml-auto" />
          </Button>
        )}

        {task.status === "active" && s.total === 0 && (
          <p className="text-[10px] text-muted-foreground/40 font-mono py-1">
            No assignments spawned yet
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface TaskManagementPanelProps {
  committeeSlug: string;
}

export function TaskManagementPanel({
  committeeSlug,
}: TaskManagementPanelProps) {
  const {
    adminTasks,
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
  } = useTaskAdmin();
  const { toast } = useToast();

  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [revisionTarget, setRevisionTarget] =
    useState<AssignmentWithMemberInfo | null>(null);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [evaluateTarget, setEvaluateTarget] =
    useState<AssignmentWithMemberInfo | null>(null);
  const [evalSheetOpen, setEvalSheetOpen] = useState(false);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);

  // ── Mount: load tasks for this committee ──────────────────────────────────
  useEffect(() => {
    loadAdminTasks({ committeeSlug, status: "active" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committeeSlug]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFilterChange = useCallback(
    (status: string) => {
      setAdminStatusFilter(status);
      loadAdminTasks({ committeeSlug, status });
    },
    [committeeSlug, loadAdminTasks, setAdminStatusFilter],
  );

  const handleActivate = useCallback(
    async (task: AdminEnrichedTask) => {
      setActivatingId(task._id);
      const result = await updateTaskStatus(task._id, "active");
      setActivatingId(null);
      if (result.success) {
        toast({
          title: "Task Activated",
          description: `${task.title} is now live.`,
          variant: "success",
        });
      } else {
        toast({
          title: "Activation Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    [updateTaskStatus, toast],
  );

  const handleViewSubmissions = useCallback(
    async (task: AdminEnrichedTask) => {
      await loadTaskAssignments(task);
      setSubmissionsOpen(true);
    },
    [loadTaskAssignments],
  );

  const handleRequestRevision = useCallback(
    async (a: AssignmentWithMemberInfo) => {
      if (!revisionReason.trim()) return;
      setRevisionLoading(true);
      const result = await requestRevision(a._id, revisionReason);
      setRevisionLoading(false);
      if (result.success) {
        setRevisionTarget(null);
        setRevisionReason("");
        toast({
          title: "Revision Requested",
          description: `${a.memberInfo?.fullName} will resubmit.`,
          variant: "success",
        });
      } else {
        toast({
          title: "Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    [revisionReason, requestRevision, toast],
  );

  const handleEvaluateClick = useCallback((a: AssignmentWithMemberInfo) => {
    setEvaluateTarget(a);
    setEvalSheetOpen(true);
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* ── Filter row ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={cn(
                "text-[10px]",
                "font-mono",
                "font-bold",
                "uppercase",
                "tracking-wider",
                "px-2.5",
                "py-1",
                "rounded-md",
                "transition-all",
                "duration-150",
                adminStatusFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={refreshAdminTasks}
          disabled={adminTasksLoading}
          className={cn(
            "p-1.5",
            "rounded-md",
            "text-muted-foreground/50",
            "hover:text-muted-foreground",
            "hover:bg-foreground/5",
            "transition-all",
            "duration-150",
            adminTasksLoading && "animate-spin pointer-events-none",
          )}
          aria-label="Refresh"
        >
          <LuRefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {adminTasksError && !adminTasksLoading && (
        <div
          className={cn(
            "flex",
            "items-center",
            "gap-2",
            "p-3",
            "rounded-lg",
            "bg-red-500/8",
            "border",
            "border-red-500/20",
          )}
        >
          <LuCircleAlert className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-500 flex-1">{adminTasksError}</p>
          <button
            onClick={refreshAdminTasks}
            className="text-[10px] font-mono font-bold text-red-500 underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Skeletons ─────────────────────────────────────────────────────── */}
      {adminTasksLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "glass-subtle",
                "rounded-xl",
                "border",
                "border-border/30",
                "p-4",
                "space-y-3",
                "animate-pulse",
              )}
            >
              <div className="h-4 bg-foreground/8 rounded w-2/3" />
              <div className="h-3 bg-foreground/5 rounded w-full" />
              <div className="h-3 bg-foreground/5 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!adminTasksLoading && !adminTasksError && adminTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          <LuInbox className="w-9 h-9 text-muted-foreground/20" />
          <div>
            <p className="text-sm font-bold text-muted-foreground/50">
              No tasks yet
            </p>
            <p className="text-[11px] text-muted-foreground/35 mt-0.5">
              Create a task using the form above to get started.
            </p>
          </div>
        </div>
      )}

      {/* ── Task cards ────────────────────────────────────────────────────── */}
      {!adminTasksLoading && adminTasks.length > 0 && (
        <div className="space-y-3">
          {adminTasks.map((task) => (
            <AdminTaskCard
              key={task._id}
              task={task}
              onViewSubmissions={handleViewSubmissions}
              onActivate={handleActivate}
              activatingId={activatingId}
            />
          ))}
        </div>
      )}

      {/* ── Task submissions sheet ────────────────────────────────────────── */}
      <Sheet
        open={submissionsOpen}
        onOpenChange={(v) => {
          setSubmissionsOpen(v);
          if (!v) closeTaskAssignments();
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0"
        >
          <SheetHeader className="p-6 pb-4 border-b border-border space-y-1">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
              Submissions
            </span>
            <SheetTitle className="text-sm font-black uppercase tracking-tight">
              {viewingTask?.title}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {taskAssignmentsLoading && (
              <div className="flex items-center justify-center py-10 gap-2">
                <LuLoader className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Loading submissions…
                </span>
              </div>
            )}

            {taskAssignmentsError && !taskAssignmentsLoading && (
              <div
                className={cn(
                  "p-3",
                  "rounded-lg",
                  "bg-red-500/8",
                  "border",
                  "border-red-500/20",
                  "text-xs",
                  "text-red-500",
                )}
              >
                {taskAssignmentsError}
              </div>
            )}

            {!taskAssignmentsLoading && taskAssignments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-10">
                No submissions yet.
              </p>
            )}

            {!taskAssignmentsLoading &&
              taskAssignments.map((a) => (
                <div key={a._id}>
                  {revisionTarget?._id === a._id ? (
                    // Inline revision reason form
                    <div
                      className={cn(
                        "glass-subtle",
                        "rounded-lg",
                        "p-3",
                        "space-y-2",
                        "border",
                        "border-orange-500/20",
                      )}
                    >
                      <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-500">
                        Revision Reason — {a.memberInfo?.fullName}
                      </p>
                      <textarea
                        className="w-full text-xs p-2 rounded-md bg-foreground/5 border border-border/30 resize-none focus:outline-none focus:ring-1 focus:ring-orange-500/30 min-h-[80px]"
                        placeholder="Describe what the member should fix or improve…"
                        value={revisionReason}
                        onChange={(e) => setRevisionReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 flex-1 text-[10px]"
                          onClick={() => {
                            setRevisionTarget(null);
                            setRevisionReason("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 flex-1 text-[10px] font-bold uppercase tracking-wider bg-orange-500 hover:bg-orange-600"
                          onClick={() => handleRequestRevision(a)}
                          disabled={revisionLoading || !revisionReason.trim()}
                        >
                          {revisionLoading ? (
                            <LuLoader className="w-3 h-3 animate-spin" />
                          ) : (
                            "Confirm"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <AssignmentRow
                      a={a}
                      maxScore={viewingTask?.maxScore ?? 100}
                      onRevision={(a) => {
                        setRevisionTarget(a);
                        setRevisionReason("");
                      }}
                      onEvaluate={handleEvaluateClick}
                      revisionLoading={
                        revisionLoading && revisionTarget?._id === a._id
                      }
                    />
                  )}
                </div>
              ))}
          </div>

          <div className="p-4 border-t border-border">
            <SheetClose asChild>
              <Button
                variant="ghost"
                className="w-full h-9 text-[11px] font-bold uppercase tracking-wider"
              >
                Close
              </Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Manual evaluate sheet ─────────────────────────────────────────── */}
      <ManualEvaluateSheet
        assignment={evaluateTarget}
        maxScore={viewingTask?.maxScore ?? 100}
        open={evalSheetOpen}
        onOpenChange={setEvalSheetOpen}
      />
    </div>
  );
}
