"use client";
// AAConversion.tsx
// Funnel data derived from pageVisits collection + eventRegistrations.
// Three real steps tracked: event listing → event detail → register page → completed.
// Drop-off data from vault (unverified) + userData (no avatar after 3 days).
// Click-to-register step not tracked — requires client-side button event.

import React from "react";
import { motion } from "framer-motion";
import { IconType } from "react-icons";
import {
  LuFilter,
  LuMousePointerClick,
  LuUserCheck,
  LuArrowDown,
  LuTarget,
  LuMailX,
  LuImageOff,
  LuTrendingDown,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { Analytics } from "@/context/AdminContext";

interface Props {
  analytics: Analytics | null;
}

export const AdminAnalyticsConversionSection: React.FC<Props> = ({
  analytics,
}) => {
  const funnel = analytics?.funnel;

  const steps = [
    {
      label: "Event Listing Views",
      sublabel: "/events page",
      value: funnel?.eventListingViews ?? 0,
      isReal: true,
    },
    {
      label: "Event Detail Views",
      sublabel: "/events/[slug]",
      value: funnel?.eventDetailViews ?? 0,
      isReal: true,
    },
    {
      label: "Registration Page Views",
      sublabel: "/events/[slug]/register",
      value: funnel?.registerPageViews ?? 0,
      isReal: true,
    },
    {
      label: "Completed Registrations",
      sublabel: "eventRegistrations collection",
      value: funnel?.completedRegistrations ?? 0,
      isReal: true,
    },
  ];

  // Normalise all bars relative to the largest step
  const maxValue = Math.max(1, ...steps.map((s) => s.value));

  // Conversion rates between adjacent steps
  const rates = steps.map((step, i) => {
    if (i === 0) return null;
    const prev = steps[i - 1].value;
    if (prev === 0) return null;
    return Math.round((step.value / prev) * 100);
  });

  // Overall listing → completion rate
  const overallRate =
    steps[0].value > 0
      ? ((steps[3].value / steps[0].value) * 100).toFixed(1)
      : "0.0";

  const hasData = steps.some((s) => s.value > 0);

  return (
    <div className={cn("space-y-8", "mb-16")}>
      {/* Section header */}
      <div className={cn("flex", "items-center", "gap-3")}>
        <div
          className={cn(
            "p-2.5",
            "bg-primary/10",
            "text-foreground",
            "rounded-xl",
            "border",
            "border-primary/20",
          )}
        >
          <LuTarget className="w-5 h-5" />
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
            Growth Optimization
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
            Funnel performance & conversion bottlenecks
          </p>
        </div>
      </div>

      {/* Data source notice — honest but not alarming */}
      {!hasData && (
        <div
          className={cn(
            "flex",
            "items-start",
            "gap-3",
            "p-4",
            "bg-blue-50",
            "border",
            "border-blue-100",
            "rounded-2xl",
          )}
        >
          <LuFilter className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p
            className={cn(
              "text-[11px]",
              "font-bold",
              "text-blue-700",
              "leading-relaxed",
            )}
          >
            Funnel data is collecting — visit data builds up as users navigate
            the platform. The bars below will populate automatically within 24
            hours of platform activity.
          </p>
        </div>
      )}

      <div className={cn("grid", "grid-cols-1", "xl:grid-cols-3", "gap-8")}>
        {/* Funnel chart */}
        <div
          className={cn(
            "xl:col-span-2",
            "bg-background",
            "border",
            "border-border",
            "rounded-[2.5rem]",
            "p-10",
            "shadow-sm",
          )}
        >
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3
                className={cn(
                  "text-sm",
                  "font-black",
                  "text-foreground",
                  "uppercase",
                  "tracking-tight",
                )}
              >
                Acquisition Funnel
              </h3>
              <p
                className={cn(
                  "text-[10px]",
                  "font-bold",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-widest",
                  "mt-1",
                )}
              >
                Last 30 days · real visit + registration data
              </p>
            </div>
            {hasData && (
              <div className={cn("text-right")}>
                <p
                  className={cn(
                    "text-[9px]",
                    "font-black",
                    "text-muted-foreground",
                    "uppercase",
                    "tracking-widest",
                  )}
                >
                  Overall Rate
                </p>
                <p
                  className={cn(
                    "text-2xl",
                    "font-black",
                    "text-foreground",
                    "tracking-tighter",
                  )}
                >
                  {overallRate}%
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {steps.map((step, i) => {
              const pct = Math.round((step.value / maxValue) * 100);
              const rate = rates[i];
              return (
                <div key={step.label}>
                  {/* Drop-off indicator between steps */}
                  {i > 0 && rate !== null && (
                    <div
                      className={cn(
                        "flex",
                        "items-center",
                        "gap-2",
                        "my-2",
                        "pl-2",
                      )}
                    >
                      <LuArrowDown className="w-3 h-3 text-slate-300" />
                      <span
                        className={cn(
                          "text-[9px]",
                          "font-black",
                          "uppercase",
                          "tracking-widest",
                          rate < 30
                            ? "text-rose-500"
                            : rate < 60
                              ? "text-amber-500"
                              : "text-emerald-500",
                        )}
                      >
                        {rate}% through-rate
                      </span>
                    </div>
                  )}

                  {/* Funnel bar */}
                  <div>
                    <div
                      className={cn(
                        "flex",
                        "justify-between",
                        "items-end",
                        "mb-1.5",
                      )}
                    >
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
                          {step.label}
                        </span>
                        <span
                          className={cn(
                            "text-[9px]",
                            "font-bold",
                            "text-muted-foreground",
                            "ml-2",
                          )}
                        >
                          {step.sublabel}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-xs",
                          "font-black",
                          "text-foreground",
                          "tabular-nums",
                        )}
                      >
                        {step.value.toLocaleString()}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "h-10",
                        "w-full",
                        "bg-muted",
                        "rounded-2xl",
                        "overflow-hidden",
                        "border",
                        "border-border",
                      )}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.max(pct, step.value > 0 ? 2 : 0)}%`,
                        }}
                        transition={{
                          duration: 0.8,
                          delay: i * 0.1,
                          ease: "easeOut",
                        }}
                        className={cn(
                          "h-full rounded-2xl",
                          i === 0
                            ? "bg-foreground"
                            : i === 1
                              ? "bg-slate-600"
                              : i === 2
                                ? "bg-slate-400"
                                : "bg-primary",
                        )}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drop-off breakdown */}
        <div
          className={cn(
            "bg-rose-50",
            "border",
            "border-rose-100",
            "rounded-[2.5rem]",
            "p-10",
            "flex",
            "flex-col",
          )}
        >
          <div className={cn("space-y-1", "mb-8")}>
            <h3
              className={cn(
                "text-sm",
                "font-black",
                "text-rose-900",
                "uppercase",
                "tracking-tight",
                "flex",
                "items-center",
                "gap-2",
              )}
            >
              <LuTrendingDown className="w-4 h-4" /> Drop-off Signals
            </h3>
            <p
              className={cn(
                "text-[10px]",
                "font-bold",
                "text-rose-400",
                "uppercase",
                "tracking-widest",
              )}
            >
              Real data · last 30 days
            </p>
          </div>
          <div className={cn("flex-1", "space-y-6")}>
            <DropoffItem
              icon={LuMailX}
              stage="Email Unverified"
              value={funnel?.dropoff.emailUnverified ?? 0}
              desc="New signups who haven't verified their email"
              severity={
                (funnel?.dropoff.emailUnverified ?? 0) > 20
                  ? "high"
                  : (funnel?.dropoff.emailUnverified ?? 0) > 5
                    ? "medium"
                    : "low"
              }
            />
            <DropoffItem
              icon={LuImageOff}
              stage="Profile Incomplete"
              value={funnel?.dropoff.profileIncomplete ?? 0}
              desc="Users with no avatar after 3+ days"
              severity={
                (funnel?.dropoff.profileIncomplete ?? 0) > 30
                  ? "high"
                  : (funnel?.dropoff.profileIncomplete ?? 0) > 10
                    ? "medium"
                    : "low"
              }
            />
            <div className={cn("pt-4", "border-t", "border-rose-100")}>
              <p
                className={cn(
                  "text-[9px]",
                  "font-black",
                  "text-rose-400",
                  "uppercase",
                  "tracking-widest",
                  "mb-2",
                )}
              >
                Profile Completion Rate
              </p>
              <div className={cn("flex", "items-end", "gap-2")}>
                <p
                  className={cn(
                    "text-3xl",
                    "font-black",
                    "text-rose-900",
                    "tracking-tighter",
                  )}
                >
                  {funnel?.dropoff.profileCompletionRate ?? 0}%
                </p>
                <p
                  className={cn(
                    "text-[9px]",
                    "font-bold",
                    "text-rose-400",
                    "pb-1",
                  )}
                >
                  of users have a profile photo
                </p>
              </div>
              <div
                className={cn(
                  "mt-3",
                  "h-2",
                  "bg-rose-100",
                  "rounded-full",
                  "overflow-hidden",
                )}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${funnel?.dropoff.profileCompletionRate ?? 0}%`,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-rose-400 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className={cn("grid", "grid-cols-1", "md:grid-cols-3", "gap-6")}>
        <ConversionStat
          icon={LuMousePointerClick}
          label="Listing → Detail Rate"
          value={
            steps[0].value > 0
              ? `${Math.round((steps[1].value / steps[0].value) * 100)}%`
              : "—"
          }
          status={steps[0].value > 0 ? "Real data" : "No data yet"}
          isReal={steps[0].value > 0}
        />
        <ConversionStat
          icon={LuFilter}
          label="Detail → Register Rate"
          value={
            steps[1].value > 0
              ? `${Math.round((steps[2].value / steps[1].value) * 100)}%`
              : "—"
          }
          status={steps[1].value > 0 ? "Real data" : "No data yet"}
          isReal={steps[1].value > 0}
        />
        <ConversionStat
          icon={LuUserCheck}
          label="Register → Completed"
          value={
            steps[2].value > 0
              ? `${Math.round((steps[3].value / steps[2].value) * 100)}%`
              : "—"
          }
          status={steps[2].value > 0 ? "Real data" : "No data yet"}
          isReal={steps[2].value > 0}
        />
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface DropoffItemProps {
  icon: IconType;
  stage: string;
  value: number;
  desc: string;
  severity: "high" | "medium" | "low";
}

const DropoffItem: React.FC<DropoffItemProps> = ({
  icon: Icon,
  stage,
  value,
  desc,
  severity,
}) => {
  const colors = {
    high: "text-rose-700",
    medium: "text-rose-500",
    low: "text-rose-300",
  };
  return (
    <div className="space-y-1">
      <div className={cn("flex", "items-center", "justify-between")}>
        <span
          className={cn(
            "text-[10px]",
            "font-black",
            "text-rose-900",
            "uppercase",
            "tracking-tight",
            "flex",
            "items-center",
            "gap-1.5",
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          {stage}
        </span>
        <span className={cn("text-sm", "font-black", colors[severity])}>
          {value.toLocaleString()}
        </span>
      </div>
      <p
        className={cn(
          "text-[9px]",
          "font-bold",
          "text-rose-400",
          "uppercase",
          "leading-tight",
        )}
      >
        {desc}
      </p>
    </div>
  );
};

interface ConversionStatProps {
  icon: IconType;
  label: string;
  value: string;
  status: string;
  isReal: boolean;
}

const ConversionStat: React.FC<ConversionStatProps> = ({
  icon: Icon,
  label,
  value,
  status,
  isReal,
}) => (
  <div
    className={cn(
      "bg-background",
      "border",
      "border-border",
      "p-8",
      "rounded-[2.5rem]",
      "shadow-sm",
      "flex",
      "items-center",
      "justify-between",
    )}
  >
    <div className="space-y-4">
      <div className={cn("flex", "items-center", "gap-2")}>
        <Icon className={cn("w-4", "h-4", "text-muted-foreground")} />
        <span
          className={cn(
            "text-[9px]",
            "font-black",
            "text-muted-foreground",
            "uppercase",
            "tracking-[0.2em]",
          )}
        >
          {label}
        </span>
      </div>
      <h4
        className={cn(
          "text-3xl",
          "font-black",
          "tracking-tighter",
          isReal ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {value}
      </h4>
    </div>
    <span
      className={cn(
        "text-[8px]",
        "font-black",
        "uppercase",
        "tracking-widest",
        "px-3",
        "py-1.5",
        "rounded-full",
        "border",
        isReal
          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
          : "bg-muted text-muted-foreground border-border",
      )}
    >
      {status}
    </span>
  </div>
);
