"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconType } from "react-icons";
import {
  LuSearch,
  LuLayoutGrid,
  LuActivity,
  LuCalendar,
  LuArrowUpDown,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

// TypeScript Interfaces
interface TicketFilters {
  search: string;
  event: string;
  status: string;
  date: string;
  sort: string;
}

interface AdminTicketsToolbarProps {
  onSearchChange?: (searchValue: string) => void;
}

interface TicketDropdownProps {
  label: string;
  icon: IconType;
  current: string;
  options: string[];
  onChange?: (value: string) => void;
  delay?: number;
}

export const AdminTicketsToolbar: React.FC<AdminTicketsToolbarProps> = ({
  onSearchChange,
}) => {
  const [filters, setFilters] = useState<TicketFilters>({
    search: "",
    event: "All Events",
    status: "Upcoming",
    date: "All Time",
    sort: "Newest",
  });

  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, search: value });
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const updateFilter = (key: keyof TicketFilters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "bg-white",
        "border-2",
        "border-slate-100",
        "rounded-[2.5rem]",
        "p-6",
        "mb-8",
        "shadow-sm",
      )}
    >
      <div
        className={cn(
          "flex",
          "flex-col",
          "2xl:flex-row",
          "items-center",
          "gap-6",
        )}
      >
        {/* 1. Universal Ticket Search */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={cn("relative", "w-full", "2xl:w-[480px]")}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
            className={cn(
              "absolute",
              "left-6",
              "top-1/2",
              "-translate-y-1/2",
              "text-slate-400",
            )}
          >
            <LuSearch className={cn("w-5", "h-5")} />
          </motion.div>
          <input
            type="text"
            placeholder="Search Name, Email, or Ticket Code..."
            className={cn(
              "w-full",
              "bg-slate-50",
              "border",
              "border-slate-100",
              "rounded-2xl",
              "pl-14",
              "pr-6",
              "py-5",
              "text-[11px]",
              "font-black",
              "text-slate-900",
              "placeholder:text-slate-400",
              "outline-none",
              "focus:ring-4",
              "focus:ring-primary/10",
              "focus:border-primary",
              "transition-all",
              "uppercase",
              "tracking-tighter",
            )}
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </motion.div>

        {/* 2. Filter Matrix */}
        <div
          className={cn(
            "flex",
            "flex-wrap",
            "items-center",
            "gap-3",
            "w-full",
            "2xl:w-auto",
          )}
        >
          <TicketDropdown
            label="Event"
            icon={LuLayoutGrid}
            current={filters.event}
            options={["All Events", "Summit 2026", "AI Workshop", "Grad Gala"]}
            onChange={(value) => updateFilter("event", value)}
            delay={0.2}
          />

          <TicketDropdown
            label="Status"
            icon={LuActivity}
            current={filters.status}
            options={["Upcoming", "Used", "Cancelled", "Expired"]}
            onChange={(value) => updateFilter("status", value)}
            delay={0.25}
          />

          <TicketDropdown
            label="Timeframe"
            icon={LuCalendar}
            current={filters.date}
            options={["All Time", "Today", "This Week", "Next Week"]}
            onChange={(value) => updateFilter("date", value)}
            delay={0.3}
          />

          <TicketDropdown
            label="Sort"
            icon={LuArrowUpDown}
            current={filters.sort}
            options={["Newest", "Oldest", "Owner Name", "Tier"]}
            onChange={(value) => updateFilter("sort", value)}
            delay={0.35}
          />
        </div>
      </div>
    </motion.div>
  );
};

/* --- Internal Component: TicketDropdown --- */
const TicketDropdown: React.FC<TicketDropdownProps> = ({
  label,
  icon: Icon,
  current,
  options,
  onChange,
  delay = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: string) => {
    if (onChange) {
      onChange(option);
    }
    setIsOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "relative",
        "group",
        "flex-1",
        "min-w-[150px]",
        "lg:flex-none",
      )}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <motion.button
        whileHover={{ scale: 1.02, borderColor: "rgb(15 23 42)" }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full",
          "flex",
          "items-center",
          "justify-between",
          "gap-4",
          "px-5",
          "py-4",
          "bg-white",
          "border",
          "border-slate-200",
          "rounded-2xl",
          "transition-all",
          "group",
        )}
      >
        <div className={cn("flex", "items-center", "gap-3", "text-left")}>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Icon
              className={cn(
                "w-4",
                "h-4",
                "text-slate-400",
                "group-hover:text-primary",
                "transition-colors",
              )}
            />
          </motion.div>
          <div>
            <p
              className={cn(
                "text-[8px]",
                "font-black",
                "text-slate-400",
                "uppercase",
                "leading-none",
                "mb-1",
                "tracking-widest",
              )}
            >
              {label}
            </p>
            <p
              className={cn(
                "text-[10px]",
                "font-black",
                "text-slate-900",
                "uppercase",
                "tracking-tight",
                "truncate",
                "max-w-[80px]",
              )}
            >
              {current}
            </p>
          </div>
        </div>
      </motion.button>

      {/* Dropdown Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "absolute",
              "top-full",
              "left-0",
              "mt-2",
              "w-full",
              "min-w-[200px]",
              "bg-white",
              "border",
              "border-slate-100",
              "rounded-2xl",
              "shadow-2xl",
              "p-2",
              "z-50",
            )}
          >
            {options.map((opt, index) => (
              <motion.button
                key={opt}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelect(opt)}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full",
                  "text-left",
                  "px-4",
                  "py-3",
                  "rounded-xl",
                  "text-[10px]",
                  "font-black",
                  "text-slate-600",
                  "uppercase",
                  "tracking-widest",
                  "hover:bg-slate-50",
                  "hover:text-primary",
                  "transition-colors",
                  "flex",
                  "items-center",
                  "justify-between",
                )}
              >
                {opt}
                <AnimatePresence>
                  {current === opt && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                      }}
                      className={cn(
                        "w-1.5",
                        "h-1.5",
                        "rounded-full",
                        "bg-primary",
                      )}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Export types
export type { AdminTicketsToolbarProps, TicketFilters, TicketDropdownProps };