"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type StatusFilter = "All" | "Upcoming" | "Used" | "Cancelled";

interface TicketTabsProps {
  activeTab: StatusFilter;
  onTabChange: (tab: StatusFilter) => void;
  counts: {
    total: number;
    upcoming: number;
    used: number;
    cancelled: number;
  };
}

export const TicketTabs = ({
  activeTab,
  onTabChange,
  counts,
}: TicketTabsProps) => {
  const tabs: { id: StatusFilter; label: string; count: number }[] = [
    { id: "All", label: "All Tickets", count: counts.total },
    { id: "Upcoming", label: "Upcoming", count: counts.upcoming },
    { id: "Used", label: "Past Events", count: counts.used },
    { id: "Cancelled", label: "Cancelled", count: counts.cancelled },
  ];

  return (
    <div
      className={cn(
        "flex",
        "flex-wrap",
        "items-center",
        "gap-2",
        "p-1.5",
        "text-muted",
        "w-fit",
        "rounded-[1.5rem]",
        "border",
        "border-border",
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer",
              isActive
                ? "text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTicketTab"
                className={cn(
                  "absolute",
                  "inset-0",
                  "bg-foreground",
                  "rounded-2xl",
                  "z-0",
                )}
                transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              />
            )}
            <span className={cn("relative", "z-10")}>{tab.label}</span>
            <span
              className={cn(
                "relative z-10 px-1.5 py-0.5 rounded-md text-[9px] font-bold",
                isActive
                  ? "bg-background/20 text-background"
                  : "bg-slate-200 text-muted-foreground",
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
