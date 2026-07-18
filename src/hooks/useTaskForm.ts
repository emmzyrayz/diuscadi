// src/hooks/useTaskForm.ts
// Shared form state and validation for task create/edit pages.
// Used by both the committee page (/committees/[slug]/tasks/create)
// and the admin page (/admin/tasks/create).
// The caller decides what to do with the validated payload (different
// API calls, different redirects, different error handling).

import { useState, useCallback } from "react";
import type {
  TaskType,
  TaskPriority,
  TaskScope,
  TaskDeliverable,
  TaskButton,
  PollConfig,
  SurveyConfig,
  AssignmentTarget,
} from "@/types/tasks";
import type { PointsConfig } from "@/components/sections/tasks/admin/PointConfigPanel";

export interface TaskFormState {
  title: string;
  description: string;
  committeeSlug: string;
  scope: TaskScope;
  taskType: TaskType;
  priority: TaskPriority;
  deadline: string;
  evaluationCriteria: string;
  maxScore: number;
  autoEvaluate: boolean;
  tags: string;
  deliverables: TaskDeliverable[];
  taskBtn: TaskButton[];
  hasActionButtons: boolean;
  pollConfig: PollConfig;
  surveyConfig: SurveyConfig;
  points: PointsConfig;
  assignmentTarget: AssignmentTarget;
  publishImmediately: boolean;
}

export interface TaskFormErrors {
  title?: string;
  description?: string;
  deadline?: string;
  evaluationCriteria?: string;
  pollConfig?: string;
  surveyConfig?: string;
  weights?: string;
  deliverables?: string;
  general?: string;
}

const DEFAULT_POLL_CONFIG: PollConfig = {
  question: "",
  options: [
    { id: "opt1", label: "" },
    { id: "opt2", label: "" },
  ],
  allowMultiple: false,
  showResultsBeforeDeadline: false,
  requiresQuorum: false,
};

const DEFAULT_SURVEY_CONFIG: SurveyConfig = {
  questions: [],
  anonymous: false,
};

const DEFAULT_POINTS: PointsConfig = {
  pointsReward: 0,
  qualityWeight: 80,
  timeWeight: 20,
  decayBaseHours: 4,
  passThresholdPercent: 50,
  acceptResponsesAfterDeadline: false,
  latenessStretchFactor: 0.5,
};

export function useTaskForm(defaults?: Partial<TaskFormState>) {
  const [form, setForm] = useState<TaskFormState>({
    title: "",
    description: "",
    committeeSlug: defaults?.committeeSlug ?? "",
    scope: defaults?.scope ?? "committee",
    taskType: "submission",
    priority: "medium",
    deadline: "",
    evaluationCriteria: "",
    maxScore: 100,
    autoEvaluate: false,
    tags: "",
    deliverables: [],
    taskBtn: [],
    hasActionButtons: false,
    pollConfig: DEFAULT_POLL_CONFIG,
    surveyConfig: DEFAULT_SURVEY_CONFIG,
    points: DEFAULT_POINTS,
    assignmentTarget: { mode: "broadcast" },
    publishImmediately: false,
    ...defaults,
  });

  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = useCallback(
    <K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        // Clear field-specific error when user edits that field
        if (key === "title") delete next.title;
        if (key === "description") delete next.description;
        if (key === "deadline") delete next.deadline;
        if (key === "evaluationCriteria") delete next.evaluationCriteria;
        if (key === "pollConfig") delete next.pollConfig;
        if (key === "surveyConfig") delete next.surveyConfig;
        if (key === "deliverables") delete next.deliverables;
        return next;
      });
    },
    [],
  );

  const validate = useCallback((): boolean => {
    const errs: TaskFormErrors = {};

    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.deadline) {
      errs.deadline = "Deadline is required";
    } else if (new Date(form.deadline) <= new Date()) {
      errs.deadline = "Deadline must be in the future";
    }

    if (form.taskType === "submission") {
      if (!form.evaluationCriteria.trim()) {
        errs.evaluationCriteria =
          "Evaluation criteria is required for submission tasks";
      }
      if (form.deliverables.length === 0) {
        errs.deliverables =
          "At least one deliverable is required for submission tasks";
      }
      const hasEmptyLabel = form.deliverables.some((d) => !d.label.trim());
      if (hasEmptyLabel) {
        errs.deliverables = "All deliverables must have a label";
      }
      if (form.points.pointsReward > 0) {
        if (form.points.qualityWeight + form.points.timeWeight !== 100) {
          errs.weights = "Quality weight + Time weight must equal 100%";
        }
      }
    }

    if (form.taskType === "poll") {
      if (!form.pollConfig.question.trim()) {
        errs.pollConfig = "Poll question is required";
      }
      const emptyOptions = form.pollConfig.options.filter(
        (o) => !o.label.trim(),
      );
      if (emptyOptions.length > 0) {
        errs.pollConfig = "All poll options must have a label";
      }
      if (form.pollConfig.options.length < 2) {
        errs.pollConfig = "Poll must have at least 2 options";
      }
    }

    if (form.taskType === "survey") {
      if (form.surveyConfig.questions.length === 0) {
        errs.surveyConfig = "Survey must have at least one question";
      }
      const emptyLabels = form.surveyConfig.questions.filter(
        (q) => !q.label.trim(),
      );
      if (emptyLabels.length > 0) {
        errs.surveyConfig = "All survey questions must have a label";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  // Build the API payload from current form state
  const buildPayload = useCallback(() => {
    const isSubmission = form.taskType === "submission";
    const isInstant = ["poll", "survey", "acknowledgement"].includes(
      form.taskType,
    );

    return {
      title: form.title.trim(),
      description: form.description.trim(),
      committeeSlug: form.committeeSlug,
      scope: form.scope,
      taskType: form.taskType,
      priority: form.priority,
      deadline: new Date(form.deadline).toISOString(),
      assignmentTarget: form.assignmentTarget,
      tags: form.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      publishImmediately: form.publishImmediately,

      // Submission-specific
      ...(isSubmission && {
        deliverables: form.deliverables,
        evaluationCriteria: form.evaluationCriteria.trim(),
        maxScore: form.maxScore,
        autoEvaluate: form.autoEvaluate,
      }),

      // Task button
      ...(form.hasActionButtons &&
        form.taskBtn.length > 0 && {
          taskBtn: form.taskBtn,
        }),

      // Poll-specific
      ...(form.taskType === "poll" && {
        pollConfig: form.pollConfig,
      }),

      // Survey-specific
      ...(form.taskType === "survey" && {
        surveyConfig: form.surveyConfig,
      }),

      // Points config — always included
      pointsReward: form.points.pointsReward,

      // Submission decay config
      ...(isSubmission &&
        form.points.pointsReward > 0 && {
          qualityWeight: form.points.qualityWeight,
          timeWeight: form.points.timeWeight,
          decayBaseHours: form.points.decayBaseHours,
          passThresholdPercent: form.points.passThresholdPercent,
        }),

      // Instant-complete lateness config
      ...(isInstant && {
        acceptResponsesAfterDeadline: form.points.acceptResponsesAfterDeadline,
        latenessStretchFactor: form.points.latenessStretchFactor,
        decayBaseHours: form.points.decayBaseHours,
      }),
    };
  }, [form]);

  return {
    form,
    set,
    errors,
    setErrors,
    submitting,
    setSubmitting,
    validate,
    buildPayload,
  };
}
