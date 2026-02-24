"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuTicket,
  LuCircleCheck,
  LuCalendarClock,
  LuActivity,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

// 1. Define Strict TypeScript Interfaces
export interface ActivityStats {
  ticketsOwned: number;
  eventsAttended: number;
  upcomingEvents: number;
}

interface ActivitySummaryProps {
  stats: ActivityStats;
}

export const ActivitySummarySection = ({ stats }: ActivitySummaryProps) => {
  return (
    <section className="w-full">
      {/* Section Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
          <LuActivity className="w-4 h-4" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Activity Summary
        </h3>
      </div>

      {/* 3-Column Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          label="Tickets Owned"
          value={stats.ticketsOwned}
          icon={LuTicket}
          color="text-blue-600"
          bg="bg-blue-50"
          delay={0.1}
        />

        <StatCard
          label="Events Attended"
          value={stats.eventsAttended}
          icon={LuCircleCheck}
          color="text-emerald-600"
          bg="bg-emerald-50"
          delay={0.2}
        />

        <StatCard
          label="Upcoming Events"
          value={stats.upcomingEvents}
          icon={LuCalendarClock}
          color="text-primary"
          bg="bg-orange-50"
          delay={0.3}
        />
      </div>
    </section>
  );
};

// 2. Internal StatCard Component
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  delay: number;
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  bg,
  delay,
}: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    viewport={{ once: true }}
    className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 flex flex-col items-center text-center group hover:border-primary/20 hover:shadow-xl hover:shadow-slate-200/50 transition-all"
  >
    <div
      className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-500",
        bg,
      )}
    >
      <Icon className={cn("w-7 h-7", color)} />
    </div>

    <div className="space-y-1">
      <p className="text-[28px] font-black text-slate-900 leading-none">
        {value < 10 ? `0${value}` : value}
      </p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </p>
    </div>

    {/* Subtle Progress Indicator or Sparkle */}
    <div className="mt-4 w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={cn("h-full w-2/3 rounded-full", color.replace("text", "bg"))}
      />
    </div>
  </motion.div>
);
