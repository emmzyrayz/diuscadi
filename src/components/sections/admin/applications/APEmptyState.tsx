"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuInbox, LuCircleCheck, LuRefreshCcw } from "react-icons/lu";

interface Props {
  statusFilter: string;
  onClear: () => void;
}

export const APEmptyState: React.FC<Props> = ({ statusFilter, onClear }) => {
  const isPending = statusFilter === "pending";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full py-24 bg-muted/50 border-2 border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center text-center px-6"
    >
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-background rounded-3xl shadow-sm border border-border flex items-center justify-center relative z-10">
          {isPending ? (
            <LuCircleCheck className="w-10 h-10 text-emerald-300" />
          ) : (
            <LuInbox className="w-10 h-10 text-slate-200" />
          )}
        </div>
        <div className="absolute inset-0 bg-primary/5 rounded-3xl animate-ping scale-150 -z-10 opacity-20" />
      </div>

      <div className="max-w-md space-y-3">
        <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">
          {isPending ? "Queue is Clear" : `No ${statusFilter} Applications`}
        </h3>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] leading-relaxed px-10">
          {isPending
            ? "All pending applications have been reviewed. Great work."
            : `No applications with status "${statusFilter}" found. Try a different filter.`}
        </p>
      </div>

      {!isPending && (
        <div className="mt-10">
          <button
            onClick={onClear}
            className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all shadow-xl shadow-foreground/10 cursor-pointer"
          >
            <LuRefreshCcw className="w-4 h-4" /> Back to Pending
          </button>
        </div>
      )}
    </motion.div>
  );
};
