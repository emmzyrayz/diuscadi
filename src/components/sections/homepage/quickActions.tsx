"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuLayoutGrid,
  LuCalendarDays,
  LuTicket,
  LuCircleUser,
  LuArrowUpRight,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { QuickAction } from "@/app/home/page";

// Icons are presentation-only — mapped by index/order, not passed as data
const ACTION_ICONS = [
  <LuLayoutGrid key="programs" className={cn("w-6", "h-6")} />,
  <LuCalendarDays key="events" className={cn("w-6", "h-6")} />,
  <LuTicket key="tickets" className={cn("w-6", "h-6")} />,
  <LuCircleUser key="profile" className={cn("w-6", "h-6")} />,
];

const ACTION_STYLES = [
  { color: "text-blue-600", bg: "bg-blue-50" },
  { color: "text-orange-600", bg: "bg-orange-50" },
  { color: "text-purple-600", bg: "bg-purple-50" },
  { color: "text-emerald-600", bg: "bg-emerald-50" },
];

interface QuickActionsProps {
  actions: QuickAction[];
}

export const QuickActions = ({ actions }: QuickActionsProps) => {
  return (
    <section
      className={cn(
        "w-full",
        "max-w-7xl",
        "mx-auto",
        "px-4",
        "sm:px-6",
        "lg:px-8",
        "mt-4",
        "md:mt-8",
      )}
    >
      <div className={cn("grid", "grid-cols-2", "md:grid-cols-4", "gap-4")}>
        {actions.map((action, index) => {
          const style = ACTION_STYLES[index] ?? {
            color: "text-slate-600",
            bg: "bg-slate-50",
          };
          const icon = ACTION_ICONS[index] ?? null;
          return (
            <motion.a
              key={index}
              href={action.link}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className={cn(
                "group relative p-5 bg-white border border-slate-100 rounded-3xl",
                "shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300",
              )}
            >
              <div
                className={cn(
                  "flex",
                  "items-center",
                  "justify-between",
                  "mb-4",
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300",
                    style.bg,
                    style.color,
                  )}
                >
                  {icon}
                </div>
                <LuArrowUpRight
                  className={cn(
                    "w-5",
                    "h-5",
                    "text-slate-300",
                    "group-hover:text-primary",
                    "group-hover:translate-x-0.5",
                    "group-hover:-translate-y-0.5",
                    "transition-all",
                  )}
                />
              </div>
              <div className="space-y-1">
                <h4
                  className={cn(
                    "font-bold",
                    "text-slate-900",
                    "group-hover:text-primary",
                    "transition-colors",
                  )}
                >
                  {action.title}
                </h4>
                <p className={cn("text-xs", "font-medium", "text-slate-400")}>
                  {action.desc}
                </p>
              </div>
              <div
                className={cn(
                  "absolute",
                  "bottom-0",
                  "left-1/2",
                  "-translate-x-1/2",
                  "w-0",
                  "h-1",
                  "bg-primary",
                  "rounded-full",
                  "group-hover:w-1/3",
                  "transition-all",
                  "duration-300",
                )}
              />
            </motion.a>
          );
        })}
      </div>
    </section>
  );
};
