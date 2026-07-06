"use client";
// src/components/sections/tasks/admin/PollBuilder.tsx
// Manages the poll configuration: question, options, multi-select,
// quorum settings, and results visibility.

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LuPlus, LuTrash2, LuGripVertical } from "react-icons/lu";
import type { PollConfig } from "@/types/tasks";

function generateOptionId() {
  return Math.random().toString(36).slice(2, 8);
}

interface PollBuilderProps {
  value: PollConfig;
  onChange: (config: PollConfig) => void;
  disabled?: boolean;
}

export function PollBuilder({ value, onChange, disabled }: PollBuilderProps) {
  const set = (patch: Partial<PollConfig>) => onChange({ ...value, ...patch });

  const addOption = () => {
    onChange({
      ...value,
      options: [...value.options, { id: generateOptionId(), label: "" }],
    });
  };

  const removeOption = (id: string) => {
    onChange({
      ...value,
      options: value.options.filter((o) => o.id !== id),
    });
  };

  const updateOption = (id: string, label: string) => {
    onChange({
      ...value,
      options: value.options.map((o) => (o.id === id ? { ...o, label } : o)),
    });
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-widest">
          Poll Question <span className="text-red-500">*</span>
        </Label>
        <Textarea
          rows={2}
          value={value.question}
          onChange={(e) => set({ question: e.target.value })}
          placeholder="What would you like members to vote on?"
          disabled={disabled}
          className="text-sm resize-none"
        />
      </div>

      {/* Options */}
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest">
          Options <span className="text-red-500">*</span>
          <span className="ml-1 text-muted-foreground font-normal normal-case tracking-normal">
            (min. 2)
          </span>
        </Label>

        {value.options.map((opt, idx) => (
          <div key={opt.id} className="flex items-center gap-2">
            <LuGripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0" />
            <div className="w-6 h-6 rounded-full border-2 border-border flex items-center justify-center shrink-0">
              <span className="text-[9px] font-black text-muted-foreground">
                {idx + 1}
              </span>
            </div>
            <Input
              value={opt.label}
              onChange={(e) => updateOption(opt.id, e.target.value)}
              placeholder={`Option ${idx + 1}`}
              disabled={disabled}
              className="flex-1 text-sm"
            />
            <button
              type="button"
              onClick={() => removeOption(opt.id)}
              disabled={disabled || value.options.length <= 2}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-30"
            >
              <LuTrash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addOption}
          disabled={disabled}
          className="w-full h-8 text-[10px] font-black uppercase tracking-widest border-dashed"
        >
          <LuPlus className="w-3 h-3 mr-1.5" />
          Add Option
        </Button>
      </div>

      {/* Settings */}
      <div className="space-y-4 pt-4 border-t border-border">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          Poll Settings
        </p>

        <ToggleRow
          label="Allow multiple selections"
          desc="Members can select more than one option"
          value={value.allowMultiple}
          onChange={(v) => set({ allowMultiple: v })}
          disabled={disabled}
        />

        <ToggleRow
          label="Show results before deadline"
          desc="Members can see vote tallies while the poll is open"
          value={value.showResultsBeforeDeadline}
          onChange={(v) => set({ showResultsBeforeDeadline: v })}
          disabled={disabled}
        />

        <ToggleRow
          label="Require quorum"
          desc="Results are only valid if a minimum percentage of members vote"
          value={value.requiresQuorum}
          onChange={(v) => set({ requiresQuorum: v })}
          disabled={disabled}
        />

        {value.requiresQuorum && (
          <div className="space-y-1.5 pl-4 border-l-2 border-primary/20">
            <Label className="text-[10px] font-black uppercase tracking-widest">
              Quorum Percentage (%)
            </Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={value.quorumPercent ?? 50}
              onChange={(e) =>
                set({ quorumPercent: parseInt(e.target.value) || 50 })
              }
              disabled={disabled}
              className="w-28 text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  value,
  onChange,
  disabled,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] font-black text-foreground">{label}</p>
        <p className="text-[9px] font-bold text-muted-foreground mt-0.5">
          {desc}
        </p>
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={cn(
          "relative w-10 h-5 rounded-full transition-all shrink-0",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          value ? "bg-primary" : "bg-muted border border-border",
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 w-4 h-4 bg-background rounded-full shadow-sm transition-all",
            value ? "left-5" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}
