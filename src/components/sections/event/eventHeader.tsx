"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuLayoutGrid, LuChevronRight } from "react-icons/lu";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const EventsHeader = () => {
  return (
    <section
      className={cn("w-full", "bg-white", "border-b", "border-slate-100")}
    >
      <div
        className={cn(
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "py-10",
          "md:py-16",
        )}
      >
        <div
          className={cn(
            "flex",
            "flex-col",
            "md:flex-row",
            "md:items-end",
            "justify-between",
            "gap-6",
          )}
        >
          {/* Left Side: Context & Title */}
          <div className="space-y-4">
            <nav
              className={cn(
                "flex",
                "items-center",
                "gap-2",
                "text-xs",
                "font-bold",
                "text-slate-400",
                "uppercase",
                "tracking-widest",
              )}
            >
              <Link href="/">
                <span
                  className={cn(
                    "hover:text-primary",
                    "cursor-pointer",
                    "transition-colors",
                  )}
                >
                  Home
                </span>
              </Link>
              <LuChevronRight className={cn("w-3", "h-3")} />
              <Link href="/events">
                <span className="text-slate-900">Events</span>
              </Link>
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1
                className={cn(
                  "text-4xl",
                  "md:text-6xl",
                  "font-black",
                  "text-slate-900",
                  "tracking-tighter",
                )}
              >
                Events<span className="text-primary">.</span>
              </h1>
              <p
                className={cn(
                  "text-lg",
                  "md:text-xl",
                  "text-slate-500",
                  "mt-2",
                  "max-w-2xl",
                  "font-medium",
                  "leading-relaxed",
                )}
              >
                Discover workshops, seminars, and mentorship programs designed
                to accelerate your career journey.
              </p>
            </motion.div>
          </div>

          {/* Right Side: Quick Action */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="shrink-0"
          >
            <button
              className={cn(
                "inline-flex",
                "items-center",
                "gap-3",
                "px-6",
                "py-3.5",
                "bg-slate-900",
                "hover:bg-primary",
                "text-white",
                "font-bold",
                "rounded-2xl",
                "transition-all",
                "shadow-lg",
                "shadow-slate-200",
                "hover:shadow-primary/20",
                "group",
              )}
            >
              <LuLayoutGrid
                className={cn(
                  "w-5",
                  "h-5",
                  "group-hover:rotate-90",
                  "transition-transform",
                  "duration-500",
                )}
              />
              Browse Programs
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
