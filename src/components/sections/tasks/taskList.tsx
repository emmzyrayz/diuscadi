"use client";

import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LuRefreshCw,
  LuInbox,
  LuCircleAlert,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";
import { useTasks, type EnrichedTask } from "@/context/TaskContext";
import { TaskCard } from "./TaskCard";
import { SubmissionSheet, type SheetMode } from "./submissionSheet";
import { PollResponseSheet } from "./PollResponseSheet";
import { SurveyResponseSheet } from "./SurveyResponseSheet";
import { AcknowledgementSheet } from "./AcknowledgementSheet";

// ─── Status filter config ─────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
] as const;

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function TaskSkeleton() {
  return (
    <div
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
      <div className={cn('flex', 'items-start', 'gap-3')}>
        <div className={cn('flex-1', 'space-y-2')}>
          <div className={cn('h-3.5', 'bg-foreground/8', 'rounded-md', 'w-3/4')} />
          <div className={cn('h-3', 'bg-foreground/5', 'rounded-md', 'w-full')} />
          <div className={cn('h-3', 'bg-foreground/5', 'rounded-md', 'w-2/3')} />
        </div>
        <div className={cn('h-5', 'w-16', 'bg-foreground/5', 'rounded-md', 'shrink-0')} />
      </div>
      <div className={cn('flex', 'gap-3')}>
        <div className={cn('h-3', 'bg-foreground/5', 'rounded', 'w-24')} />
        <div className={cn('h-3', 'bg-foreground/5', 'rounded', 'w-14')} />
      </div>
      <div className={cn('pt-2', 'border-t', 'border-border/20', 'flex', 'items-center', 'justify-between', 'gap-2')}>
        <div className={cn('h-3', 'bg-foreground/5', 'rounded', 'w-20')} />
        <div className={cn('h-7', 'bg-foreground/8', 'rounded-lg', 'w-24')} />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TasksList() {
  const {
    tasks,
    pagination,
    tasksLoading,
    tasksError,
    activeStatus,
    loadTasks,
    refreshTasks,
    setActiveStatus,
  } = useTasks();

  // ── Submission sheet state (unchanged from Phase 2/3) ─────────────────────
  const [submissionTask, setSubmissionTask] = useState<EnrichedTask | null>(
    null,
  );
  const [submissionMode, setSubmissionMode] = useState<SheetMode>("submit");
  const [submissionOpen, setSubmissionOpen] = useState(false);

  // ── Instant-complete sheet state (Phase 4) ────────────────────────────────
  // Each sheet manages its own open state so they can't accidentally
  // open simultaneously. The respondTask reference is shared — only one
  // sheet renders it at a time, controlled by which open flag is true.
  const [respondTask, setRespondTask] = useState<EnrichedTask | null>(null);
  const [pollOpen, setPollOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [ackOpen, setAckOpen] = useState(false);

  // Load active tasks on mount
  useEffect(() => {
    loadTasks("active", 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFilterChange = useCallback(
    (status: string) => {
      setActiveStatus(status);
      loadTasks(status, 1);
    },
    [loadTasks, setActiveStatus],
  );

  const handlePageChange = useCallback(
    (page: number) => loadTasks(activeStatus, page),
    [loadTasks, activeStatus],
  );

  const handleSubmitClick = useCallback((task: EnrichedTask) => {
    setSubmissionTask(task);
    setSubmissionMode("submit");
    setSubmissionOpen(true);
  }, []);

  const handleViewClick = useCallback((task: EnrichedTask) => {
    setSubmissionTask(task);
    setSubmissionMode("view");
    setSubmissionOpen(true);
  }, []);

  // Phase 4: single entry point for all instant-complete task types.
  // Inspects task.taskType and opens the correct sheet. The respondTask
  // reference is set first so the sheet has the task before it opens.
  const handleRespondClick = useCallback((task: EnrichedTask) => {
    setRespondTask(task);
    switch (task.taskType) {
      case "poll":
        setPollOpen(true);
        break;
      case "survey":
        setSurveyOpen(true);
        break;
      case "acknowledgement":
        setAckOpen(true);
        break;
      default:
        break;
    }
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={cn('space-y-4', 'w-full', 'min-w-0')}>
      {/* ── Filter + Refresh Row ─────────────────────────────────────────── */}
      <div className={cn('flex', 'items-center', 'justify-between', 'gap-3', 'min-w-0')}>
        <div className={cn('flex', 'items-center', 'gap-1', 'flex-wrap')}>
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
                activeStatus === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10",
              )}
            >
              {f.label}
              {f.value === activeStatus &&
                pagination &&
                pagination.total > 0 && (
                  <span className={cn('ml-1', 'opacity-60')}>({pagination.total})</span>
                )}
            </button>
          ))}
        </div>

        <button
          onClick={refreshTasks}
          disabled={tasksLoading}
          className={cn(
            "p-1.5",
            "rounded-md",
            "text-muted-foreground/50",
            "hover:text-muted-foreground",
            "hover:bg-foreground/5",
            "transition-all",
            "duration-150",
            tasksLoading && "animate-spin pointer-events-none",
          )}
          aria-label="Refresh tasks"
        >
          <LuRefreshCw className={cn('w-3.5', 'h-3.5')} />
        </button>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {tasksError && !tasksLoading && (
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
          <LuCircleAlert className={cn('w-4', 'h-4', 'text-red-500', 'shrink-0')} />
          <p className={cn('text-xs', 'text-red-500', 'flex-1')}>{tasksError}</p>
          <button
            onClick={refreshTasks}
            className={cn('text-[10px]', 'font-mono', 'font-bold', 'text-red-500', 'underline', 'underline-offset-2', 'shrink-0')}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Skeletons ────────────────────────────────────────────────────── */}
      {tasksLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <TaskSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!tasksLoading && !tasksError && tasks.length === 0 && (
        <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-14', 'gap-3', 'text-center')}>
          <LuInbox className={cn('w-9', 'h-9', 'text-muted-foreground/20')} />
          <div>
            <p className={cn('text-sm', 'font-bold', 'text-muted-foreground/50')}>
              No{activeStatus !== "all" ? ` ${activeStatus}` : ""} tasks
            </p>
            <p className={cn('text-[11px]', 'text-muted-foreground/35', 'mt-0.5')}>
              Tasks assigned to your committee will appear here.
            </p>
          </div>
        </div>
      )}

      {/* ── Task cards ───────────────────────────────────────────────────── */}
      {!tasksLoading && tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onSubmit={handleSubmitClick}
              onViewDetails={handleViewClick}
              onRespond={handleRespondClick}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {!tasksLoading && pagination && pagination.totalPages > 1 && (
        <div className={cn('flex', 'items-center', 'justify-between', 'pt-3', 'border-t', 'border-border/30')}>
          <span className={cn('text-[10px]', 'font-mono', 'text-muted-foreground/40')}>
            Page {pagination.page} of {pagination.totalPages} ·{" "}
            {pagination.total} total
          </span>
          <div className={cn('flex', 'items-center', 'gap-1')}>
            <Button
              size="sm"
              variant="ghost"
              className={cn('h-7', 'w-7', 'p-0')}
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <LuChevronLeft className={cn('w-3.5', 'h-3.5')} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={cn('h-7', 'w-7', 'p-0')}
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              <LuChevronRight className={cn('w-3.5', 'h-3.5')} />
            </Button>
          </div>
        </div>
      )}

      {/* ── Submission sheet (portal — renders outside card DOM) ─────────── */}
      <SubmissionSheet
        task={submissionTask}
        open={submissionOpen}
        onOpenChange={setSubmissionOpen}
        mode={submissionMode}
      />

      {/* ── Poll response sheet ───────────────────────────────────────────── */}
      <PollResponseSheet
        task={respondTask}
        open={pollOpen}
        onOpenChange={(v) => {
          setPollOpen(v);
          if (!v) setRespondTask(null);
        }}
      />

      {/* ── Survey response sheet ─────────────────────────────────────────── */}
      <SurveyResponseSheet
        task={respondTask}
        open={surveyOpen}
        onOpenChange={(v) => {
          setSurveyOpen(v);
          if (!v) setRespondTask(null);
        }}
      />

      {/* ── Acknowledgement sheet ─────────────────────────────────────────── */}
      <AcknowledgementSheet
        task={respondTask}
        open={ackOpen}
        onOpenChange={(v) => {
          setAckOpen(v);
          if (!v) setRespondTask(null);
        }}
      />
    </div>
  );
}
