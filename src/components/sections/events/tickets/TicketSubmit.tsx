"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuTicket,
  LuLoader,
  LuCircleCheck,
  LuArrowRight,
  LuSave,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

interface SubmitSectionProps {
  price: string; // e.g., "Free" or "₦15,000"
  onComplete?: () => void;
}

export const TicketSubmitSection = ({
  price,
  onComplete,
}: SubmitSectionProps) => {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = () => {
    setStatus("loading");
    // Simulating API call
    setTimeout(() => {
      setStatus("success");
      if (onComplete) onComplete();
    }, 2500);
  };

  const isFree = price.toLowerCase() === "free";

  return (
    <section className={cn("w-full", "max-w-4xl", "mx-auto", "px-4", "py-12")}>
      <div
        className={cn(
          "bg-slate-900",
          "rounded-[3rem]",
          "p-8",
          "md:p-12",
          "shadow-2xl",
          "relative",
          "overflow-hidden",
        )}
      >
        {/* Decorative background glow */}
        <div
          className={cn(
            "absolute",
            "-top-24",
            "-right-24",
            "w-64",
            "h-64",
            "bg-primary/20",
            "rounded-full",
            "blur-[80px]",
          )}
        />

        <div
          className={cn("relative", "z-10", "flex", "flex-col", "items-center")}
        >
          {/* 1. Price Breakdown Summary */}
          <div className={cn("w-full", "max-w-md", "mb-10", "space-y-3")}>
            <div
              className={cn(
                "flex",
                "justify-between",
                "items-center",
                "text-slate-400",
                "text-sm",
                "font-medium",
                "px-2",
              )}
            >
              <span>Standard Access Pass</span>
              <span>{price}</span>
            </div>
            <div
              className={cn(
                "flex",
                "justify-between",
                "items-center",
                "text-slate-400",
                "text-sm",
                "font-medium",
                "px-2",
              )}
            >
              <span>Service & Processing Fee</span>
              <span className="text-emerald-500">₦0.00</span>
            </div>

            <div className={cn("h-px", "bg-white/10", "my-4", "w-full")} />

            <div
              className={cn("flex", "justify-between", "items-center", "px-2")}
            >
              <span
                className={cn(
                  "text-white",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "text-sm",
                )}
              >
                Total Due
              </span>
              <span
                className={cn(
                  "text-3xl font-black",
                  isFree ? "text-emerald-400" : "text-white",
                )}
              >
                {price}
              </span>
            </div>
          </div>

          {/* 2. Action Buttons */}
          <div
            className={cn(
              "flex",
              "flex-col",
              "sm:flex-row",
              "items-center",
              "gap-4",
              "w-full",
              "max-w-md",
            )}
          >
            <button
              disabled={status !== "idle"}
              onClick={handleSubmit}
              className={cn(
                "relative w-full sm:flex-1 h-16 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 overflow-hidden",
                status === "success"
                  ? "bg-emerald-500 text-white"
                  : "bg-primary text-white hover:bg-orange-600 active:scale-95 shadow-xl shadow-primary/25 disabled:opacity-80",
              )}
            >
              <AnimatePresence mode="wait">
                {status === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn("flex", "items-center", "gap-2")}
                  >
                    Get Ticket <LuTicket className={cn("w-5", "h-5")} />
                  </motion.div>
                )}

                {status === "loading" && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn("flex", "items-center", "gap-2")}
                  >
                    <LuLoader className={cn("w-5", "h-5", "animate-spin")} />{" "}
                    Generating...
                  </motion.div>
                )}

                {status === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn("flex", "items-center", "gap-2")}
                  >
                    <LuCircleCheck className={cn("w-5", "h-5")} /> Confirmed!
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Optional Save Draft */}
            {status === "idle" && (
              <button
                className={cn(
                  "w-full",
                  "sm:w-auto",
                  "h-16",
                  "px-6",
                  "bg-white/5",
                  "hover:bg-white/10",
                  "text-white",
                  "border",
                  "border-white/10",
                  "rounded-2xl",
                  "font-bold",
                  "transition-colors",
                  "flex",
                  "items-center",
                  "justify-center",
                  "gap-2",
                  "group",
                )}
              >
                <LuSave
                  className={cn(
                    "w-5",
                    "h-5",
                    "text-slate-400",
                    "group-hover:text-white",
                    "transition-colors",
                  )}
                />
                <span className={cn("sm:hidden", "lg:inline")}>Save Draft</span>
              </button>
            )}
          </div>

          {/* 3. Security Guarantee */}
          <p
            className={cn(
              "mt-8",
              "text-[10px]",
              "text-slate-500",
              "font-black",
              "uppercase",
              "tracking-[0.2em]",
              "flex",
              "items-center",
              "gap-2",
            )}
          >
            Secure checkout powered by DIUSCADI Core
          </p>
        </div>
      </div>
    </section>
  );
};
