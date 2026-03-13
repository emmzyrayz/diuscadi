"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuCircleCheck,
  LuTicket,
  LuCircleUser,
  LuZap,
  LuChevronRight,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

export interface Activity {
  id: string | number;
  content: string;
  target: string;
  time: string;
}

// Icon + style mapped by activity target keyword — fully presentational
const resolveStyle = (
  target: string,
): { icon: React.ReactNode; color: string; bg: string } => {
  if (target.toLowerCase().includes("points"))
    return {
      icon: <LuZap className={cn("w-4", "h-4")} />,
      color: "text-orange-600",
      bg: "bg-orange-50",
    };
  if (
    target.toLowerCase().includes("summit") ||
    target.toLowerCase().includes("registered")
  )
    return {
      icon: <LuTicket className={cn("w-4", "h-4")} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    };
  if (
    target.toLowerCase().includes("workshop") ||
    target.toLowerCase().includes("completed")
  )
    return {
      icon: <LuCircleCheck className={cn("w-4", "h-4")} />,
      color: "text-green-600",
      bg: "bg-green-50",
    };
  return {
    icon: <LuCircleUser className={cn("w-4", "h-4")} />,
    color: "text-purple-600",
    bg: "bg-purple-50",
  };
};

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivity = ({ activities }: RecentActivityProps) => {
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
        "pb-8",
      )}
    >
      <div className={cn("flex", "items-center", "justify-between", "mb-8")}>
        <h3
          className={cn(
            "text-xl",
            "font-black",
            "text-foreground",
            "uppercase",
            "tracking-tighter",
          )}
        >
          Recent Activity
        </h3>
        <button
          className={cn(
            "text-xs",
            "font-bold",
            "text-muted-foreground",
            "hover:text-primary",
            "transition-colors",
            "flex",
            "items-center",
            "gap-1",
          )}
        >
          Full History <LuChevronRight className={cn("w-3", "h-3")} />
        </button>
      </div>

      <div className="relative">
        <div
          className={cn(
            "absolute",
            "left-6",
            "top-0",
            "bottom-0",
            "w-0.5",
            "text-muted",
            "hidden",
            "sm:block",
          )}
        />
        <div className="space-y-8">
          {activities.map((activity, index) => {
            const style = resolveStyle(activity.target);
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative",
                  "flex",
                  "items-center",
                  "gap-4",
                  "group",
                )}
              >
                <div
                  className={cn(
                    "relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300",
                    "bg-background border border-border shadow-sm group-hover:shadow-md group-hover:border-primary/20",
                    style.color,
                  )}
                >
                  <div className={cn("p-2 rounded-xl", style.bg)}>
                    {style.icon}
                  </div>
                </div>
                <div className={cn("flex-1", "min-w-0")}>
                  <p
                    className={cn(
                      "text-sm",
                      "text-muted-foreground",
                      "font-medium",
                    )}
                  >
                    {activity.content}{" "}
                    <span
                      className={cn(
                        "text-foreground",
                        "font-bold",
                        "group-hover:text-primary",
                        "transition-colors",
                        "cursor-pointer",
                      )}
                    >
                      {activity.target}
                    </span>
                  </p>
                  <span
                    className={cn(
                      "text-[10px]",
                      "font-bold",
                      "text-muted-foreground",
                      "uppercase",
                      "tracking-wide",
                    )}
                  >
                    {activity.time}
                  </span>
                </div>
                <button
                  className={cn(
                    "hidden",
                    "group-hover:flex",
                    "items-center",
                    "justify-center",
                    "p-2",
                    "rounded-lg",
                    "bg-muted",
                    "text-muted-foreground",
                  )}
                >
                  <LuChevronRight className={cn("w-4", "h-4")} />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
