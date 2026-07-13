"use client";
// src/components/sections/admin/analytics/AATaskSection.tsx

import React from "react";
import { cn } from "@/lib/utils";
import {
  LuListTodo,
  LuSend,
  LuVote,
  LuClipboardList,
  LuShieldCheck,
  LuTriangleAlert,
  LuClock,
  LuCheck,
  LuCoins,
} from "react-icons/lu";

interface TaskTypeStats {
  completions: number;
  avgScore: number;
  totalPoints: number;
}

interface TaskAnalytics {
  statusBreakdown: {
    draft: number;
    pendingApproval: number;
    active: number;
    completed: number;
    cancelled: number;
    archived: number;
  };
  pendingApprovalCount: number;
  flaggedAssignmentsCount: number;
  byType: {
    submission: TaskTypeStats;
    poll: TaskTypeStats;
    survey: TaskTypeStats;
    acknowledgement: TaskTypeStats;
    learning: TaskTypeStats;
  };
  topPerformers: {
    userId: string;
    name: string;
    committee: string | null;
    lifetimePoints: number;
    currentPoints: number;
    directReferrals: number;
  }[];
}

interface AATaskSectionProps {
  tasks: TaskAnalytics | null | undefined;
}

const TASK_TYPE_CONFIG = [
  {
    key: "submission" as const,
    label: "Submission",
    icon: LuSend,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "poll" as const,
    label: "Poll",
    icon: LuVote,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    key: "learning" as const,
    label: "Learning",
    icon: LuClock, // pick an appropriate icon
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-500/10",
  },
  {
    key: "survey" as const,
    label: "Survey",
    icon: LuClipboardList,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  {
    key: "acknowledgement" as const,
    label: "Acknowledgement",
    icon: LuShieldCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
];

export function AATaskSection({ tasks }: AATaskSectionProps) {
  if (!tasks) return null;

  const { statusBreakdown, byType, topPerformers = [] } = tasks;

    if (!statusBreakdown || !byType) return null;
    
  const totalTasks = statusBreakdown
    ? Object.values(statusBreakdown).reduce((a, b) => a + b, 0)
    : 0;
  const totalCompletions = byType
    ? Object.values(byType).reduce((a, b) => a + b.completions, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={cn('flex', 'items-center', 'gap-3')}>
        <div className={cn('w-10', 'h-10', 'rounded-2xl', 'bg-primary/10', 'flex', 'items-center', 'justify-center')}>
          <LuListTodo className={cn('w-5', 'h-5', 'text-primary')} />
        </div>
        <div>
          <h2 className={cn('text-sm', 'font-black', 'text-foreground', 'uppercase', 'tracking-tight')}>
            Task Analytics
          </h2>
          <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-0.5')}>
            Completion rates, scores, and engagement
          </p>
        </div>
      </div>

      {/* ── Alert banners ───────────────────────────────────────────────────── */}
      {(tasks.pendingApprovalCount > 0 ||
        tasks.flaggedAssignmentsCount > 0) && (
        <div className="space-y-2">
          {tasks.pendingApprovalCount > 0 && (
            <div className={cn('flex', 'items-center', 'gap-3', 'p-3', 'bg-amber-500/5', 'border', 'border-amber-500/20', 'rounded-xl')}>
              <LuClock className={cn('w-4', 'h-4', 'text-amber-500', 'shrink-0')} />
              <p className={cn('text-[11px]', 'font-bold', 'text-amber-600', 'flex-1')}>
                {tasks.pendingApprovalCount} task
                {tasks.pendingApprovalCount > 1 ? "s" : ""} awaiting admin
                approval
              </p>
            </div>
          )}
          {tasks.flaggedAssignmentsCount > 0 && (
            <div className={cn('flex', 'items-center', 'gap-3', 'p-3', 'bg-red-500/5', 'border', 'border-red-500/20', 'rounded-xl')}>
              <LuTriangleAlert className={cn('w-4', 'h-4', 'text-red-500', 'shrink-0')} />
              <p className={cn('text-[11px]', 'font-bold', 'text-red-600', 'flex-1')}>
                {tasks.flaggedAssignmentsCount} assignment
                {tasks.flaggedAssignmentsCount > 1 ? "s" : ""} flagged for human
                review
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Overview stats ──────────────────────────────────────────────────── */}
      <div className={cn('grid', 'grid-cols-2', 'sm:grid-cols-4', 'gap-4')}>
        <div className={cn('p-5', 'bg-background', 'border', 'border-border', 'rounded-2xl', 'space-y-2')}>
          <p className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
            Total Tasks
          </p>
          <p className={cn('text-3xl', 'font-black', 'text-foreground')}>
            {totalTasks.toLocaleString()}
          </p>
        </div>
        <div className={cn('p-5', 'bg-background', 'border', 'border-border', 'rounded-2xl', 'space-y-2')}>
          <p className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
            Active Tasks
          </p>
          <p className={cn('text-3xl', 'font-black', 'text-emerald-500')}>
            {statusBreakdown.active.toLocaleString()}
          </p>
        </div>
        <div className={cn('p-5', 'bg-background', 'border', 'border-border', 'rounded-2xl', 'space-y-2')}>
          <p className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
            Completions
          </p>
          <p className={cn('text-3xl', 'font-black', 'text-primary')}>
            {totalCompletions.toLocaleString()}
          </p>
        </div>
        <div className={cn('p-5', 'bg-background', 'border', 'border-border', 'rounded-2xl', 'space-y-2')}>
          <p className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
            Pending Approval
          </p>
          <p
            className={cn(
              "text-3xl font-black",
              tasks.pendingApprovalCount > 0
                ? "text-amber-500"
                : "text-muted-foreground/40",
            )}
          >
            {tasks.pendingApprovalCount}
          </p>
        </div>
      </div>

      {/* ── Status breakdown bar ────────────────────────────────────────────── */}
      {statusBreakdown && totalTasks > 0 && (
        <div className="space-y-2">
          <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
            Task Status Distribution
          </p>
          <div className={cn('h-3', 'bg-border', 'rounded-full', 'overflow-hidden', 'flex', 'gap-0.5')}>
            {[
              { key: "active", color: "bg-emerald-500" },
              { key: "pendingApproval", color: "bg-amber-500" },
              { key: "completed", color: "bg-primary" },
              { key: "draft", color: "bg-muted-foreground/30" },
              { key: "cancelled", color: "bg-red-500/40" },
              { key: "archived", color: "bg-muted-foreground/15" },
            ].map(({ key, color }) => {
              const count =
                statusBreakdown[key as keyof typeof statusBreakdown] ?? 0;
              const pct = (count / totalTasks) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={key}
                  className={cn("h-full rounded-full", color)}
                  style={{ width: `${pct}%` }}
                  title={`${key}: ${count}`}
                />
              );
            })}
          </div>
          <div className={cn('flex', 'flex-wrap', 'gap-3')}>
            {[
              {
                label: "Active",
                count: statusBreakdown.active,
                dot: "bg-emerald-500",
              },
              {
                label: "Pending",
                count: statusBreakdown.pendingApproval,
                dot: "bg-amber-500",
              },
              {
                label: "Completed",
                count: statusBreakdown.completed,
                dot: "bg-primary",
              },
              {
                label: "Draft",
                count: statusBreakdown.draft,
                dot: "bg-muted-foreground/30",
              },
              {
                label: "Cancelled",
                count: statusBreakdown.cancelled,
                dot: "bg-red-500/40",
              },
            ].map(({ label, count, dot }) => (
              <div
                key={label}
                className={cn('flex', 'items-center', 'gap-1.5', 'text-[10px]', 'font-mono', 'text-muted-foreground')}
              >
                <div className={cn("w-2 h-2 rounded-full shrink-0", dot)} />
                {label}: {count}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── By task type ────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
          Completions by Type
        </p>
        <div className={cn('grid', 'grid-cols-1', 'sm:grid-cols-2', 'gap-3')}>
          {TASK_TYPE_CONFIG.map(({ key, label, icon: Icon, color, bg }) => {
            const stats = byType[key] ?? {
              completions: 0,
              avgScore: 0,
              totalPoints: 0,
            };
            return (
              <div
                key={key}
                className={cn('flex', 'items-center', 'gap-4', 'p-4', 'bg-background', 'border', 'border-border', 'rounded-2xl')}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    bg,
                  )}
                >
                  <Icon className={cn("w-5 h-5", color)} />
                </div>
                <div className={cn('flex-1', 'min-w-0')}>
                  <p className={cn('text-[11px]', 'font-black', 'text-foreground')}>
                    {label}
                  </p>
                  <p className={cn('text-[10px]', 'text-muted-foreground', 'mt-0.5')}>
                    {stats.completions} completed
                    {key === "submission" && stats.avgScore > 0 && (
                      <> · avg {stats.avgScore}%</>
                    )}
                  </p>
                </div>
                <div className={cn('text-right', 'shrink-0')}>
                  <p className={cn('text-[11px]', 'font-black', 'text-primary')}>
                    {stats.totalPoints.toLocaleString()}
                  </p>
                  <p className={cn('text-[9px]', 'text-muted-foreground')}>pts given</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Top performers ───────────────────────────────────────────────────── */}
      {topPerformers.length > 0 && (
        <div className="space-y-3">
          <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
            Top Task Performers
          </p>
          <div className="space-y-2">
            {topPerformers.map((p, idx) => (
              <div
                key={p.userId}
                className={cn('flex', 'items-center', 'gap-4', 'p-4', 'bg-background', 'border', 'border-border', 'rounded-2xl')}
              >
                <div className={cn('w-8', 'h-8', 'rounded-xl', 'bg-muted', 'flex', 'items-center', 'justify-center', 'shrink-0')}>
                  <span className={cn('text-[11px]', 'font-black', 'text-muted-foreground')}>
                    #{idx + 1}
                  </span>
                </div>
                <div className={cn('flex-1', 'min-w-0')}>
                  <p className={cn('text-[11px]', 'font-black', 'text-foreground', 'truncate')}>
                    {p.name}
                  </p>
                  {p.committee && (
                    <p className={cn('text-[9px]', 'font-mono', 'text-muted-foreground/60', 'uppercase', 'mt-0.5')}>
                      {p.committee}
                    </p>
                  )}
                </div>
                <div className={cn('flex', 'items-center', 'gap-4', 'shrink-0')}>
                  <div className="text-right">
                    <p className={cn('text-[11px]', 'font-black', 'text-primary')}>
                      {p.lifetimePoints.toLocaleString()}
                    </p>
                    <p className={cn('text-[9px]', 'text-muted-foreground')}>
                      lifetime pts
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-[11px]', 'font-black', 'text-emerald-500')}>
                      {p.directReferrals}
                    </p>
                    <p className={cn('text-[9px]', 'text-muted-foreground')}>
                      referrals
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
