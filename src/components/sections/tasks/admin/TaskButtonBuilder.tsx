"use client";
// src/components/sections/tasks/admin/TaskButtonBuilder.tsx
// Manages the list of task-level action buttons (e.g. "Follow on Facebook").
// Each button has: btnLabel, btnUrl, hoverLabel.

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import type { TaskButton } from "@/types/tasks";

interface TaskButtonBuilderProps {
  value: TaskButton[];
  onChange: (buttons: TaskButton[]) => void;
  disabled?: boolean;
}

function emptyButton(): TaskButton {
  return { btnLabel: "", btnUrl: "", hoverLabel: "" };
}

export function TaskButtonBuilder({
  value,
  onChange,
  disabled,
}: TaskButtonBuilderProps) {
  const add = () => onChange([...value, emptyButton()]);
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const update = (idx: number, patch: Partial<TaskButton>) =>
    onChange(value.map((b, i) => (i === idx ? { ...b, ...patch } : b)));

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <div className="flex items-center justify-center py-6 border-2 border-dashed border-border rounded-2xl text-muted-foreground/50 text-xs font-bold uppercase tracking-widest">
          No action buttons yet
        </div>
      )}

      {value.map((btn, idx) => (
        <div
          key={idx}
          className="border-2 border-border rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Button {idx + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(idx)}
              disabled={disabled}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
            >
              <LuTrash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                Button Label <span className="text-red-500">*</span>
              </Label>
              <Input
                value={btn.btnLabel}
                onChange={(e) => update(idx, { btnLabel: e.target.value })}
                placeholder="e.g. Follow on Facebook"
                disabled={disabled}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                Hover Text
              </Label>
              <Input
                value={btn.hoverLabel}
                onChange={(e) => update(idx, { hoverLabel: e.target.value })}
                placeholder="e.g. Opens in a new tab"
                disabled={disabled}
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest">
              Destination URL <span className="text-red-500">*</span>
            </Label>
            <Input
              value={btn.btnUrl}
              onChange={(e) => update(idx, { btnUrl: e.target.value })}
              placeholder="https://facebook.com/yourpage"
              disabled={disabled}
              className="text-sm font-mono"
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={add}
        disabled={disabled}
        className="w-full h-9 text-[11px] font-black uppercase tracking-widest border-dashed"
      >
        <LuPlus className="w-3.5 h-3.5 mr-2" />
        Add Action Button
      </Button>
    </div>
  );
}
