"use client";
// src/components/sections/tasks/admin/TaskDetailModal.tsx
// Popup modal for committee HEAD/COORDINATOR to inspect a task —
// shows task metadata, assignment summary, and action links.
// Full evaluation and approval lives on the admin detail page;
// this modal is intentionally lightweight (read + edit/delete links only).

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LuClock,
  LuUsers,
  LuCoins,
  LuPencil,
  LuX,
  LuTriangleAlert,
  LuCheck,
  LuLoader,
  LuSend,
  LuVote,
  LuClipboardList,
  LuShieldCheck,
} from "react-icons/lu";
import Link from "next/link";

interface TaskDetailModalProps {
  task: {
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
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
}: TaskDetailModalProps) {
  if (!task) return null;

  const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.draft;
  const TypeIcon = TYPE_ICONS[task.taskType] ?? LuSend;
  const isOverdue = new Date(task.deadline) < new Date();
  const stats = task.assignmentStats ?? { total: 0, byStatus: {} };
  const evaluated = stats.byStatus["evaluated"] ?? 0;
  const submitted = stats.byStatus["submitted"] ?? 0;
  const underReview = stats.byStatus["under_review"] ?? 0;
  const pending = stats.byStatus["pending"] ?? 0;
  const canEdit = task.status !== "cancelled" && task.status !== "archived";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <TypeIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <span
              className={cn(
                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                statusCfg.className,
              )}
            >
              {statusCfg.label}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">
              {task.taskType} · {task.priority}
            </span>
          </div>
          <DialogTitle className="text-base font-black tracking-tight mt-2">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {task.description}
          </p>

          {/* Pending approval note */}
          {task.status === "pending_approval" && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <LuTriangleAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-600 font-bold">
                Awaiting admin approval before it goes live.
              </p>
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 rounded-xl border border-border space-y-0.5">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <LuClock className="w-2.5 h-2.5" /> Deadline
              </p>
              <p
                className={cn(
                  "text-[11px] font-bold",
                  isOverdue ? "text-red-500" : "text-foreground",
                )}
              >
                {new Date(task.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            {task.pointsReward > 0 && (
              <div className="p-3 bg-muted/30 rounded-xl border border-border space-y-0.5">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <LuCoins className="w-2.5 h-2.5" /> Points
                </p>
                <p className="text-[11px] font-bold text-primary">
                  {task.pointsReward}pts
                </p>
              </div>
            )}

            {stats.total > 0 && (
              <div className="p-3 bg-muted/30 rounded-xl border border-border space-y-0.5">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <LuUsers className="w-2.5 h-2.5" /> Assignments
                </p>
                <p className="text-[11px] font-bold text-foreground">
                  {stats.total} total
                </p>
              </div>
            )}

            {evaluated > 0 && (
              <div className="p-3 bg-muted/30 rounded-xl border border-border space-y-0.5">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <LuCheck className="w-2.5 h-2.5" /> Evaluated
                </p>
                <p className="text-[11px] font-bold text-emerald-600">
                  {evaluated} / {stats.total}
                </p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {stats.total > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                Progress
              </p>
              <div className="h-2 bg-border rounded-full overflow-hidden flex gap-0.5">
                {evaluated > 0 && (
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(evaluated / stats.total) * 100}%` }}
                  />
                )}
                {submitted + underReview > 0 && (
                  <div
                    className="h-full bg-primary/60"
                    style={{
                      width: `${((submitted + underReview) / stats.total) * 100}%`,
                    }}
                  />
                )}
                {pending > 0 && (
                  <div
                    className="h-full bg-border"
                    style={{ width: `${(pending / stats.total) * 100}%` }}
                  />
                )}
              </div>
              <div className="flex items-center gap-4 text-[9px] font-mono text-muted-foreground/60">
                {evaluated > 0 && <span>{evaluated} evaluated</span>}
                {submitted + underReview > 0 && (
                  <span>{submitted + underReview} in review</span>
                )}
                {pending > 0 && <span>{pending} pending</span>}
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[10px] font-black uppercase tracking-wider"
            >
              <LuX className="w-3.5 h-3.5 mr-1.5" />
              Close
            </Button>

            {canEdit && (
              <Link
                href={`/committees/${task.committeeSlug}/tasks/${task._id}/edit`}
                className="flex-1"
              >
                <Button
                  variant="outline"
                  className="w-full text-[10px] font-black uppercase tracking-wider"
                  onClick={() => onOpenChange(false)}
                >
                  <LuPencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit Task
                </Button>
              </Link>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
