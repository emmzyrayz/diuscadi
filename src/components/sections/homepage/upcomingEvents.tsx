"use client";
import React from "react";
import { motion } from "framer-motion";
import {
//   LuCalendar,
  LuMapPin,
  LuClock,
  LuExternalLink,
  LuCircleCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

const userEvents = [
  {
    date: "18",
    month: "FEB",
    title: "DIUSCADI Orientation: New Members",
    time: "10:00 AM WAT",
    location: "Virtual (Zoom)",
    status: "Registered",
    type: "Webinar",
  },
  {
    date: "24",
    month: "FEB",
    title: "CV Clinic & Portfolio Review",
    time: "02:00 PM WAT",
    location: "Lagos Hub / Hybrid",
    status: "Confirmed",
    type: "Workshop",
  },
  {
    date: "02",
    month: "MAR",
    title: "Networking Dinner: Tech Founders",
    time: "06:00 PM WAT",
    location: "Victoria Island, Lagos",
    status: "On Waitlist",
    type: "Physical",
  },
];

export const UpcomingEvents = () => {
  return (
    <section
      className={cn(
        "w-full",
        "max-w-7xl",
        "mx-auto",
        "px-4",
        "sm:px-6",
        "lg:px-8",
        "mt-16",
      )}
    >
      <div className={cn("flex", "items-center", "justify-between", "mb-8")}>
        <div>
          <h3
            className={cn(
              "text-xl",
              "font-black",
              "text-slate-900",
              "leading-none",
            )}
          >
            Your Schedule
          </h3>
          <p className={cn("text-sm", "text-slate-500", "mt-1")}>
            Events you&apos;re participating in
          </p>
        </div>
        <button
          className={cn(
            "text-sm",
            "font-bold",
            "text-primary",
            "px-4",
            "py-2",
            "bg-primary/5",
            "rounded-xl",
            "hover:bg-primary/10",
            "transition-colors cursor-pointer",
          )}
        >
          Sync to Calendar
        </button>
      </div>

      <div className="space-y-4">
        {userEvents.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "group",
              "flex",
              "flex-col",
              "md:flex-row",
              "items-center",
              "bg-white",
              "border",
              "border-slate-100",
              "rounded-[1.5rem]",
              "p-4",
              "md:p-6",
              "hover:shadow-md",
              "transition-all",
              "border-l-4",
              "border-l-primary",
            )}
          >
            {/* Date Block */}
            <div
              className={cn(
                "flex",
                "flex-col",
                "items-center",
                "justify-center",
                "min-w-[80px]",
                "md:border-r",
                "border-slate-100",
                "md:pr-8",
                "mb-4",
                "md:mb-0",
              )}
            >
              <span
                className={cn(
                  "text-2xl",
                  "font-black",
                  "text-slate-900",
                  "leading-none",
                )}
              >
                {event.date}
              </span>
              <span
                className={cn("text-xs", "font-bold", "text-primary", "mt-1")}
              >
                {event.month}
              </span>
            </div>

            {/* Content Block */}
            <div
              className={cn("flex-1", "md:px-8", "text-center", "md:text-left")}
            >
              <div
                className={cn(
                  "flex",
                  "flex-wrap",
                  "items-center",
                  "justify-center",
                  "md:justify-start",
                  "gap-2",
                  "mb-2",
                )}
              >
                <span
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                    "text-slate-400",
                  )}
                >
                  {event.type}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                    event.status === "On Waitlist"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-green-50 text-green-600",
                  )}
                >
                  <LuCircleCheck className={cn("w-3", "h-3")} />
                  {event.status}
                </span>
              </div>
              <h4
                className={cn(
                  "text-lg",
                  "font-bold",
                  "text-slate-900",
                  "group-hover:text-primary",
                  "transition-colors",
                )}
              >
                {event.title}
              </h4>
              <div
                className={cn(
                  "flex",
                  "flex-wrap",
                  "items-center",
                  "justify-center",
                  "md:justify-start",
                  "gap-4",
                  "mt-3",
                  "text-sm",
                  "text-slate-400",
                )}
              >
                <div className={cn("flex", "items-center", "gap-1.5")}>
                  <LuClock className={cn("w-4", "h-4")} />
                  {event.time}
                </div>
                <div className={cn("flex", "items-center", "gap-1.5")}>
                  <LuMapPin className={cn("w-4", "h-4")} />
                  {event.location}
                </div>
              </div>
            </div>

            {/* Action Block */}
            <div className={cn("mt-6", "md:mt-0")}>
              <button
                className={cn(
                  "flex",
                  "items-center",
                  "gap-2",
                  "px-6",
                  "py-3",
                  "bg-slate-900",
                  "text-white",
                  "font-bold",
                  "rounded-xl",
                  "hover:bg-primary",
                  "transition-all",
                  "group-hover:shadow-lg",
                  "group-hover:shadow-primary/20 cursor-pointer",
                )}
              >
                Join Info
                <LuExternalLink className={cn("w-4", "h-4")} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
