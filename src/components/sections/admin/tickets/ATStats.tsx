"use client";
import React from "react";
import { IconType } from "react-icons";
import {
  LuTicket,
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuUsers,
} from "react-icons/lu";

interface StatCardProps {
    label: string;
    value: string;
    icon: IconType;
    color: string;
    bg: string;
    description: string;
    showProgress?: number;
}

export const AdminTicketsStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
      {/* 1. TotalTicketsCard */}
      <StatCard
        label="Total Issued"
        value="2,500"
        icon={LuTicket}
        color="text-slate-900"
        bg="bg-slate-50"
        description="Total tickets generated across all events"
      />

      {/* 2. ActiveTicketsCard (Valid but not yet used) */}
      <StatCard
        label="Active / Unused"
        value="1,120"
        icon={LuClock}
        color="text-blue-600"
        bg="bg-blue-50"
        description="Valid passes awaiting check-in"
      />

      {/* 3. UsedTicketsCard (Checked-in) */}
      <StatCard
        label="Checked-In"
        value="1,280"
        icon={LuCircleCheck}
        color="text-emerald-600"
        bg="bg-emerald-50"
        description="51% Attendance rate achieved"
        showProgress={51}
      />

      {/* 4. CancelledTicketsCard */}
      <StatCard
        label="Invalidated"
        value="100"
        icon={LuCircleX}
        color="text-rose-600"
        bg="bg-rose-50"
        description="Revoked or cancelled credentials"
      />
    </div>
  );
};

/* --- Internal StatCard Component --- */
const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  bg,
  description,
  showProgress,
}: StatCardProps) => (
  <div
    className={`p-8 rounded-[2.5rem] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all group`}
  >
    <div className="flex justify-between items-start mb-6">
      <div
        className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}
      >
        <Icon className="w-7 h-7" />
      </div>
      {showProgress && (
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
            {showProgress}%
          </span>
          <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${showProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>

    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
        {label}
      </p>
      <h3 className={`text-3xl font-black ${color} tracking-tighter`}>
        {value}
      </h3>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3 leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);
