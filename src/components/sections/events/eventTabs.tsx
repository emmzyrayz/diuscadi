"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "all", label: "All Events", count: 24 },
  { id: "upcoming", label: "Upcoming", count: 8 },
  { id: "past", label: "Past Events", count: 12 },
  { id: "my-events", label: "My Events", count: 3 },
];

export const EventsTabs = () => {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        {/* TAB CONTROLS */}
        <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-[1.25rem] relative">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-4 py-2 text-sm font-bold transition-all duration-300 rounded-xl flex items-center gap-2 cursor-pointer",
                  isActive
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {/* Framer Motion Layout Animation for the 'active' slider */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white shadow-sm rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                <span className="relative z-10">{tab.label}</span>

                {/* Counter Badge */}
                <span
                  className={cn(
                    "relative z-10 text-[10px] px-1.5 py-0.5 rounded-md font-black transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-200 text-slate-400",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* VIEW TOGGLE (Optional visual flair) */}
        <div className="hidden md:flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Sorting by: Recently Added</span>
        </div>
      </div>
    </section>
  );
};
