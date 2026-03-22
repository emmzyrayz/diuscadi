"use client";
import React from "react";
import { IconType } from "react-icons";
import {
  LuDollarSign,
  LuTicket,
  LuUsers,
  LuCircleCheck,
  LuCalendar,
  LuUserPlus,
  LuTrendingUp,
  LuTrendingDown,
} from "react-icons/lu";
import type { Analytics } from "@/context/AdminContext";
import { cn } from "../../../../lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: IconType;
  color: string;
  bg: string;
}

interface Props {
  analytics: Analytics | null;
}

export const AdminAnalyticsOverviewStats = ({ analytics }: Props) => {
  const a = analytics;

  const cards: KPICardProps[] = [
    // Revenue is not in Analytics type — show registrations as proxy
    {
      title: "Total Registrations",
      value: a ? String(a.registrations.total) : "—",
      trend: "Live",
      isPositive: true,
      icon: LuTicket,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Tickets This Month",
      value: a ? String(a.registrations.thisMonth) : "—",
      trend: "Month",
      isPositive: true,
      icon: LuDollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Verified Users",
      value: a ? String(a.users.total) : "—",
      trend: "All",
      isPositive: true,
      icon: LuUsers,
      color: "text-foreground",
      bg: "bg-muted",
    },
    {
      title: "Check-in Rate",
      value: a ? `${a.registrations.attendanceRate}%` : "—",
      trend: "Events",
      isPositive: a ? a.registrations.attendanceRate >= 70 : true,
      icon: LuCircleCheck,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Upcoming Events",
      value: a ? String(a.events.upcoming) : "—",
      trend: "Active",
      isPositive: true,
      icon: LuCalendar,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "New Signups",
      value: a ? String(a.users.newThisMonth) : "—",
      trend: "Month",
      isPositive: true,
      icon: LuUserPlus,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
  ];

  return (
    <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'xl:grid-cols-3', '2xl:grid-cols-6', 'gap-5', 'mb-10')}>
      {cards.map((card) => (
        <KPICard key={card.title} {...card} />
      ))}
    </div>
  );
};

const KPICard = ({
  title,
  value,
  trend,
  isPositive,
  icon: Icon,
  color,
  bg,
}: KPICardProps) => (
  <div className={cn('bg-background', 'border', 'border-border', 'p-6', 'rounded-[2rem]', 'shadow-sm', 'hover:shadow-md', 'transition-all', 'group')}>
    <div className={cn('flex', 'items-center', 'justify-between', 'mb-4')}>
      <div
        className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}
      >
        <Icon className={cn('w-5', 'h-5')} />
      </div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black ${isPositive ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"}`}
      >
        {isPositive ? (
          <LuTrendingUp className={cn('w-3', 'h-3')} />
        ) : (
          <LuTrendingDown className={cn('w-3', 'h-3')} />
        )}
        {trend}
      </div>
    </div>
    <p className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-[0.2em]', 'mb-1')}>
      {title}
    </p>
    <h3 className={cn('text-2xl', 'font-black', 'text-foreground', 'tracking-tighter')}>
      {value}
    </h3>
    <div className={cn('mt-4', 'h-8', 'w-full', 'flex', 'items-end', 'gap-1')}>
      {[40, 70, 45, 90, 65, 80, 50, 85].map((h, i) => (
        <div
          key={i}
          className={`flex-1 rounded-full ${isPositive ? "bg-emerald-100" : "bg-rose-100"}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  </div>
);
