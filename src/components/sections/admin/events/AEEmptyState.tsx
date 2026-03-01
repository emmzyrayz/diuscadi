"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuPlus, LuCalendarX, LuSearchX, LuZap } from "react-icons/lu";

// 1. TypeScript Interface
interface EmptyStateProps {
  type?: "none-created" | "no-results";
  onCreateClick: () => void;
}

export const AdminEventsEmptyState: React.FC<EmptyStateProps> = ({
  type = "none-created",
  onCreateClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full py-24 bg-white border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center px-6"
    >
      {/* 2. Empty Illustration (Elite Icon Stack) */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-slate-100 relative z-10">
          {type === "none-created" ? (
            <LuCalendarX className="w-10 h-10 text-slate-300" />
          ) : (
            <LuSearchX className="w-10 h-10 text-slate-300" />
          )}
        </div>
        {/* Decorative background elements */}
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/10 rounded-xl blur-sm -z-10 animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-slate-100 rounded-full blur-md -z-10" />
      </div>

      {/* 3. Empty Title & Description */}
      <div className="max-w-sm space-y-3">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
          {type === "none-created"
            ? "The Archive is Empty"
            : "No Matches Found"}
        </h3>
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed">
          {type === "none-created"
            ? "You haven't initialized any events yet. Start building your platform's schedule today."
            : "We couldn't find any events matching your current filters. Try adjusting your search."}
        </p>
      </div>

      {/* 4. Create Event Button (Primary CTA) */}
      {type === "none-created" ? (
        <button
          onClick={onCreateClick}
          className="mt-10 group flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[2rem] hover:bg-primary hover:text-slate-900 transition-all shadow-2xl shadow-slate-900/20 active:scale-95"
        >
          <LuPlus className="w-5 h-5" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">
            Initialize First Event
          </span>
        </button>
      ) : (
        <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
          <LuZap className="w-3 h-3 text-primary" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Tip: Clear filters to see all events
          </span>
        </div>
      )}
    </motion.div>
  );
};