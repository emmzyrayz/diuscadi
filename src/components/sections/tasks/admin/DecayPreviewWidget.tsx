"use client";
// src/components/sections/tasks/admin/DecayPreviewWidget.tsx
// Live preview of the time-decay bracket curve for submission tasks.
// Reuses buildBrackets() from timeDecayService so the preview is always
// mathematically identical to what the scoring engine will compute.

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { buildBrackets } from "@/lib/services/timeDecayService";

interface DecayPreviewWidgetProps {
  decayBaseHours: number;
  qualityWeight: number;
  timeWeight: number;
  pointsReward: number;
  className?: string;
}

export function DecayPreviewWidget({
  decayBaseHours,
  qualityWeight,
  timeWeight,
  pointsReward,
  className,
}: DecayPreviewWidgetProps) {
  const brackets = useMemo(
    () => buildBrackets(decayBaseHours),
    [decayBaseHours],
  );

  const maxTimePoints = (timeWeight / 100) * pointsReward;
  const maxQualityPoints = (qualityWeight / 100) * pointsReward;

  return (
    <div
      className={cn(
        "bg-muted/30 border border-border rounded-2xl p-5 space-y-4",
        className,
      )}
    >
      <div>
        <p className="text-[10px] font-black text-foreground uppercase tracking-widest">
          Time-Decay Preview
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Points earned drops as time passes after task is published. Quality
          score ({qualityWeight}%) is always earned independently of when you
          submit.
        </p>
      </div>

      {/* Bracket table */}
      <div className="space-y-2">
        {brackets.map((bracket, idx) => {
          const timePts = Math.round(maxTimePoints * bracket.multiplier);
          const totalIfPerfect = Math.round(maxQualityPoints + timePts);
          const barWidth = `${bracket.multiplier * 100}%`;

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0 w-28">
                    {idx === 0
                      ? `0 – ${bracket.endHour.toFixed(1)}h`
                      : `${bracket.startHour.toFixed(1)} – ${bracket.endHour.toFixed(1)}h`}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-black",
                      bracket.multiplier === 1.0
                        ? "text-emerald-500"
                        : bracket.multiplier >= 0.6
                          ? "text-yellow-500"
                          : bracket.multiplier >= 0.2
                            ? "text-orange-500"
                            : "text-red-500",
                    )}
                  >
                    {Math.round(bracket.multiplier * 100)}%
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                  +{timePts} time pts → {totalIfPerfect} total (if 100% quality)
                </span>
              </div>

              {/* Bar */}
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    bracket.multiplier === 1.0
                      ? "bg-emerald-500"
                      : bracket.multiplier >= 0.6
                        ? "bg-yellow-500"
                        : bracket.multiplier >= 0.2
                          ? "bg-orange-500"
                          : "bg-red-500",
                  )}
                  style={{ width: barWidth }}
                />
              </div>
            </div>
          );
        })}

        {/* Floor — beyond all brackets */}
        <div className="space-y-1 opacity-50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-muted-foreground/60 w-28">
                After {brackets[brackets.length - 1].endHour.toFixed(1)}h
              </span>
              <span className="text-[10px] font-black text-red-500">0%</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              +0 time pts → {Math.round(maxQualityPoints)} total (quality only)
            </span>
          </div>
          <div className="h-1.5 bg-border rounded-full" />
        </div>
      </div>

      {/* Summary note */}
      <p className="text-[9px] text-muted-foreground/60 leading-relaxed border-t border-border pt-3">
        Quality component ({qualityWeight}% = up to{" "}
        {Math.round(maxQualityPoints)}pts) is always earned based on evaluation
        score. Time component ({timeWeight}% = up to {Math.round(maxTimePoints)}
        pts) decays as shown above. Both require passing the quality threshold
        to earn anything.
      </p>
    </div>
  );
}
