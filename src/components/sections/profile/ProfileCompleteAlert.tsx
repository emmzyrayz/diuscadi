"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuTriangleAlert, LuArrowRight, LuSparkles } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface ProfileCompletionAlertProps {
  isVisible: boolean;
  missingFields: string[];
  onAction: () => void;
}

export const ProfileCompletionAlert = ({
  isVisible,
  missingFields,
  onAction,
}: ProfileCompletionAlertProps) => {
  if (!isVisible || missingFields.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="mt-6"
      >
        <div
          className={cn(
            "bg-amber-500/8 border border-amber-500/20 rounded-[2rem] p-4 md:p-6",
            "relative overflow-hidden",
          )}
        >
          {/* Background sparkle */}
          <LuSparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-500/10 rotate-12 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Warning */}
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl bg-background flex items-center justify-center shrink-0",
                  "shadow-sm border border-amber-500/20",
                )}
              >
                <LuTriangleAlert className="w-6 h-6 text-amber-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-foreground uppercase tracking-tight">
                  Incomplete Profile
                </h4>
                <p className="text-xs font-bold text-muted-foreground leading-relaxed max-w-md">
                  Complete your profile to unlock event registrations. Missing:{" "}
                  <span className="text-foreground">
                    {missingFields.join(", ")}
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={onAction}
              className={cn(
                "w-full md:w-auto flex items-center justify-center gap-3",
                "px-8 py-4 bg-amber-500 text-white rounded-2xl",
                "font-black text-xs uppercase tracking-widest",
                "hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/20 transition-all",
                "group/btn cursor-pointer",
              )}
            >
              Finish Profile Setup
              <LuArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
