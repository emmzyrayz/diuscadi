"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuZap, LuUserPlus, LuClock, LuChevronRight } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { Analytics } from "@/context/AdminContext";

interface Props {
  analytics: Analytics | null;
}

export const AdminAnalyticsRecentActivitySection = ({ analytics }: Props) => {
  const recentSignups = analytics?.recentSignups ?? [];

  return (
    <div className={cn("space-y-6")}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn("flex", "items-center", "justify-between")}
      >
        <div className={cn("flex", "items-center", "gap-3")}>
          <div
            className={cn(
              "p-2.5",
              "bg-amber-50",
              "text-amber-600",
              "rounded-xl",
              "border",
              "border-amber-100",
            )}
          >
            <LuZap className={cn("w-5", "h-5")} />
          </div>
          <div>
            <h2
              className={cn(
                "text-xl",
                "font-black",
                "text-foreground",
                "uppercase",
                "tracking-tighter",
              )}
            >
              Recent Signups
            </h2>
            <p
              className={cn(
                "text-[10px]",
                "font-bold",
                "text-muted-foreground",
                "uppercase",
                "tracking-widest",
              )}
            >
              Most recent user registrations
            </p>
          </div>
        </div>
        <button
          className={cn(
            "flex",
            "items-center",
            "gap-2",
            "px-5",
            "py-2.5",
            "bg-background",
            "border",
            "border-border",
            "rounded-xl",
            "text-[10px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "text-muted-foreground",
            "hover:text-foreground",
            "transition-all",
            "shadow-sm",
          )}
        >
          View All <LuChevronRight className={cn("w-3.5", "h-3.5")} />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={cn(
          "bg-background",
          "border",
          "border-border",
          "rounded-[2.5rem]",
          "p-4",
          "shadow-sm",
        )}
      >
        {recentSignups.length === 0 ? (
          <p
            className={cn(
              "text-sm",
              "font-bold",
              "text-muted-foreground",
              "text-center",
              "py-12",
            )}
          >
            No recent activity
          </p>
        ) : (
          <div className={cn("divide-y", "divide-slate-50")}>
            {recentSignups.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                whileHover={{
                  backgroundColor: "rgba(248, 250, 252, 0.5)",
                  x: 5,
                }}
                className={cn(
                  "group",
                  "flex",
                  "items-center",
                  "justify-between",
                  "p-6",
                  "transition-all",
                  "rounded-[1.5rem]",
                )}
              >
                <div className={cn("flex", "items-center", "gap-5")}>
                  <div
                    className={cn(
                      "w-12",
                      "h-12",
                      "bg-emerald-50",
                      "text-emerald-600",
                      "rounded-2xl",
                      "flex",
                      "items-center",
                      "justify-center",
                      "shadow-sm",
                    )}
                  >
                    <LuUserPlus className={cn("w-5", "h-5")} />
                  </div>
                  <div>
                    <span
                      className={cn(
                        "text-[11px]",
                        "font-black",
                        "text-foreground",
                        "uppercase",
                        "tracking-tight",
                      )}
                    >
                      {user.fullName}
                    </span>
                    <p
                      className={cn(
                        "text-[10px]",
                        "font-bold",
                        "text-muted-foreground",
                        "uppercase",
                        "tracking-widest",
                      )}
                    >
                      {user.role} · {user.eduStatus}
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-1.5",
                    "text-slate-300",
                  )}
                >
                  <LuClock className={cn("w-3", "h-3")} />
                  <span
                    className={cn(
                      "text-[9px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                    )}
                  >
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
