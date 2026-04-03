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
} from "react-icons/lu";
import { cn } from "@/lib/utils";

export interface Activity {
  id: string | number;
  content: string;
  target: string;
  time: string;
}

const resolveStyle = (
  target: string,
): { icon: React.ReactNode; color: string; bg: string } => {
  if (target.toLowerCase().includes("points"))
    return {
      icon: <LuZap className={cn('w-4', 'h-4')} />,
      color: "text-orange-600",
      bg: "bg-orange-50",
    };
  if (
    target.toLowerCase().includes("summit") ||
    target.toLowerCase().includes("registered")
  )
    return {
      icon: <LuTicket className={cn('w-4', 'h-4')} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    };
  if (
    target.toLowerCase().includes("workshop") ||
    target.toLowerCase().includes("completed")
  )
    return {
      icon: <LuCircleCheck className={cn('w-4', 'h-4')} />,
      color: "text-green-600",
      bg: "bg-green-50",
    };
  return {
    icon: <LuCircleUser className={cn('w-4', 'h-4')} />,
    color: "text-purple-600",
    bg: "bg-purple-50",
  };
};

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivity = ({ activities }: RecentActivityProps) => {
  // ── Empty state ────────────────────────────────────────────────────────────
  // activities come from getStaticActivities() in homeData.ts —
  // these are static stubs until a real activity feed is built.
  // TODO: replace static activities with GET /api/users/activity (not yet built)
  // which should return a paginated list of user actions: registrations,
  // check-ins, profile updates, points earned, applications submitted, etc.
  if (activities.length === 0) {
    return (
      <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mt-16', 'pb-8')}>
        <h3 className={cn('text-xl', 'font-black', 'text-foreground', 'uppercase', 'tracking-tighter', 'mb-8')}>
          Recent Activity
        </h3>
        <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-16', 'bg-background', 'border', 'border-dashed', 'border-border', 'rounded-[2.5rem]', 'text-center', 'gap-4')}>
          <div className={cn('w-16', 'h-16', 'bg-muted', 'rounded-3xl', 'flex', 'items-center', 'justify-center')}>
            <LuActivity className={cn('w-8', 'h-8', 'text-slate-300')} />
          </div>
          <div>
            <p className={cn('text-[11px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
              No activity yet
            </p>
            <p className={cn('text-xs', 'text-muted-foreground', 'mt-1')}>
              Your actions — registrations, check-ins, points — will show here
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mt-16', 'pb-8')}>
      <div className={cn('flex', 'items-center', 'justify-between', 'mb-8')}>
        <h3 className={cn('text-xl', 'font-black', 'text-foreground', 'uppercase', 'tracking-tighter')}>
          Recent Activity
          {/* TODO: add "LIVE" badge when real-time activity feed is wired */}
        </h3>
        <button className={cn('text-xs', 'font-bold', 'text-muted-foreground', 'hover:text-primary', 'transition-colors', 'flex', 'items-center', 'gap-1')}>
          {/* TODO: link to /activity when full activity history page is built */}
          Full History <LuChevronRight className={cn('w-3', 'h-3')} />
        </button>
      </div>

      <div className="relative">
        <div className={cn('absolute', 'left-6', 'top-0', 'bottom-0', 'w-0.5', 'text-muted', 'hidden', 'sm:block')} />
        <div className="space-y-8">
          {activities.map((activity, index) => {
            const style = resolveStyle(activity.target);
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn('relative', 'flex', 'items-center', 'gap-4', 'group')}
              >
                <div
                  className={cn(
                    "relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300",
                    "bg-background border border-border shadow-sm group-hover:shadow-md group-hover:border-primary/20",
                    style.color,
                  )}
                >
                  <div className={cn("p-2 rounded-xl", style.bg)}>
                    {style.icon}
                  </div>
                </div>
                <div className={cn('flex-1', 'min-w-0')}>
                  <p className={cn('text-sm', 'text-muted-foreground', 'font-medium')}>
                    {activity.content}{" "}
                    <span className={cn('text-foreground', 'font-bold', 'group-hover:text-primary', 'transition-colors', 'cursor-pointer')}>
                      {activity.target}
                    </span>
                  </p>
                  <span className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-wide')}>
                    {activity.time}
                  </span>
                </div>
                <button className={cn('hidden', 'group-hover:flex', 'items-center', 'justify-center', 'p-2', 'rounded-lg', 'bg-muted', 'text-muted-foreground')}>
                  <LuChevronRight className={cn('w-4', 'h-4')} />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
