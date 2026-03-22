"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuHistory, LuUserPlus, LuChevronRight } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { Analytics } from "@/context/AdminContext";

interface Props {
  recentSignups: Analytics["recentSignups"];
}

export const AdminRecentActivity = ({ recentSignups }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "p-8",
        "shadow-sm",
      )}
    >
      <div className={cn("flex", "items-center", "justify-between", "mb-8")}>
        <div className={cn("flex", "items-center", "gap-3")}>
          <div
            className={cn(
              "w-10",
              "h-10",
              "rounded-xl",
              "bg-muted",
              "flex",
              "items-center",
              "justify-center",
              "text-foreground",
              "border",
              "border-border",
            )}
          >
            <LuHistory className={cn("w-5", "h-5")} />
          </div>
          <div>
            <h3
              className={cn(
                "text-sm",
                "font-black",
                "text-foreground",
                "uppercase",
                "tracking-widest",
              )}
            >
              Recent Signups
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
                />
                <span
                  className={cn(
                    "relative",
                    "inline-flex",
                    "rounded-full",
                    "h-2",
                    "w-2",
                    "bg-emerald-500",
                  )}
                />
              </span>
              <p
                className={cn(
                  "text-[9px]",
                  "font-black",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                Live Feed
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {recentSignups.length === 0 ? (
          <p
            className={cn(
              "text-sm",
              "font-bold",
              "text-muted-foreground",
              "text-center",
              "py-8",
            )}
          >
            No recent signups
          </p>
        ) : (
          recentSignups.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.01, x: 4 }}
              className={cn(
                "flex",
                "items-center",
                "gap-4",
                "p-4",
                "rounded-2xl",
                "border",
                "border-transparent",
                "hover:border-border",
                "hover:bg-muted/50",
                "transition-all",
                "group",
                "cursor-pointer",
              )}
            >
              <div
                className={cn(
                  "w-10",
                  "h-10",
                  "rounded-xl",
                  "flex",
                  "items-center",
                  "justify-center",
                  "shrink-0",
                  "bg-emerald-50",
                  "text-emerald-600",
                )}
              >
                <LuUserPlus className={cn("w-5", "h-5")} />
              </div>
              <div className={cn('flex-1', 'min-w-0')}>
                <p
                  className={cn(
                    "text-[11px]",
                    "text-muted-foreground",
                    "leading-snug",
                  )}
                >
                  <span className={cn("font-black", "text-foreground")}>
                    {user.fullName}
                  </span>{" "}
                  joined as{" "}
                  <span className={cn("font-bold", "text-primary")}>
                    {user.role}
                  </span>
                </p>
                <p
                  className={cn(
                    "text-[9px]",
                    "font-bold",
                    "text-muted-foreground",
                    "uppercase",
                    "mt-1",
                  )}
                >
                  {user.eduStatus} ·{" "}
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <LuChevronRight
                className={cn(
                  "w-4",
                  "h-4",
                  "text-slate-300",
                  "opacity-0",
                  "group-hover:opacity-100",
                  "transition-opacity",
                )}
              />
            </motion.div>
          ))
        )}
      </div>

      <button
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
            "text-muted-foreground",
            "uppercase",
            "tracking-[0.2em]",
            "group-hover:text-primary",
            "transition-colors",
          )}
        >
          View All Users
        </span>
        <LuChevronRight
          className={cn(
            "w-3",
            "h-3",
            "text-slate-300",
            "group-hover:text-primary",
            "transition-colors",
          )}
        />
      </button>
    </motion.div>
  );
};
