"use client";
// src/components/sections/tasks/admin/SurveyBuilder.tsx
// Manages survey configuration: questions list with type, label,
// options (for choice types), required flag, and anonymous toggle.

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LuPlus,
  LuTrash2,
  LuGripVertical,
  LuChevronDown,
  LuChevronUp,
} from "react-icons/lu";
import type { SurveyConfig, SurveyQuestion } from "@/types/tasks";

const QUESTION_TYPES: { value: SurveyQuestion["type"]; label: string }[] = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text / Paragraph" },
  { value: "single_choice", label: "Single Choice" },
  { value: "multi_choice", label: "Multiple Choice" },
  { value: "rating", label: "Rating (1–5 stars)" },
];

function generateId() {
  return Math.random().toString(36).slice(2, 8);
}

function emptyQuestion(): SurveyQuestion {
  return {
    id: generateId(),
    label: "",
    type: "short_text",
    required: true,
    options: [],
  };
}

interface SurveyBuilderProps {
  value: SurveyConfig;
  onChange: (config: SurveyConfig) => void;
  disabled?: boolean;
}

export function SurveyBuilder({
  value,
  onChange,
  disabled,
}: SurveyBuilderProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const setConfig = (patch: Partial<SurveyConfig>) =>
    onChange({ ...value, ...patch });

  const addQuestion = () => {
    const q = emptyQuestion();
    setConfig({ questions: [...value.questions, q] });
    setExpanded(q.id);
  };

  const removeQuestion = (id: string) => {
    setConfig({ questions: value.questions.filter((q) => q.id !== id) });
    if (expanded === id) setExpanded(null);
  };

  const updateQuestion = (id: string, patch: Partial<SurveyQuestion>) => {
    setConfig({
      questions: value.questions.map((q) =>
        q.id === id ? { ...q, ...patch } : q,
      ),
    });
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...value.questions];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setConfig({ questions: next });
  };

  const moveDown = (idx: number) => {
    if (idx === value.questions.length - 1) return;
    const next = [...value.questions];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setConfig({ questions: next });
  };

  const addOption = (qId: string) => {
    updateQuestion(qId, {
      options: [
        ...(value.questions.find((q) => q.id === qId)?.options ?? []),
        "",
      ],
    });
  };

  const updateOption = (qId: string, optIdx: number, val: string) => {
    const q = value.questions.find((q) => q.id === qId);
    if (!q) return;
    const opts = [...(q.options ?? [])];
    opts[optIdx] = val;
    updateQuestion(qId, { options: opts });
  };

  const removeOption = (qId: string, optIdx: number) => {
    const q = value.questions.find((q) => q.id === qId);
    if (!q) return;
    updateQuestion(qId, {
      options: (q.options ?? []).filter((_, i) => i !== optIdx),
    });
  };

  return (
    <div className="space-y-4">
      {/* Anonymous toggle */}
      <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-2xl border border-border">
        <div>
          <p className="text-[11px] font-black text-foreground">
            Anonymous Survey
          </p>
          <p className="text-[9px] font-bold text-muted-foreground mt-0.5">
            Responses are collected without linking to member identity
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            !disabled && setConfig({ anonymous: !value.anonymous })
          }
          disabled={disabled}
          className={cn(
            "relative w-10 h-5 rounded-full transition-all shrink-0 cursor-pointer",
            value.anonymous ? "bg-primary" : "bg-muted border border-border",
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 w-4 h-4 bg-background rounded-full shadow-sm transition-all",
              value.anonymous ? "left-5" : "left-0.5",
            )}
          />
        </button>
      </div>

      {/* Questions */}
      {value.questions.length === 0 && (
        <div className="flex items-center justify-center py-8 border-2 border-dashed border-border rounded-2xl text-muted-foreground/50 text-xs font-bold uppercase tracking-widest">
          No questions yet — add one below
        </div>
      )}

      {value.questions.map((q, idx) => {
        const isOpen = expanded === q.id;
        const needsOptions =
          q.type === "single_choice" || q.type === "multi_choice";

        return (
          <div
            key={q.id}
            className={cn(
              "border-2 rounded-2xl overflow-hidden transition-all",
              isOpen ? "border-sky-500/30" : "border-border",
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
              <LuGripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />

              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : q.id)}
                className="flex-1 flex items-center gap-2 text-left min-w-0"
              >
                <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">
                  Q{idx + 1}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-black uppercase tracking-wide truncate",
                    q.label ? "text-foreground" : "text-muted-foreground/50",
                  )}
                >
                  {q.label || "Untitled question"}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground/50 uppercase shrink-0">
                  {QUESTION_TYPES.find((t) => t.value === q.type)?.label}
                </span>
                {q.required && (
                  <span className="text-[9px] font-black text-red-500 shrink-0">
                    *
                  </span>
                )}
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0 || disabled}
                  className="p-1 rounded hover:bg-muted transition-all disabled:opacity-30"
                >
                  <LuChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === value.questions.length - 1 || disabled}
                  className="p-1 rounded hover:bg-muted transition-all disabled:opacity-30"
                >
                  <LuChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => removeQuestion(q.id)}
                  disabled={disabled}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <LuTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expanded form */}
            {isOpen && (
              <div className="p-5 space-y-4 border-t border-border bg-background">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest">
                      Question Label <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={q.label}
                      onChange={(e) =>
                        updateQuestion(q.id, { label: e.target.value })
                      }
                      placeholder="e.g. How satisfied are you with..."
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest">
                      Question Type
                    </Label>
                    <select
                      value={q.type}
                      onChange={(e) =>
                        updateQuestion(q.id, {
                          type: e.target.value as SurveyQuestion["type"],
                          options:
                            e.target.value === "single_choice" ||
                            e.target.value === "multi_choice"
                              ? (q.options ?? [])
                              : [],
                        })
                      }
                      disabled={disabled}
                      className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2 outline-none focus:border-primary transition-all"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Options for choice types */}
                {needsOptions && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">
                      Options
                    </Label>
                    {(q.options ?? []).map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <Input
                          value={opt}
                          onChange={(e) =>
                            updateOption(q.id, optIdx, e.target.value)
                          }
                          placeholder={`Option ${optIdx + 1}`}
                          disabled={disabled}
                          className="flex-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(q.id, optIdx)}
                          disabled={disabled}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <LuTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addOption(q.id)}
                      disabled={disabled}
                      className="w-full h-8 text-[10px] font-black uppercase tracking-widest border-dashed"
                    >
                      <LuPlus className="w-3 h-3 mr-1.5" /> Add Option
                    </Button>
                  </div>
                )}

                {/* Required toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuestion(q.id, { required: !q.required })
                    }
                    disabled={disabled}
                    className={cn(
                      "relative w-10 h-5 rounded-full transition-all cursor-pointer",
                      q.required
                        ? "bg-primary"
                        : "bg-muted border border-border",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 w-4 h-4 bg-background rounded-full shadow-sm transition-all",
                        q.required ? "left-5" : "left-0.5",
                      )}
                    />
                  </button>
                  <Label className="text-[11px] font-bold cursor-pointer">
                    Required question
                  </Label>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={addQuestion}
        disabled={disabled}
        className="w-full h-9 text-[11px] font-black uppercase tracking-widest border-dashed"
      >
        <LuPlus className="w-3.5 h-3.5 mr-2" />
        Add Question
      </Button>
    </div>
  );
}
