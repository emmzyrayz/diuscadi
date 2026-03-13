"use client";
import React, { useState } from "react";
import { IconType } from "react-icons";
import {
  LuLayoutGrid,
  LuTicket,
  LuUsers,
  LuRotateCcw,
  LuChevronDown,
} from "react-icons/lu";

interface FilterDropdownProps {
  icon: IconType;
  label: string;
  value: string;
  options: string[];
}

export const AdminAnalyticsFilters: React.FC = () => {
  const [activeFilters, setActiveFilters] = useState({
    event: "All Events",
    tier: "All Tiers",
    attendance: "All Attendees",
  });

  const resetFilters = () => {
    setActiveFilters({
      event: "All Events",
      tier: "All Tiers",
      attendance: "All Attendees",
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 py-6 px-8 bg-muted border border-border rounded-[2rem] mb-10">
      {/* 1. EventFilterDropdown */}
      <FilterDropdown
        icon={LuLayoutGrid}
        label="Event Context"
        value={activeFilters.event}
        options={[
          "All Events",
          "DIU Tech Summit",
          "AI Masterclass",
          "Founder Night",
        ]}
      />

      {/* 2. TicketTypeFilterDropdown */}
      <FilterDropdown
        icon={LuTicket}
        label="Ticket Tier"
        value={activeFilters.tier}
        options={["All Tiers", "VIP Pass", "Regular", "Student/Alumni"]}
      />

      {/* 3. AttendanceTypeFilterDropdown */}
      <FilterDropdown
        icon={LuUsers}
        label="User Class"
        value={activeFilters.attendance}
        options={["All Attendees", "Professional", "Student", "Exhibitor"]}
      />

      <div className="h-8 w-px bg-slate-200 mx-2 hidden lg:block" />

      {/* 4. ResetFiltersButton */}
      <button
        onClick={resetFilters}
        className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all group"
      >
        <LuRotateCcw className="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500" />
        <span className="text-[10px] font-black uppercase tracking-widest">
          Reset View
        </span>
      </button>
    </div>
  );
};

/* --- Internal Filter Dropdown --- */
const FilterDropdown = ({
  icon: Icon,
  label,
  value,
  options,
}: FilterDropdownProps) => (
  <div className="relative group min-w-[180px]">
    <button className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-background border border-border rounded-xl hover:border-foreground transition-all">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <div className="text-left">
          <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-0.5">
            {label}
          </p>
          <p className="text-[10px] font-black text-foreground uppercase tracking-tight truncate max-w-[100px]">
            {value}
          </p>
        </div>
      </div>
      <LuChevronDown className="w-3 h-3 text-slate-300" />
    </button>

    <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-background border border-border rounded-2xl shadow-2xl p-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      {options.map((opt: string) => (
        <button
          key={opt}
          className="w-full text-left px-4 py-2.5 rounded-lg text-[9px] font-black text-muted-foreground uppercase tracking-widest hover:bg-muted hover:text-foreground transition-colors"
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);
