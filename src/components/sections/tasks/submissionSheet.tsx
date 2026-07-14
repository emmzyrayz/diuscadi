"use client";
// src/components/sections/tasks/submissionSheet.tsx
// CHANGED: image_url and file_url deliverables now open ScreenshotUploadModal
// instead of plain text input. publicIds stored alongside URLs.

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  LuSend,
  LuLoader,
  LuCircleAlert,
  LuClock,
  LuImage,
  LuCheck,
  LuUpload,
  LuRotateCcw,
} from "react-icons/lu";
import { useTasks, type EnrichedTask } from "@/context/TaskContext";
import { useToast } from "@/hooks/useToast";
import { ScreenshotUploadModal } from "./ScreenshotUploadModal";
import type { SubmissionItem } from "@/types/tasks";

export type SheetMode = "submit" | "view";

interface SubmissionSheetProps {
  task: EnrichedTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SheetMode;
}

interface DeliverableState {
  value: string;
  publicId?: string;
}

export function SubmissionSheet({
  task,
  open,
  onOpenChange,
  mode,
}: SubmissionSheetProps) {
  const { submitAssignment } = useTasks();
  const { toast } = useToast();

  const [deliverableValues, setDeliverableValues] = useState<
    Record<string, DeliverableState>
  >({});
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const [activeDeliverableLabel, setActiveDeliverableLabel] = useState<
    string | null
  >(null);

  // Tracks which task/open "instance" we've already initialized state for.
  const [initializedKey, setInitializedKey] = useState<string | null>(null);

  // Derive a stable key for the currently-open task. Adjust the fallback
  // chain below to whatever unique id your EnrichedTask actually has.
  const taskKey = task ? task._id : null;
  const currentKey = open && task ? taskKey : null;

  // "Adjusting state during render" pattern (React-docs sanctioned):
  // this runs synchronously as part of render, not as a post-commit effect,
  // so it doesn't trigger the cascading-render warning.
  if (currentKey !== initializedKey) {
    setInitializedKey(currentKey);
    if (currentKey && task) {
      const initial: Record<string, DeliverableState> = {};
      for (const d of task.deliverables ?? []) initial[d.label] = { value: "" };
      setDeliverableValues(initial);
      setAdditionalNotes("");
      setErrors({});
    }
  }

  if (!task) return null;

  const assignment = task.assignment;
  const deliverables = task.deliverables ?? [];
  const isResubmission = assignment?.status === "revision_requested";
  const effectiveDeadline = assignment?.effectiveDeadline ?? task.deadline;
  const isOverdue = new Date(effectiveDeadline) < new Date();

  if (mode === "view") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0"
        >
          <SheetHeader className="p-6 pb-4 space-y-2 border-b border-border">
            <SheetTitle className="text-base font-black uppercase tracking-tight">
              {task.title}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Submitted work — read only
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {assignment?.score && (
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-1">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  Evaluation Score
                </p>
                <p className="text-2xl font-black text-emerald-600">
                  {assignment.score.total}/{assignment.score.max}
                  <span className="text-sm ml-2 font-bold">
                    ({assignment.score.percentage.toFixed(0)}%)
                  </span>
                </p>
              </div>
            )}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Submitted Deliverables
              </p>
              {deliverables.map((d) => (
                <div key={d.label} className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest">
                    {d.label}
                  </Label>
                  <div className="p-3 bg-muted/30 rounded-xl border border-border text-sm text-muted-foreground">
                    {d.type === "image_url" || d.type === "file_url"
                      ? "[Screenshot submitted — removed after evaluation]"
                      : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <SheetFooter className="p-6 pt-4 border-t border-border">
            <SheetClose asChild>
              <Button
                variant="ghost"
                className="w-full text-[11px] font-black uppercase tracking-widest"
              >
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  const setDeliverableValue = (
    label: string,
    value: string,
    publicId?: string,
  ) => {
    setDeliverableValues((prev) => ({
      ...prev,
      [label]: { value, ...(publicId && { publicId }) },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[label];
      return next;
    });
  };

  const handleScreenshotComplete = (result: {
    url: string;
    publicId: string;
  }) => {
    if (!activeDeliverableLabel) return;
    setDeliverableValue(activeDeliverableLabel, result.url, result.publicId);
    setScreenshotModalOpen(false);
    setActiveDeliverableLabel(null);
  };

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    for (const d of deliverables) {
      if (d.required && !deliverableValues[d.label]?.value?.trim()) {
        newErrors[d.label] = "This deliverable is required";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!assignment || !validate()) return;
    setSubmitting(true);
    const items: SubmissionItem[] = deliverables.map((d) => ({
      deliverableLabel: d.label,
      type: d.type,
      value: deliverableValues[d.label]?.value ?? "",
    }));
    const result = await submitAssignment(assignment._id, {
      items,
      additionalNotes: additionalNotes.trim() || undefined,
    });
    setSubmitting(false);
    if (result.success) {
      toast({
        title: isResubmission ? "Resubmitted" : "Submitted",
        description: result.evaluationPreview
          ? result.evaluationPreview.flaggedForHumanReview
            ? "Submitted and queued for review."
            : `Score: ${result.evaluationPreview.score}/${result.evaluationPreview.maxScore}`
          : "Your work has been submitted for evaluation.",
        variant: "success",
      });
      onOpenChange(false);
    } else {
      toast({
        title: "Submission Failed",
        description: result.error ?? "Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0"
        >
          <SheetHeader className="p-6 pb-4 space-y-3 border-b border-border">
            {isResubmission && (
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20 inline-flex items-center gap-1 w-fit">
                <LuRotateCcw className="w-2.5 h-2.5" /> Revision
              </span>
            )}
            <SheetTitle className="text-base font-black uppercase tracking-tight leading-snug">
              {task.title}
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
              {isOverdue ? "Overdue · " : "Due · "}
              {new Date(effectiveDeadline).toLocaleString()}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isOverdue && (
              <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                <LuCircleAlert className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-[11px] text-red-600 font-bold">
                  Deadline has passed — your submission may not be accepted.
                </p>
              </div>
            )}

            {deliverables.map((d) => {
              const isImage = d.type === "image_url" || d.type === "file_url";
              const currentValue = deliverableValues[d.label]?.value ?? "";
              const hasValue = currentValue.trim().length > 0;
              const hasError = !!errors[d.label];

              return (
                <div key={d.label} className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">
                    {d.label}
                    {d.required && <span className="ml-1 text-red-500">*</span>}
                  </Label>
                  {d.description && (
                    <p className="text-[10px] text-muted-foreground">
                      {d.description}
                    </p>
                  )}

                  {isImage ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDeliverableLabel(d.label);
                          setScreenshotModalOpen(true);
                        }}
                        disabled={submitting}
                        className={cn(
                          "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                          hasValue
                            ? "border-emerald-500/40 bg-emerald-500/5"
                            : hasError
                              ? "border-red-500/40 bg-red-500/5"
                              : "border-dashed border-border hover:border-primary/40 hover:bg-muted/30",
                          submitting && "pointer-events-none opacity-60",
                        )}
                      >
                        {hasValue ? (
                          <>
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <LuCheck className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-black text-emerald-600">
                                Screenshot uploaded
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                Click to replace
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                              <LuImage className="w-5 h-5 text-muted-foreground/50" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-foreground">
                                Upload screenshot
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {d.placeholder ?? "Click to select an image"}
                              </p>
                            </div>
                            <LuUpload className="w-4 h-4 text-muted-foreground/40 ml-auto shrink-0" />
                          </>
                        )}
                      </button>
                      {hasError && (
                        <p className="text-[11px] text-red-500 font-bold flex items-center gap-1">
                          <LuCircleAlert className="w-3 h-3 shrink-0" />
                          {errors[d.label]}
                        </p>
                      )}
                    </div>
                  ) : d.type === "text" ? (
                    <Textarea
                      rows={3}
                      value={currentValue}
                      onChange={(e) =>
                        setDeliverableValue(d.label, e.target.value)
                      }
                      placeholder={d.placeholder ?? "Your response…"}
                      disabled={submitting}
                      className={cn(
                        "text-sm resize-none",
                        hasError && "border-red-500/50",
                      )}
                    />
                  ) : (
                    <Input
                      value={currentValue}
                      onChange={(e) =>
                        setDeliverableValue(d.label, e.target.value)
                      }
                      placeholder={d.placeholder ?? "https://…"}
                      disabled={submitting}
                      className={cn(
                        "text-sm font-mono",
                        hasError && "border-red-500/50",
                      )}
                    />
                  )}

                  {hasError && !isImage && (
                    <p className="text-[11px] text-red-500 font-bold flex items-center gap-1">
                      <LuCircleAlert className="w-3 h-3 shrink-0" />
                      {errors[d.label]}
                    </p>
                  )}
                </div>
              );
            })}

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                Additional Notes{" "}
                <span className="font-normal text-muted-foreground normal-case tracking-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any context for the evaluator…"
                disabled={submitting}
                className="text-sm resize-none"
              />
            </div>
          </div>

          <SheetFooter className="p-6 pt-4 border-t border-border flex flex-row gap-2">
            <SheetClose asChild>
              <Button
                variant="ghost"
                className="flex-1 h-9 text-[11px] font-black uppercase tracking-wider"
                disabled={submitting}
              >
                Cancel
              </Button>
            </SheetClose>
            <Button
              className="flex-1 h-9 text-[11px] font-black uppercase tracking-wider"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LuLoader className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <LuSend className="w-3.5 h-3.5 mr-1.5" />
                  {isResubmission ? "Resubmit" : "Submit"}
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ScreenshotUploadModal
        open={screenshotModalOpen}
        onOpenChange={setScreenshotModalOpen}
        deliverableLabel={activeDeliverableLabel ?? ""}
        onComplete={handleScreenshotComplete}
        disabled={submitting}
        ownerId={assignment?._id}
      />
    </>
  );
}
