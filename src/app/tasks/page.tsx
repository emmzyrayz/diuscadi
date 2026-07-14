"use client";
// app/tasks/page.tsx

import React, { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTasks } from "@/context/TaskContext";
import {
  LuLoader,
  LuListTodo,
  LuClock,
  LuCoins,
  LuCircleAlert,
  LuRefreshCw,
} from "react-icons/lu";

const STATUS_TABS = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

export default function TasksPage() {
  const {
    tasks,
    tasksLoading,
    tasksError,
    activeStatus,
    loadTasks,
    refreshTasks,
    committee,
    pagination,
  } = useTasks();

  useEffect(() => {
    loadTasks("active", 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={cn(
        "max-w-4xl w-full px-5 md:mt-[140px] mt-[70px] mx-auto pb-20 space-y-8",
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-foreground tracking-tight">
          Tasks
        </h1>
        {committee?.name && (
          <p className="text-xs font-bold text-muted-foreground">
            {committee.name}
          </p>
        )}
      </div>

      {/* Status tabs + refresh */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => loadTasks(tab.key, 1)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-colors",
                activeStatus === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => refreshTasks()}
          disabled={tasksLoading}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
            "text-[11px] font-black uppercase tracking-widest",
            "text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            "disabled:opacity-50",
          )}
          aria-label="Refresh tasks"
        >
          <LuRefreshCw
            className={cn("w-3.5 h-3.5", tasksLoading && "animate-spin")}
          />
          Refresh
        </button>
      </div>

      {tasksError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
          <LuCircleAlert className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-[11px] font-bold text-red-600">{tasksError}</p>
        </div>
      )}

      {tasksLoading && (
        <div className="flex items-center justify-center py-16">
          <LuLoader className="w-6 h-6 text-primary animate-spin" />
        </div>
      )}

      {!tasksLoading && tasks.length === 0 && !tasksError && (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center border border-dashed border-border rounded-2xl">
          <LuListTodo className="w-7 h-7 text-muted-foreground/20" />
          <p className="text-xs font-bold text-muted-foreground/50">
            No tasks in this view
          </p>
        </div>
      )}

      <div className="space-y-3">
        {tasks.map((task) => (
          <Link
            key={task._id}
            href={`/tasks/${task._id}`}
            className={cn(
              "flex items-center gap-4 p-4 glass-subtle rounded-xl border border-border/40",
              "hover:border-primary/30 transition-all",
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {task.title}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {task.description}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60">
                  <LuClock className="w-3 h-3" />
                  {new Date(task.deadline).toLocaleDateString()}
                </span>
                {task.pointsReward > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-primary">
                    <LuCoins className="w-3 h-3" />
                    {task.pointsReward}pts
                  </span>
                )}
              </div>
            </div>
            <span
              className={cn(
                "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full shrink-0",
                task.assignment
                  ? task.assignment.status === "evaluated"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {task.assignment
                ? task.assignment.status.replace("_", " ")
                : "Open"}
            </span>
          </Link>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <button
                key={p}
                onClick={() => loadTasks(activeStatus, p)}
                className={cn(
                  "w-8 h-8 rounded-lg text-[11px] font-black",
                  pagination.page === p
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {p}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
