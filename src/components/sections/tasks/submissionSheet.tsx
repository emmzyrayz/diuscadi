"use client";

import React, { useState, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  LuClock,
  LuSend,
  LuCircleAlert,
  LuLink,
  LuType,
  LuImage,
  LuFileText,
  LuLoader,
  LuRotateCcw,
} from "react-icons/lu";
import { useTasks } from "@/context/TaskContext";
import { useToast } from "@/hooks/useToast";
import { EvaluationCard } from "./EvaluationCard";
import type { EnrichedTask } from "@/context/TaskContext";
import type { SubmissionItem } from "@/types/tasks";

const TYPE_ICONS = {
  text: LuType,
  url: LuLink,
  file_url: LuFileText,
  image_url: LuImage,
} as const;

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export type SheetMode = "submit" | "view";

interface SubmissionSheetProps {
  task: EnrichedTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SheetMode;
}

export function SubmissionSheet({
  task,
  open,
  onOpenChange,
  mode,
}: SubmissionSheetProps) {
  const {
    submitAssignment,
    triggerBotEvaluate,
    selectedAssignment,
    selectedAssignmentLoading,
    loadAssignmentDetail,
    clearSelectedAssignment,
  } = useTasks();
  const { toast } = useToast();

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [reEvaluating, setReEvaluating] = useState(false);

  // ── Sheet open/close ────────────────────────────────────────────────────────
  // Phase 3 change: trigger loadAssignmentDetail on view mode open,
  // and clear selectedAssignment on close.

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setFieldValues({});
        setAdditionalNotes("");
        setFieldErrors({});
        // Phase 3: fetch full evaluation breakdown when viewing
        if (mode === "view" && task?.assignment?._id) {
          loadAssignmentDetail(task.assignment._id);
        }
      } else {
        clearSelectedAssignment();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, mode, task, loadAssignmentDetail, clearSelectedAssignment],
  );

  if (!task) return null;

  const assignment = task.assignment;
  const isResubmission = assignment?.status === "revision_requested";
  const deadlineStr = assignment?.effectiveDeadline ?? task.deadline;
  const isOverdue = new Date(deadlineStr) < new Date();

  function validateFields(): boolean {
    if (!task) return false;
    const errors: Record<string, string> = {};
    for (const d of task.deliverables) {
      if (d.required && !fieldValues[d.label]?.trim()) {
        errors[d.label] = `${d.label} is required`;
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!task || !assignment || isOverdue) return;
    if (!validateFields()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required deliverables.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const items: SubmissionItem[] = task.deliverables
      .map((d) => ({
        deliverableLabel: d.label,
        type: d.type,
        value: fieldValues[d.label]?.trim() ?? "",
      }))
      .filter((item) => item.value.length > 0);

    const result = await submitAssignment(assignment._id, {
      items,
      additionalNotes: additionalNotes.trim() || undefined,
    });

    setSubmitting(false);

    if (result.success) {
      let description: string;
      if (result.botTriggered && result.evaluationPreview) {
        description = result.evaluationPreview.flaggedForHumanReview
          ? "Submitted and flagged for human review."
          : `AI evaluated: ${result.evaluationPreview.score}/${result.evaluationPreview.maxScore} (${result.evaluationPreview.percentage.toFixed(0)}%)`;
      } else {
        description = "Your work has been submitted for review.";
      }
      toast({
        title: isResubmission ? "Resubmitted" : "Submitted",
        description,
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

  async function handleReEvaluate() {
    if (!assignment) return;
    setReEvaluating(true);

    const result = await triggerBotEvaluate(assignment._id, "RE_EVALUATE");
    setReEvaluating(false);

    if (result.success) {
      toast({
        title: result.flaggedForHumanReview
          ? "Flagged for Review"
          : "Re-evaluation Complete",
        description: result.flaggedForHumanReview
          ? "The AI flagged this submission for human review."
          : `Score: ${result.evaluation?.totalScore}/${result.evaluation?.maxScore} · ${result.evaluation?.percentageScore.toFixed(0)}%`,
        variant: result.flaggedForHumanReview ? "default" : "success",
      });
    } else {
      toast({
        title: "Re-evaluation Failed",
        description: result.error ?? "AI service temporarily unavailable.",
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
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <SheetHeader className="p-6 pb-4 space-y-3 border-b border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-[9px]",
                "font-mono",
                "font-bold",
                "uppercase",
                "tracking-widest",
                "px-2",
                "py-0.5",
                "rounded",
                "bg-primary/10",
                "text-primary",
              )}
            >
              {task.priority} priority
            </span>
            <span
              className={cn(
                "text-[9px]",
                "font-mono",
                "uppercase",
                "tracking-widest",
                "px-2",
                "py-0.5",
                "rounded",
                "bg-foreground/5",
                "text-muted-foreground",
              )}
            >
              {task.taskType}
            </span>
            {task.autoEvaluate && (
              <span
                className={cn(
                  "text-[9px]",
                  "font-mono",
                  "uppercase",
                  "tracking-widest",
                  "px-2",
                  "py-0.5",
                  "rounded",
                  "bg-blue-500/10",
                  "text-blue-500",
                )}
              >
                ✦ AI Graded
              </span>
            )}
          </div>

          <SheetTitle className="text-base font-black uppercase tracking-tight leading-snug">
            {task.title}
          </SheetTitle>
          <SheetDescription className="text-xs leading-relaxed text-muted-foreground">
            {task.description}
          </SheetDescription>
          <div
            className={cn(
              "flex",
              "items-center",
              "gap-1.5",
              "text-xs",
              "font-mono",
              isOverdue ? "text-red-500" : "text-muted-foreground/60",
            )}
          >
            <LuClock className="w-3.5 h-3.5" />
            {isOverdue ? "Overdue · " : "Deadline · "}
            {formatDate(deadlineStr)}
          </div>
        </SheetHeader>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* VIEW MODE — evaluated (Phase 3: loads full breakdown) */}
          {mode === "view" && assignment?.status === "evaluated" && (
            <>
              {selectedAssignmentLoading && (
                <div className="flex items-center justify-center py-12 gap-3">
                  <LuLoader className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Loading evaluation…
                  </span>
                </div>
              )}

              {!selectedAssignmentLoading && selectedAssignment?.evaluation && (
                <EvaluationCard
                  evaluation={{
                    totalScore: selectedAssignment.evaluation.totalScore,
                    maxScore: selectedAssignment.evaluation.maxScore,
                    percentageScore:
                      selectedAssignment.evaluation.percentageScore,
                    feedback: selectedAssignment.evaluation.feedback,
                    criteriaBreakdown:
                      selectedAssignment.evaluation.criteriaBreakdown,
                    evaluatorType: selectedAssignment.evaluation.evaluatorType,
                    flaggedForHumanReview:
                      selectedAssignment.evaluation.flaggedForHumanReview,
                    evaluatedAt: selectedAssignment.evaluation.evaluatedAt,
                    reviewNote:
                      selectedAssignment.evaluation.reviewNote ?? undefined,
                  }}
                />
              )}

              {/* Fallback: show score summary if full detail fetch failed */}
              {!selectedAssignmentLoading &&
                !selectedAssignment?.evaluation &&
                assignment.score && (
                  <EvaluationCard
                    evaluation={{
                      totalScore: assignment.score.total,
                      maxScore: assignment.score.max,
                      percentageScore: assignment.score.percentage,
                      flaggedForHumanReview: assignment.flaggedForHumanReview,
                      evaluatedAt: assignment.evaluatedAt ?? undefined,
                    }}
                  />
                )}
            </>
          )}

          {/* VIEW MODE — submitted */}
          {mode === "view" && assignment?.status === "submitted" && (
            <div
              className={cn(
                "p-4",
                "rounded-xl",
                "bg-primary/5",
                "border",
                "border-primary/15",
                "space-y-2",
              )}
            >
              <p className="text-xs font-bold text-primary">
                Submission Received
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your work has been received and is in the evaluation queue.
                {task.autoEvaluate
                  ? " AI evaluation will run shortly."
                  : " A committee head or admin will review it."}
              </p>
              {assignment.submittedAt && (
                <p className="text-[10px] font-mono text-muted-foreground/50">
                  Submitted {formatDate(assignment.submittedAt)}
                </p>
              )}
            </div>
          )}

          {/* VIEW MODE — under review */}
          {mode === "view" && assignment?.status === "under_review" && (
            <div
              className={cn(
                "p-4",
                "rounded-xl",
                "bg-yellow-500/5",
                "border",
                "border-yellow-500/20",
                "space-y-3",
              )}
            >
              <div className="flex items-center gap-2">
                <LuCircleAlert className="w-4 h-4 text-yellow-500 shrink-0" />
                <p className="text-xs font-bold text-yellow-500">
                  Under Review
                </p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your submission is in the manual review queue.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-[11px] font-bold uppercase tracking-wider border-yellow-500/30 hover:bg-yellow-500/5"
                onClick={handleReEvaluate}
                disabled={reEvaluating}
              >
                {reEvaluating ? (
                  <>
                    <LuLoader className="w-3.5 h-3.5 mr-1.5 animate-spin" />{" "}
                    Re-evaluating...
                  </>
                ) : (
                  <>
                    <LuRotateCcw className="w-3.5 h-3.5 mr-1.5" /> Request
                    Re-evaluation
                  </>
                )}
              </Button>
            </div>
          )}

          {/* SUBMIT MODE */}
          {mode === "submit" && (
            <div className="space-y-5">
              {isOverdue && (
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-2",
                    "p-3",
                    "rounded-lg",
                    "bg-red-500/10",
                    "border",
                    "border-red-500/20",
                  )}
                >
                  <LuCircleAlert className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-500 font-semibold">
                    The submission deadline has passed. Contact a committee head
                    if you need an extension.
                  </p>
                </div>
              )}

              {task.evaluationCriteria && (
                <div
                  className={cn(
                    "p-3",
                    "rounded-lg",
                    "bg-primary/5",
                    "border",
                    "border-primary/10",
                  )}
                >
                  <h5
                    className={cn(
                      "text-[10px]",
                      "font-mono",
                      "font-bold",
                      "uppercase",
                      "tracking-widest",
                      "text-primary",
                      "mb-1.5",
                    )}
                  >
                    Evaluation Criteria
                  </h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {task.evaluationCriteria}
                  </p>
                </div>
              )}

              {task.deliverables.length > 0 ? (
                <div className="space-y-4">
                  {task.deliverables.map((d) => {
                    const Icon = TYPE_ICONS[d.type] ?? LuType;
                    const hasError = !!fieldErrors[d.label];

                    return (
                      <div key={d.label} className="space-y-1.5">
                        <Label
                          htmlFor={`field-${d.label}`}
                          className="flex items-center gap-2 text-xs font-bold"
                        >
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          {d.label}
                          {d.required ? (
                            <span className="text-[10px] text-red-500 font-normal">
                              required
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/40 font-normal">
                              optional
                            </span>
                          )}
                        </Label>

                        {d.description && (
                          <p className="text-[11px] text-muted-foreground pl-5">
                            {d.description}
                          </p>
                        )}

                        {d.type === "text" ? (
                          <Textarea
                            id={`field-${d.label}`}
                            placeholder={
                              d.placeholder ?? `Enter ${d.label.toLowerCase()}…`
                            }
                            value={fieldValues[d.label] ?? ""}
                            onChange={(e) =>
                              setFieldValues((prev) => ({
                                ...prev,
                                [d.label]: e.target.value,
                              }))
                            }
                            rows={4}
                            className={cn(
                              "text-sm resize-none",
                              hasError &&
                                "border-red-500/50 focus-visible:ring-red-500/30",
                            )}
                          />
                        ) : (
                          <Input
                            id={`field-${d.label}`}
                            type="url"
                            placeholder={d.placeholder ?? "https://…"}
                            value={fieldValues[d.label] ?? ""}
                            onChange={(e) =>
                              setFieldValues((prev) => ({
                                ...prev,
                                [d.label]: e.target.value,
                              }))
                            }
                            className={cn(
                              "text-sm",
                              hasError &&
                                "border-red-500/50 focus-visible:ring-red-500/30",
                            )}
                          />
                        )}

                        {hasError && (
                          <p className="text-[11px] text-red-500 flex items-center gap-1 pl-0.5">
                            <LuCircleAlert className="w-3 h-3 shrink-0" />
                            {fieldErrors[d.label]}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">
                      Additional Notes{" "}
                      <span className="font-normal text-muted-foreground/40 text-[10px]">
                        optional
                      </span>
                    </Label>
                    <Textarea
                      placeholder="Any context or clarifications for the reviewer…"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No deliverables defined for this task.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <SheetFooter className="p-6 pt-4 border-t border-border flex flex-row gap-2">
          <SheetClose asChild>
            <Button
              variant="ghost"
              className="flex-1 h-9 text-[11px] font-bold uppercase tracking-wider"
            >
              {mode === "submit" ? "Cancel" : "Close"}
            </Button>
          </SheetClose>

          {mode === "submit" && (
            <Button
              className="flex-1 h-9 text-[11px] font-bold uppercase tracking-wider"
              onClick={handleSubmit}
              disabled={submitting || isOverdue}
            >
              {submitting ? (
                <>
                  <LuLoader className="w-3.5 h-3.5 mr-1.5 animate-spin" />{" "}
                  Submitting…
                </>
              ) : (
                <>
                  <LuSend className="w-3.5 h-3.5 mr-1.5" />
                  {isResubmission ? "Resubmit" : "Submit Work"}
                </>
              )}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
