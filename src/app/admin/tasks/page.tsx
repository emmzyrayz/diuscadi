"use client";
// src/app/admin/tasks/page.tsx
// Admin task list — shows all tasks across all committees with filters.
// Highlights pending_approval tasks prominently as they need action.

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  LuListTodo,
  LuLoader,
  LuPlus,
  LuCircleAlert,
  LuRefreshCw,
  LuChevronLeft,
  LuChevronRight,
  LuClock,
  LuUsers,
  LuCheck,
  LuX,
  LuTriangleAlert,
  LuGlobe,
  LuBuilding2,
  LuCoins,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskListItem {
  _id: string;
  title: string;
  committeeSlug: string;
  scope: "committee" | "global";
  status: string;
  taskType: string;
  priority: string;
  deadline: string;
  pointsReward: number;
  assignmentStats: {
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

// ─── Status badge config ──────────────────────────────────────────────────────

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

const STATUS_FILTERS = [
  "all",
  "pending_approval",
  "draft",
  "active",
  "completed",
  "cancelled",
  "archived",
] as const;

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminTasksPage() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTasks = useCallback(
    async (status: string, scope: string, page: number) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          status,
          scope,
          page: String(page),
        });
        const res = await fetch(`/api/admin/tasks?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load tasks");
        setTasks(data.tasks);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (isAuthenticated) fetchTasks(statusFilter, scopeFilter, currentPage);
  }, [isAuthenticated, fetchTasks, statusFilter, scopeFilter, currentPage]);

  const pendingCount = tasks.filter(
    (t) => t.status === "pending_approval",
  ).length;

  return (
    <div className="max-w-[1400px] mx-auto px-5 pt-24 pb-16 space-y-8">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center shadow-xl shadow-foreground/20">
            <LuListTodo className="w-7 h-7 text-background" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">
              Task Management
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              All tasks across all committees
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTasks(statusFilter, scopeFilter, currentPage)}
            disabled={loading}
            className={cn(
              "p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-all",
              loading && "animate-spin pointer-events-none",
            )}
          >
            <LuRefreshCw className="w-4 h-4" />
          </button>
          <Link href="/admin/tasks/create">
            <Button className="flex items-center gap-2 px-6 py-2.5 text-[11px] font-black uppercase tracking-widest">
              <LuPlus className="w-4 h-4" />
              Create Task
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Pending approval banner ───────────────────────────────────────── */}
      {pendingCount > 0 && statusFilter === "all" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl"
        >
          <LuTriangleAlert className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm font-bold text-amber-600 flex-1">
            {pendingCount} task{pendingCount > 1 ? "s" : ""} awaiting approval
          </p>
          <button
            onClick={() => {
              setStatusFilter("pending_approval");
              setCurrentPage(1);
            }}
            className="text-[10px] font-black text-amber-600 uppercase tracking-widest underline underline-offset-2"
          >
            View All
          </button>
        </motion.div>
      )}

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status */}
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setCurrentPage(1);
              }}
              className={cn(
                "text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all",
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10",
              )}
            >
              {s === "all" ? "All" : (STATUS_CONFIG[s]?.label ?? s)}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Scope */}
        {["all", "committee", "global"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setScopeFilter(s);
              setCurrentPage(1);
            }}
            className={cn(
              "flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all",
              scopeFilter === s
                ? "bg-foreground text-background"
                : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10",
            )}
          >
            {s === "global" ? (
              <LuGlobe className="w-3 h-3" />
            ) : s === "committee" ? (
              <LuBuilding2 className="w-3 h-3" />
            ) : null}
            {s === "all" ? "All Scopes" : s}
          </button>
        ))}

        {pagination && (
          <p className="ml-auto text-[10px] font-mono text-muted-foreground/50">
            {pagination.total} tasks
          </p>
        )}
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/8 border border-red-500/20 rounded-2xl">
          <LuCircleAlert className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-foreground/5 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ── Task list ─────────────────────────────────────────────────────── */}
      {!loading && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center border border-dashed border-border rounded-3xl">
          <LuListTodo className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-sm font-bold text-muted-foreground/50">
            No tasks found
          </p>
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => {
            const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.draft;
            const isPendingApproval = task.status === "pending_approval";
            const evaluated = task.assignmentStats.byStatus["evaluated"] ?? 0;
            const totalAssigned = task.assignmentStats.total;
            const isOverdue = new Date(task.deadline) < new Date();

            return (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-center gap-4 p-5 bg-background border-2 rounded-2xl transition-all hover:border-foreground/20",
                  isPendingApproval
                    ? "border-amber-500/30 bg-amber-500/[0.02]"
                    : "border-border",
                )}
              >
                {/* Scope icon */}
                <div className="shrink-0">
                  {task.scope === "global" ? (
                    <LuGlobe className="w-5 h-5 text-primary" />
                  ) : (
                    <LuBuilding2 className="w-5 h-5 text-muted-foreground/50" />
                  )}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-foreground truncate">
                      {task.title}
                    </p>
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                        statusCfg.className,
                      )}
                    >
                      {statusCfg.label}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">
                      {task.taskType}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <span className="text-[10px] font-mono text-muted-foreground/60">
                      {task.committeeSlug}
                    </span>
                    {task.pointsReward > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-primary">
                        <LuCoins className="w-3 h-3" />
                        {task.pointsReward}pts
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[10px] font-mono",
                        isOverdue ? "text-red-500" : "text-muted-foreground/60",
                      )}
                    >
                      <LuClock className="w-3 h-3" />
                      {new Date(task.deadline).toLocaleDateString()}
                    </span>
                    {totalAssigned > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60">
                        <LuUsers className="w-3 h-3" />
                        {evaluated}/{totalAssigned} evaluated
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isPendingApproval && (
                    <Link href={`/admin/tasks/${task._id}`}>
                      <Button
                        size="sm"
                        className="h-8 text-[10px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        <LuCheck className="w-3.5 h-3.5 mr-1.5" />
                        Review
                      </Button>
                    </Link>
                  )}
                  <Link href={`/admin/tasks/${task._id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-black uppercase tracking-wider"
                    >
                      View
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-[10px] font-mono text-muted-foreground/40">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={!pagination.hasPrev || loading}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border disabled:opacity-30 hover:bg-foreground/5 transition-all"
            >
              <LuChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={!pagination.hasNext || loading}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border disabled:opacity-30 hover:bg-foreground/5 transition-all"
            >
              <LuChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
