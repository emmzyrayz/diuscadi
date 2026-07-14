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
  LuLoader,
  LuCircleCheck,
  LuCircleAlert,
  LuPlus,
  LuTrash2,
  LuImageOff,
  LuExternalLink,
  LuRotateCcw,
  LuCircleX,
} from "react-icons/lu";
import { useTaskAdmin } from "@/context/TaskAdminContext";
import { useToast } from "@/hooks/useToast";
import type { AssignmentWithMemberInfo } from "@/context/TaskAdminContext";
import Image from "next/image";

export interface ManualEvaluateSheetProps {
  assignment: AssignmentWithMemberInfo | null;
  maxScore: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface CriterionRow {
  criterion: string;
  awarded: string;
  maximum: string;
  rationale: string;
}

type DecisionMode = "approve" | "reject";

export function ManualEvaluateSheet({
  assignment,
  maxScore,
  open,
  onOpenChange,
}: ManualEvaluateSheetProps) {
  const { manualEvaluate, requestRevision } = useTaskAdmin();
  const { toast } = useToast();

  const [mode, setMode] = useState<DecisionMode>("approve");

  // Approve/score fields
  const [totalScore, setTotalScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [criteria, setCriteria] = useState<CriterionRow[]>([]);
  const [showCriteria, setShowCriteria] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Reject fields
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setMode("approve");
    setTotalScore("");
    setFeedback("");
    setCriteria([]);
    setShowCriteria(false);
    setFieldErrors({});
    setRejectReason("");
    setRejectError(null);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) resetForm();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetForm],
  );

  if (!assignment) return null;

  const submissionItems = assignment.submission?.items ?? [];
  const alreadyEvaluated = !!assignment.evaluation;

  const scoreNum = parseFloat(totalScore);
  const scorePct =
    !isNaN(scoreNum) && maxScore > 0 ? (scoreNum / maxScore) * 100 : 0;
  const scoreColor =
    scorePct >= 70
      ? "text-green-500"
      : scorePct >= 50
        ? "text-yellow-500"
        : "text-red-500";
  const barColor =
    scorePct >= 70
      ? "bg-green-500"
      : scorePct >= 50
        ? "bg-yellow-500"
        : "bg-red-500";

  function validateEvaluation(): boolean {
    const errors: Record<string, string> = {};
    const n = parseFloat(totalScore);
    if (isNaN(n)) errors.totalScore = "Score must be a number";
    else if (n < 0) errors.totalScore = "Score cannot be negative";
    else if (n > maxScore)
      errors.totalScore = `Score cannot exceed ${maxScore}`;
    if (!feedback.trim()) errors.feedback = "Feedback is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleApproveSubmit() {
    if (!assignment || !validateEvaluation()) return;
    setSubmitting(true);

    const payload = {
      totalScore: parseFloat(totalScore),
      feedback: feedback.trim(),
      evaluatorType: "MANUAL" as const,
      ...(showCriteria &&
        criteria.length > 0 && {
          criteriaBreakdown: criteria
            .filter((c) => c.criterion.trim())
            .map((c) => ({
              criterion: c.criterion.trim(),
              awarded: parseFloat(c.awarded) || 0,
              maximum: parseFloat(c.maximum) || 0,
              rationale: c.rationale.trim(),
            })),
        }),
    };

    const result = await manualEvaluate(assignment._id, payload);
    setSubmitting(false);

    if (result.success) {
      toast({
        title: "Evaluation Saved",
        description: `${assignment.memberInfo?.fullName ?? "Member"} scored ${totalScore}/${maxScore}`,
        variant: "success",
      });
      onOpenChange(false);
    } else {
      toast({
        title: "Evaluation Failed",
        description: result.error ?? "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleRejectSubmit() {
    if (!assignment) return;
    if (!rejectReason.trim()) {
      setRejectError("Please explain what the member should fix");
      return;
    }
    setRejectError(null);
    setSubmitting(true);

    const result = await requestRevision(assignment._id, rejectReason.trim());
    setSubmitting(false);

    if (result.success) {
      toast({
        title: "Sent Back for Revision",
        description: `${assignment.memberInfo?.fullName ?? "Member"} can now resubmit.`,
        variant: "success",
      });
      onOpenChange(false);
    } else {
      toast({
        title: "Request Failed",
        description: result.error ?? "Please try again.",
        variant: "destructive",
      });
    }
  }

  function addCriterion() {
    setCriteria((prev) => [
      ...prev,
      { criterion: "", awarded: "", maximum: "", rationale: "" },
    ]);
  }

  function removeCriterion(i: number) {
    setCriteria((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateCriterion(
    i: number,
    field: keyof CriterionRow,
    value: string,
  ) {
    setCriteria((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)),
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto flex flex-col gap-0 p-0"
      >
        <SheetHeader className="p-6 pb-4 border-b border-border space-y-2">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
            Review Submission
          </span>
          <SheetTitle className="text-sm font-black uppercase tracking-tight">
            {assignment.memberInfo?.fullName ?? "Member"}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {assignment.memberInfo?.email}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ── Submitted deliverables ─────────────────────────────────────── */}
          <div className="space-y-3">
            <Label className="text-xs font-bold">
              Submitted Deliverables
            </Label>

            {submissionItems.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">
                No submission data available.
              </p>
            ) : (
              <div className="space-y-3">
                {submissionItems.map((item, i) => {
                  const isImage =
                    item.type === "image_url" || item.type === "file_url";
                  const looksRemoved =
                    !item.value ||
                    item.value.includes("[image removed after evaluation]");

                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {item.deliverableLabel}
                      </p>

                      {isImage ? (
                        looksRemoved ? (
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 italic py-4">
                            <LuImageOff className="w-3.5 h-3.5 shrink-0" />
                            Image no longer available
                          </div>
                        ) : (
                          <a
                            href={item.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                          >
                              <Image
                                width={300}
                                height={500}
                              src={item.value}
                              alt={item.deliverableLabel}
                              className="rounded-lg border border-border max-h-64 w-auto object-contain bg-background"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                            <span className="flex items-center gap-1 text-[10px] text-primary mt-1.5 group-hover:underline">
                              <LuExternalLink className="w-3 h-3" />
                              Open full size
                            </span>
                          </a>
                        )
                      ) : (
                        <p className="text-[12px] text-foreground break-words whitespace-pre-wrap">
                          {item.value || (
                            <span className="italic text-muted-foreground/50">
                              (empty)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {assignment.submission?.additionalNotes && (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Additional Notes
                </p>
                <p className="text-[12px] text-foreground whitespace-pre-wrap">
                  {assignment.submission.additionalNotes}
                </p>
              </div>
            )}

            {assignment.submission?.submittedAt && (
              <p className="text-[10px] text-muted-foreground/60 font-mono">
                Submitted{" "}
                {new Date(assignment.submission.submittedAt).toLocaleString()}
              </p>
            )}
          </div>

          {alreadyEvaluated && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-600 font-bold">
              Already evaluated: {assignment.evaluation!.totalScore}/
              {assignment.evaluation!.maxScore} (
              {assignment.evaluation!.percentageScore.toFixed(0)}%). Submitting
              again will overwrite this.
            </div>
          )}

          {/* ── Mode toggle ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/40 border border-border/50">
            <button
              type="button"
              onClick={() => setMode("approve")}
              className={cn(
                "text-[10px] font-black uppercase tracking-wider py-2 rounded-lg transition-all",
                mode === "approve"
                  ? "bg-background shadow-sm text-emerald-600 border border-emerald-500/20"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Approve & Score
            </button>
            <button
              type="button"
              onClick={() => setMode("reject")}
              className={cn(
                "text-[10px] font-black uppercase tracking-wider py-2 rounded-lg transition-all",
                mode === "reject"
                  ? "bg-background shadow-sm text-red-500 border border-red-500/20"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Reject Submission
            </button>
          </div>

          {/* ── Approve form ───────────────────────────────────────────────── */}
          {mode === "approve" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="total-score" className="text-xs font-bold">
                  Score
                  <span className="ml-1.5 font-normal text-muted-foreground/50 text-[10px]">
                    0 – {maxScore}
                  </span>
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="total-score"
                    type="number"
                    min={0}
                    max={maxScore}
                    placeholder={`0–${maxScore}`}
                    value={totalScore}
                    onChange={(e) => setTotalScore(e.target.value)}
                    className={cn(
                      "w-28 text-sm text-center font-mono",
                      fieldErrors.totalScore && "border-red-500/50",
                    )}
                  />
                  <span
                    className={cn("text-lg font-black font-mono", scoreColor)}
                  >
                    {isNaN(scoreNum) ? "–" : `${scorePct.toFixed(0)}%`}
                  </span>
                </div>

                <div className="h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      barColor,
                    )}
                    style={{
                      width: `${Math.min(Math.max(scorePct, 0), 100)}%`,
                    }}
                  />
                </div>

                {fieldErrors.totalScore && (
                  <p className="text-[11px] text-red-500 flex items-center gap-1">
                    <LuCircleAlert className="w-3 h-3" />
                    {fieldErrors.totalScore}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="feedback" className="text-xs font-bold">
                  Feedback
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="Write constructive feedback for the member — what they did well, what to improve…"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={5}
                  className={cn(
                    "text-sm resize-none",
                    fieldErrors.feedback &&
                      "border-red-500/50 focus-visible:ring-red-500/30",
                  )}
                />
                {fieldErrors.feedback && (
                  <p className="text-[11px] text-red-500 flex items-center gap-1">
                    <LuCircleAlert className="w-3 h-3" />
                    {fieldErrors.feedback}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowCriteria((v) => !v)}
                  className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-foreground/5 text-muted-foreground hover:bg-foreground/10 transition-all"
                >
                  {showCriteria ? "Hide" : "Add"} Criteria Breakdown (optional)
                </button>

                {showCriteria && (
                  <div className="space-y-3">
                    {criteria.map((c, i) => (
                      <div
                        key={i}
                        className="glass-subtle rounded-lg p-3 space-y-2 border border-border/30"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Input
                            placeholder="Criterion name"
                            value={c.criterion}
                            onChange={(e) =>
                              updateCriterion(i, "criterion", e.target.value)
                            }
                            className="text-xs h-7 flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeCriterion(i)}
                            className="text-muted-foreground/40 hover:text-red-500 transition-colors shrink-0"
                          >
                            <LuTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Awarded"
                            value={c.awarded}
                            onChange={(e) =>
                              updateCriterion(i, "awarded", e.target.value)
                            }
                            className="text-xs h-7 w-20 text-center font-mono"
                          />
                          <span className="text-xs text-muted-foreground">
                            /
                          </span>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={c.maximum}
                            onChange={(e) =>
                              updateCriterion(i, "maximum", e.target.value)
                            }
                            className="text-xs h-7 w-20 text-center font-mono"
                          />
                        </div>

                        <Input
                          placeholder="Rationale (optional)"
                          value={c.rationale}
                          onChange={(e) =>
                            updateCriterion(i, "rationale", e.target.value)
                          }
                          className="text-xs h-7"
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addCriterion}
                      className="flex items-center gap-1.5 text-[10px] font-mono text-primary hover:opacity-70 transition-opacity"
                    >
                      <LuPlus className="w-3 h-3" /> Add Criterion
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Reject form ────────────────────────────────────────────────── */}
          {mode === "reject" && (
            <div className="space-y-2">
              <Label htmlFor="reject-reason" className="text-xs font-bold">
                Reason for rejection
              </Label>
              <p className="text-[10px] text-muted-foreground">
                Explain what&apos;s wrong so the member knows what to fix before
                resubmitting.
              </p>
              <Textarea
                id="reject-reason"
                placeholder="e.g. Screenshot doesn't show the required confirmation page — please retake and resubmit."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={5}
                className={cn(
                  "text-sm resize-none",
                  rejectError && "border-red-500/50",
                )}
              />
              {rejectError && (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                  <LuCircleAlert className="w-3 h-3" />
                  {rejectError}
                </p>
              )}
            </div>
          )}
        </div>

        <SheetFooter className="p-6 pt-4 border-t border-border flex flex-row gap-2">
          <SheetClose asChild>
            <Button
              variant="ghost"
              className="flex-1 h-9 text-[11px] font-bold uppercase tracking-wider"
            >
              Cancel
            </Button>
          </SheetClose>

          {mode === "approve" ? (
            <Button
              className="flex-1 h-9 text-[11px] font-bold uppercase tracking-wider"
              onClick={handleApproveSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LuLoader className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <LuCircleCheck className="w-3.5 h-3.5 mr-1.5" /> Save
                  Evaluation
                </>
              )}
            </Button>
          ) : (
            <Button
              className="flex-1 h-9 text-[11px] font-bold uppercase tracking-wider bg-red-500 hover:bg-red-600 text-white"
              onClick={handleRejectSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LuLoader className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <LuRotateCcw className="w-3.5 h-3.5 mr-1.5" /> Send Back
                </>
              )}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}