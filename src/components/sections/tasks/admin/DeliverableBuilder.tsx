"use client";
// src/components/sections/tasks/admin/DeliverableBuilder.tsx
// Manages the list of deliverable fields for a submission task.
// Each deliverable has: label, type, required flag, description, placeholder.

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
import type { TaskDeliverable } from "@/types/tasks";

const DELIVERABLE_TYPES: {
  value: TaskDeliverable["type"];
  label: string;
}[] = [
  { value: "text", label: "Text / Paragraph" },
  { value: "url", label: "URL / Link" },
  { value: "file_url", label: "File URL (Cloudinary / Drive)" },
  { value: "image_url", label: "Image URL" },
];

interface DeliverableBuilderProps {
  value: TaskDeliverable[];
  onChange: (deliverables: TaskDeliverable[]) => void;
  disabled?: boolean;
}

function emptyDeliverable(): TaskDeliverable {
  return {
    label: "",
    type: "text",
    required: true,
    description: "",
    placeholder: "",
  };
}

export function DeliverableBuilder({
  value,
  onChange,
  disabled,
}: DeliverableBuilderProps) {
  const [expanded, setExpanded] = useState<number | null>(0);

  const add = () => {
    const next = [...value, emptyDeliverable()];
    onChange(next);
    setExpanded(next.length - 1);
  };

  const remove = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
    if (expanded === idx) setExpanded(null);
  };

  const update = (idx: number, patch: Partial<TaskDeliverable>) => {
    onChange(value.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...value];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
    setExpanded(idx - 1);
  };

  const moveDown = (idx: number) => {
    if (idx === value.length - 1) return;
    const next = [...value];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
    setExpanded(idx + 1);
  };

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <div className="flex items-center justify-center py-8 border-2 border-dashed border-border rounded-2xl text-muted-foreground/50 text-xs font-bold uppercase tracking-widest">
          No deliverables yet — add one below
        </div>
      )}

      {value.map((d, idx) => {
        const isOpen = expanded === idx;
        const hasLabel = d.label.trim().length > 0;

        return (
          <div
            key={idx}
            className={cn(
              "border-2 rounded-2xl overflow-hidden transition-all",
              isOpen ? "border-primary/30" : "border-border",
            )}
          >
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
              <LuGripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />

              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : idx)}
                className="flex-1 flex items-center gap-2 text-left"
              >
                <span
                  className={cn(
                    "text-[11px] font-black uppercase tracking-wide",
                    hasLabel ? "text-foreground" : "text-muted-foreground/50",
                  )}
                >
                  {hasLabel ? d.label : `Deliverable ${idx + 1}`}
                </span>
                <span
                  className={cn(
                    "text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded",
                    d.required
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {d.required ? "Required" : "Optional"}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">
                  {DELIVERABLE_TYPES.find((t) => t.value === d.type)?.label}
                </span>
              </button>

              {/* Move up/down */}
              <div className="flex items-center gap-1">
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
                  disabled={idx === value.length - 1 || disabled}
                  className="p-1 rounded hover:bg-muted transition-all disabled:opacity-30"
                >
                  <LuChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => remove(idx)}
                disabled={disabled}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
              >
                <LuTrash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Expanded form */}
            {isOpen && (
              <div className="p-5 space-y-4 border-t border-border bg-background">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest">
                      Label <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={d.label}
                      onChange={(e) => update(idx, { label: e.target.value })}
                      placeholder="e.g. Design File URL"
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest">
                      Type
                    </Label>
                    <select
                      value={d.type}
                      onChange={(e) =>
                        update(idx, {
                          type: e.target.value as TaskDeliverable["type"],
                        })
                      }
                      disabled={disabled}
                      className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2 outline-none focus:border-primary transition-all"
                    >
                      {DELIVERABLE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest">
                    Description (shown to member)
                  </Label>
                  <Input
                    value={d.description ?? ""}
                    onChange={(e) =>
                      update(idx, { description: e.target.value })
                    }
                    placeholder="Brief guidance on what to submit"
                    disabled={disabled}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest">
                    Placeholder text
                  </Label>
                  <Input
                    value={d.placeholder ?? ""}
                    onChange={(e) =>
                      update(idx, { placeholder: e.target.value })
                    }
                    placeholder="e.g. https://figma.com/..."
                    disabled={disabled}
                    className="text-sm"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => update(idx, { required: !d.required })}
                    disabled={disabled}
                    className={cn(
                      "relative w-10 h-5 rounded-full transition-all cursor-pointer",
                      d.required
                        ? "bg-primary"
                        : "bg-muted border border-border",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 w-4 h-4 bg-background rounded-full shadow-sm transition-all",
                        d.required ? "left-5" : "left-0.5",
                      )}
                    />
                  </button>
                  <Label className="text-[11px] font-bold cursor-pointer">
                    Required field
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
        onClick={add}
        disabled={disabled}
        className="w-full h-9 text-[11px] font-black uppercase tracking-widest border-dashed"
      >
        <LuPlus className="w-3.5 h-3.5 mr-2" />
        Add Deliverable
      </Button>
    </div>
  );
}
