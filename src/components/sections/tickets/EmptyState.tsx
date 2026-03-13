"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuSearch, LuTicket, LuArrowRight, LuSparkles } from "react-icons/lu";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const EmptyState = ({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) => (
  <section className={cn("w-full", "py-12")}>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-background",
        "border-2",
        "border-dashed",
        "border-border",
        "rounded-[3rem]",
        "p-12",
        "md:p-20",
        "flex",
        "flex-col",
        "items-center",
        "text-center",
      )}
    >
      {/* Icon */}
      <div className={cn("relative", "mb-8")}>
        <div
          className={cn(
            "w-24",
            "h-24",
            "bg-muted",
            "rounded-full",
            "flex",
            "items-center",
            "justify-center",
          )}
        >
          <LuTicket
            className={cn("w-12", "h-12", "text-slate-200", "-rotate-12")}
          />
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className={cn(
            "absolute",
            "-top-2",
            "-right-2",
            "w-8",
            "h-8",
            "bg-primary/10",
            "text-primary",
            "rounded-lg",
            "flex",
            "items-center",
            "justify-center",
          )}
        >
          <LuSparkles className={cn("w-4", "h-4")} />
        </motion.div>
      </div>

      {/* Text */}
      <div className={cn("max-w-md", "space-y-4", "mb-10")}>
        <h2
          className={cn(
            "text-2xl",
            "md:text-3xl",
            "font-black",
            "text-foreground",
            "tracking-tight",
          )}
        >
          No tickets found yet.
        </h2>
        <p
          className={cn(
            "text-muted-foreground",
            "font-medium",
            "leading-relaxed",
          )}
        >
          It looks like you haven&apos;t registered for any events yet, or your
          current filters don&apos;t match any tickets. Ready to start your
          journey?
        </p>
      </div>

      {/* Actions */}
      <div
        className={cn(
          "flex",
          "flex-col",
          "sm:flex-row",
          "items-center",
          "gap-4",
        )}
      >
        <Link
          href="/events"
          className={cn(
            "px-8",
            "py-4",
            "bg-foreground",
            "text-background",
            "font-black",
            "rounded-2xl",
            "flex",
            "items-center",
            "gap-3",
            "hover:bg-primary",
            "transition-all",
            "shadow-xl",
            "shadow-foreground/10",
            "group",
          )}
        >
          Explore Events
          <LuArrowRight
            className={cn(
              "w-5",
              "h-5",
              "group-hover:translate-x-1",
              "transition-transform",
            )}
          />
        </Link>
        <button
          onClick={onClearFilters}
          className={cn(
            "px-8",
            "py-4",
            "bg-background",
            "border-2",
            "border-border",
            "text-slate-600",
            "font-bold",
            "rounded-2xl",
            "hover:border-slate-300",
            "transition-all",
            "flex",
            "items-center",
            "gap-2",
            "cursor-pointer",
          )}
        >
          <LuSearch className={cn("w-4", "h-4")} />
          Clear All Filters
        </button>
      </div>

      <p
        className={cn(
          "mt-12",
          "text-[10px]",
          "font-black",
          "uppercase",
          "tracking-[0.2em]",
          "text-slate-300",
        )}
      >
        Need help?{" "}
        <a
          href="mailto:support@diuscadi.org.ng"
          className={cn("text-primary", "hover:underline")}
        >
          Contact Support
        </a>
      </p>
    </motion.div>
  </section>
);
