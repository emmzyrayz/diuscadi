"use client";
// AARevenue.tsx
// Revenue data is NOT in the Analytics type from AdminContext.
// The API returns: users, events, registrations, topEvents, recentSignups, health.
// There is no revenue/payment collection in the current schema.
// This section shows registration velocity as the closest available proxy,
// and clearly labels the data source.
// TODO: add revenue tracking when Paystack/Stripe webhooks are integrated.

import React from "react";
import { motion } from "framer-motion";
import { LuTicket, LuInfo } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { Analytics } from "@/context/AdminContext";

interface Props {
  analytics: Analytics | null;
}

export const AdminAnalyticsRevenueSection = ({ analytics }: Props) => {
  const topEvents = analytics?.topEvents ?? [];
  const maxReg = Math.max(...topEvents.map((e) => e.registrations), 1);

  return (
    <div className={cn("space-y-8", "mb-16")}>
      <div className={cn("flex", "items-center", "gap-3")}>
        <div
          className={cn(
            "p-2.5",
            "bg-emerald-50",
            "text-emerald-600",
            "rounded-xl",
            "border",
            "border-emerald-100",
          )}
        >
          <LuTicket className={cn("w-5", "h-5")} />
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
            Registration Analytics
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
            Top events by registrations
          </p>
        </div>
      </div>

      {/* TODO notice */}
      <div
        className={cn(
          "flex",
          "items-start",
          "gap-3",
          "p-4",
          "bg-amber-50",
          "border",
          "border-amber-100",
          "rounded-2xl",
        )}
      >
        <LuInfo
          className={cn("w-4", "h-4", "text-amber-600", "shrink-0", "mt-0.5")}
        />
        <p
          className={cn(
            "text-[11px]",
            "font-bold",
            "text-amber-700",
            "leading-relaxed",
          )}
        >
          Revenue tracking is not yet available — payment webhooks
          (Paystack/Stripe) are not integrated. Showing registration counts as a
          proxy for event performance.
        </p>
      </div>

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
            "mb-8",
          )}
        >
          Event Registration Volume
        </h3>
        {topEvents.length === 0 ? (
          <p
            className={cn(
              "text-sm",
              "font-bold",
              "text-muted-foreground",
              "text-center",
              "py-12",
            )}
          >
            No event data yet
          </p>
        ) : (
          <div className="space-y-4">
            {topEvents.map((event) => {
              const pct = Math.round((event.registrations / maxReg) * 100);
              return (
                <motion.div
                  key={event.eventId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-2"
                >
                  <div className={cn("flex", "justify-between", "items-end")}>
                    <span
                      className={cn(
                        "text-[10px]",
                        "font-black",
                        "text-foreground",
                        "uppercase",
                        "tracking-tight",
                      )}
                    >
                      {event.title}
                    </span>
                    <span
                      className={cn(
                        "text-[10px]",
                        "font-black",
                        "text-muted-foreground",
                      )}
                    >
                      {event.registrations} registered
                    </span>
                  </div>
                  <div
                    className={cn(
                      "h-2",
                      "bg-muted",
                      "rounded-full",
                      "overflow-hidden",
                    )}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn("h-full", "bg-foreground", "rounded-full")}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className={cn("grid", "grid-cols-1", "md:grid-cols-3", "gap-6")}>
        <div
          className={cn(
            "bg-background",
            "border",
            "border-border",
            "p-8",
            "rounded-[2.5rem]",
          )}
        >
          <p
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-[0.2em]",
              "mb-4",
            )}
          >
            Total Registrations
          </p>
          <h4
            className={cn(
              "text-3xl",
              "font-black",
              "text-foreground",
              "tracking-tighter",
            )}
          >
            {analytics?.registrations.total ?? "—"}
          </h4>
        </div>
        <div
          className={cn(
            "bg-background",
            "border",
            "border-border",
            "p-8",
            "rounded-[2.5rem]",
          )}
        >
          <p
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-[0.2em]",
              "mb-4",
            )}
          >
            This Month
          </p>
          <h4
            className={cn(
              "text-3xl",
              "font-black",
              "text-foreground",
              "tracking-tighter",
            )}
          >
            {analytics?.registrations.thisMonth ?? "—"}
          </h4>
        </div>
        <div
          className={cn(
            "bg-background",
            "border",
            "border-border",
            "p-8",
            "rounded-[2.5rem]",
          )}
        >
          <p
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-[0.2em]",
              "mb-4",
            )}
          >
            Checked In
          </p>
          <h4
            className={cn(
              "text-3xl",
              "font-black",
              "text-foreground",
              "tracking-tighter",
            )}
          >
            {analytics?.registrations.checkedIn ?? "—"}
          </h4>
        </div>
      </div>
    </div>
  );
};
