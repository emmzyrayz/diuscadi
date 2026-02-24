"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuTriangleAlert, LuArrowRight, LuSparkles, LuX } from "react-icons/lu";

// 1. Define Props Interface
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
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6"
      >
        <div className="bg-amber-50 border-2 border-amber-100 rounded-[2rem] p-4 md:p-6 relative overflow-hidden group">
          {/* Decorative Background Icon */}
          <LuSparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-200/40 rotate-12" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Warning Message */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-amber-200">
                <LuTriangleAlert className="w-6 h-6 text-amber-600 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">
                  Incomplete Profile
                </h4>
                <p className="text-xs font-bold text-amber-700/80 leading-relaxed max-w-md">
                  Complete your profile to unlock event registrations. Missing:
                  <span className="text-amber-900">
                    {" "}
                    {missingFields.join(", ")}
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* Right: CTA Button */}
            <button
              onClick={onAction}
              className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-600/20 transition-all group/btn"
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
