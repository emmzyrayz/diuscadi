"use client";
import React from "react";
import {
  LuSearch,
  LuFilter,
  LuCalendar,
  LuArrowDownUp,
  LuX,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  dateFilter: string;
  onDateFilterChange: (v: string) => void;
  sort: string;
  onSortChange: (v: string) => void;
  onClearAll: () => void;
}

const dropdownCls =
  "bg-background border-2 border-border rounded-xl px-4 py-3 text-xs font-bold text-slate-600 outline-none focus:border-primary transition-all cursor-pointer appearance-none pr-10";

export const TicketFilterAndSearchBar = ({
  search,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  sort,
  onSortChange,
  onClearAll,
}: FilterBarProps) => (
  <div
    className={cn("flex", "flex-col", "xl:flex-row", "items-center", "gap-4")}
  >
    {/* Search */}
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
        onChange={(e) => onSearchChange(e.target.value)}
        className={cn(
          "w-full",
          "bg-background",
          "border-2",
          "border-border",
          "rounded-2xl",
          "pl-14",
          "pr-12",
          "py-4",
          "text-sm",
          "font-bold",
          "text-foreground",
          "outline-none",
          "focus:border-primary",
          "transition-all",
          "placeholder:text-slate-300",
        )}
      />
      {search && (
        <button
          onClick={() => onSearchChange("")}
          className={cn(
            "absolute",
            "right-4",
            "top-1/2",
            "-translate-y-1/2",
            "p-1",
            "hover:text-muted",
            "rounded-full",
            "cursor-pointer",
          )}
        >
          <LuX className={cn("w-4", "h-4", "text-muted-foreground")} />
        </button>
      )}
    </div>

    {/* Filters */}
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
      {/* Date */}
      <div className={cn("relative", "flex", "items-center")}>
        <select
          value={dateFilter}
          onChange={(e) => onDateFilterChange(e.target.value)}
          className={dropdownCls}
        >
          <option value="all">All Time</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
        <LuCalendar
          className={cn(
            "absolute",
            "right-4",
            "text-muted-foreground",
            "pointer-events-none",
            "w-4",
            "h-4",
          )}
        />
      </div>

      {/* Sort */}
      <div className={cn("relative", "flex", "items-center")}>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className={dropdownCls}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="event-date">By Event Date</option>
        </select>
        <LuArrowDownUp
          className={cn(
            "absolute",
            "right-4",
            "text-muted-foreground",
            "pointer-events-none",
            "w-4",
            "h-4",
          )}
        />
      </div>

      <button
        onClick={onClearAll}
        className={cn(
          "h-12",
          "px-4",
          "text-[10px]",
          "font-black",
          "uppercase",
          "tracking-widest",
          "text-muted-foreground",
          "hover:text-rose-500",
          "transition-colors",
          "cursor-pointer",
        )}
      >
        Clear All
      </button>
    </div>
  </div>
);
