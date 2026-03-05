"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuCalendar, LuArrowRight, LuCirclePlay } from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface FeaturedEvent {
  image: string;
  title: string;
  daysLeft?: number;
  date?: string;
  category?: string;
}

export interface CurrentTask {
  category: string;
  title: string;
  progress: number; // 0 to 100
}

interface HomeHeroProps {
  featuredEvent: FeaturedEvent;
  currentTask: CurrentTask;
}

export const HomeHero = ({ featuredEvent, currentTask }: HomeHeroProps) => {
  return (
    <section
      className={cn(
        "w-full",
        "max-w-7xl",
        "mx-auto",
        "px-4",
        "sm:px-6",
        "lg:px-8",
        "py-8",
      )}
    >
      <div className={cn("grid", "grid-cols-1", "lg:grid-cols-3", "gap-6")}>
        {/* Featured Event */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "lg:col-span-2",
            "relative",
            "group",
            "overflow-hidden",
            "rounded-[2.5rem]",
            "bg-slate-900",
            "min-h-[320px]",
            "flex",
            "flex-col",
            "justify-end",
            "p-8",
            "md:p-10",
          )}
        >
          <Image
            src={featuredEvent.image}
            alt="Featured Event"
            fill
            className={cn(
              "absolute",
              "inset-0",
              "object-cover",
              "opacity-40",
              "group-hover:scale-105",
              "transition-transform",
              "duration-700 ease-in-out",
            )}
          />
          <div
            className={cn(
              "absolute",
              "inset-0",
              "bg-linear-to-t",
              "from-slate-950",
              "via-slate-950/60",
              "to-transparent",
            )}
          />

          <div className={cn("relative", "z-10")}>
            <div className={cn("flex", "items-center", "gap-3", "mb-4")}>
              <span
                className={cn(
                  "px-3",
                  "py-1",
                  "bg-primary",
                  "text-white",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "rounded-full",
                )}
              >
                Upcoming Event
              </span>
              <span
                className={cn(
                  "flex",
                  "items-center",
                  "gap-1.5",
                  "text-orange-200",
                  "text-sm",
                  "font-bold",
                )}
              >
                <LuCalendar className={cn("w-4", "h-4")} />
                Starts in {featuredEvent.daysLeft} days
              </span>
            </div>

            <h2
              className={cn(
                "text-3xl",
                "md:text-4xl",
                "font-black",
                "text-white",
                "mb-6",
                "leading-tight",
              )}
            >
              {featuredEvent.title}
            </h2>

            <div className={cn("flex", "flex-wrap", "gap-4")}>
              <button
                className={cn(
                  "px-8",
                  "py-3.5",
                  "bg-white",
                  "text-slate-950",
                  "font-black",
                  "rounded-2xl",
                  "hover:bg-primary",
                  "hover:text-white hover:border",
                  "transition-all duration-700 ease-in-out cursor-pointer",
                  "flex",
                  "items-center",
                  "gap-2",
                  "group/btn",
                )}
              >
                Register Now
                <LuArrowRight
                  className={cn(
                    "w-4",
                    "h-4",
                    "group-hover/btn:translate-x-1",
                    "transition-transform",
                  )}
                />
              </button>
              <button
                className={cn(
                  "px-6",
                  "py-3.5",
                  "bg-white/10",
                  "backdrop-blur-md",
                  "text-white",
                  "font-bold",
                  "rounded-2xl cursor-pointer",
                  "border",
                  "border-white/20",
                  "hover:bg-white/20",
                  "transition-all",
                )}
              >
                Event Details
              </button>
            </div>
          </div>
        </motion.div>

        {/* Continue Learning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "bg-white",
            "border",
            "border-slate-100",
            "rounded-[2.5rem]",
            "p-8",
            "flex",
            "flex-col",
            "shadow-sm",
          )}
        >
          <div
            className={cn("flex", "items-center", "justify-between", "mb-8")}
          >
            <h3
              className={cn(
                "font-bold",
                "text-slate-900",
                "uppercase",
                "tracking-tighter",
                "text-sm",
              )}
            >
              Resume Learning
            </h3>
            <LuCirclePlay className={cn("text-primary", "w-6", "h-6")} />
          </div>

          <div className="mb-auto">
            <span
              className={cn(
                "text-[10px]",
                "font-bold",
                "text-slate-400",
                "uppercase",
              )}
            >
              {currentTask.category}
            </span>
            <h4
              className={cn(
                "text-xl",
                "font-black",
                "text-slate-900",
                "mt-1",
                "mb-6",
              )}
            >
              {currentTask.title}
            </h4>

            <div className="space-y-3">
              <div
                className={cn(
                  "flex",
                  "justify-between",
                  "text-sm",
                  "font-bold",
                )}
              >
                <span className="text-slate-500">Progress</span>
                <span className="text-primary">{currentTask.progress}%</span>
              </div>
              <div
                className={cn(
                  "h-3",
                  "w-full",
                  "bg-slate-100",
                  "rounded-full",
                  "overflow-hidden",
                )}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentTask.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "h-full",
                    "bg-linear-to-r",
                    "from-orange-400",
                    "to-primary",
                    "rounded-full",
                    "shadow-[0_0_12px_rgba(249,115,22,0.3)]",
                  )}
                />
              </div>
            </div>
          </div>

          <button
            className={cn(
              "mt-8",
              "w-full",
              "py-4",
              "bg-slate-50",
              "hover:bg-primary",
              "hover:text-white",
              "text-slate-900",
              "font-bold",
              "rounded-2xl",
              "transition-all duration-700 ease-in-out cursor-pointer",
              "flex",
              "items-center",
              "justify-center",
              "gap-2",
              "group",
            )}
          >
            Continue Module
            <LuCirclePlay
              className={cn(
                "w-4",
                "h-4",
                "group-hover:scale-110",
                "transition-transform",
              )}
            />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
