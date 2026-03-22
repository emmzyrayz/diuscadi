"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuUserPlus, LuBriefcase } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { Analytics } from "@/context/AdminContext";
import { UserGrowthChart } from "@/components/sections/admin/analytics/charts/UserGrowthChart";

interface Props {
  analytics: Analytics | null;
}

export const AdminAnalyticsUserInsightsSection = ({ analytics }: Props) => {
  const a = analytics;
  const byRole = a?.users.byRole ?? {};
  const byEduStatus = a?.users.byEduStatus ?? {};

  // Build UserGrowthChart data from weekly/monthly counts
  const growthData = [
    {
      month: "This Week",
      newUsers: a?.users.newThisWeek ?? 0,
      returning: Math.max(
        0,
        (a?.users.total ?? 0) - (a?.users.newThisWeek ?? 0),
      ),
    },
    {
      month: "This Month",
      newUsers: a?.users.newThisMonth ?? 0,
      returning: Math.max(
        0,
        (a?.users.total ?? 0) - (a?.users.newThisMonth ?? 0),
      ),
    },
  ];

  const roleEntries = Object.entries(byRole);
  const eduEntries = Object.entries(byEduStatus);
  const totalUsers = a?.users.total ?? 1; // avoid div/0

  return (
    <div className={cn("space-y-8", "mb-16")}>
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
              "bg-rose-50",
              "text-rose-600",
              "rounded-xl",
              "border",
              "border-rose-100",
            )}
          >
            <LuUserPlus className={cn("w-5", "h-5")} />
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
              User Insights
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
              Demographics & acquisition trends
            </p>
          </div>
        </div>
      </motion.div>

      {/* Growth chart */}
      <div
        className={cn(
          "bg-background",
          "border",
          "border-border",
          "rounded-[2.5rem]",
          "p-10",
          "shadow-sm",
        )}
      >
        <h3
          className={cn(
            "text-sm",
            "font-black",
            "text-foreground",
            "uppercase",
            "tracking-tight",
          )}
        >
          User Growth
        </h3>
        <p
          className={cn(
            "text-[10px]",
            "font-bold",
            "text-muted-foreground",
            "uppercase",
            "tracking-widest",
          )}
        >
          New vs returning users
        </p>
        <UserGrowthChart data={growthData} />
      </div>

      {/* Role breakdown */}
      <div className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-6")}>
        <div
          className={cn(
            "bg-background",
            "border",
            "border-border",
            "rounded-[2.5rem]",
            "p-8",
            "shadow-sm",
          )}
        >
          <div className={cn("flex", "items-center", "gap-2", "mb-6")}>
            <LuBriefcase
              className={cn("w-4", "h-4", "text-muted-foreground")}
            />
            <h4
              className={cn(
                "text-[10px]",
                "font-black",
                "text-foreground",
                "uppercase",
                "tracking-widest",
              )}
            >
              User Roles
            </h4>
          </div>
          {roleEntries.length === 0 ? (
            <p className={cn("text-xs", "font-bold", "text-muted-foreground")}>
              No data yet
            </p>
          ) : (
            <div className="space-y-4">
              {roleEntries.map(([role, count]) => {
                const pct = Math.round((count / totalUsers) * 100);
                return (
                  <div key={role}>
                    <div
                      className={cn(
                        "flex",
                        "justify-between",
                        "text-[10px]",
                        "font-black",
                        "uppercase",
                        "mb-1.5",
                      )}
                    >
                      <span className={cn("text-muted-foreground")}>
                        {role}
                      </span>
                      <span className={cn("text-foreground")}>{pct}%</span>
                    </div>
                    <div
                      className={cn(
                        "h-1.5",
                        "w-full",
                        "bg-muted",
                        "rounded-full",
                        "overflow-hidden",
                      )}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn("h-full", "bg-foreground")}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* EduStatus breakdown */}
        <div
          className={cn(
            "bg-background",
            "border",
            "border-border",
            "rounded-[2.5rem]",
            "p-8",
            "shadow-sm",
          )}
        >
          <div className={cn("flex", "items-center", "gap-2", "mb-6")}>
            <LuUserPlus className={cn("w-4", "h-4", "text-muted-foreground")} />
            <h4
              className={cn(
                "text-[10px]",
                "font-black",
                "text-foreground",
                "uppercase",
                "tracking-widest",
              )}
            >
              Education Status
            </h4>
          </div>
          {eduEntries.length === 0 ? (
            <p className={cn("text-xs", "font-bold", "text-muted-foreground")}>
              No data yet
            </p>
          ) : (
            <div className="space-y-4">
              {eduEntries.map(([status, count]) => {
                const pct = Math.round((count / totalUsers) * 100);
                return (
                  <div key={status}>
                    <div
                      className={cn(
                        "flex",
                        "justify-between",
                        "text-[10px]",
                        "font-black",
                        "uppercase",
                        "mb-1.5",
                      )}
                    >
                      <span className={cn("text-muted-foreground")}>
                        {status}
                      </span>
                      <span className={cn("text-foreground")}>{pct}%</span>
                    </div>
                    <div
                      className={cn(
                        "h-1.5",
                        "w-full",
                        "bg-muted",
                        "rounded-full",
                        "overflow-hidden",
                      )}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn("h-full", "bg-primary")}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
