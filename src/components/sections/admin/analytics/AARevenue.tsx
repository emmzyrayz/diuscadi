"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuDollarSign, LuMaximize2, LuDownload } from "react-icons/lu";
import { cn } from "@/lib/utils";

// TypeScript Interfaces
interface ChartContainerProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  delay?: number;
}

interface ProgressBarProps {
  label: string;
  value: string;
  percentage: number;
  color: string;
  delay?: number;
}

interface BreakdownItem {
  name: string;
  value: string;
  sub: string;
}

interface BreakdownCardProps {
  label: string;
  items: BreakdownItem[];
  delay?: number;
}

export const AdminAnalyticsRevenueSection: React.FC = () => {
  return (
    <div className={cn("space-y-8", "mb-16")}>
      {/* 1. Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn("flex", "items-center", "justify-between")}
      >
        <div className={cn("flex", "items-center", "gap-3")}>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "p-2.5",
              "bg-emerald-50",
              "text-emerald-600",
              "rounded-xl",
              "border",
              "border-emerald-100",
            )}
          >
            <LuDollarSign className={cn("w-5", "h-5")} />
          </motion.div>
          <div>
            <h2
              className={cn(
                "text-xl",
                "font-black",
                "text-slate-900",
                "uppercase",
                "tracking-tighter",
              )}
            >
              Revenue Analytics
            </h2>
            <p
              className={cn(
                "text-[10px]",
                "font-bold",
                "text-slate-400",
                "uppercase",
                "tracking-widest",
              )}
            >
              Monetary growth & distribution
            </p>
          </div>
        </div>

        <div className={cn("flex", "items-center", "gap-2")}>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "rgb(248 250 252)" }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "p-2",
              "rounded-lg",
              "text-slate-400",
              "transition-colors",
            )}
          >
            <LuDownload className={cn("w-4", "h-4")} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "rgb(248 250 252)" }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "p-2",
              "rounded-lg",
              "text-slate-400",
              "transition-colors",
            )}
          >
            <LuMaximize2 className={cn("w-4", "h-4")} />
          </motion.button>
        </div>
      </motion.div>

      {/* 2. Primary Revenue Charts */}
      <div className={cn("grid", "grid-cols-1", "xl:grid-cols-2", "gap-8")}>
        {/* RevenueLineChart (Time-series) */}
        <ChartContainer
          title="Revenue Velocity"
          subtitle="Daily gross earnings over time"
          delay={0.1}
        >
          <div
            className={cn(
              "h-64",
              "flex",
              "items-end",
              "justify-between",
              "gap-1",
              "mt-6",
            )}
          >
            {/* Visual representation of an Area Chart */}
            {[20, 35, 25, 60, 45, 80, 55, 90, 75, 100].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{
                  duration: 0.8,
                  delay: 0.3 + i * 0.05,
                  ease: "easeOut",
                }}
                whileHover={{
                  scale: 1.05,
                  filter: "brightness(1.1)",
                }}
                className={cn(
                  "flex-1",
                  "bg-linear-to-t",
                  "from-emerald-500/10",
                  "to-emerald-500",
                  "rounded-t-lg",
                  "transition-all",
                  "cursor-pointer",
                )}
              />
            ))}
          </div>
          <div
            className={cn(
              "flex",
              "justify-between",
              "mt-4",
              "text-[9px]",
              "font-black",
              "text-slate-300",
              "uppercase",
              "tracking-widest",
            )}
          >
            <span>Oct 01</span>
            <span>Oct 15</span>
            <span>Oct 31</span>
          </div>
        </ChartContainer>

        {/* RevenueBarChart (Categorical) */}
        <ChartContainer
          title="Event Performance"
          subtitle="Gross revenue per major summit"
          delay={0.15}
        >
          <div className={cn("space-y-4", "mt-6")}>
            <ProgressBar
              label="Tech Summit 2026"
              value="$84,200"
              percentage={100}
              color="bg-slate-900"
              delay={0.4}
            />
            <ProgressBar
              label="AI Masterclass"
              value="$32,150"
              percentage={45}
              color="bg-emerald-500"
              delay={0.45}
            />
            <ProgressBar
              label="Founder Night"
              value="$18,400"
              percentage={25}
              color="bg-blue-500"
              delay={0.5}
            />
            <ProgressBar
              label="Web3 Meetup"
              value="$8,100"
              percentage={12}
              color="bg-slate-300"
              delay={0.55}
            />
          </div>
        </ChartContainer>
      </div>

      {/* 3. RevenueBreakdownCards */}
      <div className={cn("grid", "grid-cols-1", "md:grid-cols-3", "gap-6")}>
        <BreakdownCard
          label="Revenue by Tier"
          items={[
            { name: "VIP Pass", value: "65%", sub: "$92.8k" },
            { name: "Regular", value: "25%", sub: "$35.7k" },
            { name: "Student", value: "10%", sub: "$14.3k" },
          ]}
          delay={0.2}
        />
        <BreakdownCard
          label="Acquisition Channel"
          items={[
            { name: "Invite Codes", value: "72%", sub: "Organic" },
            { name: "Direct Sale", value: "18%", sub: "Marketing" },
            { name: "Referrals", value: "10%", sub: "Affiliate" },
          ]}
          delay={0.25}
        />
        <BreakdownCard
          label="Payment Method"
          items={[
            { name: "Card", value: "88%", sub: "Stripe" },
            { name: "Bank Transfer", value: "9%", sub: "Manual" },
            { name: "Other", value: "3%", sub: "Wallets" },
          ]}
          delay={0.3}
        />
      </div>
    </div>
  );
};

/* --- Helpers --- */
const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.01 }}
    className={cn(
      "bg-white",
      "border",
      "border-slate-100",
      "rounded-[2.5rem]",
      "p-10",
      "shadow-sm",
    )}
  >
    <div className={cn("flex", "flex-col", "gap-1")}>
      <h3
        className={cn(
          "text-sm",
          "font-black",
          "text-slate-900",
          "uppercase",
          "tracking-tight",
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-[10px]",
          "font-bold",
          "text-slate-400",
          "uppercase",
          "tracking-widest",
        )}
      >
        {subtitle}
      </p>
    </div>
    {children}
  </motion.div>
);

const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  percentage,
  color,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay }}
    className={cn("space-y-2")}
  >
    <div className={cn("flex", "justify-between", "items-end")}>
      <span
        className={cn(
          "text-[10px]",
          "font-black",
          "text-slate-900",
          "uppercase",
          "tracking-tight",
        )}
      >
        {label}
      </span>
      <span className={cn("text-[10px]", "font-black", "text-slate-400")}>
        {value}
      </span>
    </div>
    <div
      className={cn(
        "h-2",
        "bg-slate-50",
        "rounded-full",
        "overflow-hidden",
        "relative",
      )}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
        className={cn("h-full", color, "rounded-full")}
      >
        {/* Shimmer effect */}
        <motion.div
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "linear",
          }}
          className={cn(
            "absolute",
            "inset-0",
            "bg-linear-to-r",
            "from-transparent",
            "via-white/20",
            "to-transparent",
          )}
        />
      </motion.div>
    </div>
  </motion.div>
);

const BreakdownCard: React.FC<BreakdownCardProps> = ({
  label,
  items,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
    className={cn(
      "bg-white",
      "border",
      "border-slate-100",
      "p-8",
      "rounded-[2.5rem]",
    )}
  >
    <h4
      className={cn(
        "text-[10px]",
        "font-black",
        "text-slate-400",
        "uppercase",
        "tracking-[0.2em]",
        "mb-6",
      )}
    >
      {label}
    </h4>
    <div className={cn("space-y-5")}>
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: delay + 0.1 + i * 0.05 }}
          whileHover={{ x: 5 }}
          className={cn("flex", "items-center", "justify-between")}
        >
          <div className={cn("flex", "flex-col")}>
            <span
              className={cn(
                "text-xs",
                "font-black",
                "text-slate-900",
                "uppercase",
                "tracking-tight",
              )}
            >
              {item.name}
            </span>
            <span
              className={cn(
                "text-[9px]",
                "font-bold",
                "text-slate-400",
                "uppercase",
              )}
            >
              {item.sub}
            </span>
          </div>
          <span className={cn("text-sm", "font-black", "text-slate-900")}>
            {item.value}
          </span>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// Export types
export type {
  ChartContainerProps,
  ProgressBarProps,
  BreakdownItem,
  BreakdownCardProps,
};