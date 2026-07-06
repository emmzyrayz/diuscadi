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
  LuVote,
  LuClipboardList,
  LuShieldCheck,
  LuCoins,
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

// ─── Task type display config (Phase 4) ───────────────────────────────────────

const TASK_TYPE_CONFIG = {
  submission: { label: "Submission", Icon: LuSend, color: "text-primary" },
  poll: { label: "Poll", Icon: LuVote, color: "text-violet-500" },
  survey: { label: "Survey", Icon: LuClipboardList, color: "text-sky-500" },
  acknowledgement: {
    label: "Acknowledgement",
    Icon: LuShieldCheck,
    color: "text-emerald-500",
  },
  learning: {
    label: "Learning",
    Icon: LuClipboardList,
    color: "text-muted-foreground",
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
  // Phase 4: a single handler that opens the correct instant-complete sheet
  // (poll/survey/acknowledgement) based on task.taskType. The parent
  // (taskList.tsx) owns the sheet-selection logic via this callback.
  onRespond: (task: EnrichedTask) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskCard({
  task,
  onSubmit,
  onViewDetails,
  onRespond,
}: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const assignmentStatus = task.assignment?.status ?? "pending";
  const statusCfg =
    STATUS_CONFIG[assignmentStatus as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.pending;
  const typeCfg =
    TASK_TYPE_CONFIG[task.taskType] ?? TASK_TYPE_CONFIG.submission;

  const deadline = formatDeadline(
    task.assignment?.effectiveDeadline ?? task.deadline,
  );

  const isSubmissionTask = task.taskType === "submission";
  const isInstantTask = ["poll", "survey", "acknowledgement"].includes(
    task.taskType,
  );
  const isLearningTask = task.taskType === "learning";

  // ── Submission-type CTA gates (unchanged from Phase 2/3) ──────────────────
  const canSubmit = ["pending", "in_progress", "revision_requested"].includes(
    assignmentStatus,
  );
  const canView = ["submitted", "under_review", "evaluated"].includes(
    assignmentStatus,
  );
  const hasScore =
    assignmentStatus === "evaluated" && task.assignment?.score != null;

  // ── Instant-complete CTA gates (Phase 4) ───────────────────────────────────
  const isOverdue = new Date(task.deadline) < new Date();
  const acceptsLate = task.acceptResponsesAfterDeadline ?? false;
  const isClosed = isOverdue && !acceptsLate;

  const alreadyResponded =
    task.taskType === "poll"
      ? !!task.assignment?.pollResponseRecorded
      : task.taskType === "survey"
        ? !!task.assignment?.surveyResponseRecorded
        : task.taskType === "acknowledgement"
          ? !!task.assignment?.acknowledgedAtRecorded
          : false;

  const canRespond = isInstantTask && !alreadyResponded && !isClosed;

  const { Icon: StatusIcon } = statusCfg;
  const { Icon: TypeIcon } = typeCfg;

  const instantResult = task.assignment?.instantPointsResult;

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
        assignmentStatus === "revision_requested" &&
          "bg-orange-500/[0.03] border-orange-500/20",
        assignmentStatus === "rejected" && "opacity-55",
        assignmentStatus === "evaluated" && "bg-green-500/[0.02]",
      )}
    >
      {/* ── Title + Priority Row ──────────────────────────────────────────── */}
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <TypeIcon className={cn("w-3 h-3 shrink-0", typeCfg.color)} />
            <h4 className="text-sm font-bold text-foreground leading-snug break-words">
              {task.title}
            </h4>
          </div>
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
              ? acceptsLate
                ? "text-amber-500"
                : "text-red-500"
              : deadline.isUrgent
                ? "text-orange-500"
                : "text-muted-foreground/60",
          )}
        >
          <LuClock className="w-3 h-3" />
          {deadline.display}
          {deadline.isPast &&
            isInstantTask &&
            acceptsLate &&
            " (late accepted)"}
        </span>

        {task.pointsReward > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-primary">
            <LuCoins className="w-3 h-3" />
            {task.pointsReward}pts
          </span>
        )}

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
          {/* Submission-task score pill */}
          {isSubmissionTask && hasScore && task.assignment?.score && (
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

          {/* Instant-complete points-earned pill */}
          {isInstantTask && alreadyResponded && instantResult?.accepted && (
            <span
              className={cn(
                "text-[10px]",
                "font-mono",
                "font-bold",
                "px-2",
                "py-0.5",
                "rounded-full",
                instantResult.isLate
                  ? "bg-amber-500/15 text-amber-600"
                  : "bg-emerald-500/15 text-emerald-600",
              )}
            >
              +{instantResult.pointsEarned}pts
              {instantResult.isLate &&
                ` (${Math.round(instantResult.timeMultiplier * 100)}%)`}
            </span>
          )}

          {task.assignment?.flaggedForHumanReview && (
            <span className="flex items-center gap-1 text-[9px] font-mono text-yellow-500">
              <LuTriangleAlert className="w-3 h-3" />
              Review
            </span>
          )}
        </div>
      </div>

      {/* ── CTA Row — Submission tasks ──────────────────────────────────── */}
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

      {/* ── CTA Row — Instant-complete tasks (poll/survey/acknowledgement) ── */}
      {isInstantTask && task.assignment && (
        <div className="flex gap-2">
          {canRespond && (
            <Button
              size="sm"
              className="h-7 flex-1 text-[11px] font-bold uppercase tracking-wider"
              onClick={() => onRespond(task)}
            >
              <TypeIcon className="w-3 h-3 mr-1.5" />
              {task.taskType === "poll" && "Vote Now"}
              {task.taskType === "survey" && "Take Survey"}
              {task.taskType === "acknowledgement" && "Acknowledge"}
            </Button>
          )}

          {alreadyResponded && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 flex-1 text-[11px] font-bold uppercase tracking-wider"
              disabled
            >
              <LuCircleCheck className="w-3 h-3 mr-1.5" />
              Completed
            </Button>
          )}

          {!alreadyResponded && isClosed && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 flex-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
              disabled
            >
              <LuX className="w-3 h-3 mr-1.5" />
              Closed
            </Button>
          )}
        </div>
      )}

      {/* ── CTA Row — Learning tasks (TODO: not yet implemented) ──────────── */}
      {isLearningTask && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 flex-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            disabled
          >
            Coming Soon — External Platform
          </Button>
        </div>
      )}
    </div>
  );
}
