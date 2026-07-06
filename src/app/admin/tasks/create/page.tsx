"use client";
// src/app/admin/tasks/create/page.tsx
// Admin task creation page — full control version.
// Admins/webmasters can:
//   - Choose scope (committee or global)
//   - Publish immediately or save as draft
//   - Create any task type including all config options
// After creation: redirects to the new task's detail page.

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import {
  LuArrowLeft,
  LuLoader,
  LuSend,
  LuCircleAlert,
  LuGlobe,
  LuBuilding2,
  LuSave,
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

const SYSTEM_ADMIN_ROLES = ["admin", "webmaster"];

export default function AdminTaskCreatePage() {
  const router = useRouter();
  const { token } = useAuth();
  const { profile } = useUser();

  const [committees, setCommittees] = useState<
    { slug: string; name: string }[]
  >([]);

  const {
    form,
    set,
    errors,
    submitting,
    setSubmitting,
    validate,
    buildPayload,
  } = useTaskForm({
    scope: "committee",
    publishImmediately: false,
  });

  // ── Permission gate ────────────────────────────────────────────────────────
  const isSystemAdmin = SYSTEM_ADMIN_ROLES.includes(profile?.role ?? "");

  useEffect(() => {
    if (profile && !isSystemAdmin) {
      toast.error("Admin or webmaster role required.");
      router.replace("/admin");
    }
  }, [profile, isSystemAdmin, router]);

  // ── Load committees for the dropdown ──────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch("/api/platform/committees", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.committees) setCommittees(d.committees);
      })
      .catch(() => {});
  }, [token]);

  async function handleSubmit(publishNow: boolean) {
    set("publishImmediately", publishNow);
    if (!validate()) return;
    if (!token) return;

    setSubmitting(true);
    try {
      const payload = buildPayload();
      const res = await fetch("/api/admin/tasks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...payload, publishImmediately: publishNow }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create task");

      toast.success(
        publishNow
          ? `Task published. ${data.assignments?.spawned ?? 0} assignment(s) created.`
          : "Task saved as draft.",
      );

      // Redirect to the new task's detail page
      router.push(`/admin/tasks/${data.task._id}`);
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
        <LuArrowLeft className="w-4 h-4" /> Back to Tasks
      </button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">
          Create Task
        </h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
          Admin · Full control
        </p>
      </div>

      <div className="space-y-8">
        {/* ── Scope ─────────────────────────────────────────────────────────── */}
        <Section
          title="Scope"
          desc="Who this task targets"
        >
          <div className="grid grid-cols-2 gap-3">
            {(["committee", "global"] as const).map((s) => {
              const isSelected = form.scope === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("scope", s)}
                  disabled={submitting}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-slate-300",
                  )}
                >
                  {s === "global" ? (
                    <LuGlobe
                      className={cn(
                        "w-5 h-5 shrink-0",
                        isSelected ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                  ) : (
                    <LuBuilding2
                      className={cn(
                        "w-5 h-5 shrink-0",
                        isSelected ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                  )}
                  <div>
                    <p
                      className={cn(
                        "text-[11px] font-black uppercase tracking-wide",
                        isSelected ? "text-primary" : "text-foreground",
                      )}
                    >
                      {s === "committee" ? "Committee" : "Global"}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground mt-0.5">
                      {s === "committee"
                        ? "Targets members of one committee"
                        : "Targets all approved platform members"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Task Type ─────────────────────────────────────────────────────── */}
        <Section title="Task Type" desc="Choose what kind of task this is">
          <TaskTypeSelector
            value={form.taskType}
            onChange={(t) => set("taskType", t)}
            disabled={submitting}
          />
        </Section>

        {/* ── Basic Info ────────────────────────────────────────────────────── */}
        <Section title="Basic Information">
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
                placeholder="Describe the task clearly..."
                disabled={submitting}
                className={cn(
                  "text-sm resize-none",
                  errors.description && "border-red-500/50",
                )}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Committee attribution */}
              <Field label="Committee (attribution)" required>
                <select
                  value={form.committeeSlug}
                  onChange={(e) => set("committeeSlug", e.target.value)}
                  disabled={submitting}
                  className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2 outline-none focus:border-primary transition-all"
                >
                  <option value="">Select committee…</option>
                  {committees.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-muted-foreground mt-1">
                  For global tasks, this records which committee drafted it
                </p>
              </Field>

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
            </div>

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
              error={errors.deliverables}
            >
              <DeliverableBuilder
                value={form.deliverables}
                onChange={(d) => set("deliverables", d)}
                disabled={submitting}
              />
            </Section>

            <Section title="Evaluation" error={errors.evaluationCriteria}>
              <div className="space-y-4">
                <Field
                  label="Evaluation Criteria"
                  required
                  error={errors.evaluationCriteria}
                >
                  <Textarea
                    rows={5}
                    value={form.evaluationCriteria}
                    onChange={(e) =>
                      set("evaluationCriteria", e.target.value)
                    }
                    placeholder="Describe the rubric. Fed directly to the AI evaluator..."
                    disabled={submitting}
                    className={cn(
                      "text-sm resize-none",
                      errors.evaluationCriteria && "border-red-500/50",
                    )}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Max Score">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        value={form.maxScore}
                        onChange={(e) =>
                          set(
                            "maxScore",
                            Math.max(1, parseInt(e.target.value) || 100),
                          )
                        }
                        disabled={submitting}
                        className="w-28 text-sm"
                      />
                      <span className="text-[11px] text-muted-foreground">
                        points
                      </span>
                    </div>
                  </Field>
                </div>

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
                  <div>
                    <p className="text-[11px] font-black text-foreground">
                      Auto-evaluate with Gemini AI
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      Submissions scored automatically on receipt
                    </p>
                  </div>
                </div>
              </div>
            </Section>
          </>
        )}

        {form.taskType === "poll" && (
          <Section title="Poll Configuration" error={errors.pollConfig}>
            <PollBuilder
              value={form.pollConfig}
              onChange={(c) => set("pollConfig", c)}
              disabled={submitting}
            />
          </Section>
        )}

        {form.taskType === "survey" && (
          <Section title="Survey Configuration" error={errors.surveyConfig}>
            <SurveyBuilder
              value={form.surveyConfig}
              onChange={(c) => set("surveyConfig", c)}
              disabled={submitting}
            />
          </Section>
        )}

        <Section title="Points & Rewards" error={errors.weights}>
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

        {/* ── Submit row ────────────────────────────────────────────────────── */}
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
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="text-[11px] font-black uppercase tracking-widest"
          >
            {submitting ? (
              <LuLoader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <LuSave className="w-3.5 h-3.5 mr-2" />
                Save as Draft
              </>
            )}
          </Button>

          <Button
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="text-[11px] font-black uppercase tracking-widest px-8"
          >
            {submitting ? (
              <>
                <LuLoader className="w-3.5 h-3.5 mr-2 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <LuSend className="w-3.5 h-3.5 mr-2" />
                Publish Now
              </>
            )}
          </Button>
        </div>
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