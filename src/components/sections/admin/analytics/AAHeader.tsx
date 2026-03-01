"use client";
import React, { useState } from "react";
import {
  LuChartBar,
  LuCalendar,
  LuDownload,
  LuChevronDown,
  LuTrendingUp,
} from "react-icons/lu";

export const AdminAnalyticsHeader: React.FC = () => {
  const [dateRange, setDateRange] = useState("Last 30 days");

  return (
    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-10">
      {/* 1. Identity & Narrative */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-primary shadow-xl shadow-slate-900/20 border border-white/10">
            <LuChartBar className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                Analytics Dashboard
              </h1>
              <div className="hidden sm:flex px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full items-center gap-1.5">
                <LuTrendingUp className="w-3 h-3 text-emerald-600" />
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                  Live Insights
                </span>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
              Track platform growth, attendance, and revenue insights
            </p>
          </div>
        </div>
      </div>

      {/* 2. Global Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* DateRangePicker */}
        <div className="relative group">
          <button className="flex items-center gap-3 px-5 py-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-900 transition-all">
            <LuCalendar className="w-4 h-4 text-slate-400" />
            <div className="text-left">
              <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1 tracking-widest">
                Timeframe
              </p>
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                {dateRange} <LuChevronDown className="w-3 h-3" />
              </p>
            </div>
          </button>

          {/* Dropdown Menu */}
          <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 hidden group-hover:block z-100 animate-in fade-in zoom-in-95 duration-200">
            {[
              "Today",
              "Last 7 days",
              "Last 30 days",
              "Last 90 days",
              "Custom Range",
            ].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className="w-full text-left px-4 py-3 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-primary transition-colors flex items-center justify-between"
              >
                {range}
                {dateRange === range && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ExportAnalyticsButton */}
        <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-primary hover:text-slate-900 transition-all shadow-2xl shadow-slate-900/10 group">
          <LuDownload className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-[0.15em]">
            Generate Report
          </span>
        </button>
      </div>
    </div>
  );
};
