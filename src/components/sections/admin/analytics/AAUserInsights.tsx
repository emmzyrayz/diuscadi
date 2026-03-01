"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuUserPlus,
  LuBriefcase,
  LuMapPin,
  LuGraduationCap,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";

// TypeScript Interfaces
interface InsightChartContainerProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  delay?: number;
}

interface DonutDataItem {
  label: string;
  val: number;
  color: string;
}

interface DonutBreakdownProps {
  title: string;
  icon: IconType;
  data: DonutDataItem[];
  delay?: number;
}

interface AcademicItem {
  name: string;
  count: string;
  percent: number;
}

interface AcademicRankingCardProps {
  title: string;
  items: AcademicItem[];
  delay?: number;
}

export const AdminAnalyticsUserInsightsSection: React.FC = () => {
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
              "bg-rose-50",
              "text-rose-600",
              "rounded-xl",
              "border",
              "border-rose-100",
            )}
          >
            <LuUserPlus className={cn("w-5", "h-5")} />
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
              User Insights
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
              Demographics & acquisition trends
            </p>
          </div>
        </div>
      </motion.div>

      {/* 2. User Growth Row */}
      <div className={cn("grid", "grid-cols-1", "xl:grid-cols-2", "gap-8")}>
        <InsightChartContainer
          title="User Acquisition"
          subtitle="New signups vs. active sessions"
          delay={0.1}
        >
          <div className={cn("h-64", "flex", "items-end", "gap-2", "mt-6")}>
            {/* Stacked Bar Chart Mockup */}
            {[30, 45, 60, 40, 70, 85, 95, 80, 100].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{
                  duration: 0.8,
                  delay: 0.3 + i * 0.05,
                  ease: "easeOut",
                }}
                className={cn(
                  "flex-1",
                  "flex",
                  "flex-col",
                  "justify-end",
                  "gap-1",
                )}
              >
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.4 + i * 0.05,
                    ease: "easeOut",
                  }}
                  whileHover={{ scale: 1.05 }}
                  className={cn(
                    "w-full",
                    "bg-slate-900",
                    "rounded-sm",
                    "origin-bottom",
                  )}
                  style={{ height: `${h * 0.7}%` }}
                />
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.5 + i * 0.05,
                    ease: "easeOut",
                  }}
                  whileHover={{ scale: 1.05 }}
                  className={cn(
                    "w-full",
                    "bg-primary",
                    "rounded-sm",
                    "origin-bottom",
                  )}
                  style={{ height: `${h * 0.3}%` }}
                />
              </motion.div>
            ))}
          </div>
          <div
            className={cn(
              "flex",
              "justify-between",
              "mt-4",
              "text-[8px]",
              "font-black",
              "text-slate-400",
              "uppercase",
              "tracking-widest",
            )}
          >
            <div className={cn("flex", "items-center", "gap-2")}>
              <div
                className={cn("w-2", "h-2", "bg-slate-900", "rounded-full")}
              />{" "}
              Returning
            </div>
            <div className={cn("flex", "items-center", "gap-2")}>
              <div className={cn("w-2", "h-2", "bg-primary", "rounded-full")} />{" "}
              New Users
            </div>
          </div>
        </InsightChartContainer>

        {/* 3. Role & Engagement Breakdown */}
        <div className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-6")}>
          <DonutBreakdown
            title="User Roles"
            icon={LuBriefcase}
            data={[
              { label: "Students", val: 65, color: "bg-slate-900" },
              { label: "Alumni", val: 20, color: "bg-primary" },
              { label: "Faculty", val: 15, color: "bg-slate-200" },
            ]}
            delay={0.15}
          />
          <DonutBreakdown
            title="Top Locations"
            icon={LuMapPin}
            data={[
              { label: "Main Campus", val: 55, color: "bg-slate-900" },
              { label: "Remote", val: 30, color: "bg-primary" },
              { label: "International", val: 15, color: "bg-slate-200" },
            ]}
            delay={0.2}
          />
        </div>
      </div>

      {/* 4. DIUSCADI Specifics (Academic Insights) */}
      <div className={cn("grid", "grid-cols-1", "lg:grid-cols-2", "gap-8")}>
        <AcademicRankingCard
          title="Engagement by School"
          items={[
            { name: "School of Engineering", count: "842", percent: 90 },
            { name: "Business & Economics", count: "520", percent: 65 },
            { name: "Arts & Humanities", count: "310", percent: 35 },
            { name: "Science & Tech", count: "290", percent: 30 },
          ]}
          delay={0.25}
        />
        <AcademicRankingCard
          title="Active Departments"
          items={[
            { name: "Computer Science", count: "412", percent: 95 },
            { name: "Architecture", count: "210", percent: 45 },
            { name: "Marketing", count: "180", percent: 40 },
            { name: "Mechanical Eng.", count: "155", percent: 35 },
          ]}
          delay={0.3}
        />
      </div>
    </div>
  );
};

/* --- Helpers --- */
const InsightChartContainer: React.FC<InsightChartContainerProps> = ({
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
    <div className={cn("space-y-1")}>
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

const DonutBreakdown: React.FC<DonutBreakdownProps> = ({
  title,
  data,
  icon: Icon,
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
      "rounded-[2.5rem]",
      "p-8",
      "shadow-sm",
    )}
  >
    <div className={cn("flex", "items-center", "gap-2", "mb-6")}>
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Icon className={cn("w-4", "h-4", "text-slate-400")} />
      </motion.div>
      <h4
        className={cn(
          "text-[10px]",
          "font-black",
          "text-slate-900",
          "uppercase",
          "tracking-widest",
        )}
      >
        {title}
      </h4>
    </div>
    <div className={cn("space-y-4")}>
      {data.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: delay + 0.1 + index * 0.05 }}
        >
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
            <span className={cn("text-slate-500")}>{item.label}</span>
            <span className={cn("text-slate-900")}>{item.val}%</span>
          </div>
          <div
            className={cn(
              "h-1.5",
              "w-full",
              "bg-slate-50",
              "rounded-full",
              "overflow-hidden",
            )}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.val}%` }}
              transition={{
                duration: 1,
                delay: delay + 0.2 + index * 0.05,
                ease: "easeOut",
              }}
              className={cn("h-full", item.color)}
            />
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const AcademicRankingCard: React.FC<AcademicRankingCardProps> = ({
  title,
  items,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.01 }}
    className={cn(
      "bg-slate-50",
      "border",
      "border-slate-100",
      "rounded-[2.5rem]",
      "p-10",
    )}
  >
    <h4
      className={cn(
        "text-xs",
        "font-black",
        "text-slate-900",
        "uppercase",
        "tracking-[0.2em]",
        "mb-8",
      )}
    >
      {title}
    </h4>
    <div className={cn("space-y-6")}>
      {items.map((item, index) => (
        <motion.div
          key={item.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: delay + 0.1 + index * 0.05 }}
          whileHover={{ x: 5 }}
          className={cn("flex", "items-center", "gap-6")}
        >
          <div className={cn("flex-1")}>
            <div className={cn("flex", "justify-between", "mb-2")}>
              <span
                className={cn(
                  "text-[11px]",
                  "font-black",
                  "text-slate-800",
                  "uppercase",
                  "tracking-tight",
                )}
              >
                {item.name}
              </span>
              <span
                className={cn("text-[10px]", "font-bold", "text-slate-400")}
              >
                {item.count} Users
              </span>
            </div>
            <div
              className={cn(
                "h-1",
                "w-full",
                "bg-white",
                "rounded-full",
                "overflow-hidden",
              )}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.percent}%` }}
                transition={{
                  duration: 1,
                  delay: delay + 0.2 + index * 0.05,
                  ease: "easeOut",
                }}
                className={cn("h-full", "bg-slate-900", "rounded-full")}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// Export types
export type {
  InsightChartContainerProps,
  DonutDataItem,
  DonutBreakdownProps,
  AcademicItem,
  AcademicRankingCardProps,
};
