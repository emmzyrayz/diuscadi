"use client";
import React, { useState } from "react";
import {
  LuSearch,
  LuFilter,
  LuChevronDown,
  LuTrash2,
  LuArrowUpDown,
  LuMapPin,
} from "react-icons/lu";
import { cn } from "../../../../lib/utils";

interface Props {
  onSearchChange?: (v: string) => void;
  onStatusChange?: (v: string) => void;
}

export const AdminEventsToolbar: React.FC<Props> = ({
  onSearchChange,
  onStatusChange,
}) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("newest");

  const handleSearch = (v: string) => {
    setSearch(v);
    onSearchChange?.(v);
  };

  const handleStatus = (v: string) => {
    setStatus(v);
    onStatusChange?.(v === "all" ? "" : v);
  };

  return (
    <div
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2rem]",
        "p-4",
        "mb-6",
        "shadow-sm",
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
        {/* Search */}
        <div className={cn("relative", "w-full", "xl:w-96")}>
          <LuSearch
            className={cn(
              "absolute",
              "left-4",
              "top-1/2",
              "-translate-y-1/2",
              "text-muted-foreground",
              "w-4",
              "h-4",
            )}
          />
          <input
            type="text"
            placeholder="Search by event title..."
            className={cn(
              "w-full",
              "bg-muted",
              "border",
              "border-border",
              "rounded-xl",
              "pl-11",
              "pr-4",
              "py-3",
              "text-[11px]",
              "font-bold",
              "text-foreground",
              "outline-none",
              "focus:ring-2",
              "focus:ring-primary/20",
              "focus:border-primary",
              "transition-all",
            )}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
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
          <ToolbarDropdown
            label="Status"
            icon={LuFilter}
            value={status}
            options={["all", "published", "draft", "cancelled"]}
            onChange={handleStatus}
          />
          <ToolbarDropdown
            label="Venue"
            icon={LuMapPin}
            value={type}
            options={["all", "physical", "virtual", "hybrid"]}
            onChange={setType}
          />
          <ToolbarDropdown
            label="Sort"
            icon={LuArrowUpDown}
            value={sort}
            options={["newest", "oldest", "capacity"]}
            onChange={setSort}
          />

          <div
            className={cn(
              "h-8",
              "w-px",
              "text-muted",
              "mx-2",
              "hidden",
              "lg:block",
            )}
          />

          <button
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "px-4",
              "py-3",
              "bg-rose-50",
              "border",
              "border-rose-100",
              "rounded-xl",
              "text-rose-600",
              "hover:bg-rose-600",
              "hover:text-background",
              "transition-all",
            )}
          >
            <LuTrash2 className={cn("w-4", "h-4")} />
            <span
              className={cn(
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "hidden",
                "sm:inline",
              )}
            >
              Bulk Delete
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface DropdownProps {
  label: string;
  icon: React.ElementType;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}

const ToolbarDropdown: React.FC<DropdownProps> = ({
  label,
  icon: Icon,
  value,
  options,
  onChange,
}) => (
  <div className={cn("relative", "group")}>
    <button
      className={cn(
        "flex",
        "items-center",
        "gap-3",
        "px-4",
        "py-3",
        "bg-background",
        "border",
        "border-border",
        "rounded-xl",
        "hover:border-slate-400",
        "transition-all",
      )}
    >
      <Icon className={cn("w-3.5", "h-3.5", "text-muted-foreground")} />
      <div className="text-left">
        <p
          className={cn(
            "text-[8px]",
            "font-black",
            "text-muted-foreground",
            "uppercase",
            "leading-none",
            "mb-0.5",
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
            "capitalize",
          )}
        >
          {value}
        </p>
      </div>
      <LuChevronDown
        className={cn("w-3.5", "h-3.5", "text-slate-300", "ml-1")}
      />
    </button>
    <div
      className={cn(
        "absolute",
        "top-full",
        "left-0",
        "mt-2",
        "w-48",
        "bg-background",
        "border",
        "border-border",
        "rounded-2xl",
        "shadow-xl",
        "p-2",
        "hidden",
        "group-hover:block",
        "z-30",
      )}
    >
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "w-full",
            "text-left",
            "px-4",
            "py-2.5",
            "rounded-xl",
            "text-[10px]",
            "font-bold",
            "text-slate-600",
            "uppercase",
            "hover:bg-muted",
            "hover:text-primary",
            "transition-colors",
            value === opt && "text-primary bg-primary/5",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);
