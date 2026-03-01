"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuEllipsis,
  LuEye,
  LuSquarePen,
  LuCopy,
  LuCircleX,
  LuTrash2,
  LuMapPin,
  LuCalendar,
} from "react-icons/lu";
import { cn } from "../../../../lib/utils";
import { IconType } from "react-icons";
import Image from "next/image";

// 1. TypeScript Interfaces
interface EventRowProps {
  event: {
    id: string;
    image: string;
    title: string;
    category: string;
    date: string;
    location: string;
    enrolled: number;
    capacity: number;
    status: "Upcoming" | "Completed" | "Cancelled";
    visibility: "Published" | "Draft";
  };
  isSelected: boolean;
  onSelect: (id: string) => void;
  delay?: number;
}

interface DropdownItemProps {
  icon: IconType;
  color?: string;
  label: string;
  onClick?: () => void;
}

interface StatusBadgeProps {
  status: "Upcoming" | "Completed" | "Cancelled";
}

interface VisibilityBadgeProps {
  visibility: "Published" | "Draft";
}

export const AdminEventRow: React.FC<EventRowProps> = ({
  event,
  isSelected,
  onSelect,
  delay = 0,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleAction = (action: string) => {
    console.log(`Action: ${action} for event ${event.id}`);
    setShowDropdown(false);
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{
        backgroundColor: isSelected
          ? "rgba(251, 146, 60, 0.05)"
          : "rgba(248, 250, 252, 0.5)",
      }}
      className={cn("group", "transition-all", isSelected && "bg-primary/5")}
    >
      {/* 1. Checkbox */}
      <td className={cn("pl-8", "py-5")}>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(event.id)}
            className={cn(
              "w-4",
              "h-4",
              "rounded",
              "border-slate-300",
              "text-primary",
              "focus:ring-primary",
              "cursor-pointer",
            )}
          />
        </motion.div>
      </td>

      {/* 2. Image & Title + Category */}
      <td className={cn("px-6", "py-5")}>
        <div className={cn("flex", "items-center", "gap-4")}>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "w-12",
              "h-12",
              "rounded-xl",
              "bg-slate-100",
              "overflow-hidden",
              "border",
              "border-slate-100",
              "shrink-0",
            )}
          >
            <Image
              height={300}
              width={500}
              src={event.image}
              alt={event.title}
              className={cn("w-full", "h-full", "object-cover")}
            />
          </motion.div>
          <div className={cn("flex", "flex-col")}>
            <span
              className={cn(
                "text-xs",
                "font-black",
                "text-slate-900",
                "leading-tight",
                "uppercase",
                "tracking-tight",
                "group-hover:text-primary",
                "transition-colors",
              )}
            >
              {event.title}
            </span>
            <span
              className={cn(
                "text-[9px]",
                "font-bold",
                "text-primary",
                "uppercase",
                "tracking-[0.15em]",
                "mt-1",
              )}
            >
              {event.category}
            </span>
          </div>
        </div>
      </td>

      {/* 3. Date & Location */}
      <td className={cn("px-6", "py-5")}>
        <div className={cn("flex", "flex-col", "gap-1")}>
          <div
            className={cn("flex", "items-center", "gap-1.5", "text-slate-600")}
          >
            <LuCalendar className={cn("w-3", "h-3", "text-slate-400")} />
            <span className={cn("text-[10px]", "font-bold")}>{event.date}</span>
          </div>
          <div
            className={cn("flex", "items-center", "gap-1.5", "text-slate-400")}
          >
            <LuMapPin className={cn("w-3", "h-3")} />
            <span className={cn("text-[10px]", "font-medium")}>
              {event.location}
            </span>
          </div>
        </div>
      </td>

      {/* 4. Registrations */}
      <td className={cn("px-6", "py-5")}>
        <div className={cn("flex", "flex-col", "gap-1")}>
          <span className={cn("text-[10px]", "font-black", "text-slate-900")}>
            {event.enrolled}{" "}
            <span className="text-slate-300">/ {event.capacity}</span>
          </span>
          <div
            className={cn(
              "w-20",
              "h-1",
              "bg-slate-100",
              "rounded-full",
              "overflow-hidden",
            )}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(event.enrolled / event.capacity) * 100}%`,
              }}
              transition={{ duration: 1, delay: delay + 0.2 }}
              className={cn("h-full", "bg-primary", "rounded-full")}
            />
          </div>
        </div>
      </td>

      {/* 5. Status & Visibility Badges */}
      <td className={cn("px-6", "py-5")}>
        <div className={cn("flex", "flex-col", "gap-2")}>
          <StatusBadge status={event.status} />
          <VisibilityBadge visibility={event.visibility} />
        </div>
      </td>

      {/* 6. Actions Dropdown */}
      <td className={cn("pr-8", "py-5", "text-right", "relative")}>
        <motion.button
          onClick={() => setShowDropdown(!showDropdown)}
          whileHover={{ scale: 1.1, backgroundColor: "rgb(255 255 255)" }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "p-2",
            "border",
            "border-transparent",
            "hover:border-slate-200",
            "rounded-lg",
            "text-slate-400",
            "hover:text-slate-900",
            "transition-colors",
          )}
        >
          <motion.div
            animate={showDropdown ? { rotate: 90 } : { rotate: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LuEllipsis className={cn("w-5", "h-5")} />
          </motion.div>
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showDropdown && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn("fixed", "inset-0", "z-10")}
                onClick={() => setShowDropdown(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={cn(
                  "absolute",
                  "right-8",
                  "top-14",
                  "w-48",
                  "bg-white",
                  "border",
                  "border-slate-100",
                  "rounded-2xl",
                  "shadow-2xl",
                  "z-20",
                  "p-2",
                )}
              >
                <DropdownItem
                  icon={LuEye}
                  label="View Event"
                  onClick={() => handleAction("view")}
                />
                <DropdownItem
                  icon={LuSquarePen}
                  label="Edit Event"
                  color="text-slate-900"
                  onClick={() => handleAction("edit")}
                />
                <DropdownItem
                  icon={LuCopy}
                  label="Duplicate"
                  onClick={() => handleAction("duplicate")}
                />
                <div className={cn("h-px", "bg-slate-50", "my-1")} />
                <DropdownItem
                  icon={LuCircleX}
                  label="Cancel Event"
                  color="text-amber-600"
                  onClick={() => handleAction("cancel")}
                />
                <DropdownItem
                  icon={LuTrash2}
                  label="Delete Permanent"
                  color="text-rose-600"
                  onClick={() => handleAction("delete")}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
};

/* --- Internal Helpers --- */

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<StatusBadgeProps["status"], string> = {
    Upcoming: "bg-blue-50 text-blue-600 border-blue-100",
    Completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Cancelled: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "w-fit",
        "px-2",
        "py-0.5",
        "rounded-md",
        "border",
        "text-[8px]",
        "font-black",
        "uppercase",
        "tracking-widest",
        styles[status],
      )}
    >
      {status}
    </motion.span>
  );
};

const VisibilityBadge: React.FC<VisibilityBadgeProps> = ({ visibility }) => (
  <motion.span
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className={cn(
      "w-fit",
      "flex",
      "items-center",
      "gap-1",
      "text-[8px]",
      "font-bold",
      "uppercase",
      "tracking-widest",
      visibility === "Published" ? "text-emerald-500" : "text-slate-400",
    )}
  >
    <motion.span
      animate={
        visibility === "Published"
          ? {
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1],
            }
          : {}
      }
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={cn(
        "w-1",
        "h-1",
        "rounded-full",
        visibility === "Published" ? "bg-emerald-500" : "bg-slate-400",
      )}
    />
    {visibility}
  </motion.span>
);

const DropdownItem: React.FC<DropdownItemProps> = ({
  icon: Icon,
  label,
  color = "text-slate-600",
  onClick,
}) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.02, x: 2 }}
    whileTap={{ scale: 0.98 }}
    className={cn(
      "w-full",
      "flex",
      "items-center",
      "gap-3",
      "px-3",
      "py-2.5",
      "rounded-xl",
      "hover:bg-slate-50",
      "transition-colors",
      color,
    )}
  >
    <Icon className={cn("w-4", "h-4")} />
    <span
      className={cn("text-[10px]", "font-black", "uppercase", "tracking-tight")}
    >
      {label}
    </span>
  </motion.button>
);

// Export types
export type {
  EventRowProps,
  DropdownItemProps,
  StatusBadgeProps,
  VisibilityBadgeProps,
};