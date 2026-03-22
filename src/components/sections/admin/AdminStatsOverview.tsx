"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuUsers,
  LuCalendar,
  LuTicket,
  LuActivity,
  LuTrendingUp,
  LuMinus,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { Analytics } from "@/context/AdminContext";
import { IconType } from "react-icons";

type ColorType = "blue" | "purple" | "emerald" | "amber";

interface StatCardProps {
  label: string;
  value: string;
  subLabel: string;
  icon: IconType;
  color: ColorType;
  delay?: number;
}

interface Props {
  analytics: Analytics | null;
}

export const AdminStatsOverview = ({ analytics }: Props) => {
  const stats: StatCardProps[] = [
    {
      label: "Total Users",
      value: analytics ? String(analytics.users.total) : "—",
      subLabel: `+${analytics?.users.newThisWeek ?? 0} this week`,
      icon: LuUsers,
      color: "blue",
    },
    {
      label: "Total Events",
      value: analytics ? String(analytics.events.total) : "—",
      subLabel: `${analytics?.events.upcoming ?? 0} upcoming`,
      icon: LuCalendar,
      color: "purple",
    },
    {
      label: "Tickets Issued",
      value: analytics ? String(analytics.registrations.total) : "—",
      subLabel: `${analytics?.registrations.thisMonth ?? 0} this month`,
      icon: LuTicket,
      color: "emerald",
    },
    {
      label: "Attendance Rate",
      value: analytics ? `${analytics.registrations.attendanceRate}%` : "—",
      subLabel: `${analytics?.registrations.checkedIn ?? 0} checked in`,
      icon: LuActivity,
      color: "amber",
    },
  ];

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
      {stats.map((stat, index) => (
        <StatCard key={stat.label} {...stat} delay={0.1 + index * 0.1} />
      ))}
    </motion.div>
  );
};

const COLOR_STYLES: Record<ColorType, { card: string; icon: string }> = {
  blue: {
    card: "bg-blue-50 text-blue-600 border-blue-100",
    icon: "bg-blue-500",
  },
  purple: {
    card: "bg-purple-50 text-purple-600 border-purple-100",
    icon: "bg-purple-500",
  },
  emerald: {
    card: "bg-emerald-50 text-emerald-600 border-emerald-100",
    icon: "bg-emerald-500",
  },
  amber: {
    card: "bg-amber-50 text-amber-600 border-amber-100",
    icon: "bg-amber-500",
  },
};

const StatCard = ({
  label,
  value,
  subLabel,
  icon: Icon,
  color,
  delay = 0,
}: StatCardProps & { delay?: number }) => {
  const styles = COLOR_STYLES[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "p-7",
        "shadow-sm",
        "hover:shadow-xl",
        "hover:shadow-slate-200/50",
        "hover:border-primary/20",
        "transition-all",
        "duration-300",
      )}
    >
      <div className={cn("flex", "items-center", "justify-between", "mb-6")}>
        <div
          className={cn(
            "w-14",
            "h-14",
            "rounded-2xl",
            "flex",
            "items-center",
            "justify-center",
            "border-2",
            "shadow-sm",
            styles.card,
          )}
        >
          <Icon className={cn("w-7", "h-7")} />
        </div>
        <div
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
            "bg-muted",
            "text-muted-foreground",
          )}
        >
          <LuMinus className={cn("w-3", "h-3")} />
          Live
        </div>
      </div>
      <p
        className={cn(
          "text-[10px]",
          "font-black",
          "text-muted-foreground",
          "uppercase",
          "tracking-[0.2em]",
        )}
      >
        {label}
      </p>
      <h2
        className={cn(
          "text-4xl",
          "font-black",
          "text-foreground",
          "tracking-tighter",
          "mt-1",
        )}
      >
        {value}
      </h2>
      <div
        className={cn("mt-6", "w-full", "h-1.5", "bg-muted", "rounded-full")}
      />
      <p
        className={cn(
          "text-[10px]",
          "font-bold",
          "text-muted-foreground",
          "mt-2",
        )}
      >
        {subLabel}
      </p>
    </motion.div>
  );
};
