"use client";
import React, { useState } from "react";
import {
  LuSearch,
  LuFilter,
  LuChevronDown,
  LuTrash2,
  LuArchive,
  LuArrowUpDown,
  LuMapPin,
} from "react-icons/lu";
import { cn } from "../../../../lib/utils";

// 1. TypeScript Interfaces for Filter State
interface FilterState {
  search: string;
  status: "all" | "upcoming" | "completed" | "cancelled" | "draft";
  type: "all" | "physical" | "virtual" | "hybrid";
  sort: "newest" | "oldest" | "capacity";
}

export const AdminEventsToolbar: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    type: "all",
    sort: "newest",
  });

  return (
    <div className={cn('bg-white', 'border-2', 'border-slate-100', 'rounded-[2rem]', 'p-4', 'mb-6', 'shadow-sm')}>
      <div className={cn('flex', 'flex-col', 'xl:flex-row', 'items-center', 'gap-4')}>
        {/* 1. Universal Search Input */}
        <div className={cn('relative', 'w-full', 'xl:w-96')}>
          <LuSearch className={cn('absolute', 'left-4', 'top-1/2', '-translate-y-1/2', 'text-slate-400', 'w-4', 'h-4')} />
          <input
            type="text"
            placeholder="Search by event title or ID..."
            className={cn('w-full', 'bg-slate-50', 'border', 'border-slate-100', 'rounded-xl', 'pl-11', 'pr-4', 'py-3', 'text-[11px]', 'font-bold', 'text-slate-900', 'outline-none', 'focus:ring-2', 'focus:ring-primary/20', 'focus:border-primary', 'transition-all')}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        {/* 2. Filter Group */}
        <div className={cn('flex', 'flex-wrap', 'items-center', 'gap-3', 'w-full', 'xl:w-auto')}>
          <ToolbarDropdown
            label="Status"
            icon={LuFilter}
            value={filters.status}
            options={["All", "Upcoming", "Completed", "Cancelled", "Draft"]}
          />

          <ToolbarDropdown
            label="Venue"
            icon={LuMapPin}
            value={filters.type}
            options={["All", "Physical", "Virtual", "Hybrid"]}
          />

          <ToolbarDropdown
            label="Sort"
            icon={LuArrowUpDown}
            value={filters.sort}
            options={["Newest", "Oldest", "Capacity"]}
          />

          {/* 3. Bulk Actions (Optional/Contextual) */}
          <div className={cn('h-8', 'w-px', 'bg-slate-100', 'mx-2', 'hidden', 'lg:block')} />

          <button className={cn('flex', 'items-center', 'gap-2', 'px-4', 'py-3', 'bg-rose-50', 'border', 'border-rose-100', 'rounded-xl', 'text-rose-600', 'hover:bg-rose-600', 'hover:text-white', 'transition-all', 'group')}>
            <LuTrash2 className={cn('w-4', 'h-4')} />
            <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'hidden', 'sm:inline')}>
              Bulk Delete
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* --- Internal Helper: Toolbar Dropdown --- */
interface DropdownProps {
  label: string;
  icon: React.ElementType;
  value: string;
  options: string[];
}

const ToolbarDropdown: React.FC<DropdownProps> = ({
  label,
  icon: Icon,
  value,
  options,
}) => (
  <div className={cn('relative', 'group')}>
    <button className={cn('flex', 'items-center', 'gap-3', 'px-4', 'py-3', 'bg-white', 'border', 'border-slate-200', 'rounded-xl', 'hover:border-slate-400', 'transition-all')}>
      <Icon className={cn('w-3.5', 'h-3.5', 'text-slate-400')} />
      <div className="text-left">
        <p className={cn('text-[8px]', 'font-black', 'text-slate-400', 'uppercase', 'leading-none', 'mb-0.5')}>
          {label}
        </p>
        <p className={cn('text-[10px]', 'font-black', 'text-slate-900', 'uppercase', 'tracking-tight', 'capitalize')}>
          {value}
        </p>
      </div>
      <LuChevronDown className={cn('w-3.5', 'h-3.5', 'text-slate-300', 'ml-1')} />
    </button>

    {/* Dropdown Menu - Simplified for now */}
    <div className={cn('absolute', 'top-full', 'left-0', 'mt-2', 'w-48', 'bg-white', 'border', 'border-slate-100', 'rounded-2xl', 'shadow-xl', 'p-2', 'hidden', 'group-hover:block', 'z-30', 'animate-in', 'fade-in', 'zoom-in-95', 'duration-200')}>
      {options.map((opt) => (
        <button
          key={opt}
          className={cn('w-full', 'text-left', 'px-4', 'py-2.5', 'rounded-xl', 'text-[10px]', 'font-bold', 'text-slate-600', 'uppercase', 'hover:bg-slate-50', 'hover:text-primary', 'transition-colors')}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);