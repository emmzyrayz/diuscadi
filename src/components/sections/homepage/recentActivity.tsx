"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuCircleCheck,
  LuTicket,
  LuCircleUser,
  LuZap,
  LuChevronRight,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    content: "Registered for",
    target: "Lagos Career Summit 2026",
    time: "2 hours ago",
    icon: <LuTicket className={cn("w-4", "h-4")} />,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: 2,
    content: "Completed workshop",
    target: "Intro to UI Design",
    time: "Yesterday",
    icon: <LuCircleCheck className={cn("w-4", "h-4")} />,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    id: 3,
    content: "Earned",
    target: "50 Career Points",
    time: "2 days ago",
    icon: <LuZap className={cn("w-4", "h-4")} />,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    id: 4,
    content: "Updated",
    target: "Professional Bio",
    time: "3 days ago",
    icon: <LuCircleUser className={cn("w-4", "h-4")} />,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

export const RecentActivity = () => {
  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mt-16', 'pb-8')}>
      <div className={cn('flex', 'items-center', 'justify-between', 'mb-8')}>
        <h3 className={cn('text-xl', 'font-black', 'text-slate-900', 'uppercase', 'tracking-tighter')}>
          Recent Activity
        </h3>
        <button className={cn('text-xs', 'font-bold', 'text-slate-400', 'hover:text-primary', 'transition-colors', 'flex', 'items-center', 'gap-1')}>
          Full History <LuChevronRight className={cn('w-3', 'h-3')} />
        </button>
      </div>

      <div className="relative">
        {/* The Vertical Timeline Line */}
        <div className={cn('absolute', 'left-6', 'top-0', 'bottom-0', 'w-0.5', 'bg-slate-100', 'hidden', 'sm:block')} />

        <div className="space-y-8">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn('relative', 'flex', 'items-center', 'gap-4', 'group')}
            >
              {/* Icon Container (The Timeline Node) */}
              <div
                className={cn(
                  "relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300",
                  "bg-white border border-slate-100 shadow-sm group-hover:shadow-md group-hover:border-primary/20",
                  activity.color,
                )}
              >
                <div className={cn("p-2 rounded-xl", activity.bg)}>
                  {activity.icon}
                </div>
              </div>

              {/* Text Content */}
              <div className={cn('flex-1', 'min-w-0')}>
                <p className={cn('text-sm', 'text-slate-500', 'font-medium')}>
                  {activity.content}{" "}
                  <span className={cn('text-slate-900', 'font-bold', 'group-hover:text-primary', 'transition-colors', 'cursor-pointer')}>
                    {activity.target}
                  </span>
                </p>
                <span className={cn('text-[10px]', 'font-bold', 'text-slate-400', 'uppercase', 'tracking-wide')}>
                  {activity.time}
                </span>
              </div>

              {/* Invisible touch target for accessibility */}
              <button className={cn('hidden', 'group-hover:flex', 'items-center', 'justify-center', 'p-2', 'rounded-lg', 'bg-slate-50', 'text-slate-400')}>
                <LuChevronRight className={cn('w-4', 'h-4')} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
