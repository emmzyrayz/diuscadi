"use client";
import React from "react";
import {
  LuTrophy,
  LuChartBar
} from "react-icons/lu";

export const AdminAnalyticsEventPerformanceSection: React.FC = () => {
  const PERFORMANCE_DATA = [
    {
      name: "Tech Summit 2026",
      issued: 1200,
      attendance: "92%",
      revenue: "$45,000",
      fill: 100,
      status: "Sold Out",
    },
    {
      name: "AI Masterclass",
      issued: 450,
      attendance: "88%",
      revenue: "$12,500",
      fill: 90,
      status: "Active",
    },
    {
      name: "Founder Night",
      issued: 300,
      attendance: "75%",
      revenue: "$8,400",
      fill: 60,
      status: "Active",
    },
    {
      name: "Web3 Meetup",
      issued: 150,
      attendance: "95%",
      revenue: "$3,200",
      fill: 30,
      status: "Completed",
    },
  ];

  return (
    <div className="space-y-8 mb-16">
      {/* 1. Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <LuTrophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
              Event Performance
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Benchmarking success across the portfolio
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-8">
        {/* 2. TopPerformingEventsTable */}
        <div className="2xl:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
              Performance Ledger
            </h3>
            <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
              View All Events
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Event
                  </th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Issued
                  </th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Attendance
                  </th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Revenue
                  </th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Fill Rate
                  </th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {PERFORMANCE_DATA.map((event, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-5 text-[11px] font-black text-slate-900 uppercase tracking-tight">
                      {event.name}
                    </td>
                    <td className="px-6 py-5 text-[11px] font-bold text-slate-600">
                      {event.issued}
                    </td>
                    <td className="px-6 py-5 text-[11px] font-bold text-emerald-600">
                      {event.attendance}
                    </td>
                    <td className="px-6 py-5 text-[11px] font-bold text-slate-900">
                      {event.revenue}
                    </td>
                    <td className="px-6 py-5">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-slate-900 rounded-full`}
                          style={{ width: `${event.fill}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span
                        className={`text-[8px] font-black uppercase px-2 py-1 rounded ${
                          event.status === "Sold Out"
                            ? "bg-rose-50 text-rose-600"
                            : event.status === "Completed"
                              ? "bg-slate-100 text-slate-400"
                              : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. EventPerformanceChart (Popularity Comparison) */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm flex flex-col">
          <div className="space-y-1 mb-10">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <LuChartBar className="w-4 h-4 text-primary" /> Popularity Mix
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Market share by ticket volume
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center relative">
            {/*  */}
            <div className="w-48 h-48 rounded-full border-16 border-slate-900 border-t-primary border-l-emerald-500 border-r-indigo-500 rotate-45" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900">2.5k</span>
              <span className="text-[8px] font-black text-slate-400 uppercase">
                Total Tickets
              </span>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[9px] font-black text-slate-600 uppercase">
                Tech Summit
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-black text-slate-600 uppercase">
                AI Master
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
