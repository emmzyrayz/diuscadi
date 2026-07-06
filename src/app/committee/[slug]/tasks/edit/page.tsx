"use client";
// src/app/committees/[slug]/tasks/[id]/edit/page.tsx
// Edit an existing committee task.
// If the task is currently "active", editing and resubmitting immediately
// sets it back to "pending_approval" (task goes dark until re-approved).
// The user sees a clear warning before submitting.

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import {
  LuArrowLeft,
  LuLoader,
  LuSend,
  LuCircleAlert,
  LuTriangleAlert,
  LuInfo,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaskTypeSelector } from "@/components/sections/tasks/admin/TaskTypeSelector";
import { DeliverableBuilder } from "@/components/sections/tasks/admin/DeliverableBuilder";
import { PollBuilder } from "@/components/sections/tasks/admin/PollBuilder";
import { SurveyBuilder } from "@/components/sections/tasks/admin/SurveyBuilder";
import { PointsConfigPanel } from "@/components/sections/tasks/admin/PointConfigPanel";
import { DecayPreviewWidget } from "@/components/sections/tasks/admin/DecayPreviewWidget";
import { useTaskForm } from "@/hooks/useTaskForm";
import { toast } from "react-hot-toast";
import type { ITask } from "@/types/tasks";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

export default function CommitteeTaskEditPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { profile, effectiveCommittee, effectiveRole } = useUser();

  const slug = params?.slug as string;
  const taskId = params?.id as string;

  const [originalTask, setOriginalTask] = useState<ITask | null>(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [showTakedownWarning, setShowTakedownWarning] = useState(false);

  const {
    form,
    set,
    errors,
    submitting,
    setSubmitting,
    validate,
    buildPayload,
  } = useTaskForm({
    committeeSlug: slug,
    scope: "committee",
  });

  // ── Permission gate ────────────────────────────────────────────────────────
  const canEdit =
    profile?.membershipStatus === "approved" &&
    effectiveCommittee === slug &&
    ["HEAD", "COORDINATOR"].includes(effectiveRole ?? "");

  // ── Load existing task ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !taskId) return;

    const load = async () => {
      setLoadingTask(true);
      setTaskError(null);
      try {
        const res = await fetch(`/api/admin/tasks/task/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Task not found");

        const task = data.task as ITask;
        setOriginalTask(task);

        // Prefill form
        set("title", task.title);
        set("description", task.description);
        set("taskType", task.taskType);
        set("priority", task.priority);
        set(
          "deadline",
          new Date(task.deadline).toISOString().slice(0, 16),
        );
        set("evaluationCriteria", task.evaluationCriteria ?? "");
        set("maxScore", task.maxScore ?? 100);
        set("autoEvaluate", task.autoEvaluate ?? false);
        set("deliverables", task.deliverables ?? []);
        set("tags", (task.tags ?? []).join(", "));
        if (task.pollConfig) set("pollConfig", task.pollConfig);
        if (task.surveyConfig) set("surveyConfig", task.surveyConfig);
        set("points", {
          pointsReward: task.pointsReward ?? 0,
          qualityWeight: task.qualityWeight ?? 80,
          timeWeight: task.timeWeight ?? 20,
          decayBaseHours: task.decayBaseHours ?? 4,
          passThresholdPercent: task.passThresholdPercent ?? 50,
          acceptResponsesAfterDeadline:
            task.acceptResponsesAfterDeadline ?? false,
          latenessStretchFactor: task.latenessStretchFactor ?? 0.5,
        });
      } catch (err) {
        setTaskError(
          err instanceof Error ? err.message : "Failed to load task",
        );
      } finally {
        setLoadingTask(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, taskId]);

  // Show takedown warning when task is active and user tries to submit
  const isActiveTask = originalTask?.status === "active";

  async function handleSubmit() {
    if (isActiveTask && !showTakedownWarning) {
      setShowTakedownWarning(true);
      return;
    }

    if (!validate()) return;
    if (!token) return;

    setSubmitting(true);
    try {
      const payload = buildPayload();

      // PATCH the task — the route will set status back to pending_approval
      // if it was active, since committee staff can't publish directly.
      const res = await fetch(`/api/admin/tasks/task/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...payload,
          // Force back to pending_approval — committee staff edits always
          // require re-approval regardless of current status.
          status: "pending_approval",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update task");

      toast.success(
        isActiveTask
          ? "Task updated and taken down for re-approval. It will be hidden from members until a webmaster approves it again."
          : "Task updated and re-submitted for review.",
        { duration: 6000 },
      );
      router.push(`/committees/${slug}?tab=tasks`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update task",
      );
    } finally {
      setSubmitting(false);
      setShowTakedownWarning(false);
    }
  }

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loadingTask) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LuLoader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (taskError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <LuCircleAlert className="w-10 h-10 text-red-500" />
        <p className="text-sm font-bold text-red-500">{taskError}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <LuCircleAlert className="w-10 h-10 text-red-500" />
        <p className="text-sm font-bold text-red-500">
          You don&apos;t have permission to edit tasks for this committee.
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-[90px] pb-20 space-y-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors cursor-pointer"
      >
        <LuArrowLeft className="w-4 h-4" /> Back to Committee
      </button>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">
          Edit Task
        </h1>

        <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <LuInfo className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-[11px] text-amber-600 font-bold leading-relaxed">
            Edits are submitted for review — a webmaster or admin must approve
            them before they take effect.
          </p>
        </div>

        {/* Active task takedown warning */}
        {isActiveTask && (
          <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
            <LuTriangleAlert className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-[11px] text-red-600 font-bold leading-relaxed">
              This task is currently{" "}
              <strong>live and visible to members</strong>. Saving edits will
              immediately take it down for re-approval. Members will not be
              able to submit until an admin re-approves it.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Task type — locked once task exists to avoid data shape mismatch */}
        <Section
          title="Task Type"
          desc="Task type cannot be changed after creation"
        >
          <TaskTypeSelector
            value={form.taskType}
            onChange={() => {}}
            disabled={true}
          />
        </Section>

        {/* Basic Info */}
        <Section title="Basic Information" desc="Title, description, and deadline">
          <div className="space-y-4">
            <Field label="Title" required error={errors.title}>
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                disabled={submitting}
                className={cn("text-sm", errors.title && "border-red-500/50")}
              />
            </Field>

            <Field label="Description" required error={errors.description}>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                disabled={submitting}
                className={cn(
                  "text-sm resize-none",
                  errors.description && "border-red-500/50",
                )}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Priority">
                <select
                  value={form.priority}
                  onChange={(e) =>
                    set("priority", e.target.value as typeof form.priority)
                  }
                  disabled={submitting}
                  className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2 outline-none focus:border-primary transition-all"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Deadline" required error={errors.deadline}>
                <Input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => set("deadline", e.target.value)}
                  disabled={submitting}
                  className={cn(
                    "text-sm",
                    errors.deadline && "border-red-500/50",
                  )}
                />
              </Field>
            </div>

            <Field label="Tags (comma separated)">
              <Input
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                disabled={submitting}
                className="text-sm"
              />
            </Field>
          </div>
        </Section>

        {/* Submission-specific */}
        {form.taskType === "submission" && (
          <>
            <Section
              title="Deliverables"
              desc="What members need to submit"
              error={errors.deliverables}
            >
              <DeliverableBuilder
                value={form.deliverables}
                onChange={(d) => set("deliverables", d)}
                disabled={submitting}
              />
            </Section>

            <Section
              title="Evaluation"
              desc="How submissions will be graded"
              error={errors.evaluationCriteria}
            >
              <div className="space-y-4">
                <Field
                  label="Evaluation Criteria"
                  required
                  error={errors.evaluationCriteria}
                >
                  <Textarea
                    rows={4}
                    value={form.evaluationCriteria}
                    onChange={(e) =>
                      set("evaluationCriteria", e.target.value)
                    }
                    disabled={submitting}
                    className={cn(
                      "text-sm resize-none",
                      errors.evaluationCriteria && "border-red-500/50",
                    )}
                  />
                </Field>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      set("autoEvaluate", !form.autoEvaluate)
                    }
                    disabled={submitting}
                    className={cn(
                      "relative w-10 h-5 rounded-full transition-all cursor-pointer",
                      form.autoEvaluate
                        ? "bg-primary"
                        : "bg-muted border border-border",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 w-4 h-4 bg-background rounded-full shadow-sm transition-all",
                        form.autoEvaluate ? "left-5" : "left-0.5",
                      )}
                    />
                  </button>
                  <p className="text-[11px] font-black text-foreground">
                    Auto-evaluate with Gemini AI
                  </p>
                </div>
              </div>
            </Section>
          </>
        )}

        {form.taskType === "poll" && (
          <Section
            title="Poll Configuration"
            error={errors.pollConfig}
          >
            <PollBuilder
              value={form.pollConfig}
              onChange={(c) => set("pollConfig", c)}
              disabled={submitting}
            />
          </Section>
        )}

        {form.taskType === "survey" && (
          <Section
            title="Survey Configuration"
            error={errors.surveyConfig}
          >
            <SurveyBuilder
              value={form.surveyConfig}
              onChange={(c) => set("surveyConfig", c)}
              disabled={submitting}
            />
          </Section>
        )}

        <Section
          title="Points & Rewards"
          error={errors.weights}
        >
          <PointsConfigPanel
            taskType={form.taskType}
            value={form.points}
            onChange={(p) => set("points", p)}
            disabled={submitting}
            weightError={errors.weights}
          />
          {form.taskType === "submission" &&
            form.points.pointsReward > 0 &&
            form.points.qualityWeight + form.points.timeWeight === 100 && (
              <DecayPreviewWidget
                decayBaseHours={form.points.decayBaseHours}
                qualityWeight={form.points.qualityWeight}
                timeWeight={form.points.timeWeight}
                pointsReward={form.points.pointsReward}
                className="mt-4"
              />
            )}
        </Section>

        {/* Takedown confirmation */}
        {showTakedownWarning && isActiveTask && (
          <div className="p-5 bg-red-500/5 border-2 border-red-500/20 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <LuTriangleAlert className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm font-black text-red-600">
                Confirm Takedown
              </p>
            </div>
            <p className="text-[11px] text-red-600 leading-relaxed">
              This will immediately hide the task from all members and cancel
              any pending submissions that haven&apos;t been evaluated yet.
              The task will reappear only after an admin re-approves it.
              Are you sure you want to proceed?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTakedownWarning(false)}
                className="text-[11px] font-black uppercase tracking-widest"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-red-500 hover:bg-red-600 text-white text-[11px] font-black uppercase tracking-widest"
              >
                {submitting ? (
                  <LuLoader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Yes, Take Down & Update"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Submit */}
        {!showTakedownWarning && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              disabled={submitting}
              className="text-[11px] font-black uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="text-[11px] font-black uppercase tracking-widest px-8"
            >
              {submitting ? (
                <>
                  <LuLoader className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <LuSend className="w-3.5 h-3.5 mr-2" />
                  {isActiveTask ? "Save & Take Down for Review" : "Save Changes"}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  desc,
  error,
  children,
}: {
  title: string;
  desc?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background border-2 border-border rounded-[2rem] p-7 space-y-5"
    >
      <div className="pb-4 border-b border-border">
        <h2 className="text-sm font-black text-foreground uppercase tracking-tight">
          {title}
        </h2>
        {desc && (
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            {desc}
          </p>
        )}
        {error && (
          <p className="text-[11px] text-red-500 font-bold mt-1 flex items-center gap-1.5">
            <LuCircleAlert className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
      {children}
    </motion.div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-black uppercase tracking-widest">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-[11px] text-red-500 font-bold flex items-center gap-1">
          <LuCircleAlert className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}