"use client";
import React from "react";
import {
  LuUsers,
  LuCircleCheck,
  LuActivity,
  LuInfo,
  LuBrainCircuit,
} from "react-icons/lu";
import type { Analytics } from "@/context/AdminContext";
import { CheckInHeatmapChart } from "@/components/sections/admin/analytics/charts/CheckinHeatmapChart";
import { predictCheckinCurve } from "@/lib/analytics/predictCheckinCurve";
import { cn } from "../../../../lib/utils";

interface Props {
  analytics: Analytics | null;
}

export const AdminAnalyticsAttendanceSection = ({ analytics }: Props) => {
  const a = analytics;

  const totalRegistrations = a?.registrations.total ?? 0;
  const checkedIn = a?.registrations.checkedIn ?? 0;
  const noShowCount = totalRegistrations - checkedIn;
  const noShowRate =
    totalRegistrations > 0
      ? ((noShowCount / totalRegistrations) * 100).toFixed(1)
      : "0.0";
  const attendanceRate = a?.registrations.attendanceRate ?? 0;

  // Build heatmap data from visit distribution + prediction model
  // When real hourly check-in data is available from cron,
  // pass it as the second argument to predictCheckinCurve()
  const hourlyVisits =
    a?.hourlyVisits ??
    Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
      volume: 0,
    }));

  const biasVector = a?.prediction?.biasVector ?? new Array(24).fill(0);
  const heatmapData = predictCheckinCurve(hourlyVisits, undefined, biasVector);
  const hasRealVisitData = hourlyVisits.some((v) => v.volume > 0);
  const hasRealCheckinData = heatmapData.some((d) => d.isReal);

  const accuracyPct = a?.prediction?.accuracyPct;
  const maeScore = a?.prediction?.maeScore;
  const lastValidated = a?.prediction?.lastValidatedDate;
  const logCount = a?.prediction?.logCount ?? 0;

  return (
    <div className={cn("space-y-8", "mb-16")}>
      <div className={cn("flex", "items-center", "gap-3")}>
        <div
          className={cn(
            "p-2.5",
            "bg-blue-50",
            "text-blue-600",
            "rounded-xl",
            "border",
            "border-blue-100",
          )}
        >
          <LuActivity className={cn("w-5", "h-5")} />
        </div>
        <div>
          <h2
            className={cn(
              "text-xl",
              "font-black",
              "text-foreground",
              "uppercase",
              "tracking-tighter",
            )}
          >
            Attendance Insights
          </h2>
          <p
            className={cn(
              "text-[10px]",
              "font-bold",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
            )}
          >
            Check-in rates & entry flow
          </p>
        </div>
      </div>

      {/* Heatmap chart */}
      <div
        className={cn(
          "bg-background",
          "border",
          "border-border",
          "rounded-[2.5rem]",
          "p-10",
          "shadow-sm",
        )}
      >
        <div className={cn("flex", "items-center", "justify-between", "mb-4")}>
          <div>
            <h3
              className={cn(
                "text-sm",
                "font-black",
                "text-foreground",
                "uppercase",
                "tracking-tight",
              )}
            >
              Entry Velocity Heatmap
            </h3>
            <p
              className={cn(
                "text-[10px]",
                "font-bold",
                "text-muted-foreground",
                "uppercase",
                "tracking-widest",
              )}
            >
              Arrival volume by hour (WAT)
            </p>
          </div>
          {/* Status badge */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest",
              hasRealCheckinData
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : hasRealVisitData
                  ? "bg-blue-50 text-blue-600 border-blue-100"
                  : "bg-amber-50 text-amber-600 border-amber-100",
            )}
          >
            <LuBrainCircuit className="w-3 h-3" />
            {hasRealCheckinData
              ? "Live Data"
              : hasRealVisitData
                ? "AI Predicted"
                : "Collecting…"}
          </div>
        </div>

        {/* Info banner — only shown when in prediction mode */}
        {!hasRealCheckinData && (
          <div
            className={cn(
              "flex items-start gap-3 mb-4 p-3 rounded-2xl border",
              hasRealVisitData
                ? "bg-blue-50 border-blue-100"
                : "bg-amber-50 border-amber-100",
            )}
          >
            <LuInfo
              className={cn(
                "w-3.5 h-3.5 shrink-0 mt-0.5",
                hasRealVisitData ? "text-blue-500" : "text-amber-600",
              )}
            />
            <p
              className={cn(
                "text-[10px] font-bold",
                hasRealVisitData ? "text-blue-700" : "text-amber-700",
              )}
            >
              {hasRealVisitData
                ? "Showing AI-predicted check-in curve based on platform visit patterns. Dashed bars are estimates — they will be replaced with confirmed data once hourly check-in tracking is wired to the analytics API."
                : "Visit data is still being collected. The heatmap will populate as users navigate the platform. Each page visit is recorded once per 3-hour window to build an activity distribution pattern."}
            </p>
          </div>
        )}

        {/* Accuracy strip — only shown after at least one cron run */}
        {logCount > 0 && (
          <div className="flex items-center gap-6 mb-4 p-4 bg-muted rounded-2xl">
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                Model Accuracy
              </p>
              <p
                className={cn(
                  "text-2xl font-black tracking-tighter",
                  accuracyPct != null && accuracyPct >= 80
                    ? "text-emerald-600"
                    : accuracyPct != null && accuracyPct >= 60
                      ? "text-amber-600"
                      : "text-rose-500",
                )}
              >
                {accuracyPct != null ? `${accuracyPct}%` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                Mean Error
              </p>
              <p className="text-2xl font-black tracking-tighter text-foreground">
                {maeScore != null ? `±${maeScore}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                Days Trained
              </p>
              <p className="text-2xl font-black tracking-tighter text-foreground">
                {logCount}
              </p>
            </div>
            {lastValidated && (
              <div className="ml-auto">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                  Last Validated
                </p>
                <p className="text-[10px] font-bold text-foreground">
                  {lastValidated}
                </p>
              </div>
            )}
          </div>
        )}

        <CheckInHeatmapChart data={heatmapData} />
      </div>

      {/* Real stats */}
      <div className={cn("grid", "grid-cols-1", "md:grid-cols-3", "gap-6")}>
        <div
          className={cn(
            "bg-background",
            "border",
            "border-border",
            "p-8",
            "rounded-[2.5rem]",
            "shadow-sm",
          )}
        >
          <div className={cn("flex", "items-center", "gap-3", "mb-4")}>
            <LuUsers className={cn("w-4", "h-4", "text-blue-600")} />
            <span
              className={cn(
                "text-[9px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.2em]",
              )}
            >
              Checked In
            </span>
          </div>
          <h4
            className={cn(
              "text-3xl",
              "font-black",
              "text-foreground",
              "tracking-tighter",
            )}
          >
            {checkedIn.toLocaleString()}
          </h4>
          <p
            className={cn(
              "text-[10px]",
              "font-bold",
              "text-muted-foreground",
              "uppercase",
              "mt-1",
            )}
          >
            of {totalRegistrations.toLocaleString()} registered
          </p>
        </div>

        <div
          className={cn(
            "bg-background",
            "border",
            "border-border",
            "p-8",
            "rounded-[2.5rem]",
            "shadow-sm",
          )}
        >
          <div className={cn("flex", "items-center", "gap-3", "mb-4")}>
            <LuUsers className={cn("w-4", "h-4", "text-rose-500")} />
            <span
              className={cn(
                "text-[9px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.2em]",
              )}
            >
              No-Show Rate
            </span>
          </div>
          <h4
            className={cn(
              "text-3xl",
              "font-black",
              "text-foreground",
              "tracking-tighter",
            )}
          >
            {noShowRate}%
          </h4>
          <p
            className={cn(
              "text-[10px]",
              "font-bold",
              "text-muted-foreground",
              "uppercase",
              "mt-1",
            )}
          >
            {noShowCount.toLocaleString()} did not attend
          </p>
        </div>

        <div
          className={cn(
            "bg-background",
            "border",
            "border-border",
            "p-8",
            "rounded-[2.5rem]",
            "shadow-sm",
          )}
        >
          <div className={cn("flex", "items-center", "gap-3", "mb-4")}>
            <LuCircleCheck className={cn("w-4", "h-4", "text-emerald-500")} />
            <span
              className={cn(
                "text-[9px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.2em]",
              )}
            >
              Attendance Rate
            </span>
          </div>
          <h4
            className={cn(
              "text-3xl",
              "font-black",
              "text-foreground",
              "tracking-tighter",
            )}
          >
            {attendanceRate}%
          </h4>
          <p
            className={cn(
              "text-[10px]",
              "font-bold",
              "text-muted-foreground",
              "uppercase",
              "mt-1",
            )}
          >
            Overall check-in rate
          </p>
        </div>
      </div>
    </div>
  );
};
