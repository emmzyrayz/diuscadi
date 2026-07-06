"use client";
// src/components/sections/tasks/admin/PointsConfigPanel.tsx
// All points-related configuration for a task in one panel.
// Adapts shown fields based on taskType:
//   submission     → pointsReward + qualityWeight + timeWeight +
//                    decayBaseHours + passThresholdPercent
//   poll / survey / acknowledgement → pointsReward +
//                    acceptResponsesAfterDeadline + latenessStretchFactor +
//                    decayBaseHours (for the lateness curve)
//   learning       → pointsReward only (webhook handles the rest)

import React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LuInfo } from "react-icons/lu";
import type { TaskType } from "@/types/tasks";

export interface PointsConfig {
  pointsReward: number;
  // Submission only
  qualityWeight: number;
  timeWeight: number;
  decayBaseHours: number;
  passThresholdPercent: number;
  // Instant-complete only
  acceptResponsesAfterDeadline: boolean;
  latenessStretchFactor: number;
}

interface PointsConfigPanelProps {
  taskType: TaskType;
  value: PointsConfig;
  onChange: (config: PointsConfig) => void;
  disabled?: boolean;
  weightError?: string | null;
}

export function PointsConfigPanel({
  taskType,
  value,
  onChange,
  disabled,
  weightError,
}: PointsConfigPanelProps) {
  const set = (patch: Partial<PointsConfig>) =>
    onChange({ ...value, ...patch });

  const isSubmission = taskType === "submission";
  const isInstant = ["poll", "survey", "acknowledgement"].includes(taskType);

  return (
    <div className="space-y-6">
      {/* Points reward — all task types */}
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-widest">
          Points Reward
        </Label>
        <p className="text-[10px] text-muted-foreground">
          Points credited to the member on successful completion. Set to 0 for
          no-reward tasks (e.g. mandatory compliance acknowledgements).
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={value.pointsReward}
            onChange={(e) =>
              set({ pointsReward: Math.max(0, parseInt(e.target.value) || 0) })
            }
            disabled={disabled}
            className="w-28 text-sm font-black"
          />
          <span className="text-[11px] font-bold text-muted-foreground">
            pts
          </span>
        </div>
      </div>

      {/* Submission: quality/time weight split */}
      {isSubmission && value.pointsReward > 0 && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div>
            <p className="text-[10px] font-black text-foreground uppercase tracking-widest">
              Score Composition
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Quality weight drives how much of the reward depends on the
              evaluation score. Time weight is the portion that decays based on
              how quickly the member submits after publish.
              <strong className="text-foreground">
                {" "}
                Both must sum to 100%.
              </strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                Quality Weight (%)
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={value.qualityWeight}
                onChange={(e) => {
                  const q = Math.min(
                    100,
                    Math.max(0, parseInt(e.target.value) || 0),
                  );
                  set({ qualityWeight: q, timeWeight: 100 - q });
                }}
                disabled={disabled}
                className={cn(
                  "text-sm font-black",
                  weightError && "border-red-500/50",
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                Time Weight (%)
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={value.timeWeight}
                onChange={(e) => {
                  const t = Math.min(
                    100,
                    Math.max(0, parseInt(e.target.value) || 0),
                  );
                  set({ timeWeight: t, qualityWeight: 100 - t });
                }}
                disabled={disabled}
                className={cn(
                  "text-sm font-black",
                  weightError && "border-red-500/50",
                )}
              />
            </div>
          </div>

          {/* Live sum indicator */}
          <div
            className={cn(
              "flex items-center gap-2 text-[10px] font-bold",
              value.qualityWeight + value.timeWeight === 100
                ? "text-emerald-500"
                : "text-red-500",
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                value.qualityWeight + value.timeWeight === 100
                  ? "bg-emerald-500"
                  : "bg-red-500",
              )}
            />
            {value.qualityWeight + value.timeWeight === 100
              ? "Weights sum to 100% ✓"
              : `Weights sum to ${value.qualityWeight + value.timeWeight}% — must equal 100%`}
          </div>

          {weightError && (
            <p className="text-[11px] text-red-500">{weightError}</p>
          )}

          {/* Pass threshold */}
          <div className="space-y-1.5 pt-2">
            <Label className="text-[10px] font-black uppercase tracking-widest">
              Pass Threshold (%)
            </Label>
            <p className="text-[10px] text-muted-foreground">
              Minimum evaluation score required to earn ANY points. Submissions
              below this threshold earn zero regardless of timing.
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={value.passThresholdPercent}
                onChange={(e) =>
                  set({
                    passThresholdPercent: Math.min(
                      100,
                      Math.max(0, parseInt(e.target.value) || 0),
                    ),
                  })
                }
                disabled={disabled}
                className="w-24 text-sm font-black"
              />
              <span className="text-[11px] font-bold text-muted-foreground">
                %
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Shared: decay base hours (submission + instant) */}
      {value.pointsReward > 0 && (isSubmission || isInstant) && (
        <div className="space-y-1.5 pt-4 border-t border-border">
          <Label className="text-[10px] font-black uppercase tracking-widest">
            Decay Base Hours
          </Label>
          <p className="text-[10px] text-muted-foreground">
            {isSubmission
              ? "Duration of the first bracket (full-multiplier window) after task publish. All subsequent brackets grow by 1.5× this value."
              : "Duration of the first bracket (full-reward window) after the deadline. Late responses decay faster with a smaller value."}
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0.5}
              step={0.5}
              value={value.decayBaseHours}
              onChange={(e) =>
                set({
                  decayBaseHours: Math.max(
                    0.5,
                    parseFloat(e.target.value) || 4,
                  ),
                })
              }
              disabled={disabled}
              className="w-24 text-sm font-black"
            />
            <span className="text-[11px] font-bold text-muted-foreground">
              hours
            </span>
          </div>
        </div>
      )}

      {/* Instant-complete: late response settings */}
      {isInstant && (
        <div className="space-y-5 pt-4 border-t border-border">
          <p className="text-[10px] font-black text-foreground uppercase tracking-widest">
            Late Response Settings
          </p>

          {/* Accept after deadline toggle */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black text-foreground">
                Accept responses after deadline
              </p>
              <p className="text-[9px] font-bold text-muted-foreground mt-0.5">
                If off, any response after the deadline is rejected outright. If
                on, late responses are accepted but earn reduced points.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                !disabled &&
                set({
                  acceptResponsesAfterDeadline:
                    !value.acceptResponsesAfterDeadline,
                })
              }
              disabled={disabled}
              className={cn(
                "relative w-10 h-5 rounded-full transition-all shrink-0 cursor-pointer",
                value.acceptResponsesAfterDeadline
                  ? "bg-primary"
                  : "bg-muted border border-border",
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-4 h-4 bg-background rounded-full shadow-sm transition-all",
                  value.acceptResponsesAfterDeadline ? "left-5" : "left-0.5",
                )}
              />
            </button>
          </div>

          {/* Stretch factor — only shown when late responses are accepted */}
          {value.acceptResponsesAfterDeadline && value.pointsReward > 0 && (
            <div className="space-y-1.5 pl-4 border-l-2 border-primary/20">
              <div className="flex items-center gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">
                  Lateness Stretch Factor
                </Label>
                <LuInfo
                  className="w-3.5 h-3.5 text-muted-foreground/50"
                  title="0.5 = a 24h-late response is treated as 12h-late for scoring. Lower values are more forgiving."
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                0–1. Dampens how harshly late responses decay. 0.5 = a 24h-late
                response is scored as if it were 12h late. Lower = more
                forgiving. 1 = no dampening (full decay speed).
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={value.latenessStretchFactor}
                  onChange={(e) =>
                    set({
                      latenessStretchFactor: parseFloat(e.target.value),
                    })
                  }
                  disabled={disabled}
                  className="flex-1 accent-primary"
                />
                <span className="text-[11px] font-mono font-black text-foreground w-10 text-right">
                  {value.latenessStretchFactor.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
