"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LuClock,
  LuCircleCheck,
  LuCircleDot,
  LuLoader,
  LuSend,
  LuEye,
  LuRotateCcw,
  LuX,
  LuTriangleAlert,
  LuTag,
} from "react-icons/lu";
import type { EnrichedTask } from "@/context/TaskContext";

// ─── Priority display config ──────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  critical: {
    label: "Critical",
    badge: "bg-red-500/15 text-red-500 border-red-500/20",
    dot: "bg-red-500",
    left: "border-l-red-500/60",
  },
  high: {
    label: "High",
    badge: "bg-orange-500/15 text-orange-500 border-orange-500/20",
    dot: "bg-orange-500",
    left: "border-l-orange-500/40",
  },
  medium: {
    label: "Medium",
    badge: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20",
    dot: "bg-yellow-500",
    left: "border-l-yellow-500/30",
  },
  low: {
    label: "Low",
    badge: "bg-green-500/15 text-green-500 border-green-500/20",
    dot: "bg-green-500",
    left: "border-l-green-500/30",
  },
} as const;

// ─── Assignment status display config ─────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: "Not Started",
    Icon: LuCircleDot,
    color: "text-muted-foreground/60",
  },
  in_progress: {
    label: "In Progress",
    Icon: LuLoader,
    color: "text-blue-500",
  },
  submitted: {
    label: "Submitted",
    Icon: LuSend,
    color: "text-primary",
  },
  under_review: {
    label: "Under Review",
    Icon: LuLoader,
    color: "text-yellow-500",
  },
  evaluated: {
    label: "Evaluated",
    Icon: LuCircleCheck,
    color: "text-green-500",
  },
  revision_requested: {
    label: "Revision Required",
    Icon: LuRotateCcw,
    color: "text-orange-500",
  },
  rejected: {
    label: "Rejected",
    Icon: LuX,
    color: "text-red-500",
  },
} as const;

// ─── Deadline formatter ───────────────────────────────────────────────────────

function formatDeadline(dateStr: string): {
  display: string;
  isUrgent: boolean;
  isPast: boolean;
} {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  if (diffMs < 0)
    return { display: `Overdue · ${formatted}`, isUrgent: false, isPast: true };
  if (diffDays <= 1)
    return {
      display: `Due Today · ${formatted}`,
      isUrgent: true,
      isPast: false,
    };
  if (diffDays <= 3)
    return {
      display: `${diffDays}d left · ${formatted}`,
      isUrgent: true,
      isPast: false,
    };
  return { display: formatted, isUrgent: false, isPast: false };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: EnrichedTask;
  onSubmit: (task: EnrichedTask) => void;
  onViewDetails: (task: EnrichedTask) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskCard({ task, onSubmit, onViewDetails }: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const assignmentStatus = task.assignment?.status ?? "pending";
  const statusCfg =
    STATUS_CONFIG[assignmentStatus as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.pending;

  const deadline = formatDeadline(
    task.assignment?.effectiveDeadline ?? task.deadline,
  );

  const canSubmit = ["pending", "in_progress", "revision_requested"].includes(
    assignmentStatus,
  );
  const canView = ["submitted", "under_review", "evaluated"].includes(
    assignmentStatus,
  );
  const hasScore =
    assignmentStatus === "evaluated" && task.assignment?.score != null;
  const isSubmissionTask = task.taskType === "submission";

  const { Icon: StatusIcon } = statusCfg;

  return (
    <div
      className={cn(
        "glass-subtle",
        "rounded-xl",
        "border-l-2",
        "border",
        "border-border/40",
        "p-4",
        "space-y-3",
        "transition-all",
        "duration-200",
        "hover:border-primary/15",
        "w-full",
        "min-w-0",
        priority.left,
        // Contextual background tints
        assignmentStatus === "revision_requested" &&
          "bg-orange-500/[0.03] border-orange-500/20",
        assignmentStatus === "rejected" && "opacity-55",
        assignmentStatus === "evaluated" && "bg-green-500/[0.02]",
      )}
    >
      {/* ── Title + Priority Row ──────────────────────────────────────────── */}
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-foreground leading-snug break-words mb-0.5">
            {task.title}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 break-words">
            {task.description}
          </p>
        </div>

        <span
          className={cn(
            "inline-flex",
            "items-center",
            "gap-1",
            "text-[9px]",
            "font-mono",
            "font-bold",
            "uppercase",
            "tracking-wider",
            "px-2",
            "py-0.5",
            "rounded",
            "border",
            "shrink-0",
            priority.badge,
          )}
        >
          <span
            className={cn("w-1.5", "h-1.5", "rounded-full", priority.dot)}
          />
          {priority.label}
        </span>
      </div>

      {/* ── Meta Row ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className={cn(
            "flex",
            "items-center",
            "gap-1",
            "text-[10px]",
            "font-mono",
            deadline.isPast
              ? "text-red-500"
              : deadline.isUrgent
                ? "text-orange-500"
                : "text-muted-foreground/60",
          )}
        >
          <LuClock className="w-3 h-3" />
          {deadline.display}
        </span>

        {task.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className={cn(
              "inline-flex",
              "items-center",
              "gap-0.5",
              "text-[9px]",
              "font-mono",
              "uppercase",
              "tracking-wide",
              "bg-foreground/5",
              "text-muted-foreground/50",
              "px-1.5",
              "py-0.5",
              "rounded",
            )}
          >
            <LuTag className="w-2.5 h-2.5" />
            {tag}
          </span>
        ))}
      </div>

      {/* ── Status + Score Row ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/20">
        <span
          className={cn(
            "flex",
            "items-center",
            "gap-1.5",
            "text-[10px]",
            "font-semibold",
            statusCfg.color,
          )}
        >
          <StatusIcon
            className={cn(
              "w-3.5",
              "h-3.5",
              assignmentStatus === "under_review" && "animate-spin",
            )}
          />
          {statusCfg.label}
          {(task.assignment?.revisionsRequested ?? 0) > 0 && (
            <span className="opacity-70">
              · {task.assignment!.revisionsRequested}×
            </span>
          )}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {/* Score pill */}
          {hasScore && task.assignment?.score && (
            <span
              className={cn(
                "text-[10px]",
                "font-mono",
                "font-bold",
                "px-2",
                "py-0.5",
                "rounded-full",
                task.assignment.score.percentage >= 70
                  ? "bg-green-500/15 text-green-500"
                  : task.assignment.score.percentage >= 50
                    ? "bg-yellow-500/15 text-yellow-500"
                    : "bg-red-500/15 text-red-500",
              )}
            >
              {task.assignment.score.total}/{task.assignment.score.max} ·{" "}
              {task.assignment.score.percentage.toFixed(0)}%
            </span>
          )}

          {/* Flagged indicator */}
          {task.assignment?.flaggedForHumanReview && (
            <span className="flex items-center gap-1 text-[9px] font-mono text-yellow-500">
              <LuTriangleAlert className="w-3 h-3" />
              Review
            </span>
          )}
        </div>
      </div>

      {/* ── CTA Row ──────────────────────────────────────────────────────── */}
      {isSubmissionTask && task.assignment && (
        <div className="flex gap-2">
          {canSubmit && (
            <Button
              size="sm"
              className="h-7 flex-1 text-[11px] font-bold uppercase tracking-wider"
              onClick={() => onSubmit(task)}
            >
              <LuSend className="w-3 h-3 mr-1.5" />
              {assignmentStatus === "revision_requested"
                ? "Resubmit"
                : "Submit Work"}
            </Button>
          )}

          {canView && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 flex-1 text-[11px] font-bold uppercase tracking-wider"
              onClick={() => onViewDetails(task)}
            >
              <LuEye className="w-3 h-3 mr-1.5" />
              {hasScore ? "View Score" : "View Submission"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
