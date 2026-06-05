"use client";
// Standalone evaluation result display — used inside SubmissionSheet view mode.
// Receives a full evaluation object (when fetched) or a score summary (from
// the task list enrichment). Renders whichever fields are present.

import React from "react";
import { cn } from "@/lib/utils";
import {
  LuBot,
  LuUser,
  LuShield,
  LuCircleCheck,
  LuCircleX,
  LuTriangleAlert,
} from "react-icons/lu";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EvaluationDisplayData {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  feedback?: string;
  criteriaBreakdown?: {
    criterion: string;
    awarded: number;
    maximum: number;
    rationale?: string;
  }[];
  evaluatorType?: "GEMINI_BOT" | "MANUAL" | "HYBRID";
  evaluatedAt?: string;
  flaggedForHumanReview?: boolean;
  reviewNote?: string | null;
}

interface EvaluationCardProps {
  evaluation: EvaluationDisplayData;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gradeFromPct(pct: number) {
  if (pct >= 70)
    return { label: "Passed", color: "text-green-500", bar: "bg-green-500" };
  if (pct >= 50)
    return {
      label: "Borderline",
      color: "text-yellow-500",
      bar: "bg-yellow-500",
    };
  return {
    label: "Needs Improvement",
    color: "text-red-500",
    bar: "bg-red-500",
  };
}

function criterionColor(pct: number) {
  if (pct >= 70) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EvaluationCard({ evaluation }: EvaluationCardProps) {
  const pct = evaluation.percentageScore;
  const grade = gradeFromPct(pct);

  const EvaluatorIcon =
    evaluation.evaluatorType === "GEMINI_BOT"
      ? LuBot
      : evaluation.evaluatorType === "HYBRID"
        ? LuShield
        : LuUser;

  const evaluatorLabel =
    evaluation.evaluatorType === "GEMINI_BOT"
      ? "AI Evaluated"
      : evaluation.evaluatorType === "HYBRID"
        ? "Hybrid Review"
        : "Manually Reviewed";

  return (
    <div className="space-y-4">
      {/* ── Score card ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          "glass-subtle",
          "rounded-xl",
          "p-4",
          "space-y-3",
          "border",
          "border-border/50",
        )}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
            Evaluation Result
          </span>
          {evaluation.evaluatorType && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60">
              <EvaluatorIcon className="w-3 h-3" />
              {evaluatorLabel}
            </span>
          )}
        </div>

        {/* Score numerals */}
        <div className="flex items-baseline gap-2">
          <span className={cn("text-5xl", "font-black", grade.color)}>
            {evaluation.totalScore}
          </span>
          <span className="text-xl text-muted-foreground font-mono">
            / {evaluation.maxScore}
          </span>
          <span
            className={cn("ml-auto", "text-2xl", "font-black", grade.color)}
          >
            {pct.toFixed(0)}%
          </span>
        </div>

        {/* Score bar */}
        <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full",
              "rounded-full",
              "transition-all",
              "duration-700",
              grade.bar,
            )}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>

        {/* Grade label + date */}
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-xs", "font-bold", grade.color)}>
            {pct >= 70 ? (
              <LuCircleCheck className="inline w-3.5 h-3.5 mr-1" />
            ) : (
              <LuCircleX className="inline w-3.5 h-3.5 mr-1" />
            )}
            {grade.label}
          </span>
          {evaluation.evaluatedAt && (
            <span className="text-[10px] font-mono text-muted-foreground/40">
              {formatDate(evaluation.evaluatedAt)}
            </span>
          )}
        </div>
      </div>

      {/* ── Flagged warning ──────────────────────────────────────────────── */}
      {evaluation.flaggedForHumanReview && (
        <div
          className={cn(
            "flex",
            "items-start",
            "gap-2",
            "p-3",
            "rounded-lg",
            "bg-yellow-500/8",
            "border",
            "border-yellow-500/20",
          )}
        >
          <LuTriangleAlert className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-yellow-500">
              Flagged for Human Review
            </p>
            {evaluation.reviewNote && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {evaluation.reviewNote}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Feedback ─────────────────────────────────────────────────────── */}
      {evaluation.feedback && (
        <div className="space-y-1.5">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
            Evaluator Feedback
          </h5>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {evaluation.feedback}
          </p>
        </div>
      )}

      {/* ── Criteria breakdown ───────────────────────────────────────────── */}
      {evaluation.criteriaBreakdown &&
        evaluation.criteriaBreakdown.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
              Criteria Breakdown
            </h5>
            <div className="space-y-2.5">
              {evaluation.criteriaBreakdown.map((c, i) => {
                const cPct = c.maximum > 0 ? (c.awarded / c.maximum) * 100 : 0;
                return (
                  <div
                    key={i}
                    className={cn(
                      "glass-subtle",
                      "rounded-lg",
                      "p-3",
                      "space-y-1.5",
                      "border",
                      "border-border/30",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {c.criterion}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground shrink-0">
                        {c.awarded} / {c.maximum}
                      </span>
                    </div>
                    <div className="h-1 bg-foreground/5 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full",
                          "rounded-full",
                          criterionColor(cPct),
                        )}
                        style={{ width: `${Math.min(cPct, 100)}%` }}
                      />
                    </div>
                    {c.rationale && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {c.rationale}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
}
