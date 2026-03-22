"use client";
import React from "react";
import { LuTrophy, LuChartBar } from "react-icons/lu";
import type { Analytics } from "@/context/AdminContext";
import { EventPerformanceChart } from "@/components/sections/admin/analytics/charts/EventPerfomanceChart";
import { cn } from "../../../../lib/utils";

interface Props {
  analytics: Analytics | null;
}

const CHART_COLORS = ["#f97316", "#10b981", "#6366f1", "#f43f5e", "#f59e0b"];

export const AdminAnalyticsEventPerformanceSection = ({ analytics }: Props) => {
  const topEvents = analytics?.topEvents ?? [];

  const chartData = topEvents.map((e, i) => ({
    name: e.title,
    value: e.registrations,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className={cn('space-y-8', 'mb-16')}>
      <div className={cn('flex', 'items-center', 'justify-between')}>
        <div className={cn('flex', 'items-center', 'gap-3')}>
          <div className={cn('p-2.5', 'bg-indigo-50', 'text-indigo-600', 'rounded-xl', 'border', 'border-indigo-100')}>
            <LuTrophy className={cn('w-5', 'h-5')} />
          </div>
          <div>
            <h2 className={cn('text-xl', 'font-black', 'text-foreground', 'uppercase', 'tracking-tighter')}>
              Event Performance
            </h2>
            <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
              Top events by registrations
            </p>
          </div>
        </div>
      </div>

      <div className={cn('grid', 'grid-cols-1', '2xl:grid-cols-3', 'gap-8')}>
        {/* Performance table */}
        <div className={cn('2xl:col-span-2', 'bg-background', 'border', 'border-border', 'rounded-[2.5rem]', 'overflow-hidden', 'shadow-sm')}>
          <div className={cn('p-8', 'border-b', 'border-slate-50', 'flex', 'justify-between', 'items-center')}>
            <h3 className={cn('text-[11px]', 'font-black', 'text-foreground', 'uppercase', 'tracking-widest')}>
              Top Events by Registrations
            </h3>
          </div>
          {topEvents.length === 0 ? (
            <p className={cn('text-sm', 'font-bold', 'text-muted-foreground', 'text-center', 'py-12')}>
              No event data yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className={cn('w-full', 'text-left')}>
                <thead>
                  <tr className="bg-muted/50">
                    <th className={cn('px-8', 'py-4', 'text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                      Event
                    </th>
                    <th className={cn('px-6', 'py-4', 'text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                      Date
                    </th>
                    <th className={cn('px-6', 'py-4', 'text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                      Registrations
                    </th>
                  </tr>
                </thead>
                <tbody className={cn('divide-y', 'divide-slate-50')}>
                  {topEvents.map((event) => (
                    <tr
                      key={event.eventId}
                      className={cn('hover:bg-muted/50', 'transition-colors')}
                    >
                      <td className={cn('px-8', 'py-5', 'text-[11px]', 'font-black', 'text-foreground', 'uppercase', 'tracking-tight')}>
                        {event.title}
                      </td>
                      <td className={cn('px-6', 'py-5', 'text-[11px]', 'font-bold', 'text-slate-600')}>
                        {new Date(event.eventDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className={cn('px-6', 'py-5', 'text-[11px]', 'font-bold', 'text-primary')}>
                        {event.registrations}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className={cn('bg-background', 'border', 'border-border', 'rounded-[2.5rem]', 'p-10', 'shadow-sm', 'flex', 'flex-col')}>
          <div className={cn('space-y-1', 'mb-6')}>
            <h3 className={cn('text-sm', 'font-black', 'text-foreground', 'uppercase', 'tracking-tight', 'flex', 'items-center', 'gap-2')}>
              <LuChartBar className={cn('w-4', 'h-4', 'text-primary')} /> Popularity Mix
            </h3>
            <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
              Registrations by event
            </p>
          </div>
          {chartData.length > 0 ? (
            <>
              <EventPerformanceChart data={chartData} />
              <div className={cn('mt-4', 'grid', 'grid-cols-2', 'gap-2')}>
                {chartData.map((d) => (
                  <div key={d.name} className={cn('flex', 'items-center', 'gap-2')}>
                    <div
                      className={cn('w-2', 'h-2', 'rounded-full', 'shrink-0')}
                      style={{ backgroundColor: d.color }}
                    />
                    <span className={cn('text-[9px]', 'font-black', 'text-slate-600', 'uppercase', 'truncate')}>
                      {d.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className={cn('text-sm', 'font-bold', 'text-muted-foreground', 'text-center', 'py-12')}>
              No data yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
