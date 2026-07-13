"use client";
// src/components/sections/admin/analytics/AAPointsSection.tsx

import React from "react";
import { cn } from "@/lib/utils";
import {
  LuCoins,
  LuTrendingUp,
  LuShare2,
  LuListTodo,
  LuShieldCheck,
  LuCalendar,
} from "react-icons/lu";

interface PointsSourceStats {
  total: number;
  count: number;
}

interface PointsAnalytics {
  totalDistributed: number;
  totalTransactions: number;
  thisMonth: number;
  bySource: Record<string, PointsSourceStats>;
  leaderboard: {
    userId: string;
    name: string;
    committee: string | null;
    lifetimePoints: number;
    currentPoints: number;
  }[];
}

interface AAPointsSectionProps {
  points: PointsAnalytics | null | undefined;
}

// Human-readable source labels
const SOURCE_LABELS: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  referral_signup: {
    label: "Referral — Signup",
    icon: LuShare2,
    color: "text-emerald-500",
  },
  referral_event_reg: {
    label: "Referral — Event",
    icon: LuShare2,
    color: "text-emerald-400",
  },
  task_completion: {
    label: "Task Submission",
    icon: LuListTodo,
    color: "text-primary",
  },
  task_poll: { label: "Poll", icon: LuListTodo, color: "text-violet-500" },
  task_survey: { label: "Survey", icon: LuListTodo, color: "text-sky-500" },
  task_acknowledgement: {
    label: "Acknowledgement",
    icon: LuShieldCheck,
    color: "text-emerald-500",
  },
  task_learning: {
    label: "Learning",
    icon: LuListTodo,
    color: "text-muted-foreground",
  },
  admin_grant: { label: "Admin Grant", icon: LuCoins, color: "text-amber-500" },
  admin_deduct: {
    label: "Admin Deduction",
    icon: LuCoins,
    color: "text-red-500",
  },
  redemption: {
    label: "Redemption",
    icon: LuCoins,
    color: "text-muted-foreground",
  },
};

export function AAPointsSection({ points }: AAPointsSectionProps) {
  if (!points) return null;

  const {
    totalDistributed,
    totalTransactions,
    thisMonth,
    bySource,
    leaderboard,
  } = points;

  // Sort sources by total descending
  const sortedSources = Object.entries(bySource)
    .filter(([, v]) => v.total > 0)
    .sort(([, a], [, b]) => b.total - a.total);

  // Calculate max for bar scaling
  const maxSourceTotal = sortedSources[0]?.[1]?.total ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={cn('flex', 'items-center', 'gap-3')}>
        <div className={cn('w-10', 'h-10', 'rounded-2xl', 'bg-amber-500/10', 'flex', 'items-center', 'justify-center')}>
          <LuCoins className={cn('w-5', 'h-5', 'text-amber-500')} />
        </div>
        <div>
          <h2 className={cn('text-sm', 'font-black', 'text-foreground', 'uppercase', 'tracking-tight')}>
            Points Analytics
          </h2>
          <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-0.5')}>
            Career points distribution across the platform
          </p>
        </div>
      </div>

      {/* ── Overview stats ──────────────────────────────────────────────────── */}
      <div className={cn('grid', 'grid-cols-1', 'sm:grid-cols-3', 'gap-4')}>
        <div className={cn('p-6', 'bg-foreground', 'rounded-[1.5rem]', 'text-background', 'space-y-2', 'relative', 'overflow-hidden')}>
          <p className={cn('text-[9px]', 'font-black', 'text-primary', 'uppercase', 'tracking-widest')}>
            Total Distributed
          </p>
          <p className={cn('text-4xl', 'font-black')}>
            {totalDistributed.toLocaleString()}
          </p>
          <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground')}>
            across {totalTransactions.toLocaleString()} transactions
          </p>
          <div className={cn('absolute', '-bottom-6', '-right-6', 'w-20', 'h-20', 'bg-primary/20', 'rounded-full', 'blur-2xl')} />
        </div>

        <div className={cn('p-6', 'bg-background', 'border-2', 'border-border', 'rounded-[1.5rem]', 'space-y-2')}>
          <div className={cn('flex', 'items-center', 'gap-2')}>
            <LuCalendar className={cn('w-4', 'h-4', 'text-primary')} />
            <p className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
              This Month
            </p>
          </div>
          <p className={cn('text-4xl', 'font-black', 'text-foreground')}>
            {thisMonth.toLocaleString()}
          </p>
          <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground')}>
            pts distributed in{" "}
            {new Date().toLocaleString("default", { month: "long" })}
          </p>
        </div>

        <div className={cn('p-6', 'bg-background', 'border-2', 'border-border', 'rounded-[1.5rem]', 'space-y-2')}>
          <div className={cn('flex', 'items-center', 'gap-2')}>
            <LuTrendingUp className={cn('w-4', 'h-4', 'text-emerald-500')} />
            <p className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
              Avg per Transaction
            </p>
          </div>
          <p className={cn('text-4xl', 'font-black', 'text-foreground')}>
            {totalTransactions > 0
              ? Math.round(
                  totalDistributed / totalTransactions,
                ).toLocaleString()
              : "0"}
          </p>
          <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground')}>
            points per event
          </p>
        </div>
      </div>

      {/* ── Points by source ────────────────────────────────────────────────── */}
      {sortedSources.length > 0 && (
        <div className="space-y-3">
          <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
            Points by Source
          </p>
          <div className="space-y-2.5">
            {sortedSources.map(([source, stats]) => {
              const cfg = SOURCE_LABELS[source] ?? {
                label: source,
                icon: LuCoins,
                color: "text-muted-foreground",
              };
              const Icon = cfg.icon;
              const barPct = (stats.total / maxSourceTotal) * 100;

              return (
                <div key={source} className="space-y-1.5">
                  <div className={cn('flex', 'items-center', 'justify-between', 'gap-3')}>
                    <div className={cn('flex', 'items-center', 'gap-2', 'min-w-0')}>
                      <Icon className={cn("w-3.5 h-3.5 shrink-0", cfg.color)} />
                      <span className={cn('text-[11px]', 'font-bold', 'text-foreground', 'truncate')}>
                        {cfg.label}
                      </span>
                      <span className={cn('text-[9px]', 'font-mono', 'text-muted-foreground/60', 'shrink-0')}>
                        ({stats.count.toLocaleString()} events)
                      </span>
                    </div>
                    <span className={cn('text-[11px]', 'font-black', 'text-foreground', 'shrink-0')}>
                      {stats.total.toLocaleString()} pts
                    </span>
                  </div>
                  <div className={cn('h-1.5', 'bg-border', 'rounded-full', 'overflow-hidden')}>
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        source.startsWith("referral_")
                          ? "bg-emerald-500"
                          : source.startsWith("task_")
                            ? "bg-primary"
                            : source === "admin_grant"
                              ? "bg-amber-500"
                              : "bg-muted-foreground/40",
                      )}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Points leaderboard ───────────────────────────────────────────────── */}
      {leaderboard.length > 0 && (
        <div className="space-y-3">
          <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
            Career Points Leaderboard
          </p>
          <div className="space-y-2">
            {leaderboard.map((entry, idx) => (
              <div
                key={entry.userId}
                className={cn(
                  "flex items-center gap-4 p-4 border rounded-2xl transition-all",
                  idx === 0
                    ? "bg-amber-500/5 border-amber-500/20"
                    : idx === 1
                      ? "bg-slate-500/5 border-slate-500/15"
                      : idx === 2
                        ? "bg-orange-500/5 border-orange-500/15"
                        : "bg-background border-border",
                )}
              >
                {/* Rank */}
                <div className={cn('w-8', 'text-center', 'shrink-0')}>
                  {idx === 0 ? (
                    <span className="text-lg">🥇</span>
                  ) : idx === 1 ? (
                    <span className="text-lg">🥈</span>
                  ) : idx === 2 ? (
                    <span className="text-lg">🥉</span>
                  ) : (
                    <span className={cn('text-[11px]', 'font-black', 'text-muted-foreground/60')}>
                      #{idx + 1}
                    </span>
                  )}
                </div>

                {/* Name + committee */}
                <div className={cn('flex-1', 'min-w-0')}>
                  <p className={cn('text-[11px]', 'font-black', 'text-foreground', 'truncate')}>
                    {entry.name}
                  </p>
                  {entry.committee && (
                    <p className={cn('text-[9px]', 'font-mono', 'text-muted-foreground/60', 'uppercase', 'mt-0.5')}>
                      {entry.committee}
                    </p>
                  )}
                </div>

                {/* Points */}
                <div className={cn('flex', 'items-center', 'gap-4', 'shrink-0')}>
                  <div className="text-right">
                    <p className={cn('text-sm', 'font-black', 'text-foreground')}>
                      {entry.lifetimePoints.toLocaleString()}
                    </p>
                    <p className={cn('text-[9px]', 'text-muted-foreground')}>lifetime</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-[11px]', 'font-black', 'text-primary')}>
                      {entry.currentPoints.toLocaleString()}
                    </p>
                    <p className={cn('text-[9px]', 'text-muted-foreground')}>current</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {leaderboard.length === 0 && sortedSources.length === 0 && (
        <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-10', 'gap-2', 'text-center', 'border', 'border-dashed', 'border-border', 'rounded-2xl')}>
          <LuCoins className={cn('w-7', 'h-7', 'text-muted-foreground/20')} />
          <p className={cn('text-xs', 'font-bold', 'text-muted-foreground/50')}>
            No points distributed yet
          </p>
        </div>
      )}
    </div>
  );
}
