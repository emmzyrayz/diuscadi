"use client";
// src/components/sections/tasks/PollResponseSheet.tsx
// Poll voting sheet — single or multi-select depending on
// task.pollConfig.allowMultiple. One-shot: once voted, the sheet shows the
// recorded choice instead of the form (matches the backend's one-shot rule).

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LuClock,
  LuLoader,
  LuCheck,
  LuCircleAlert,
  LuTriangleAlert,
  LuVote,
} from "react-icons/lu";
import { useTasks } from "@/context/TaskContext";
import { useToast } from "@/hooks/useToast";
import type { EnrichedTask } from "@/context/TaskContext";

interface PollResponseSheetProps {
  task: EnrichedTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PollResponseSheet({
  task,
  open,
  onOpenChange,
}: PollResponseSheetProps) {
  const { submitPollResponse } = useTasks();
  const { toast } = useToast();

  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setSelected([]);
    onOpenChange(nextOpen);
  };

  if (!task) return null;

  const assignment = task.assignment;
  const pollConfig = task.pollConfig;
  const isOverdue = new Date(task.deadline) < new Date();
  const acceptsLate = task.acceptResponsesAfterDeadline ?? false;
  const isClosed = isOverdue && !acceptsLate;
  const alreadyVoted = !!assignment?.pollResponseRecorded;

  const toggleOption = (optionId: string) => {
    if (!pollConfig) return;
    if (pollConfig.allowMultiple) {
      setSelected((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      setSelected([optionId]);
    }
  };

  async function handleSubmit() {
    if (!task || !assignment || selected.length === 0) return;
    setSubmitting(true);

    const result = await submitPollResponse(assignment._id, selected);
    setSubmitting(false);

    if (result.success) {
      const pts = result.pointsResult;
      let description = "Your vote has been recorded.";
      if (pts?.accepted && pts.pointsEarned > 0) {
        description += pts.isLate
          ? ` Earned ${pts.pointsEarned}pts (late submission, ${Math.round(pts.timeMultiplier * 100)}% multiplier).`
          : ` Earned ${pts.pointsEarned}pts.`;
      }
      toast({ title: "Vote Recorded", description, variant: "success" });
      onOpenChange(false);
    } else {
      toast({
        title: "Vote Failed",
        description: result.error ?? "Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0"
      >
        <SheetHeader className="p-6 pb-4 space-y-3 border-b border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-violet-500/10 text-violet-500 flex items-center gap-1">
              <LuVote className="w-3 h-3" /> Poll
            </span>
            {task.pointsReward > 0 && (
              <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary">
                {task.pointsReward}pts
              </span>
            )}
          </div>
          <SheetTitle className="text-base font-black uppercase tracking-tight leading-snug">
            {pollConfig?.question ?? task.title}
          </SheetTitle>
          {task.description && (
            <SheetDescription className="text-xs leading-relaxed text-muted-foreground">
              {task.description}
            </SheetDescription>
          )}
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs font-mono",
              isOverdue ? "text-red-500" : "text-muted-foreground/60",
            )}
          >
            <LuClock className="w-3.5 h-3.5" />
            {isOverdue ? "Closed · " : "Closes · "}
            {new Date(task.deadline).toLocaleString()}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {alreadyVoted && (
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-3">
              <LuCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="text-xs font-bold text-emerald-600">
                You already voted on this poll.
              </p>
            </div>
          )}

          {!alreadyVoted && isClosed && (
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 flex items-center gap-3">
              <LuTriangleAlert className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs font-bold text-red-600">
                This poll closed at its deadline and is no longer accepting
                votes.
              </p>
            </div>
          )}

          {!alreadyVoted && !isClosed && isOverdue && acceptsLate && (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 flex items-center gap-2">
              <LuTriangleAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-600">
                This poll is past its deadline — your reward will be reduced for
                voting late.
              </p>
            </div>
          )}

          {!alreadyVoted && !isClosed && (
            <div className="space-y-2">
              {pollConfig?.allowMultiple && (
                <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-2">
                  Select all that apply
                </p>
              )}
              {(pollConfig?.options ?? []).map((opt) => {
                const isSelected = selected.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleOption(opt.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-slate-300",
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 shrink-0 border-2 flex items-center justify-center",
                        pollConfig?.allowMultiple
                          ? "rounded-md"
                          : "rounded-full",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-border",
                      )}
                    >
                      {isSelected && (
                        <LuCheck className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <SheetFooter className="p-6 pt-4 border-t border-border flex flex-row gap-2">
          <SheetClose asChild>
            <Button
              variant="ghost"
              className="flex-1 h-9 text-[11px] font-bold uppercase tracking-wider"
            >
              {alreadyVoted || isClosed ? "Close" : "Cancel"}
            </Button>
          </SheetClose>

          {!alreadyVoted && !isClosed && (
            <Button
              className="flex-1 h-9 text-[11px] font-bold uppercase tracking-wider"
              onClick={handleSubmit}
              disabled={submitting || selected.length === 0}
            >
              {submitting ? (
                <>
                  <LuLoader className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <LuCircleAlert className="w-3.5 h-3.5 mr-1.5" />
                  Cast Vote
                </>
              )}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
