"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuTicket,
  LuCalendarCheck,
  LuCircleCheck,
  LuBan,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

interface Stats {
  total: number;
  upcoming: number;
  used: number;
  cancelled: number;
}

const STAT_CONFIG = [
  {
    key: "total" as const,
    label: "Total Tickets",
    icon: LuTicket,
    color: "text-muted text-slate-600",
    delay: 0.1,
  },
  {
    key: "upcoming" as const,
    label: "Upcoming",
    icon: LuCalendarCheck,
    color: "bg-orange-100 text-primary",
    delay: 0.2,
  },
  {
    key: "used" as const,
    label: "Attended",
    icon: LuCircleCheck,
    color: "bg-emerald-100 text-emerald-600",
    delay: 0.3,
  },
  {
    key: "cancelled" as const,
    label: "Cancelled",
    icon: LuBan,
    color: "bg-rose-100 text-rose-600",
    delay: 0.4,
  },
];

export const TicketStatsOverview = ({ stats }: { stats: Stats }) => (
  <section
    className={cn(
      "w-full",
      "max-w-7xl",
      "mx-auto",
      "px-4",
      "sm:px-6",
      "lg:px-8",
      "py-8",
    )}
  >
    <div
      className={cn(
        "grid",
        "grid-cols-2",
        "lg:grid-cols-4",
        "gap-4",
        "md:gap-6",
      )}
    >
      {STAT_CONFIG.map(({ key, label, icon: Icon, color, delay }) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay }}
          className={cn(
            "bg-background",
            "p-6",
            "rounded-[2rem]",
            "border",
            "border-border",
            "shadow-sm",
            "hover:shadow-md",
            "transition-shadow",
            "flex",
            "flex-col",
            "justify-between",
            "min-h-[160px]",
          )}
        >
          <div
            className={cn(
              "w-12",
              "h-12",
              "rounded-2xl",
              "flex",
              "items-center",
              "justify-center",
              "mb-4",
              color,
            )}
          >
            <Icon className={cn("w-6", "h-6")} />
          </div>
          <div>
            <h3
              className={cn(
                "text-3xl",
                "font-black",
                "text-foreground",
                "tracking-tighter",
              )}
            >
              {String(stats[key]).padStart(2, "0")}
            </h3>
            <p
              className={cn(
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-[0.2em]",
                "text-muted-foreground",
                "mt-1",
              )}
            >
              {label}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);
