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

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  delay: number;
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  colorClass,
  delay,
}: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={cn('bg-white', 'p-6', 'rounded-[2rem]', 'border', 'border-slate-100', 'shadow-sm', 'hover:shadow-md', 'transition-shadow', 'flex', 'flex-col', 'justify-between', 'min-h-[160px]')}
  >
    <div
      className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
        colorClass,
      )}
    >
      <Icon className={cn('w-6', 'h-6')} />
    </div>
    <div>
      <h3 className={cn('text-3xl', 'font-black', 'text-slate-900', 'tracking-tighter')}>
        {value.toString().padStart(2, "0")}
      </h3>
      <p className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-[0.2em]', 'text-slate-400', 'mt-1')}>
        {label}
      </p>
    </div>
  </motion.div>
);

export const TicketStatsOverview = () => {
  const stats = [
    {
      label: "Total Tickets",
      value: 12,
      icon: LuTicket,
      color: "bg-slate-100 text-slate-600",
      delay: 0.1,
    },
    {
      label: "Upcoming",
      value: 3,
      icon: LuCalendarCheck,
      color: "bg-orange-100 text-primary",
      delay: 0.2,
    },
    {
      label: "Attended",
      value: 8,
      icon: LuCircleCheck,
      color: "bg-emerald-100 text-emerald-600",
      delay: 0.3,
    },
    {
      label: "Cancelled",
      value: 1,
      icon: LuBan,
      color: "bg-rose-100 text-rose-600",
      delay: 0.4,
    },
  ];

  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', '-mt-8', 'relative', 'z-20')}>
      <div className={cn('grid', 'grid-cols-2', 'lg:grid-cols-4', 'gap-4', 'md:gap-6')}>
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            colorClass={stat.color}
            delay={stat.delay}
          />
        ))}
      </div>
    </section>
  );
};
