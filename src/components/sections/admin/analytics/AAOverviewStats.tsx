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

interface KPICardProps {
    title: string;
    value: string;
    trend: string;
    isPositive: boolean;
    icon: IconType;
    color: string;
    bg: string;
}

export const AdminAnalyticsOverviewStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-5 mb-10">
      {/* 1. TotalRevenueCard */}
      <KPICard
        title="Gross Revenue"
        value="$142,850"
        trend="+14.2%"
        isPositive={true}
        icon={LuDollarSign}
        color="text-emerald-600"
        bg="bg-emerald-50"
      />

      {/* 2. TotalTicketsIssuedCard */}
      <KPICard
        title="Tickets Issued"
        value="3,240"
        trend="+8.1%"
        isPositive={true}
        icon={LuTicket}
        color="text-blue-600"
        bg="bg-blue-50"
      />

      {/* 3. TotalAttendeesCard */}
      <KPICard
        title="Verified Users"
        value="1,850"
        trend="+12.4%"
        isPositive={true}
        icon={LuUsers}
        color="text-slate-900"
        bg="bg-slate-50"
      />

      {/* 4. AttendanceRateCard */}
      <KPICard
        title="Check-in Rate"
        value="68.2%"
        trend="-2.1%"
        isPositive={false}
        icon={LuCircleCheck}
        color="text-amber-600"
        bg="bg-amber-50"
      />

      {/* 5. ActiveEventsCard */}
      <KPICard
        title="Live Events"
        value="12"
        trend="0%"
        isPositive={true}
        icon={LuCalendar}
        color="text-indigo-600"
        bg="bg-indigo-50"
      />

      {/* 6. NewUsersCard */}
      <KPICard
        title="New Signups"
        value="412"
        trend="+24.5%"
        isPositive={true}
        icon={LuUserPlus}
        color="text-rose-600"
        bg="bg-rose-50"
      />
    </div>
  );
};

/* --- Internal KPI Card Component --- */
const KPICard = ({
  title,
  value,
  trend,
  isPositive,
  icon: Icon,
  color,
  bg,
}: KPICardProps) => (
  <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div
        className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Trend Indicator */}
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black ${
          isPositive
            ? "text-emerald-600 bg-emerald-50"
            : "text-rose-600 bg-rose-50"
        }`}
      >
        {isPositive ? (
          <LuTrendingUp className="w-3 h-3" />
        ) : (
          <LuTrendingDown className="w-3 h-3" />
        )}
        {trend}
      </div>
    </div>

    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
        {title}
      </p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
        {value}
      </h3>
    </div>

    {/* Mini Sparkline Placeholder */}
    <div className="mt-4 h-8 w-full flex items-end gap-1">
      {[40, 70, 45, 90, 65, 80, 50, 85].map((h, i) => (
        <div
          key={i}
          className={`flex-1 rounded-full ${isPositive ? "bg-emerald-100" : "bg-rose-100"} group-hover:opacity-80 transition-all`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  </div>
);
