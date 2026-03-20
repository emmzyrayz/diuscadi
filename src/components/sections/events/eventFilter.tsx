"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuSearch,
  LuSlidersHorizontal,
  LuMapPin,
  LuCalendar,
  LuTags,
  LuBanknote,
  LuCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

// ── Static filter options ─────────────────────────────────────────────────────
// Location, price, and date are static — they don't come from the DB.
// Categories are passed as a prop from the parent page which fetches them.

const LOCATION_OPTIONS = [
  "All Locations",
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
  "Benin City",
  "Enugu",
  "Kano",
  "Ibadan",
  "Online",
];

const PRICE_OPTIONS = [
  "All Prices",
  "Free",
  "Under ₦5,000",
  "₦5,000 - ₦10,000",
  "Above ₦10,000",
];

const DATE_OPTIONS = ["All Dates", "Today", "This Week", "This Month"];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FilterState {
  status: string;
  location: string;
  category: string;
  price: string;
  date: string;
  search: string;
}

interface EventsFilterBarProps {
  /** Category list from DB — passed from the server page */
  categories?: string[];
  /** Called whenever any filter changes so the parent can filter the grid */
  onFilterChange?: (filters: FilterState) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const EventsFilterBar = ({
  categories = [],
  onFilterChange,
}: EventsFilterBarProps) => {
  const categoryOptions = ["All Categories", ...categories];

  const [filters, setFilters] = useState<FilterState>({
    status: "All",
    location: "All Locations",
    category: "All Categories",
    price: "All Prices",
    date: "All Dates",
    search: "",
  });

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilterChange?.(next);
  };

  const handleReset = () => {
    const reset: FilterState = {
      status: "All",
      location: "All Locations",
      category: "All Categories",
      price: "All Prices",
      date: "All Dates",
      search: "",
    };
    setFilters(reset);
    onFilterChange?.(reset);
  };

  const hasActiveFilters =
    filters.status !== "All" ||
    filters.location !== "All Locations" ||
    filters.category !== "All Categories" ||
    filters.price !== "All Prices" ||
    filters.date !== "All Dates" ||
    filters.search !== "";

  return (
    <motion.section
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "sticky",
        "top-[72px]",
        "z-30",
        "w-full",
        "bg-background/80",
        "backdrop-blur-md",
        "border-b",
        "border-border",
      )}
    >
      <div
        className={cn(
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "py-4",
        )}
      >
        <div
          className={cn(
            "flex",
            "flex-col",
            "lg:flex-row",
            "items-center",
            "gap-4",
          )}
        >
          {/* Search */}
          <div className={cn("relative", "w-full", "lg:w-96", "group")}>
            <LuSearch
              className={cn(
                "absolute",
                "left-4",
                "top-1/2",
                "-translate-y-1/2",
                "w-4",
                "h-4",
                "text-muted-foreground",
                "group-focus-within:text-primary",
                "transition-colors",
              )}
            />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search by event name or keyword..."
              className={cn(
                "w-full",
                "pl-11",
                "pr-4",
                "py-3",
                "bg-muted",
                "border",
                "border-border",
                "rounded-2xl",
                "text-sm",
                "focus:outline-none",
                "focus:ring-2",
                "focus:ring-primary/10",
                "focus:bg-background",
                "transition-all",
              )}
            />
          </div>

          <div
            className={cn(
              "hidden",
              "lg:block",
              "w-px",
              "h-8",
              "bg-border",
              "mx-2",
            )}
          />

          {/* Filters */}
          <div
            className={cn(
              "w-full",
              "flex",
              "items-center",
              "gap-3",
              "overflow-x-auto",
              "overflow-y-visible",
              "pb-2",
              "lg:pb-0",
              "no-scrollbar",
            )}
          >
            {/* Status pills */}
            <div
              className={cn(
                "flex",
                "items-center",
                "gap-1",
                "bg-muted",
                "p-1",
                "rounded-xl",
                "border",
                "border-border",
              )}
            >
              {["All", "Upcoming", "Ongoing", "Past"].map((status) => (
                <button
                  key={status}
                  onClick={() => handleFilterChange("status", status)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                    filters.status === status
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {status}
                </button>
              ))}
            </div>

            <FilterSelect
              id="location"
              icon={<LuMapPin />}
              label="Location"
              options={LOCATION_OPTIONS}
              value={filters.location}
              onChange={(v) => handleFilterChange("location", v)}
              isOpen={openDropdown === "location"}
              onToggle={(o) => setOpenDropdown(o ? "location" : null)}
            />

            <FilterSelect
              id="category"
              icon={<LuTags />}
              label="Category"
              options={categoryOptions}
              value={filters.category}
              onChange={(v) => handleFilterChange("category", v)}
              isOpen={openDropdown === "category"}
              onToggle={(o) => setOpenDropdown(o ? "category" : null)}
            />

            <FilterSelect
              id="price"
              icon={<LuBanknote />}
              label="Price"
              options={PRICE_OPTIONS}
              value={filters.price}
              onChange={(v) => handleFilterChange("price", v)}
              isOpen={openDropdown === "price"}
              onToggle={(o) => setOpenDropdown(o ? "price" : null)}
            />

            <FilterSelect
              id="date"
              icon={<LuCalendar />}
              label="Date"
              options={DATE_OPTIONS}
              value={filters.date}
              onChange={(v) => handleFilterChange("date", v)}
              isOpen={openDropdown === "date"}
              onToggle={(o) => setOpenDropdown(o ? "date" : null)}
            />

            <button
              onClick={handleReset}
              className={cn(
                "flex",
                "items-center",
                "gap-2",
                "px-4",
                "py-2",
                "text-xs",
                "font-black",
                "transition-colors",
                "shrink-0",
                "rounded-xl",
                hasActiveFilters
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground hover:text-primary",
              )}
            >
              <LuSlidersHorizontal className={cn("w-4", "h-4")} />
              {hasActiveFilters ? "RESET" : "MORE"}
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

// ── FilterSelect ──────────────────────────────────────────────────────────────

interface FilterSelectProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}

const FilterSelect = ({
  icon,
  label,
  options,
  value,
  onChange,
  isOpen,
  onToggle,
}: FilterSelectProps) => {
  const isActive = value !== options[0];
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("fixed", "inset-0", "z-[100]")}
            onClick={() => onToggle(false)}
          />
        )}
      </AnimatePresence>

      <div className={cn("relative", "shrink-0")}>
        <button
          ref={buttonRef}
          onClick={() => onToggle(!isOpen)}
          className={cn(
            "relative flex items-center gap-2 px-4 py-2 bg-background border rounded-xl text-xs font-bold transition-all shrink-0 z-[101]",
            isActive
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-border text-slate-600 hover:border-primary/30 hover:bg-muted",
          )}
        >
          <span className={isActive ? "text-primary" : "text-muted-foreground"}>
            {icon}
          </span>
          <span className={cn("max-w-[100px]", "truncate")}>
            {value === options[0] ? label : value}
          </span>
          <motion.svg
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "w-3",
              "h-3",
              "ml-1",
              isActive ? "text-primary" : "text-slate-300",
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M19 9l-7 7-7-7"
            />
          </motion.svg>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "fixed",
              "w-56",
              "bg-background",
              "border",
              "border-border",
              "rounded-xl",
              "shadow-xl",
              "overflow-hidden",
              "z-[102]",
            )}
            style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
          >
            <div className={cn("max-h-64", "overflow-y-auto", "p-1")}>
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option);
                    onToggle(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors text-left",
                    value === option
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-slate-600 hover:bg-muted",
                  )}
                >
                  <span>{option}</span>
                  {value === option && (
                    <LuCheck className={cn("w-4", "h-4", "text-primary")} />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
