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

// Demo filter data
const FILTER_OPTIONS = {
  location: [
    "All Locations",
    "Lagos",
    "Abuja",
    "Port Harcourt",
    "Ibadan",
    "Enugu",
  ],
  category: [
    "All Categories",
    "Tech Workshop",
    "Career Fair",
    "Networking",
    "Training",
    "Conference",
  ],
  price: [
    "All Prices",
    "Free",
    "Under ₦5,000",
    "₦5,000 - ₦10,000",
    "Above ₦10,000",
  ],
  date: ["All Dates", "Today", "This Week", "This Month", "Custom Range"],
};

interface FilterState {
  status: string;
  location: string;
  category: string;
  price: string;
  date: string;
  search: string;
}

export const EventsFilterBar = () => {
  const [filters, setFilters] = useState<FilterState>({
    status: "All",
    location: "All Locations",
    category: "All Categories",
    price: "All Prices",
    date: "All Dates",
    search: "",
  });

  // Track which dropdown is currently open
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({
      status: "All",
      location: "All Locations",
      category: "All Categories",
      price: "All Prices",
      date: "All Dates",
      search: "",
    });
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
        "bg-white/80",
        "backdrop-blur-md",
        "border-b",
        "border-slate-100",
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
          {/* SEARCH INPUT (Left) */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className={cn("relative", "w-full", "lg:w-96", "group")}
          >
            <LuSearch
              className={cn(
                "absolute",
                "left-4",
                "top-1/2",
                "-translate-y-1/2",
                "w-4",
                "h-4",
                "text-slate-400",
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
                "bg-slate-50",
                "border",
                "border-slate-100",
                "rounded-2xl",
                "text-sm",
                "focus:outline-none",
                "focus:ring-2",
                "focus:ring-primary/10",
                "focus:bg-white",
                "transition-all",
              )}
            />
          </motion.div>

          {/* VERTICAL DIVIDER (Desktop Only) */}
          <div
            className={cn(
              "hidden",
              "lg:block",
              "w-px",
              "h-8",
              "bg-slate-100",
              "mx-2",
            )}
          />

          {/* FILTERS (Right - Scrollable on mobile) */}
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
            {/* Quick Status Filter */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "flex",
                "items-center",
                "gap-1",
                "bg-slate-50",
                "p-1",
                "rounded-xl",
                "border",
                "border-slate-100",
              )}
            >
              {["All", "Upcoming", "Ongoing", "Past"].map((status, index) => (
                <motion.button
                  key={status}
                  onClick={() => handleFilterChange("status", status)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                    filters.status === status
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900",
                  )}
                >
                  {status}
                </motion.button>
              ))}
            </motion.div>

            {/* Advanced Filters Dropdowns */}
            <FilterSelect
              id="location"
              icon={<LuMapPin />}
              label="Location"
              options={FILTER_OPTIONS.location}
              value={filters.location}
              onChange={(value) => handleFilterChange("location", value)}
              delay={0.3}
              isOpen={openDropdown === "location"}
              onToggle={(isOpen) => setOpenDropdown(isOpen ? "location" : null)}
            />
            <FilterSelect
              id="category"
              icon={<LuTags />}
              label="Category"
              options={FILTER_OPTIONS.category}
              value={filters.category}
              onChange={(value) => handleFilterChange("category", value)}
              delay={0.35}
              isOpen={openDropdown === "category"}
              onToggle={(isOpen) => setOpenDropdown(isOpen ? "category" : null)}
            />
            <FilterSelect
              id="price"
              icon={<LuBanknote />}
              label="Price"
              options={FILTER_OPTIONS.price}
              value={filters.price}
              onChange={(value) => handleFilterChange("price", value)}
              delay={0.4}
              isOpen={openDropdown === "price"}
              onToggle={(isOpen) => setOpenDropdown(isOpen ? "price" : null)}
            />
            <FilterSelect
              id="date"
              icon={<LuCalendar />}
              label="Date"
              options={FILTER_OPTIONS.date}
              value={filters.date}
              onChange={(value) => handleFilterChange("date", value)}
              delay={0.45}
              isOpen={openDropdown === "date"}
              onToggle={(isOpen) => setOpenDropdown(isOpen ? "date" : null)}
            />

            {/* Reset / Advanced Toggle */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
                  : "text-slate-400 hover:text-primary",
              )}
            >
              <LuSlidersHorizontal className={cn("w-4", "h-4")} />
              {hasActiveFilters ? "RESET" : "MORE"}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

// Enhanced FilterSelect component with dropdown functionality
interface FilterSelectProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  delay?: number;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}

const FilterSelect = ({
  icon,
  label,
  options,
  value,
  onChange,
  delay = 0,
  isOpen,
  onToggle,
}: FilterSelectProps) => {
  const isActive = value !== options[0];
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Update dropdown position when it opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100"
            onClick={() => onToggle(false)}
          />
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <div className="relative shrink-0">
        <motion.button
          ref={buttonRef}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onToggle(!isOpen)}
          className={cn(
            "relative",
            "flex",
            "items-center",
            "gap-2",
            "px-4",
            "py-2",
            "bg-white",
            "border",
            "rounded-xl",
            "text-xs",
            "font-bold",
            "transition-all",
            "shrink-0",
            "z-101",
            isActive
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-slate-100 text-slate-600 hover:border-primary/30 hover:bg-slate-50",
          )}
        >
          <span className={isActive ? "text-primary" : "text-slate-400"}>
            {icon}
          </span>
          <span className="max-w-[100px] truncate">
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
        </motion.button>
      </div>

      {/* Dropdown Menu - Fixed Positioning */}
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
                "bg-white",
              "-mt-[390px] -ml-[60px]",
              "border",
              "border-slate-100",
              "rounded-xl",
              "shadow-xl",
              "overflow-hidden",
              "z-102",
            )}
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            <div className="max-h-64 overflow-y-auto p-1">
              {options.map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => {
                    onChange(option);
                    onToggle(false);
                  }}
                  className={cn(
                    "w-full",
                    "flex",
                    "items-center",
                    "justify-between",
                    "px-3",
                    "py-2.5",
                    "text-sm",
                    "rounded-lg",
                    "transition-colors",
                    "text-left",
                    value === option
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <span>{option}</span>
                  {value === option && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    >
                      <LuCheck className="w-4 h-4 text-primary" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
