"use client";
// src/components/sections/tasks/admin/TaskTypeSelector.tsx
// Card-based picker for task type selection at task creation time.
// Shows each type with a description and capability summary.
// Learning type is shown but disabled with a "Coming Soon" badge.

import React from "react";
import { cn } from "@/lib/utils";
import {
  LuSend,
  LuVote,
  LuClipboardList,
  LuShieldCheck,
  LuBookOpen,
  LuCheck,
} from "react-icons/lu";
import type { TaskType } from "@/types/tasks";

interface TaskTypeMeta {
  type: TaskType;
  label: string;
  description: string;
  capabilities: string[];
  icon: React.ElementType;
  color: string;
  bgColor: string;
  available: boolean;
}

const TASK_TYPES: TaskTypeMeta[] = [
  {
    type: "submission",
    label: "Submission",
    description:
      "Members submit deliverables (text, URLs, files). Evaluated by Gemini AI or manually by committee head. Time-decay scoring rewards early submissions.",
    capabilities: [
      "Custom deliverable fields",
      "AI or manual evaluation",
      "Quality + time-decay scoring",
      "Revision requests",
    ],
    icon: LuSend,
    color: "text-primary",
    bgColor: "bg-primary/10 border-primary/20",
    available: true,
  },
  {
    type: "poll",
    label: "Poll",
    description:
      "Members vote on options. Supports single or multi-select. Results can be shown before or after deadline. Good for committee decisions.",
    capabilities: [
      "Single or multi-select",
      "Optional quorum requirement",
      "Late vote acceptance toggle",
      "Instant completion",
    ],
    icon: LuVote,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10 border-violet-500/20",
    available: true,
  },
  {
    type: "survey",
    label: "Survey",
    description:
      "Structured questionnaire with multiple question types. Responses are collected and visible to admins. Supports anonymous submissions.",
    capabilities: [
      "5 question types",
      "Required / optional fields",
      "Anonymous mode",
      "Instant completion",
    ],
    icon: LuClipboardList,
    color: "text-sky-500",
    bgColor: "bg-sky-500/10 border-sky-500/20",
    available: true,
  },
  {
    type: "acknowledgement",
    label: "Acknowledgement",
    description:
      "Members read content and confirm they have understood it. One-click completion. Useful for policy updates, guidelines, and announcements.",
    capabilities: [
      "One-click confirm",
      "No deliverables needed",
      "Late acceptance toggle",
      "Instant completion",
    ],
    icon: LuShieldCheck,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    available: true,
  },
  {
    type: "learning",
    label: "Learning",
    description:
      "Completion tracked via external platform webhook (PandaAcademy / UniArchive). Not yet available — integration pending.",
    capabilities: [
      "External platform tracking",
      "Webhook-based completion",
      "Coming soon",
    ],
    icon: LuBookOpen,
    color: "text-muted-foreground",
    bgColor: "bg-muted border-border",
    available: false,
  },
];

interface TaskTypeSelectorProps {
  value: TaskType;
  onChange: (type: TaskType) => void;
  disabled?: boolean;
}

export function TaskTypeSelector({
  value,
  onChange,
  disabled,
}: TaskTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {TASK_TYPES.map((meta) => {
        const Icon = meta.icon;
        const isSelected = value === meta.type;
        const isDisabled = disabled || !meta.available;

        return (
          <button
            key={meta.type}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(meta.type)}
            className={cn(
              "relative flex flex-col gap-3 p-5 rounded-2xl border-2 text-left transition-all",
              isSelected
                ? `${meta.bgColor} border-current`
                : "border-border hover:border-slate-300 bg-background",
              isDisabled && "opacity-50 cursor-not-allowed",
              !isDisabled && !isSelected && "cursor-pointer",
            )}
          >
            {/* Not available badge */}
            {!meta.available && (
              <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                Soon
              </span>
            )}

            {/* Selected indicator */}
            {isSelected && (
              <span
                className={cn(
                  "absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center",
                  meta.color,
                  "bg-current/10",
                )}
              >
                <LuCheck className="w-3 h-3" />
              </span>
            )}

            {/* Icon + label */}
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center",
                  isSelected ? "bg-current/10" : "bg-muted",
                )}
              >
                <Icon
                  className={cn(
                    "w-4.5 h-4.5",
                    isSelected ? meta.color : "text-muted-foreground",
                  )}
                />
              </div>
              <p
                className={cn(
                  "text-[11px] font-black uppercase tracking-wide",
                  isSelected ? meta.color : "text-foreground",
                )}
              >
                {meta.label}
              </p>
            </div>

            {/* Description */}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {meta.description}
            </p>

            {/* Capability list */}
            <ul className="space-y-1">
              {meta.capabilities.map((cap) => (
                <li
                  key={cap}
                  className={cn(
                    "flex items-center gap-1.5 text-[10px] font-bold",
                    isSelected ? meta.color : "text-muted-foreground/60",
                  )}
                >
                  <LuCheck className="w-2.5 h-2.5 shrink-0" />
                  {cap}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}
