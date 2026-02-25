"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuUsers,
  LuCalendar,
  LuTicket,
  LuActivity,
  LuTrendingUp,
  LuTrendingDown,
  LuMinus,
} from "react-icons/lu";
import { cn } from "../../../lib/utils";
import { IconType } from "react-icons";

// Define proper TypeScript types
type TrendType = "up" | "down" | "neutral";
type ColorType = "blue" | "purple" | "emerald" | "amber";

interface StatData {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendType: TrendType;
  icon: IconType;
  color: ColorType;
  progress?: number;
}

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  trendType: TrendType;
  icon: IconType;
  color: ColorType;
  progress?: number;
  delay?: number;
}

// 1. Data Structure for the Overview
const STATS_DATA: StatData[] = [
  {
    id: "users",
    label: "Total Registered Users",
    value: "145",
    trend: "+12%",
    trendType: "up",
    icon: LuUsers,
    color: "blue",
    progress: 65,
  },
  {
    id: "events",
    label: "Total Events Created",
    value: "12",
    trend: "Stable",
    trendType: "neutral",
    icon: LuCalendar,
    color: "purple",
    progress: 48,
  },
  {
    id: "tickets",
    label: "Total Tickets Issued",
    value: "832",
    trend: "+24%",
    trendType: "up",
    icon: LuTicket,
    color: "emerald",
    progress: 82,
  },
  {
    id: "upcoming",
    label: "Upcoming Events",
    value: "4",
    trend: "-1",
    trendType: "down",
    icon: LuActivity,
    color: "amber",
    progress: 33,
  },
];

export const AdminStatsOverview = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "grid",
        "grid-cols-1",
        "md:grid-cols-2",
        "xl:grid-cols-4",
        "gap-6",
      )}
    >
      {STATS_DATA.map((stat, index) => (
        <StatCard key={stat.id} {...stat} delay={0.1 + index * 0.1} />
      ))}
    </motion.div>
  );
};

/* --- Internal Component: StatCard --- */
const StatCard = ({
  label,
  value,
  trend,
  trendType,
  icon: Icon,
  color,
  progress = 65,
  delay = 0,
}: StatCardProps) => {
  // Dynamic color mapping for the brand
  const colorStyles: Record<ColorType, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  const progressColors: Record<ColorType, string> = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
  };

  const getTrendIcon = () => {
    switch (trendType) {
      case "up":
        return <LuTrendingUp className={cn("w-3", "h-3")} />;
      case "down":
        return <LuTrendingDown className={cn("w-3", "h-3")} />;
      case "neutral":
        return <LuMinus className={cn("w-3", "h-3")} />;
    }
  };

  const getTrendStyles = () => {
    switch (trendType) {
      case "up":
        return "bg-emerald-50 text-emerald-600";
      case "down":
        return "bg-rose-50 text-rose-600";
      case "neutral":
        return "bg-slate-50 text-slate-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn(
        "bg-white",
        "border-2",
        "border-slate-100",
        "rounded-[2.5rem]",
        "p-7",
        "shadow-sm",
        "hover:shadow-xl",
        "hover:shadow-slate-200/50",
        "hover:border-primary/20",
        "transition-all",
        "duration-300",
        "group",
        "cursor-pointer",
      )}
    >
      <div className={cn("flex", "items-center", "justify-between", "mb-6")}>
        {/* Icon Container */}
        <motion.div
          whileHover={{ rotate: 360, scale: 1.15 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
          className={cn(
            "w-14",
            "h-14",
            "rounded-2xl",
            "flex",
            "items-center",
            "justify-center",
            "border-2",
            "shadow-sm",
            "transition-all",
            "duration-500",
            colorStyles[color],
          )}
        >
          <Icon className={cn("w-7", "h-7")} />
        </motion.div>

        {/* Trend Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.2 }}
          whileHover={{ scale: 1.1 }}
          className={cn(
            "flex",
            "items-center",
            "gap-1",
            "px-3",
            "py-1.5",
            "rounded-full",
            "text-[10px]",
            "font-black",
            "uppercase",
            "tracking-tighter",
            getTrendStyles(),
          )}
        >
          <motion.div
            animate={
              trendType === "up"
                ? { y: [0, -2, 0] }
                : trendType === "down"
                  ? { y: [0, 2, 0] }
                  : {}
            }
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {getTrendIcon()}
          </motion.div>
          {trend}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3 }}
        className="space-y-1"
      >
        <p
          className={cn(
            "text-[10px]",
            "font-black",
            "text-slate-400",
            "uppercase",
            "tracking-[0.2em]",
          )}
        >
          {label}
        </p>
        <motion.h2
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.4, type: "spring", stiffness: 200 }}
          className={cn(
            "text-4xl",
            "font-black",
            "text-slate-900",
            "tracking-tighter",
          )}
        >
          {value}
        </motion.h2>
      </motion.div>

      {/* Subtle Progress Bar (Elite Detail) */}
      <div
        className={cn(
          "mt-6",
          "w-full",
          "h-1.5",
          "bg-slate-50",
          "rounded-full",
          "overflow-hidden",
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{
            duration: 1,
            delay: delay + 0.5,
            ease: "easeOut",
          }}
          className={cn(
            "h-full",
            "rounded-full",
            "relative",
            "overflow-hidden",
            progressColors[color],
          )}
        >
          {/* Shimmer effect */}
          <motion.div
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 1,
            }}
            className={cn('absolute', 'inset-0', 'bg-linear-to-r', 'from-transparent', 'via-white/30', 'to-transparent')}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

// Export types for reuse
export type { StatData, StatCardProps, TrendType, ColorType };
