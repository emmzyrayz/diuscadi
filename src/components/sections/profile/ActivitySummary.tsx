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

export interface ActivityStats {
  ticketsOwned: number;
  eventsAttended: number;
  upcomingEvents: number;
}

interface ActivitySummarySectionProps {
  stats: ActivityStats;
}

export const ActivitySummarySection = ({
  stats,
}: ActivitySummarySectionProps) => {
  return (
    <section className="w-full">
      <div className={cn('flex', 'items-center', 'gap-3', 'mb-6')}>
        <div className={cn('w-8', 'h-8', 'rounded-lg', 'bg-muted', 'flex', 'items-center', 'justify-center', 'text-muted-foreground')}>
          <LuActivity className={cn('w-4', 'h-4')} />
        </div>
        <h3 className={cn('text-xl', 'font-black', 'text-foreground', 'tracking-tight')}>
          Activity Summary
        </h3>
      </div>

      <div className={cn('grid', 'grid-cols-1', 'sm:grid-cols-3', 'gap-4', 'md:gap-6')}>
        <StatCard
          label="Tickets Owned"
          value={stats.ticketsOwned}
          icon={LuTicket}
          accentClass="text-blue-500"
          bgClass="bg-blue-500/10"
          delay={0.1}
        />
        <StatCard
          label="Events Attended"
          value={stats.eventsAttended}
          icon={LuCircleCheck}
          accentClass="text-emerald-500"
          bgClass="bg-emerald-500/10"
          delay={0.2}
        />
        <StatCard
          label="Upcoming Events"
          value={stats.upcomingEvents}
          icon={LuCalendarClock}
          accentClass="text-primary"
          bgClass="bg-primary/10"
          delay={0.3}
        />
      </div>
    </section>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  accentClass: string;
  bgClass: string;
  delay: number;
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  accentClass,
  bgClass,
  delay,
}: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    viewport={{ once: true }}
    className={cn(
      "glass rounded-[2rem] p-6 flex flex-col items-center text-center group",
      "hover:shadow-xl transition-all",
    )}
  >
    <div
      className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center mb-4",
        "group-hover:scale-110 transition-transform duration-300",
        bgClass,
      )}
    >
      <Icon className={cn("w-7 h-7", accentClass)} />
    </div>

    <div className="space-y-1">
      <p className={cn('text-[28px]', 'font-black', 'text-foreground', 'leading-none')}>
        {value < 10 ? `0${value}` : value}
      </p>
      <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
        {label}
      </p>
    </div>

    {/* Progress line */}
    <div className={cn('mt-4', 'w-12', 'h-1', 'bg-muted', 'rounded-full', 'overflow-hidden')}>
      <div className={cn("h-full w-2/3 rounded-full", bgClass)} />
    </div>
  </motion.div>
);
