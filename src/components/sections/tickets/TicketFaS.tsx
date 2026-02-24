"use client";
import React, { useState } from "react";
import {
  LuSearch,
  LuFilter,
  LuCalendar,
  LuArrowDownUp,
  LuX,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

export const TicketFilterAndSearchBar = () => {
  const [search, setSearch] = useState("");

  const dropdownClasses =
    "bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 outline-hidden focus:border-primary transition-all cursor-pointer appearance-none pr-10";
  const wrapperClasses = "relative flex items-center";
  const iconClasses =
    "absolute right-4 text-slate-400 pointer-events-none w-4 h-4";

  return (
    <section
      className={cn(
        "w-full",
        "max-w-7xl",
        "mx-auto",
        "px-4",
        "sm:px-6",
        "lg:px-8",
        "py-10",
      )}
    >
      <div
        className={cn(
          "flex",
          "flex-col",
          "xl:flex-row",
          "items-center",
          "gap-4",
        )}
      >
        {/* 1. Search Input (Expands to fill space) */}
        <div className={cn("relative", "w-full", "xl:flex-1", "group")}>
          <LuSearch
            className={cn(
              "absolute",
              "left-5",
              "top-1/2",
              "-translate-y-1/2",
              "text-slate-300",
              "group-focus-within:text-primary",
              "transition-colors",
              "w-5",
              "h-5",
            )}
          />
          <input
            type="text"
            placeholder="Search by event name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full",
              "bg-white",
              "border-2",
              "border-slate-100",
              "rounded-2xl",
              "pl-14",
              "pr-12",
              "py-4",
              "text-sm",
              "font-bold",
              "text-slate-900",
              "outline-hidden",
              "focus:border-primary",
              "focus:shadow-lg",
              "focus:shadow-primary/5",
              "transition-all",
              "placeholder:text-slate-300",
            )}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className={cn(
                "absolute",
                "right-4",
                "top-1/2",
                "-translate-y-1/2",
                "p-1",
                "hover:bg-slate-100",
                "rounded-full",
                "transition-colors",
              )}
            >
              <LuX className={cn("w-4", "h-4", "text-slate-400")} />
            </button>
          )}
        </div>

        {/* 2. Filter Group */}
        <div
          className={cn(
            "flex",
            "flex-wrap",
            "items-center",
            "gap-3",
            "w-full",
            "xl:w-auto",
          )}
        >
          {/* Status Filter */}
          <div className={wrapperClasses}>
            <select className={dropdownClasses}>
              <option>All Status</option>
              <option>Upcoming</option>
              <option>Used</option>
              <option>Cancelled</option>
            </select>
            <LuFilter className={iconClasses} />
          </div>

          {/* Date Filter */}
          <div className={wrapperClasses}>
            <select className={dropdownClasses}>
              <option>All Time</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
            <LuCalendar className={iconClasses} />
          </div>

          {/* Sort Filter */}
          <div className={wrapperClasses}>
            <select className={dropdownClasses}>
              <option>Newest First</option>
              <option>Oldest First</option>
              <option>By Event Date</option>
            </select>
            <LuArrowDownUp className={iconClasses} />
          </div>

          {/* Optional: Clear Filters */}
          <button
            className={cn(
              "h-12",
              "px-4",
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "text-slate-400",
              "hover:text-rose-500",
              "transition-colors",
            )}
          >
            Clear All
          </button>
        </div>
      </div>
    </section>
  );
};
