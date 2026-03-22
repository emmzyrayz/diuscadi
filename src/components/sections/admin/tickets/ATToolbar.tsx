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

interface Props {
  onSearchChange?: (v: string) => void;
  onStatusChange?: (v: string) => void;
}

export const AdminTicketsToolbar: React.FC<Props> = ({
  onSearchChange,
  onStatusChange,
}) => {
  const [search, setSearch] = useState("");
  const [event, setEvent] = useState("All Events");
  const [status, setStatus] = useState("All");
  const [date, setDate] = useState("All Time");
  const [sort, setSort] = useState("Newest");

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
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
        <div className={cn("relative", "w-full", "2xl:w-[480px]")}>
          <LuSearch
            className={cn(
              "absolute",
              "left-6",
              "top-1/2",
              "-translate-y-1/2",
              "text-muted-foreground",
              "w-5",
              "h-5",
            )}
          />
          <input
            type="text"
            placeholder="Search Name, Email, or Ticket Code..."
            className={cn(
              "w-full",
              "bg-muted",
              "border",
              "border-border",
              "rounded-2xl",
              "pl-14",
              "pr-6",
              "py-5",
              "text-[11px]",
              "font-black",
              "text-foreground",
              "placeholder:text-muted-foreground",
              "outline-none",
              "focus:ring-4",
              "focus:ring-primary/10",
              "focus:border-primary",
              "transition-all",
              "uppercase",
              "tracking-tighter",
            )}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onSearchChange?.(e.target.value);
            }}
          />
        </div>
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
            current={event}
            options={["All Events", "Summit 2026", "AI Workshop", "Grad Gala"]}
            onChange={setEvent}
          />
          <TicketDropdown
            label="Status"
            icon={LuActivity}
            current={status}
            options={["All", "upcoming", "used", "cancelled", "expired"]}
            onChange={(v) => {
              setStatus(v);
              onStatusChange?.(v === "All" ? "" : v);
            }}
          />
          <TicketDropdown
            label="Timeframe"
            icon={LuCalendar}
            current={date}
            options={["All Time", "Today", "This Week", "Next Week"]}
            onChange={setDate}
          />
          <TicketDropdown
            label="Sort"
            icon={LuArrowUpDown}
            current={sort}
            options={["Newest", "Oldest", "Owner Name"]}
            onChange={setSort}
          />
        </div>
      </div>
    </motion.div>
  );
};

const TicketDropdown: React.FC<{
  label: string;
  icon: IconType;
  current: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ label, icon: Icon, current, options, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn("relative", "flex-1", "min-w-[150px]", "lg:flex-none")}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={cn(
          "w-full",
          "flex",
          "items-center",
          "justify-between",
          "gap-4",
          "px-5",
          "py-4",
          "bg-background",
          "border",
          "border-border",
          "rounded-2xl",
          "transition-all",
        )}
      >
        <div className={cn("flex", "items-center", "gap-3", "text-left")}>
          <Icon className={cn("w-4", "h-4", "text-muted-foreground")} />
          <div>
            <p
              className={cn(
                "text-[8px]",
                "font-black",
                "text-muted-foreground",
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
                "text-foreground",
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
      </button>
      <AnimatePresence>
        {open && (
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
              "bg-background",
              "border",
              "border-border",
              "rounded-2xl",
              "shadow-2xl",
              "p-2",
              "z-50",
            )}
          >
            {options.map((opt, i) => (
              <motion.button
                key={opt}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
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
                  "hover:bg-muted",
                  "hover:text-primary",
                  "transition-colors",
                  "flex",
                  "items-center",
                  "justify-between",
                )}
              >
                {opt}
                {current === opt && (
                  <div
                    className={cn(
                      "w-1.5",
                      "h-1.5",
                      "rounded-full",
                      "bg-primary",
                    )}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
