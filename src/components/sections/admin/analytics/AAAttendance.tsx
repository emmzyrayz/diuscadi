"use client";
import React from "react";
import { IconType } from "react-icons";
import {
  LuUsers,
  LuClock,
  LuFlame,
  LuUserMinus,
  LuChevronRight,
  LuActivity,
} from "react-icons/lu";

interface MetricCardProps {
    icon: IconType;
    label: string;
    value: string;
    sub: string;
    color: string;
}

export const AdminAnalyticsAttendanceSection: React.FC = () => {
  return (
    <div className="space-y-8 mb-16">
      {/* 1. Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <LuActivity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
              Attendance Insights
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Physical venue flow & entry behavior
            </p>
          </div>
        </div>
      </div>

      {/* 2. Attendance Chart Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* CheckInHeatmapChart (Time vs Volume) */}
        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Entry Velocity Heatmap
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Arrival volume across the event day
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-100" />
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                Low
              </span>
              <div className="w-12 h-2 bg-linear-to-r from-blue-100 to-blue-600 rounded-full" />
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                High
              </span>
            </div>
          </div>

          {/* Visualizing the Heatmap Grid */}
          <div className="grid grid-cols-12 gap-2 h-48">
            {[...Array(24)].map((_, i) => {
              // Mocking peak hours around 9 AM - 11 AM
              const intensity =
                i >= 8 && i <= 11
                  ? "bg-blue-600"
                  : i >= 12 && i <= 14
                    ? "bg-blue-300"
                    : "bg-blue-50";
              return (
                <div key={i} className="flex flex-col gap-1 items-center">
                  <div
                    className={`w-full h-full rounded-lg ${intensity} opacity-80 hover:opacity-100 transition-all cursor-pointer`}
                  />
                  <span className="text-[8px] font-bold text-slate-300">
                    {i}:00
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* PeakEntryTimeChart (Quick Look) */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <LuFlame className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight">
              Rush Hour Peak: <span className="text-primary">09:15 AM</span>
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
              42% of total attendees arrived within this 30-minute window.
              Recommend doubling gate staff for future events.
            </p>
          </div>

          <div className="pt-8 border-t border-white/10">
            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:gap-4 transition-all">
              View Staffing Suggestions <LuChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Attendance Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          icon={LuUsers}
          label="Actual Attendance"
          value="1,420"
          sub="of 1,850 registered"
          color="text-blue-600"
        />
        <MetricCard
          icon={LuUserMinus}
          label="No-Show Rate"
          value="23.2%"
          sub="Expected < 15%"
          color="text-rose-500"
        />
        <MetricCard
          icon={LuClock}
          label="Avg. Check-in Time"
          value="18s"
          sub="Gate efficiency"
          color="text-emerald-500"
        />
      </div>
    </div>
  );
};

/* --- Internal Metric Card --- */
const MetricCard = ({ icon: Icon, label, value, sub, color }: MetricCardProps) => (
  <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
        {label}
      </span>
    </div>
    <div className="flex items-baseline gap-3">
      <h4 className="text-3xl font-black text-slate-900 tracking-tighter">
        {value}
      </h4>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {sub}
      </span>
    </div>
  </div>
);
