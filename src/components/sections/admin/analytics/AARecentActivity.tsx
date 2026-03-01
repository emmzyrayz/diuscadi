"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuZap,
  LuUserPlus,
  LuTicketCheck,
  LuCalendarPlus,
  LuUserCog,
  LuClock,
  LuChevronRight,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";

// TypeScript Interfaces
interface Activity {
  id: number;
  type: "registration" | "verification" | "event_created" | "profile_update";
  title: string;
  detail: string;
  time: string;
  icon: IconType;
  color: string;
  bg: string;
}

interface ActivityItemProps {
  activity: Activity;
  delay?: number;
}

export const AdminAnalyticsRecentActivitySection: React.FC = () => {
  const ACTIVITIES: Activity[] = [
    {
      id: 1,
      type: "registration",
      title: "John Doe registered",
      detail: "Cybersecurity Essentials",
      time: "2 mins ago",
      icon: LuUserPlus,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      id: 2,
      type: "verification",
      title: "Ticket Verified",
      detail: "Gate 02 • Tech Summit 2026",
      time: "5 mins ago",
      icon: LuTicketCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      id: 3,
      type: "event_created",
      title: "New Event Created",
      detail: "Web3 Developer Workshop",
      time: "14 mins ago",
      icon: LuCalendarPlus,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      id: 4,
      type: "profile_update",
      title: "Profile Updated",
      detail: "Sarah Olanrewaju • School of Eng.",
      time: "28 mins ago",
      icon: LuUserCog,
      color: "text-slate-500",
      bg: "bg-slate-100",
    },
    {
      id: 5,
      type: "registration",
      title: "Marcus Johnson registered",
      detail: "AI Masterclass",
      time: "42 mins ago",
      icon: LuUserPlus,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className={cn("space-y-6")}>
      {/* 1. Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn("flex", "items-center", "justify-between")}
      >
        <div className={cn("flex", "items-center", "gap-3")}>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
            className={cn(
              "p-2.5",
              "bg-amber-50",
              "text-amber-600",
              "rounded-xl",
              "border",
              "border-amber-100",
            )}
          >
            <LuZap className={cn("w-5", "h-5")} />
          </motion.div>
          <div>
            <h2
              className={cn(
                "text-xl",
                "font-black",
                "text-slate-900",
                "uppercase",
                "tracking-tighter",
              )}
            >
              Recent Activity
            </h2>
            <p
              className={cn(
                "text-[10px]",
                "font-bold",
                "text-slate-400",
                "uppercase",
                "tracking-widest",
              )}
            >
              Real-time system & user events
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, borderColor: "rgb(15 23 42)" }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "flex",
            "items-center",
            "gap-2",
            "px-5",
            "py-2.5",
            "bg-white",
            "border",
            "border-slate-200",
            "rounded-xl",
            "text-[10px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "text-slate-500",
            "hover:text-slate-900",
            "transition-all",
            "shadow-sm",
          )}
        >
          View Audit Log{" "}
          <motion.div
            whileHover={{ x: 2 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <LuChevronRight className={cn("w-3.5", "h-3.5")} />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* 2. Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={cn(
          "bg-white",
          "border",
          "border-slate-100",
          "rounded-[2.5rem]",
          "p-4",
          "shadow-sm",
        )}
      >
        <div className={cn("divide-y", "divide-slate-50")}>
          {ACTIVITIES.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              delay={0.2 + index * 0.05}
            />
          ))}
        </div>

        {/* Footer Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={cn("pt-4", "pb-2", "text-center")}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "text-[9px]",
              "font-black",
              "text-slate-300",
              "uppercase",
              "tracking-[0.2em]",
              "hover:text-primary",
              "transition-colors",
            )}
          >
            End of recent activity • Refresh for more
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

/* --- Internal Activity Item --- */
const ActivityItem: React.FC<ActivityItemProps> = ({ activity, delay = 0 }) => {
  const Icon = activity.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{
        backgroundColor: "rgba(248, 250, 252, 0.5)",
        x: 5,
      }}
      className={cn(
        "group",
        "flex",
        "items-center",
        "justify-between",
        "p-6",
        "transition-all",
        "rounded-[1.5rem]",
      )}
    >
      <div className={cn("flex", "items-center", "gap-5")}>
        {/* Visual Indicator with Vertical Line Connector */}
        <div className={cn("relative")}>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "w-12",
              "h-12",
              activity.bg,
              activity.color,
              "rounded-2xl",
              "flex",
              "items-center",
              "justify-center",
              "shadow-sm",
            )}
          >
            <motion.div
              animate={
                activity.type === "verification"
                  ? {
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0],
                    }
                  : {}
              }
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            >
              <Icon className={cn("w-5", "h-5")} />
            </motion.div>
          </motion.div>
        </div>

        <div className={cn("flex", "flex-col")}>
          <span
            className={cn(
              "text-[11px]",
              "font-black",
              "text-slate-900",
              "uppercase",
              "tracking-tight",
            )}
          >
            {activity.title}
          </span>
          <span
            className={cn(
              "text-[10px]",
              "font-bold",
              "text-slate-400",
              "uppercase",
              "tracking-widest",
            )}
          >
            {activity.detail}
          </span>
        </div>
      </div>

      <div className={cn("flex", "flex-col", "items-end", "gap-1")}>
        <div
          className={cn("flex", "items-center", "gap-1.5", "text-slate-300")}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{
              duration: 60,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <LuClock className={cn("w-3", "h-3")} />
          </motion.div>
          <span
            className={cn(
              "text-[9px]",
              "font-black",
              "uppercase",
              "tracking-widest",
            )}
          >
            {activity.time}
          </span>
        </div>
        {/* Status indicator dot */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={cn("w-1.5", "h-1.5", "rounded-full", "bg-emerald-400")}
        />
      </div>
    </motion.div>
  );
};

// Export types
export type { Activity, ActivityItemProps };