"use client";
import React from "react";
import { LuUsers, LuCircleCheck, LuActivity, LuInfo } from "react-icons/lu";
import type { Analytics } from "@/context/AdminContext";
import { CheckInHeatmapChart } from "@/components/sections/admin/analytics/charts/CheckinHeatmapChart";
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

  // Heatmap: no real hourly breakdown in Analytics — show flat TODO data
  // TODO: add hourly check-in breakdown to GET /api/admin/analytics response
  const heatmapData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    volume: 0, // real data not available yet
  }));

  return (
    <div className={cn('space-y-8', 'mb-16')}>
      <div className={cn('flex', 'items-center', 'gap-3')}>
        <div className={cn('p-2.5', 'bg-blue-50', 'text-blue-600', 'rounded-xl', 'border', 'border-blue-100')}>
          <LuActivity className={cn('w-5', 'h-5')} />
        </div>
        <div>
          <h2 className={cn('text-xl', 'font-black', 'text-foreground', 'uppercase', 'tracking-tighter')}>
            Attendance Insights
          </h2>
          <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
            Check-in rates & entry flow
          </p>
        </div>
      </div>

      {/* Chart — shows zeros until hourly data is available */}
      <div className={cn('bg-background', 'border', 'border-border', 'rounded-[2.5rem]', 'p-10', 'shadow-sm')}>
        <div className={cn('flex', 'items-center', 'justify-between', 'mb-4')}>
          <div>
            <h3 className={cn('text-sm', 'font-black', 'text-foreground', 'uppercase', 'tracking-tight')}>
              Entry Velocity Heatmap
            </h3>
            <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
              Arrival volume by hour
            </p>
          </div>
        </div>
        <div className={cn('flex', 'items-start', 'gap-3', 'mb-4', 'p-3', 'bg-amber-50', 'border', 'border-amber-100', 'rounded-2xl')}>
          <LuInfo className={cn('w-3.5', 'h-3.5', 'text-amber-600', 'shrink-0', 'mt-0.5')} />
          <p className={cn('text-[10px]', 'font-bold', 'text-amber-700')}>
            Hourly check-in breakdown is not yet in the analytics API.
            {/* TODO: add hourly_checkins[] to GET /api/admin/analytics */}
          </p>
        </div>
        <CheckInHeatmapChart data={heatmapData} />
      </div>

      {/* Real stats */}
      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-6')}>
        <div className={cn('bg-background', 'border', 'border-border', 'p-8', 'rounded-[2.5rem]', 'shadow-sm')}>
          <div className={cn('flex', 'items-center', 'gap-3', 'mb-4')}>
            <LuUsers className={cn('w-4', 'h-4', 'text-blue-600')} />
            <span className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-[0.2em]')}>
              Checked In
            </span>
          </div>
          <h4 className={cn('text-3xl', 'font-black', 'text-foreground', 'tracking-tighter')}>
            {checkedIn.toLocaleString()}
          </h4>
          <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'mt-1')}>
            of {totalRegistrations.toLocaleString()} registered
          </p>
        </div>
        <div className={cn('bg-background', 'border', 'border-border', 'p-8', 'rounded-[2.5rem]', 'shadow-sm')}>
          <div className={cn('flex', 'items-center', 'gap-3', 'mb-4')}>
            <LuUsers className={cn('w-4', 'h-4', 'text-rose-500')} />
            <span className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-[0.2em]')}>
              No-Show Rate
            </span>
          </div>
          <h4 className={cn('text-3xl', 'font-black', 'text-foreground', 'tracking-tighter')}>
            {noShowRate}%
          </h4>
          <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'mt-1')}>
            {noShowCount.toLocaleString()} did not attend
          </p>
        </div>
        <div className={cn('bg-background', 'border', 'border-border', 'p-8', 'rounded-[2.5rem]', 'shadow-sm')}>
          <div className={cn('flex', 'items-center', 'gap-3', 'mb-4')}>
            <LuCircleCheck className={cn('w-4', 'h-4', 'text-emerald-500')} />
            <span className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-[0.2em]')}>
              Attendance Rate
            </span>
          </div>
          <h4 className={cn('text-3xl', 'font-black', 'text-foreground', 'tracking-tighter')}>
            {attendanceRate}%
          </h4>
          <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'mt-1')}>
            Overall check-in rate
          </p>
        </div>
      </div>
    </div>
  );
};
