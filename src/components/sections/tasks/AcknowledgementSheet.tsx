"use client";
// src/components/sections/tasks/AcknowledgementSheet.tsx
// Simplest of the three instant-complete sheets — no form, just the task
// description and a single confirm button. The act of confirming IS the
// response; no payload beyond the click itself.

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
  LuShieldCheck,
  LuTriangleAlert,
} from "react-icons/lu";
import { useTasks } from "@/context/TaskContext";
import { useToast } from "@/hooks/useToast";
import type { EnrichedTask } from "@/context/TaskContext";

interface AcknowledgementSheetProps {
  task: EnrichedTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AcknowledgementSheet({
  task,
  open,
  onOpenChange,
}: AcknowledgementSheetProps) {
  const { submitAcknowledgement } = useTasks();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  if (!task) return null;

  const assignment = task.assignment;
  const isOverdue = new Date(task.deadline) < new Date();
  const acceptsLate = task.acceptResponsesAfterDeadline ?? false;
  const isClosed = isOverdue && !acceptsLate;
  const alreadyAcknowledged = !!assignment?.acknowledgedAtRecorded;

  async function handleConfirm() {
    if (!task || !assignment) return;
    setSubmitting(true);

    const result = await submitAcknowledgement(assignment._id);
    setSubmitting(false);

    if (result.success) {
      const pts = result.pointsResult;
      let description = "Acknowledgement recorded.";
      if (pts?.accepted && pts.pointsEarned > 0) {
        description += pts.isLate
          ? ` Earned ${pts.pointsEarned}pts (late, ${Math.round(pts.timeMultiplier * 100)}% multiplier).`
          : ` Earned ${pts.pointsEarned}pts.`;
      }
      toast({ title: "Confirmed", description, variant: "success" });
      onOpenChange(false);
    } else {
      toast({
        title: "Confirmation Failed",
        description: result.error ?? "Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto flex flex-col gap-0 p-0"
      >
        <SheetHeader className="p-6 pb-4 space-y-3 border-b border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
              <LuShieldCheck className="w-3 h-3" /> Acknowledgement
            </span>
            {task.pointsReward > 0 && (
              <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary">
                {task.pointsReward}pts
              </span>
            )}
          </div>
          <SheetTitle className="text-base font-black uppercase tracking-tight leading-snug">
            {task.title}
          </SheetTitle>
          <SheetDescription className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {task.description}
          </SheetDescription>
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

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {alreadyAcknowledged && (
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-3">
              <LuCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="text-xs font-bold text-emerald-600">
                You already acknowledged this.
              </p>
            </div>
          )}

          {!alreadyAcknowledged && isClosed && (
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 flex items-center gap-3">
              <LuTriangleAlert className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs font-bold text-red-600">
                This closed at its deadline and is no longer accepting
                confirmations.
              </p>
            </div>
          )}

          {!alreadyAcknowledged && !isClosed && isOverdue && acceptsLate && (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 flex items-center gap-2">
              <LuTriangleAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-600">
                Past deadline — your reward will be reduced for confirming late.
              </p>
            </div>
          )}

          {!alreadyAcknowledged && !isClosed && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              By confirming, you acknowledge that you have read and understood
              the above. This action is final and cannot be undone.
            </p>
          )}
        </div>

        <SheetFooter className="p-6 pt-4 border-t border-border flex flex-row gap-2">
          <SheetClose asChild>
            <Button
              variant="ghost"
              className="flex-1 h-9 text-[11px] font-bold uppercase tracking-wider"
            >
              {alreadyAcknowledged || isClosed ? "Close" : "Cancel"}
            </Button>
          </SheetClose>

          {!alreadyAcknowledged && !isClosed && (
            <Button
              className="flex-1 h-9 text-[11px] font-bold uppercase tracking-wider"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LuLoader className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Confirming…
                </>
              ) : (
                <>
                  <LuCheck className="w-3.5 h-3.5 mr-1.5" />I Acknowledge
                </>
              )}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
