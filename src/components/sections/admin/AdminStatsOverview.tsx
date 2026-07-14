"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuUsers,
  LuCalendar,
  LuTicket,
  LuActivity,
  LuMinus,
  LuUserCheck,
  LuBadgeCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { Analytics } from "@/context/AdminContext";
import { IconType } from "react-icons";

type ColorType = "blue" | "purple" | "emerald" | "amber" | "violet" | "teal";

interface StatCardProps {
  label: string;
  value: string;
  subLabel: string;
  icon: IconType;
  color: ColorType;
  delay?: number;
  small?: boolean;
}

interface Props {
  analytics: Analytics | null;
}

export const AdminStatsOverview = ({ analytics }: Props) => {
  // ── Totals ────────────────────────────────────────────────────────────────
  // registrations.total / checkedIn / thisMonth / attendanceRate are already
  // combined (account + unmigrated guests) in routes's contract — do NOT re-add
  // guest figures on top of them, or guests get counted twice.
  const combinedTickets = analytics?.registrations.total ?? 0;
  const combinedCheckedIn = analytics?.registrations.checkedIn ?? 0;
  const combinedThisMonth = analytics?.registrations.thisMonth ?? 0;
  const attendanceRate = analytics?.registrations.attendanceRate ?? 0;

  // Account-only and guest-only figures, kept separate for the breakdown row.
  const accountTickets = analytics?.registrations.userTotal ?? 0;
  const accountCheckedIn = analytics?.registrations.userCheckedIn ?? 0;
  const guestTickets = analytics?.registrations.guestTotalUnmigrated ?? 0;
  const guestCheckedIn = analytics?.registrations.guestCheckedIn ?? 0;

  // ── Main 4 stat cards ─────────────────────────────────────────────────────
  const mainStats: StatCardProps[] = [
    {
      label: "Platform Users",
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
      value: analytics ? String(combinedTickets) : "—",
      subLabel: `+${combinedThisMonth} this month`,
      icon: LuTicket,
      color: "emerald",
    },
    {
      label: "Attendance Rate",
      value: analytics ? `${attendanceRate}%` : "—",
      subLabel: `${combinedCheckedIn} checked in`,
      icon: LuActivity,
      color: "amber",
    },
  ];

  // ── Guest insight row ─────────────────────────────────────────────────────
  const guestStats: StatCardProps[] = [
    {
      label: "Guest Registrations",
      value: analytics ? String(guestTickets) : "—",
      subLabel: `+${analytics?.registrations.guestThisMonth ?? 0} this month`,
      icon: LuUserCheck,
      color: "violet",
      small: true,
    },
    {
      label: "Guest Check-ins",
      value: analytics ? String(guestCheckedIn) : "—",
      subLabel: `of ${guestTickets} guest tickets`,
      icon: LuBadgeCheck,
      color: "teal",
      small: true,
    },
    {
      label: "Account Tickets",
      value: analytics ? String(accountTickets) : "—",
      subLabel: `${accountCheckedIn} checked in`,
      icon: LuTicket,
      color: "blue",
      small: true,
    },
    {
      label: "Account Check-ins",
      value: analytics ? String(accountCheckedIn) : "—",
      subLabel: `of ${accountTickets} account tickets`,
      icon: LuActivity,
      color: "emerald",
      small: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* ── Main stats ── */}
      <div
        className={cn(
          "grid",
          "grid-cols-1",
          "md:grid-cols-2",
          "xl:grid-cols-4",
          "gap-6",
        )}
      >
        {mainStats.map((stat, index) => (
          <StatCard key={stat.label} {...stat} delay={0.1 + index * 0.1} />
        ))}
      </div>

      {/* ── Guest breakdown row ── */}
      <div className={cn("grid", "grid-cols-2", "xl:grid-cols-4", "gap-4")}>
        {guestStats.map((stat, index) => (
          <StatCard
            key={stat.label}
            {...stat}
            delay={0.5 + index * 0.05}
            small
          />
        ))}
      </div>
    </motion.div>
  );
};;

// ── Color map ─────────────────────────────────────────────────────────────────

const COLOR_STYLES: Record<ColorType, { card: string }> = {
  blue: { card: "bg-blue-50 text-blue-600 border-blue-100" },
  purple: { card: "bg-purple-50 text-purple-600 border-purple-100" },
  emerald: { card: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  amber: { card: "bg-amber-50 text-amber-600 border-amber-100" },
  violet: { card: "bg-violet-50 text-violet-600 border-violet-100" },
  teal: { card: "bg-teal-50 text-teal-600 border-teal-100" },
};

// ── StatCard ──────────────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  subLabel,
  icon: Icon,
  color,
  delay = 0,
  small = false,
}: StatCardProps & { delay?: number }) => {
  const styles = COLOR_STYLES[color];

  if (small) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className={cn(
          "bg-background",
          "border-2",
          "border-border",
          "rounded-[2rem]",
          "p-5",
          "flex",
          "items-center",
          "gap-4",
          "hover:border-primary/20",
          "transition-all",
          "duration-300",
        )}
      >
        <div
          className={cn(
            "w-10",
            "h-10",
            "rounded-xl",
            "flex",
            "items-center",
            "justify-center",
            "border-2",
            "shrink-0",
            styles.card,
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              "text-[9px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-[0.18em]",
              "truncate",
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "text-2xl",
              "font-black",
              "text-foreground",
              "tracking-tighter",
              "leading-none",
              "mt-0.5",
            )}
          >
            {value}
          </p>
          <p
            className={cn(
              "text-[9px]",
              "font-bold",
              "text-muted-foreground",
              "mt-1",
              "truncate",
            )}
          >
            {subLabel}
          </p>
        </div>
      </motion.div>
    );
  }

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
          <Icon className="w-7 h-7" />
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
          <LuMinus className="w-3 h-3" />
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
