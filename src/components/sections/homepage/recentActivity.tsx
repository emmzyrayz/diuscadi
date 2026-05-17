"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuCircleCheck,
  LuTicket,
  LuCircleUser,
  LuZap,
  LuChevronRight,
  LuActivity,
  LuBookOpen,
  LuNewspaper,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { HomeActivity } from "@/lib/homeData";

// ── Types ─────────────────────────────────────────────────────────────────────

export type { HomeActivity as Activity };

// ── Style resolver ────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  "registration": {
    icon: <LuTicket className="w-4 h-4" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  "check-in": {
    icon: <LuCircleCheck className="w-4 h-4" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  "application": {
    icon: <LuCircleUser className="w-4 h-4" />,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  // Future types — wired up ready for when they ship
  "points": {
    icon: <LuZap className="w-4 h-4" />,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  "learning": {
    icon: <LuBookOpen className="w-4 h-4" />,
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
  "blog": {
    icon: <LuNewspaper className="w-4 h-4" />,
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
};

const FALLBACK_STYLE = {
  icon: <LuCircleUser className="w-4 h-4" />,
  color: "text-slate-600",
  bg: "bg-slate-50",
};

// ── Time formatter ────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: diffDays > 365 ? "numeric" : undefined,
  });
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface RecentActivityProps {
  activities: HomeActivity[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export const RecentActivity = ({ activities }: RecentActivityProps) => {
  if (activities.length === 0) {
    return (
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pb-8">
        <h3 className="text-xl font-black text-foreground uppercase tracking-tighter mb-8">
          Recent Activity
        </h3>
        <div
          className={cn(
            "flex flex-col items-center justify-center py-16",
            "bg-background border border-dashed border-border",
            "rounded-[2.5rem] text-center gap-4",
          )}
        >
          <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center">
            <LuActivity className="w-8 h-8 text-slate-300" />
          </div>
          <div>
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
              No activity yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your registrations, check-ins, and applications will appear here
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pb-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">
          Recent Activity
        </h3>
        {/* TODO: link to /activity when full history page is built */}
        <button className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
          Full History <LuChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border hidden sm:block" />

        <div className="space-y-6">
          {activities.map((activity, index) => {
            const style = TYPE_STYLE[activity.type] ?? FALLBACK_STYLE;

            const inner = (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07 }}
                className="relative flex items-center gap-4 group mb-5"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                    "bg-background border border-border shadow-sm transition-all duration-300",
                    "group-hover:shadow-md group-hover:border-primary/20",
                    style.color,
                  )}
                >
                  <div className={cn("p-2 rounded-xl", style.bg)}>
                    {style.icon}
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground font-medium leading-snug">
                    {activity.content}{" "}
                    <span
                      className={cn(
                        "text-foreground font-bold transition-colors",
                        activity.targetHref &&
                          "group-hover:text-primary cursor-pointer",
                      )}
                    >
                      {activity.target}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      {formatTime(activity.time)}
                    </span>
                    {activity.meta && (
                      <>
                        <span className="text-muted-foreground text-[10px]">·</span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {activity.meta}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                {activity.targetHref && (
                  <div className="hidden group-hover:flex items-center justify-center p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                    <LuChevronRight className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            );

            // Wrap in Link if there's a target URL
            return activity.targetHref ? (
              <Link
                key={activity.id}
                href={activity.targetHref}
                
              >
                {inner}
              </Link>
            ) : (
              <div  key={activity.id}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};