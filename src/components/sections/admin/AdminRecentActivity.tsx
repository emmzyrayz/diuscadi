"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuHistory,
  LuUserPlus,
  LuCalendarPlus,
  LuTicket,
  LuShieldCheck,
  LuChevronRight,
} from "react-icons/lu";
import { cn } from "../../../lib/utils";
import { IconType } from "react-icons";

// Define proper TypeScript types
interface ActivityItemProps {
  icon: IconType;
  iconColor: string;
  text: React.ReactNode;
  time: string;
  delay?: number;
}

interface Activity {
  id: string;
  icon: IconType;
  iconColor: string;
  text: React.ReactNode;
  time: string;
}

export const AdminRecentActivity = () => {
  const activities: Activity[] = [
    {
      id: "1",
      icon: LuTicket,
      iconColor: "text-blue-600 bg-blue-50",
      text: (
        <>
          <span className={cn("font-black", "text-slate-900")}>John Doe</span>{" "}
          registered for{" "}
          <span className={cn("font-bold", "text-blue-600")}>
            Web Dev Bootcamp
          </span>
        </>
      ),
      time: "2 mins ago",
    },
    {
      id: "2",
      icon: LuCalendarPlus,
      iconColor: "text-purple-600 bg-purple-50",
      text: (
        <>
          New event created:{" "}
          <span className={cn("font-black", "text-slate-900")}>
            Cybersecurity Essentials
          </span>
        </>
      ),
      time: "14 mins ago",
    },
    {
      id: "3",
      icon: LuUserPlus,
      iconColor: "text-emerald-600 bg-emerald-50",
      text: (
        <>
          <span className={cn("font-black", "text-slate-900")}>Jane Smith</span>{" "}
          created a new professional account
        </>
      ),
      time: "1 hour ago",
    },
    {
      id: "4",
      icon: LuShieldCheck,
      iconColor: "text-amber-600 bg-amber-50",
      text: (
        <>
          System auto-verified{" "}
          <span className={cn("font-black", "text-slate-900")}>
            42 Digital IDs
          </span>
        </>
      ),
      time: "3 hours ago",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "bg-white",
        "border-2",
        "border-slate-100",
        "rounded-[2.5rem]",
        "p-8",
        "shadow-sm",
      )}
    >
      {/* 1. Section Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className={cn("flex", "items-center", "justify-between", "mb-8")}
      >
        <div className={cn("flex", "items-center", "gap-3")}>
          <motion.div
            whileHover={{ rotate: -360 }}
            transition={{ duration: 0.6 }}
            className={cn(
              "w-10",
              "h-10",
              "rounded-xl",
              "bg-slate-50",
              "flex",
              "items-center",
              "justify-center",
              "text-slate-900",
              "border",
              "border-slate-100",
            )}
          >
            <LuHistory className={cn("w-5", "h-5")} />
          </motion.div>
          <div>
            <h3
              className={cn(
                "text-sm",
                "font-black",
                "text-slate-900",
                "uppercase",
                "tracking-widest",
              )}
            >
              Recent Activity
            </h3>
            <div className={cn("flex", "items-center", "gap-2", "mt-1")}>
              <span className={cn("relative", "flex", "h-2", "w-2")}>
                <span
                  className={cn(
                    "animate-ping",
                    "absolute",
                    "inline-flex",
                    "h-full",
                    "w-full",
                    "rounded-full",
                    "bg-emerald-400",
                    "opacity-75",
                  )}
                ></span>
                <span
                  className={cn(
                    "relative",
                    "inline-flex",
                    "rounded-full",
                    "h-2",
                    "w-2",
                    "bg-emerald-500",
                  )}
                ></span>
              </span>
              <p
                className={cn(
                  "text-[9px]",
                  "font-black",
                  "text-slate-400",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                Live System Feed
              </p>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "px-4",
            "py-2",
            "bg-slate-50",
            "hover:bg-slate-100",
            "rounded-xl",
            "text-[10px]",
            "font-black",
            "text-slate-600",
            "uppercase",
            "tracking-widest",
            "transition-colors",
          )}
        >
          Audit Logs
        </motion.button>
      </motion.div>

      {/* 2. Activity List */}
      <div className="space-y-2">
        {activities.map((activity, index) => (
          <ActivityItem
            key={activity.id}
            icon={activity.icon}
            iconColor={activity.iconColor}
            text={activity.text}
            time={activity.time}
            delay={0.3 + index * 0.1}
          />
        ))}
      </div>

      {/* 3. View More Footer */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileHover={{ backgroundColor: "rgb(248 250 252 / 0.5)" }}
        className={cn(
          "w-full",
          "mt-6",
          "py-4",
          "border-t",
          "border-slate-50",
          "flex",
          "items-center",
          "justify-center",
          "gap-2",
          "group",
          "transition-all",
          "rounded-b-3xl",
        )}
      >
        <span
          className={cn(
            "text-[10px]",
            "font-black",
            "text-slate-400",
            "uppercase",
            "tracking-[0.2em]",
            "group-hover:text-primary",
            "transition-colors",
          )}
        >
          Load Full History
        </span>
        <motion.div
          animate={{ x: [0, 3, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <LuChevronRight
            className={cn(
              "w-3",
              "h-3",
              "text-slate-300",
              "group-hover:text-primary",
              "transition-colors",
            )}
          />
        </motion.div>
      </motion.button>
    </motion.div>
  );
};

/* --- Internal Helper: Activity Item --- */
const ActivityItem = ({
  icon: Icon,
  iconColor,
  text,
  time,
  delay = 0,
}: ActivityItemProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ scale: 1.01, x: 4 }}
    className={cn(
      "flex",
      "items-center",
      "gap-4",
      "p-4",
      "rounded-2xl",
      "border",
      "border-transparent",
      "hover:border-slate-100",
      "hover:bg-slate-50/50",
      "transition-all",
      "group",
      "cursor-pointer",
    )}
  >
    <motion.div
      whileHover={{ scale: 1.15, rotate: 5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "w-10",
        "h-10",
        "rounded-xl",
        "flex",
        "items-center",
        "justify-center",
        "shrink-0",
        iconColor,
      )}
    >
      <Icon className={cn("w-5", "h-5")} />
    </motion.div>

    <div className="flex-1">
      <p className={cn("text-[11px]", "text-slate-500", "leading-snug")}>
        {text}
      </p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
        className={cn(
          "text-[9px]",
          "font-bold",
          "text-slate-400",
          "uppercase",
          "mt-1",
        )}
      >
        {time}
      </motion.p>
    </div>

    <motion.div
      initial={{ opacity: 0 }}
      whileHover={{ opacity: 1 }}
      className={cn("transition-opacity")}
    >
      <motion.button
        whileHover={{ scale: 1.2, x: 2 }}
        whileTap={{ scale: 0.9 }}
        className={cn("p-2", "text-slate-300", "hover:text-slate-900")}
      >
        <LuChevronRight className={cn("w-4", "h-4")} />
      </motion.button>
    </motion.div>
  </motion.div>
);

// Export types for reuse
export type { ActivityItemProps, Activity };