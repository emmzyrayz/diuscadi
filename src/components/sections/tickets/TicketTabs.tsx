"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type StatusType = "All" | "Upcoming" | "Used" | "Cancelled";

export const TicketTabs = () => {
  const [activeTab, setActiveTab] = useState<StatusType>("All");

  const tabs: { id: StatusType; label: string; count: number }[] = [
    { id: "All", label: "All Tickets", count: 12 },
    { id: "Upcoming", label: "Upcoming", count: 3 },
    { id: "Used", label: "Past Events", count: 8 },
    { id: "Cancelled", label: "Cancelled", count: 1 },
  ];

  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mb-8')}>
      <div className={cn('flex', 'flex-wrap', 'items-center', 'gap-2', 'p-1.5', 'bg-slate-100', 'w-fit', 'rounded-[1.5rem]', 'border', 'border-slate-200')}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                isActive ? "text-white" : "text-slate-500 hover:text-slate-900",
              )}
            >
              {/* Active Background Animation */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={cn('absolute', 'inset-0', 'bg-slate-900', 'rounded-2xl', 'z-0')}
                  transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                />
              )}

              <span className={cn('relative', 'z-10')}>{tab.label}</span>

              {/* Dynamic Count Badge */}
              <span
                className={cn(
                  "relative z-10 px-1.5 py-0.5 rounded-md text-[9px] font-bold",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-500",
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
