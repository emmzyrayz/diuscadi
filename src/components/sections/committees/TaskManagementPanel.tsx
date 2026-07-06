"use client";
// src/components/sections/committees/TaskManagementPanel.tsx
// Phase 6 update:
//   - "Create Task" button routes to /committees/[slug]/tasks/create
//   - Clicking a task card opens TaskDetailModal (read + edit link)
//   - Task cards show assignmentStats if available

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import {
  LuPlus,
  LuLoader,
  LuRefreshCw,
  LuCircleAlert,
  LuInbox,
  LuChevronLeft,
  LuChevronRight,
  LuClock,
  LuUsers,
  LuCoins,
  LuCheck,
  LuSend,
  LuVote,
  LuClipboardList,
  LuShieldCheck,
  LuTriangleAlert,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { TaskDetailModal } from "@/components/sections/tasks/admin/TaskDetailModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskItem {
  _id: string;
  title: string;
  description: string;
  committeeSlug: string;
  status: string;
  taskType: string;
  priority: string;
  deadline: string;
  pointsReward: number;
  tags: string[];
  assignmentStats?: {
    total: number;
    byStatus: Record<string, number>;
  };
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Display config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
  },
  pending_approval: {
    label: "Pending Approval",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  active: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  completed: {
    label: "Completed",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  archived: {
    label: "Archived",
    className: "bg-muted text-muted-foreground/60 border-border",
  },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  submission: LuSend,
  poll: LuVote,
  survey: LuClipboardList,
  acknowledgement: LuShieldCheck,
};

const PRIORITY_DOTS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending_approval", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskManagementPanelProps {
  committeeSlug: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskManagementPanel({
  committeeSlug,
}: TaskManagementPanelProps) {
  const { token } = useAuth();
  const { profile, effectiveRole } = useUser();
  const router = useRouter();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Detail modal state ────────────────────────────────────────────────────
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ── Permission check ───────────────────────────────────────────────────────
  const canCreateTask =
    profile?.membershipStatus === "approved" &&
    ["HEAD", "COORDINATOR"].includes(effectiveRole ?? "");

  // ── Fetch tasks ────────────────────────────────────────────────────────────

  const fetchTasks = useCallback(
    async (status: string, page: number) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          status,
          page: String(page),
          committee: committeeSlug,
        });
        const res = await fetch(`/api/admin/tasks?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load tasks");
        setTasks(data.tasks ?? []);
        setPagination(data.pagination ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    },
    [token, committeeSlug],
  );

  useEffect(() => {
    fetchTasks(statusFilter, currentPage);
  }, [fetchTasks, statusFilter, currentPage]);

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleTaskClick = (task: TaskItem) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const pendingCount = tasks.filter(
    (t) => t.status === "pending_approval",
  ).length;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 w-full">
      {/* ── Header row ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
            Committee Tasks
          </h3>
          {pagination && (
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
              {pagination.total} task{pagination.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTasks(statusFilter, currentPage)}
            disabled={loading}
            className={cn(
              "p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-all",
              loading && "animate-spin pointer-events-none",
            )}
          >
            <LuRefreshCw className="w-3.5 h-3.5" />
          </button>

          {canCreateTask && (
            <Button
              size="sm"
              onClick={() =>
                router.push(`/committees/${committeeSlug}/tasks/create`)
              }
              className="h-8 text-[10px] font-black uppercase tracking-widest"
            >
              <LuPlus className="w-3.5 h-3.5 mr-1.5" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* ── Pending approval banner ──────────────────────────────────────────── */}
      {pendingCount > 0 && statusFilter === "all" && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
          <LuTriangleAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className="text-[11px] text-amber-600 font-bold flex-1">
            {pendingCount} task{pendingCount > 1 ? "s" : ""} awaiting admin
            approval
          </p>
          <button
            onClick={() => handleFilterChange("pending_approval")}
            className="text-[9px] font-black text-amber-600 uppercase tracking-widest underline underline-offset-2"
          >
            Filter
          </button>
        </div>
      )}

      {/* ── Status filters ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={cn(
              "text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all",
              statusFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
          <LuCircleAlert className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-500 flex-1">{error}</p>
          <button
            onClick={() => fetchTasks(statusFilter, currentPage)}
            className="text-[9px] font-black text-red-500 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-foreground/5 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ── Empty ────────────────────────────────────────────────────────────── */}
      {!loading && !error && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center border border-dashed border-border rounded-2xl">
          <LuInbox className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-xs font-bold text-muted-foreground/50">
            No {statusFilter !== "all" ? statusFilter : ""} tasks
          </p>
          {canCreateTask && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                router.push(`/committees/${committeeSlug}/tasks/create`)
              }
              className="h-8 text-[10px] font-black uppercase tracking-widest mt-1"
            >
              <LuPlus className="w-3 h-3 mr-1.5" />
              Create First Task
            </Button>
          )}
        </div>
      )}

      {/* ── Task cards ───────────────────────────────────────────────────────── */}
      {!loading && tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((task) => {
            const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.draft;
            const TypeIcon = TYPE_ICONS[task.taskType] ?? LuSend;
            const priorityDot =
              PRIORITY_DOTS[task.priority] ?? PRIORITY_DOTS.medium;
            const isOverdue = new Date(task.deadline) < new Date();
            const stats = task.assignmentStats ?? {
              total: 0,
              byStatus: {},
            };
            const evaluated = stats.byStatus["evaluated"] ?? 0;
            const isPending = task.status === "pending_approval";

            return (
              <button
                key={task._id}
                type="button"
                onClick={() => handleTaskClick(task)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 bg-background border-2 rounded-xl text-left transition-all hover:border-foreground/20 cursor-pointer",
                  isPending
                    ? "border-amber-500/25 bg-amber-500/[0.02]"
                    : "border-border",
                )}
              >
                {/* Type icon */}
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <TypeIcon className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        priorityDot,
                      )}
                    />
                    <p className="text-[11px] font-black text-foreground truncate">
                      {task.title}
                    </p>
                    <span
                      className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
                        statusCfg.className,
                      )}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[9px] font-mono",
                        isOverdue ? "text-red-500" : "text-muted-foreground/60",
                      )}
                    >
                      <LuClock className="w-2.5 h-2.5" />
                      {new Date(task.deadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>

                    {task.pointsReward > 0 && (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-primary">
                        <LuCoins className="w-2.5 h-2.5" />
                        {task.pointsReward}pts
                      </span>
                    )}

                    {stats.total > 0 && (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground/60">
                        <LuUsers className="w-2.5 h-2.5" />
                        {evaluated}/{stats.total}
                      </span>
                    )}

                    {isPending && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500">
                        <LuTriangleAlert className="w-2.5 h-2.5" />
                        Awaiting approval
                      </span>
                    )}
                  </div>
                </div>

                {/* Chevron hint */}
                <LuCheck className="w-3.5 h-3.5 text-muted-foreground/20 shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <span className="text-[9px] font-mono text-muted-foreground/40">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={!pagination.hasPrev || loading}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border disabled:opacity-30 hover:bg-foreground/5 transition-all"
            >
              <LuChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!pagination.hasNext || loading}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border disabled:opacity-30 hover:bg-foreground/5 transition-all"
            >
              <LuChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Task detail modal ─────────────────────────────────────────────────── */}
      <TaskDetailModal
        task={selectedTask}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setSelectedTask(null);
        }}
      />
    </div>
  );
}
