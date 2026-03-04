"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuSparkles,
  LuBookOpen,
  LuCalendar,
  LuCirclePlay,
  LuStar,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/app/home/page";

// Visual config stays in the component — derived from item.type
const TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  Program: {
    icon: <LuCirclePlay className={cn("w-4", "h-4")} />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  Event: {
    icon: <LuCalendar className={cn("w-4", "h-4")} />,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
  Resource: {
    icon: <LuBookOpen className={cn("w-4", "h-4")} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
};

interface RecommendedSectionProps {
  recommendations: Recommendation[];
  userInterests: string;
}

export const RecommendedSection = ({
  recommendations,
  userInterests,
}: RecommendedSectionProps) => {
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
      )}
    >
      <div className={cn("flex", "items-center", "gap-2", "mb-8")}>
        <div className={cn("p-2", "bg-primary/10", "rounded-lg")}>
          <LuSparkles className={cn("text-primary", "w-5", "h-5")} />
        </div>
        <div>
          <h3
            className={cn(
              "text-xl",
              "font-black",
              "text-slate-900",
              "leading-none",
            )}
          >
            Recommended for you
          </h3>
          <p className={cn("text-sm", "text-slate-500", "mt-1")}>
            Based on your interests in {userInterests}
          </p>
        </div>
      </div>

      <div className={cn("grid", "grid-cols-1", "md:grid-cols-3", "gap-6")}>
        {recommendations.map((item, index) => {
          const config = TYPE_CONFIG[item.type] ?? {
            icon: <LuSparkles className={cn("w-4", "h-4")} />,
            color: "text-slate-600",
            bg: "bg-slate-50",
            border: "border-slate-100",
          };
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={cn(
                "group",
                "relative",
                "bg-white",
                "border",
                "border-slate-100",
                "rounded-[2rem]",
                "p-2",
                "shadow-sm",
                "hover:shadow-xl",
                "hover:shadow-slate-200/50",
                "transition-all",
                "duration-300",
              )}
            >
              <div className="p-6">
                <div
                  className={cn(
                    "flex",
                    "justify-between",
                    "items-start",
                    "mb-6",
                  )}
                >
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      config.bg,
                      config.color,
                      config.border,
                    )}
                  >
                    {item.type}
                  </span>
                  <LuStar
                    className={cn(
                      "text-slate-200",
                      "group-hover:text-primary",
                      "transition-colors",
                      "cursor-pointer",
                    )}
                  />
                </div>

                <h4
                  className={cn(
                    "text-lg",
                    "font-bold",
                    "text-slate-900",
                    "group-hover:text-primary",
                    "transition-colors",
                    "mb-2",
                    "line-clamp-2",
                  )}
                >
                  {item.title}
                </h4>

                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-2",
                    "text-slate-400",
                    "text-xs",
                    "font-medium",
                    "mb-6",
                  )}
                >
                  {config.icon}
                  {item.meta}
                </div>

                <div
                  className={cn(
                    "pt-4",
                    "border-t",
                    "border-slate-50",
                    "flex",
                    "items-center",
                    "justify-between",
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px]",
                      "font-bold",
                      "text-slate-400",
                      "uppercase",
                      "italic",
                    )}
                  >
                    {item.tag}
                  </span>
                  <button
                    className={cn(
                      "p-2",
                      "bg-slate-50",
                      "group-hover:bg-primary",
                      "group-hover:text-white",
                      "rounded-full",
                      "transition-all",
                    )}
                  >
                    <LuSparkles className={cn("w-4", "h-4")} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
