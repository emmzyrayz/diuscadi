"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuCalendar,
  LuMapPin,
  LuEllipsisVertical,
  LuSquarePen,
  LuTrash2,
} from "react-icons/lu";
import { cn } from "../../../../lib/utils";
import { DUMMY_EVENTS } from "@/assets/data/event";
import { Event } from "@/types/event";

// Map the Event type to include computed properties for the table
interface EventRowData extends Omit<Event, "status"> {
  enrolled: number;
  capacity: number;
  status: "Upcoming" | "Completed" | "Cancelled" | "Draft";
}

// Transform Event data to EventRowData
const transformEventToRowData = (event: Event): EventRowData => {
  // Calculate enrolled based on capacity and slots remaining
  const enrolled = event.totalCapacity - event.slotsRemaining;

  // Determine status based on slots remaining and other factors
  let status: EventRowData["status"] = "Upcoming";
  if (event.slotsRemaining === 0) {
    status = "Upcoming"; // Could be "Completed" based on date logic
  }
  if (event.status) {
    status = event.status;
  }

  return {
    ...event,
    enrolled,
    capacity: event.totalCapacity,
    status,
  };
};

const MOCK_EVENTS: EventRowData[] = DUMMY_EVENTS.map(transformEventToRowData);

export const AdminEventsTable: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "w-full",
        "bg-white",
        "border-2",
        "border-slate-100",
        "rounded-[2.5rem]",
        "overflow-hidden",
        "shadow-sm",
      )}
    >
      <div className="overflow-x-auto">
        <table className={cn("w-full", "text-left", "border-collapse")}>
          {/* Table Header */}
          <thead>
            <motion.tr
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn("bg-slate-50/50", "border-b", "border-slate-100")}
            >
              <th
                className={cn(
                  "px-8",
                  "py-5",
                  "text-[10px]",
                  "font-black",
                  "text-slate-400",
                  "uppercase",
                  "tracking-[0.2em]",
                )}
              >
                Event Identity
              </th>
              <th
                className={cn(
                  "px-6",
                  "py-5",
                  "text-[10px]",
                  "font-black",
                  "text-slate-400",
                  "uppercase",
                  "tracking-[0.2em]",
                )}
              >
                Schedule & Venue
              </th>
              <th
                className={cn(
                  "px-6",
                  "py-5",
                  "text-[10px]",
                  "font-black",
                  "text-slate-400",
                  "uppercase",
                  "tracking-[0.2em]",
                )}
              >
                Capacity
              </th>
              <th
                className={cn(
                  "px-6",
                  "py-5",
                  "text-[10px]",
                  "font-black",
                  "text-slate-400",
                  "uppercase",
                  "tracking-[0.2em]",
                )}
              >
                Status
              </th>
              <th
                className={cn(
                  "px-8",
                  "py-5",
                  "text-[10px]",
                  "font-black",
                  "text-slate-400",
                  "uppercase",
                  "tracking-[0.2em]",
                  "text-right",
                )}
              >
                Actions
              </th>
            </motion.tr>
          </thead>

          {/* Table Body */}
          <tbody className={cn("divide-y", "divide-slate-50")}>
            {MOCK_EVENTS.map((event, index) => (
              <AdminEventRow
                key={event.id}
                event={event}
                delay={0.3 + index * 0.05}
              />
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

/* --- Internal Component: AdminEventRow --- */
const AdminEventRow: React.FC<{ event: EventRowData; delay?: number }> = ({
  event,
  delay = 0,
}) => {
  const isFull = event.enrolled >= event.capacity;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn("group", "hover:bg-slate-50/50", "transition-colors")}
    >
      {/* 1. Identity */}
      <td className={cn("px-8", "py-6")}>
        <div className={cn("flex", "flex-col")}>
          <span
            className={cn(
              "text-sm",
              "font-black",
              "text-slate-900",
              "tracking-tight",
              "group-hover:text-primary",
              "transition-colors",
            )}
          >
            {event.title}
          </span>
          <span
            className={cn(
              "text-[10px]",
              "font-bold",
              "text-slate-400",
              "uppercase",
              "mt-1",
            )}
          >
            ID: {event.id}
          </span>
        </div>
      </td>

      {/* 2. Schedule & Venue */}
      <td className={cn("px-6", "py-6")}>
        <div className="space-y-1.5">
          <div
            className={cn("flex", "items-center", "gap-2", "text-slate-600")}
          >
            <LuCalendar className={cn("w-3.5", "h-3.5", "text-slate-400")} />
            <span className={cn("text-[11px]", "font-bold")}>{event.date}</span>
          </div>
          <div
            className={cn("flex", "items-center", "gap-2", "text-slate-500")}
          >
            <LuMapPin className={cn("w-3.5", "h-3.5", "text-slate-300")} />
            <span className={cn("text-[10px]", "font-medium")}>
              {event.location} • {event.type}
            </span>
          </div>
        </div>
      </td>

      {/* 3. Capacity Indicator */}
      <td className={cn("px-6", "py-6")}>
        <div className={cn("flex", "flex-col", "gap-2", "w-32")}>
          <div className={cn("flex", "justify-between", "items-end")}>
            <span className={cn("text-[10px]", "font-black", "text-slate-900")}>
              {event.enrolled}{" "}
              <span className="text-slate-400">/ {event.capacity}</span>
            </span>
            <span
              className={cn(
                "text-[8px]",
                "font-black",
                "uppercase",
                isFull ? "text-rose-500" : "text-emerald-500",
              )}
            >
              {isFull
                ? "Full"
                : `${Math.round((event.enrolled / event.capacity) * 100)}%`}
            </span>
          </div>
          <div
            className={cn(
              "w-full",
              "h-1.5",
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
              className={cn(
                "h-full",
                "rounded-full",
                "transition-colors",
                "duration-500",
                isFull ? "bg-rose-500" : "bg-primary",
              )}
            />
          </div>
        </div>
      </td>

      {/* 4. Status Badge */}
      <td className={cn("px-6", "py-6")}>
        <StatusBadge status={event.status} delay={delay + 0.3} />
      </td>

      {/* 5. Actions */}
      <td className={cn("px-8", "py-6", "text-right")}>
        <div className={cn("flex", "items-center", "justify-end", "gap-2")}>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "p-2",
              "hover:bg-white",
              "hover:shadow-md",
              "rounded-lg",
              "text-slate-400",
              "hover:text-primary",
              "transition-all",
            )}
          >
            <LuSquarePen className={cn("w-4", "h-4")} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "p-2",
              "hover:bg-white",
              "hover:shadow-md",
              "rounded-lg",
              "text-slate-400",
              "hover:text-rose-500",
              "transition-all",
            )}
          >
            <LuTrash2 className={cn("w-4", "h-4")} />
          </motion.button>
          <div className={cn("w-px", "h-4", "bg-slate-100", "mx-1")} />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "p-2",
              "hover:bg-white",
              "hover:shadow-md",
              "rounded-lg",
              "text-slate-400",
            )}
          >
            <LuEllipsisVertical className={cn("w-4", "h-4")} />
          </motion.button>
        </div>
      </td>
    </motion.tr>
  );
};

/* --- Internal Helper: StatusBadge --- */
const StatusBadge: React.FC<{
  status: EventRowData["status"];
  delay?: number;
}> = ({ status, delay = 0 }) => {
  const styles = {
    Upcoming: "bg-blue-50 text-blue-600 border-blue-100",
    Completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Cancelled: "bg-rose-50 text-rose-600 border-rose-100",
    Draft: "bg-slate-50 text-slate-500 border-slate-200",
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={cn(
        "px-3",
        "py-1",
        "rounded-full",
        "border",
        "text-[9px]",
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

// Export the type for reuse
export type { EventRowData };