"use client";
// src/app/committees/[slug]/tasks/create/page.tsx
// Committee staff task creation page.
// Scope is always "committee" — global option not shown.
// All created tasks go to "pending_approval" regardless of role.
// After submit: redirects back to the committee TaskManagementPanel.

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import {
  LuArrowLeft,
  LuLoader,
  LuSend,
  LuCircleAlert,
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

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

export default function CommitteeTaskCreatePage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { profile, effectiveCommittee, effectiveRole } = useUser();

  const slug = params?.slug as string;

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
    publishImmediately: false,
  });

  // ── Permission gate ────────────────────────────────────────────────────────
  // Only HEAD and COORDINATOR of this specific committee can create tasks.
  const canCreate =
    profile?.membershipStatus === "approved" &&
    effectiveCommittee === slug &&
    ["HEAD", "COORDINATOR"].includes(effectiveRole ?? "");

  useEffect(() => {
    if (profile && !canCreate) {
      toast.error(
        "You don't have permission to create tasks for this committee.",
      );
      router.replace(`/committees/${slug}`);
    }
  }, [profile, canCreate, router, slug]);

  async function handleSubmit() {
    if (!validate()) return;
    if (!token) return;

    setSubmitting(true);
    try {
      const payload = buildPayload();
      // Committee tasks always go to pending_approval — override
      // publishImmediately to false regardless of what the hook built.
      const res = await fetch("/api/admin/tasks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...payload,
          scope: "committee",
          publishImmediately: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create task");

      toast.success(
        "Task submitted for review. A webmaster or admin will approve it before it becomes visible to members.",
        { duration: 5000 },
      );
      router.push(`/committees/${slug}?tab=tasks`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LuLoader className="w-8 h-8 text-primary animate-spin" />
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
          Create Task
        </h1>
        <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <LuInfo className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-[11px] text-amber-600 font-bold leading-relaxed">
            Tasks you create are submitted for review. A webmaster or admin must
            approve them before members can see or respond to them.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* ── Task Type ────────────────────────────────────────────────────── */}
        <Section title="Task Type" desc="Choose what kind of task this is">
          <TaskTypeSelector
            value={form.taskType}
            onChange={(t) => set("taskType", t)}
            disabled={submitting}
          />
        </Section>

        {/* ── Basic Info ───────────────────────────────────────────────────── */}
        <Section
          title="Basic Information"
          desc="Title, description, and deadline"
        >
          <div className="space-y-4">
            <Field label="Title" required error={errors.title}>
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Design Sprint Brief — Week 3"
                disabled={submitting}
                className={cn("text-sm", errors.title && "border-red-500/50")}
              />
            </Field>

            <Field label="Description" required error={errors.description}>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the task clearly so members know exactly what's expected..."
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
                placeholder="e.g. design, sprint, week3"
                disabled={submitting}
                className="text-sm"
              />
            </Field>
          </div>
        </Section>

        {/* ── Submission-specific ───────────────────────────────────────────── */}
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
                    onChange={(e) => set("evaluationCriteria", e.target.value)}
                    placeholder="Describe the rubric clearly. This is fed directly to the AI evaluator and shown to committee heads doing manual reviews..."
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
                    onClick={() => set("autoEvaluate", !form.autoEvaluate)}
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
                  <div>
                    <p className="text-[11px] font-black text-foreground">
                      Auto-evaluate with Gemini AI
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      Submissions are automatically scored when received.
                      Flagged results still go to human review.
                    </p>
                  </div>
                </div>
              </div>
            </Section>
          </>
        )}

        {/* ── Poll config ───────────────────────────────────────────────────── */}
        {form.taskType === "poll" && (
          <Section
            title="Poll Configuration"
            desc="Question and voting options"
            error={errors.pollConfig}
          >
            <PollBuilder
              value={form.pollConfig}
              onChange={(c) => set("pollConfig", c)}
              disabled={submitting}
            />
          </Section>
        )}

        {/* ── Survey config ─────────────────────────────────────────────────── */}
        {form.taskType === "survey" && (
          <Section
            title="Survey Configuration"
            desc="Questions and response types"
            error={errors.surveyConfig}
          >
            <SurveyBuilder
              value={form.surveyConfig}
              onChange={(c) => set("surveyConfig", c)}
              disabled={submitting}
            />
          </Section>
        )}

        {/* ── Points config ─────────────────────────────────────────────────── */}
        <Section
          title="Points & Rewards"
          desc="How many points members earn for completing this task"
          error={errors.weights}
        >
          <PointsConfigPanel
            taskType={form.taskType}
            value={form.points}
            onChange={(p) => set("points", p)}
            disabled={submitting}
            weightError={errors.weights}
          />

          {/* Live decay preview for submission tasks */}
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

        {/* ── Submit ───────────────────────────────────────────────────────── */}
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
                Submitting…
              </>
            ) : (
              <>
                <LuSend className="w-3.5 h-3.5 mr-2" />
                Submit for Review
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Reusable section wrapper ──────────────────────────────────────────────────

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

// ── Reusable field wrapper ────────────────────────────────────────────────────

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
