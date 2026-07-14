"use client";
// components/sections/tasks/TaskSummary.tsx
//
// Home page widget: shows a compact "available tasks" + "your ongoing tasks"
// summary with a link through to /tasks. Pulls from the same TaskContext
// used by the full tasks page — no separate fetch.

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTasks } from "@/context/TaskContext";
import {
  LuListTodo,
  LuArrowRight,
  LuClock,
  LuCoins,
  LuLoader,
} from "react-icons/lu";

export function TaskSummary() {
  const { tasks, tasksLoading, loadTasks, activeStatus } = useTasks();

  useEffect(() => {
    // Only fetch if we don't already have active tasks loaded (avoids a
    // duplicate request if /tasks already populated this on mount).
    if (tasks.length === 0 && !tasksLoading) {
      loadTasks("active", 1);
    }
  }, [loadTasks, tasks.length, tasksLoading]);

  const { ongoing, available } = useMemo(() => {
    const ongoing = tasks.filter(
      (t) =>
        t.assignment &&
        [
          "pending",
          "in_progress",
          "submitted",
          "under_review",
          "revision_requested",
        ].includes(t.assignment.status),
    );
    const available = tasks.filter((t) => !t.assignment);
    return { ongoing, available };
  }, [tasks]);

  if (tasksLoading && tasks.length === 0) {
    return (
      <div
        className={cn(
          "glass-subtle rounded-2xl border border-border/40 p-6",
          "flex items-center justify-center gap-2",
        )}
      >
        <LuLoader className="w-4 h-4 animate-spin text-primary" />
        <p className="text-[11px] font-bold text-muted-foreground">
          Loading tasks…
        </p>
      </div>
    );
  }

  if (tasks.length === 0) return null;

  const preview = [...ongoing, ...available].slice(0, 3);

  return (
    <div
      className={cn(
        "max-w-[96vh] w-full glass-subtle rounded-2xl border border-border/40 p-5 space-y-4",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <LuListTodo className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
              Tasks
            </h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {ongoing.length} ongoing · {available.length} available
            </p>
          </div>
        </div>
        <Link
          href="/tasks"
          className={cn(
            "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest",
            "text-primary hover:opacity-80 transition-opacity shrink-0",
          )}
        >
          View all <LuArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {preview.map((task) => (
          <Link
            key={task._id}
            href={`/tasks/${task._id}`}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border border-border/40",
              "hover:border-primary/30 hover:bg-muted/30 transition-all",
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-foreground truncate">
                {task.title}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground/60">
                  <LuClock className="w-2.5 h-2.5" />
                  {new Date(task.deadline).toLocaleDateString()}
                </span>
                {task.pointsReward > 0 && (
                  <span className="flex items-center gap-1 text-[9px] font-mono text-primary">
                    <LuCoins className="w-2.5 h-2.5" />
                    {task.pointsReward}pts
                  </span>
                )}
              </div>
            </div>
            <span
              className={cn(
                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0",
                task.assignment
                  ? "bg-primary/10 text-primary"
                  : "bg-emerald-500/10 text-emerald-500",
              )}
            >
              {task.assignment ? "In progress" : "Available"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
