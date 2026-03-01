"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuTicket,
  LuSearchX,
  LuRefreshCcw,
  LuCirclePlus,
} from "react-icons/lu";

interface EmptyStateProps {
  isSearchActive: boolean;
  onReset: () => void;
}

export const AdminTicketsEmptyState: React.FC<EmptyStateProps> = ({
  isSearchActive,
  onReset,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full py-24 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center px-6"
    >
      {/* 1. Illustration (The Ghost Ticket) */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10">
          {isSearchActive ? (
            <LuSearchX className="w-10 h-10 text-slate-300" />
          ) : (
            <LuTicket className="w-10 h-10 text-slate-200" />
          )}
        </div>

        {/* Decorative background pulse */}
        <div className="absolute inset-0 bg-primary/5 rounded-3xl animate-ping scale-150 -z-10 opacity-20" />
      </div>

      {/* 2. Title ("No tickets found") */}
      <div className="max-w-md space-y-3">
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
          {isSearchActive ? "No Manifest Matches" : "The Ticket Vault is Empty"}
        </h3>

        {/* 3. Description */}
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-relaxed px-10">
          {isSearchActive
            ? "We couldn't find any tickets matching those specific parameters. Check the code for typos or adjust your status filters."
            : "No tickets have been issued yet. Once users begin registering or invite codes are redeemed, the manifest will populate here."}
        </p>
      </div>

      {/* Actionable Recovery Path */}
      <div className="mt-10 flex flex-col sm:flex-row gap-4">
        {isSearchActive ? (
          <button
            onClick={onReset}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-slate-900 transition-all shadow-xl shadow-slate-900/10"
          >
            <LuRefreshCcw className="w-4 h-4" />
            Clear Current Filters
          </button>
        ) : (
          <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-slate-900 transition-all shadow-xl shadow-slate-900/10">
            <LuCirclePlus className="w-4 h-4" />
            Issue First Ticket
          </button>
        )}
      </div>
    </motion.div>
  );
};
