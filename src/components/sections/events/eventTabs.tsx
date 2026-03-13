"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TabCount } from "@/app/events/page";

interface EventsTabsProps {
  counts: TabCount;
}

export const EventsTabs = ({ counts }: EventsTabsProps) => {
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", label: "All Events", count: counts.all },
    { id: "upcoming", label: "Upcoming", count: counts.upcoming },
    { id: "past", label: "Past Events", count: counts.past },
    { id: "my-events", label: "My Events", count: 0 }, // loaded client-side when connected to context
  ];

  return (
    <section
      className={cn(
        "w-full",
        "max-w-7xl",
        "mx-auto",
        "px-4",
        "sm:px-6",
        "lg:px-8",
        "mt-8",
      )}
    >
      <div
        className={cn(
          "flex",
          "items-center",
          "justify-between",
          "border-b",
          "border-border",
          "pb-4",
        )}
      >
        <div
          className={cn(
            "flex",
            "items-center",
            "gap-1",
            "text-muted/50",
            "p-1.5",
            "rounded-[1.25rem]",
            "relative",
          )}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-4 py-2 text-sm font-bold transition-all duration-300 rounded-xl flex items-center gap-2 cursor-pointer",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-slate-700",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={cn(
                      "absolute",
                      "inset-0",
                      "bg-background",
                      "shadow-sm",
                      "rounded-xl",
                    )}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className={cn("relative", "z-10")}>{tab.label}</span>
                <span
                  className={cn(
                    "relative z-10 text-[10px] px-1.5 py-0.5 rounded-md font-black transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-200 text-muted-foreground",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <div
          className={cn(
            "hidden",
            "md:flex",
            "items-center",
            "gap-4",
            "text-[10px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "text-muted-foreground",
          )}
        >
          <span>Sorting by: Recently Added</span>
        </div>
      </div>
    </section>
  );
};
