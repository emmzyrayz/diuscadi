"use client";
// src/components/sections/tasks/SurveyResponseSheet.tsx
// Survey response sheet — renders task.surveyConfig.questions as a form.
// Supports short_text, long_text, single_choice, multi_choice, rating.
// One-shot, same pattern as PollResponseSheet.

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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  LuClock,
  LuLoader,
  LuCheck,
  LuClipboardList,
  LuTriangleAlert,
  LuStar,
} from "react-icons/lu";
import { useTasks } from "@/context/TaskContext";
import { useToast } from "@/hooks/useToast";
import type { EnrichedTask } from "@/context/TaskContext";

interface SurveyResponseSheetProps {
  task: EnrichedTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AnswerValue = string | string[];

export function SurveyResponseSheet({
  task,
  open,
  onOpenChange,
}: SurveyResponseSheetProps) {
  const { submitSurveyResponse } = useTasks();
  const { toast } = useToast();

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setAnswers({});
      setErrors({});
    }
    onOpenChange(nextOpen);
  };

  if (!task) return null;

  const assignment = task.assignment;
  const surveyConfig = task.surveyConfig;
  const questions = surveyConfig?.questions ?? [];
  const isOverdue = new Date(task.deadline) < new Date();
  const acceptsLate = task.acceptResponsesAfterDeadline ?? false;
  const isClosed = isOverdue && !acceptsLate;
  const alreadyResponded = !!assignment?.surveyResponseRecorded;

  const setAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    for (const q of questions) {
      if (!q.required) continue;
      const val = answers[q.id];
      const isEmpty =
        val === undefined ||
        val === "" ||
        (Array.isArray(val) && val.length === 0);
      if (isEmpty) newErrors[q.id] = "This question is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!task || !assignment) return;
    if (!validate()) {
      toast({
        title: "Missing Answers",
        description: "Please answer all required questions.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const payload = questions
      .map((q) => ({ questionId: q.id, value: answers[q.id] }))
      .filter((a) => a.value !== undefined && a.value !== "");

    const result = await submitSurveyResponse(assignment._id, payload);
    setSubmitting(false);

    if (result.success) {
      const pts = result.pointsResult;
      let description = "Your responses have been recorded.";
      if (pts?.accepted && pts.pointsEarned > 0) {
        description += pts.isLate
          ? ` Earned ${pts.pointsEarned}pts (late submission, ${Math.round(pts.timeMultiplier * 100)}% multiplier).`
          : ` Earned ${pts.pointsEarned}pts.`;
      }
      toast({ title: "Survey Complete", description, variant: "success" });
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0"
      >
        <SheetHeader className="p-6 pb-4 space-y-3 border-b border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 flex items-center gap-1">
              <LuClipboardList className="w-3 h-3" /> Survey
            </span>
            {task.pointsReward > 0 && (
              <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary">
                {task.pointsReward}pts
              </span>
            )}
            {surveyConfig?.anonymous && (
              <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-foreground/5 text-muted-foreground">
                Anonymous
              </span>
            )}
          </div>
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
            {isOverdue ? "Closed · " : "Closes · "}
            {new Date(task.deadline).toLocaleString()}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {alreadyResponded && (
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-3">
              <LuCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="text-xs font-bold text-emerald-600">
                You already completed this survey.
              </p>
            </div>
          )}

          {!alreadyResponded && isClosed && (
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 flex items-center gap-3">
              <LuTriangleAlert className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs font-bold text-red-600">
                This survey closed at its deadline and is no longer accepting
                responses.
              </p>
            </div>
          )}

          {!alreadyResponded && !isClosed && isOverdue && acceptsLate && (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 flex items-center gap-2">
              <LuTriangleAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-600">
                This survey is past its deadline — your reward will be reduced
                for responding late.
              </p>
            </div>
          )}

          {!alreadyResponded &&
            !isClosed &&
            questions.map((q, idx) => {
              const hasError = !!errors[q.id];
              return (
                <div key={q.id} className="space-y-2">
                  <Label className="flex items-start gap-2 text-xs font-bold">
                    <span className="text-muted-foreground/40 shrink-0">
                      {idx + 1}.
                    </span>
                    <span>
                      {q.label}
                      {q.required && (
                        <span className="ml-1 text-[10px] text-red-500 font-normal">
                          required
                        </span>
                      )}
                    </span>
                  </Label>

                  {q.type === "short_text" && (
                    <Input
                      value={(answers[q.id] as string) ?? ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      className={cn("text-sm", hasError && "border-red-500/50")}
                      placeholder="Your answer…"
                    />
                  )}

                  {q.type === "long_text" && (
                    <Textarea
                      value={(answers[q.id] as string) ?? ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      rows={4}
                      className={cn(
                        "text-sm resize-none",
                        hasError && "border-red-500/50",
                      )}
                      placeholder="Your answer…"
                    />
                  )}

                  {q.type === "single_choice" && (
                    <div className="space-y-1.5">
                      {(q.options ?? []).map((opt) => {
                        const isSelected = answers[q.id] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setAnswer(q.id, opt)}
                            className={cn(
                              "w-full flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-slate-300",
                            )}
                          >
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                                isSelected
                                  ? "border-primary bg-primary"
                                  : "border-border",
                              )}
                            >
                              {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                              )}
                            </div>
                            <span className="text-xs font-medium">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "multi_choice" && (
                    <div className="space-y-1.5">
                      {(q.options ?? []).map((opt) => {
                        const current = (answers[q.id] as string[]) ?? [];
                        const isSelected = current.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              const next = isSelected
                                ? current.filter((o) => o !== opt)
                                : [...current, opt];
                              setAnswer(q.id, next);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-slate-300",
                            )}
                          >
                            <div
                              className={cn(
                                "w-4 h-4 rounded-md border-2 shrink-0 flex items-center justify-center",
                                isSelected
                                  ? "border-primary bg-primary"
                                  : "border-border",
                              )}
                            >
                              {isSelected && (
                                <LuCheck className="w-2.5 h-2.5 text-primary-foreground" />
                              )}
                            </div>
                            <span className="text-xs font-medium">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "rating" && (
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => {
                        const current = Number(answers[q.id] ?? 0);
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setAnswer(q.id, String(n))}
                            className="p-1"
                          >
                            <LuStar
                              className={cn(
                                "w-6 h-6 transition-colors",
                                n <= current
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30",
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {hasError && (
                    <p className="text-[11px] text-red-500">{errors[q.id]}</p>
                  )}
                </div>
              );
            })}
        </div>

        <SheetFooter className="p-6 pt-4 border-t border-border flex flex-row gap-2">
          <SheetClose asChild>
            <Button
              variant="ghost"
              className="flex-1 h-9 text-[11px] font-bold uppercase tracking-wider"
            >
              {alreadyResponded || isClosed ? "Close" : "Cancel"}
            </Button>
          </SheetClose>

          {!alreadyResponded && !isClosed && (
            <Button
              className="flex-1 h-9 text-[11px] font-bold uppercase tracking-wider"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LuLoader className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit Responses"
              )}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
