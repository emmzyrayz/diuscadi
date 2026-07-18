"use client";
// app/tasks/[id]/page.tsx

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTasks } from "@/context/TaskContext";
import { ScreenshotUploadModal } from "@/components/sections/tasks/ScreenshotUploadModal";
import {
  LuLoader,
  LuClock,
  LuCoins,
  LuCircleAlert,
  LuExternalLink,
  LuCheck,
  LuArrowLeft,
} from "react-icons/lu";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    tasks,
    submitAssignment,
    submitPollResponse,
    submitSurveyResponse,
    submitAcknowledgement,
  } = useTasks();

  const task = tasks.find((t) => t._id === params.id);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Submission-type state
  const [deliverableValues, setDeliverableValues] = useState<
    Record<string, { value: string; publicId?: string }>
  >({});
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [activeUploadLabel, setActiveUploadLabel] = useState<string | null>(
    null,
  );

  // Poll/survey state
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [surveyAnswers, setSurveyAnswers] = useState<
    Record<string, string | string[]>
  >({});

  if (!task) {
    // Task not in the currently-loaded list (e.g. direct link, or a
    // different status filter was active on /tasks). Without a
    // single-task-by-id API route, we can't refetch it here — surface
    // that clearly rather than silently 404ing.
    return (
      <div className="max-w-2xl mx-auto px-5 md:mt-[140px] mt-[70px] pb-20 text-center space-y-3">
        <LuCircleAlert className="w-8 h-8 text-muted-foreground/30 mx-auto" />
        <p className="text-sm font-bold text-muted-foreground">
          Task not found in the loaded list.
        </p>
        <p className="text-xs text-muted-foreground/60">
          Go back to{" "}
          <button
            onClick={() => router.push("/tasks")}
            className="text-primary underline"
          >
            Tasks
          </button>{" "}
          — a dedicated GET /api/members/tasks/:id route would let this page
          load directly without relying on the list already being in memory.
        </p>
      </div>
    );
  }

  const assignmentId = task.assignment?._id;
  const hasResponded =
    task.assignment?.status === "evaluated" ||
    task.assignment?.status === "submitted" ||
    task.assignment?.status === "under_review" ||
    task.assignment?.pollResponseRecorded ||
    task.assignment?.surveyResponseRecorded ||
    task.assignment?.acknowledgedAtRecorded;

  const handleDeliverableUpload = (
    label: string,
    result: { url: string; publicId: string },
  ) => {
    setDeliverableValues((prev) => ({
      ...prev,
      [label]: { value: result.url, publicId: result.publicId },
    }));
    setActiveUploadLabel(null);
  };

  const handleSubmitDeliverables = async () => {
    if (!assignmentId) return;
    setSubmitting(true);
    setSubmitError(null);

    const items = task.deliverables.map((d) => ({
      deliverableLabel: d.label,
      type: d.type,
      value: deliverableValues[d.label]?.value ?? "",
    }));

    const missing = task.deliverables.filter(
      (d) => d.required && !deliverableValues[d.label]?.value,
    );
    if (missing.length > 0) {
      setSubmitError(`Missing required: ${missing.map((d) => d.label).join(", ")}`);
      setSubmitting(false);
      return;
    }

    const result = await submitAssignment(assignmentId, {
      items,
      additionalNotes: additionalNotes || undefined,
    });

    setSubmitting(false);
    if (!result.success) {
      setSubmitError(result.error ?? "Submission failed");
      return;
    }
    setSubmitted(true);
  };

  const handleSubmitPoll = async () => {
    if (!assignmentId || selectedOptions.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitPollResponse(assignmentId, selectedOptions);
    setSubmitting(false);
    if (!result.success) {
      setSubmitError(result.error ?? "Vote failed");
      return;
    }
    setSubmitted(true);
  };

  const handleSubmitSurvey = async () => {
    if (!assignmentId) return;
    setSubmitting(true);
    setSubmitError(null);
    const answers = Object.entries(surveyAnswers).map(([questionId, value]) => ({
      questionId,
      value,
    }));
    const result = await submitSurveyResponse(assignmentId, answers);
    setSubmitting(false);
    if (!result.success) {
      setSubmitError(result.error ?? "Submission failed");
      return;
    }
    setSubmitted(true);
  };

  const handleAcknowledge = async () => {
    if (!assignmentId) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitAcknowledgement(assignmentId);
    setSubmitting(false);
    if (!result.success) {
      setSubmitError(result.error ?? "Confirmation failed");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="max-w-2xl w-full px-5 md:mt-[140px] mt-[70px] mx-auto pb-20 space-y-6">
      <button
        onClick={() => router.push("/tasks")}
        className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground"
      >
        <LuArrowLeft className="w-3.5 h-3.5" /> Back to tasks
      </button>

      <div className="space-y-3">
        <h1 className="text-2xl font-black text-foreground tracking-tight">
          {task.title}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {task.description}
        </p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
            <LuClock className="w-3.5 h-3.5" />
            Due {new Date(task.deadline).toLocaleString()}
          </span>
          {task.pointsReward > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-primary">
              <LuCoins className="w-3.5 h-3.5" />
              {task.pointsReward} pts
            </span>
          )}
        </div>

        {/* ← ADD: Action buttons */}
        {task.taskBtn && task.taskBtn.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {task.taskBtn.map((btn, i) => (
              <a
                key={i}
                href={btn.btnUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={btn.hoverLabel || undefined}
                className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <LuExternalLink className="w-3.5 h-3.5" />
                {btn.btnLabel}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── Already evaluated / responded ─────────────────────────────────── */}
      {task.assignment?.evaluatedAt && task.assignment.score && (
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1">
          <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">
            Evaluated
          </p>
          <p className="text-2xl font-black text-foreground">
            {task.assignment.score.total}/{task.assignment.score.max}{" "}
            <span className="text-sm text-muted-foreground">
              ({task.assignment.score.percentage}%)
            </span>
          </p>
        </div>
      )}

      {submitError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
          <LuCircleAlert className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-[11px] font-bold text-red-600">{submitError}</p>
        </div>
      )}

      {submitted && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
          <LuCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-[11px] font-bold text-emerald-600">
            Response recorded.
          </p>
        </div>
      )}

      {/* ── Submission type ──────────────────────────────────────────────── */}
      {task.taskType === "submission" && !hasResponded && !submitted && (
        <div className="space-y-4">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Deliverables
          </p>
          {task.deliverables?.map((d, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 bg-background border border-border rounded-lg"
            >
              <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                {i + 1}.
              </span>
              <div className="flex-1 space-y-2">
                <p className="text-[11px] font-bold text-foreground">
                  {d.label}
                  {d.required && <span className="text-red-500 ml-1">*</span>}
                </p>
                {d.description && (
                  <p className="text-[10px] text-muted-foreground">
                    {d.description}
                  </p>
                )}

                {(d.type === "image_url" || d.type === "file_url") && (
                  <>
                    <button
                      onClick={() => setActiveUploadLabel(d.label)}
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg",
                        deliverableValues[d.label]
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-primary text-primary-foreground",
                      )}
                    >
                      {deliverableValues[d.label]
                        ? "Uploaded ✓ — Replace"
                        : "Upload"}
                    </button>
                    <ScreenshotUploadModal
                      open={activeUploadLabel === d.label}
                      onOpenChange={(open) =>
                        !open && setActiveUploadLabel(null)
                      }
                      deliverableLabel={d.label}
                      onComplete={(result) =>
                        handleDeliverableUpload(d.label, result)
                      }
                      ownerId={assignmentId}
                    />
                  </>
                )}

                {(d.type === "text" || d.type === "url") && (
                  <input
                    type="text"
                    placeholder={
                      d.placeholder ?? (d.type === "url" ? "https://…" : "")
                    }
                    value={deliverableValues[d.label]?.value ?? ""}
                    onChange={(e) =>
                      setDeliverableValues((prev) => ({
                        ...prev,
                        [d.label]: { value: e.target.value },
                      }))
                    }
                    className="w-full text-[11px] px-3 py-2 rounded-lg border border-border bg-background"
                  />
                )}
              </div>
            </div>
          ))}

          <textarea
            placeholder="Additional notes (optional)"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={3}
            className="w-full text-[11px] px-3 py-2 rounded-lg border border-border bg-background"
          />

          <button
            onClick={handleSubmitDeliverables}
            disabled={submitting}
            className={cn(
              "w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground",
              "text-[11px] font-black uppercase tracking-widest",
              "hover:opacity-90 transition-opacity disabled:opacity-60",
            )}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      )}

      {/* ── Poll type ─────────────────────────────────────────────────────── */}
      {task.taskType === "poll" &&
        task.pollConfig &&
        !hasResponded &&
        !submitted && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground">
              {task.pollConfig.question}
            </p>
            {task.pollConfig.options.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer"
              >
                <input
                  type={task.pollConfig?.allowMultiple ? "checkbox" : "radio"}
                  name="poll"
                  checked={selectedOptions.includes(opt.id)}
                  onChange={() =>
                    setSelectedOptions((prev) =>
                      task.pollConfig?.allowMultiple
                        ? prev.includes(opt.id)
                          ? prev.filter((id) => id !== opt.id)
                          : [...prev, opt.id]
                        : [opt.id],
                    )
                  }
                />
                <span className="text-[12px] text-foreground">{opt.label}</span>
              </label>
            ))}
            <button
              onClick={handleSubmitPoll}
              disabled={submitting || selectedOptions.length === 0}
              className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Vote"}
            </button>
          </div>
        )}

      {/* ── Survey type ───────────────────────────────────────────────────── */}
      {task.taskType === "survey" &&
        task.surveyConfig &&
        !hasResponded &&
        !submitted && (
          <div className="space-y-4">
            {task.surveyConfig.questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <p className="text-[12px] font-bold text-foreground">
                  {q.label}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </p>
                {(q.type === "short_text" || q.type === "long_text") && (
                  <input
                    type="text"
                    value={(surveyAnswers[q.id] as string) ?? ""}
                    onChange={(e) =>
                      setSurveyAnswers((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                    className="w-full text-[11px] px-3 py-2 rounded-lg border border-border bg-background"
                  />
                )}
                {(q.type === "single_choice" || q.type === "multi_choice") &&
                  q.options?.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 text-[11px]"
                    >
                      <input
                        type={q.type === "single_choice" ? "radio" : "checkbox"}
                        name={q.id}
                        onChange={() =>
                          setSurveyAnswers((prev) => {
                            if (q.type === "single_choice")
                              return { ...prev, [q.id]: opt };
                            const current = (prev[q.id] as string[]) ?? [];
                            return {
                              ...prev,
                              [q.id]: current.includes(opt)
                                ? current.filter((o) => o !== opt)
                                : [...current, opt],
                            };
                          })
                        }
                      />
                      {opt}
                    </label>
                  ))}
              </div>
            ))}
            <button
              onClick={handleSubmitSurvey}
              disabled={submitting}
              className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit survey"}
            </button>
          </div>
        )}

      {/* ── Acknowledgement type ─────────────────────────────────────────── */}
      {task.taskType === "acknowledgement" && !hasResponded && !submitted && (
        <button
          onClick={handleAcknowledge}
          disabled={submitting}
          className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest disabled:opacity-60"
        >
          {submitting ? "Confirming…" : "I acknowledge"}
        </button>
      )}

      {task.taskType === "learning" && (
        <p className="text-xs text-muted-foreground italic">
          Learning tasks aren&apos;t supported yet.
        </p>
      )}
    </div>
  );
}