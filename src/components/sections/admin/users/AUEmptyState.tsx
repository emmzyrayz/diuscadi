"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuUsers, LuSearchX, LuUserPlus } from "react-icons/lu";

interface AdminUsersEmptyStateProps {
  isSearchActive: boolean;
  onClearFilters?: () => void;
}

export const AdminUsersEmptyState: React.FC<AdminUsersEmptyStateProps> = ({
  isSearchActive,
  onClearFilters,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full py-32 bg-white border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center px-8"
    >
      {/* 1. Illustration (The Ghost State) */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-slate-100 relative z-10">
          {isSearchActive ? (
            <LuSearchX className="w-10 h-10 text-slate-300" />
          ) : (
            <LuUsers className="w-10 h-10 text-slate-300" />
          )}
        </div>

        {/* Abstract Background Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-slate-50/50 rounded-full blur-3xl -z-10" />
      </div>

      {/* 2. Title ("No users found") */}
      <div className="max-w-md space-y-3">
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
          {isSearchActive ? "No Identity Matches" : "The User Base is Empty"}
        </h3>

        {/* 3. Description */}
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-relaxed">
          {isSearchActive
            ? "We couldn't find any users matching your current search criteria or filters. Try adjusting your parameters."
            : "No users have registered on the platform yet. Once the onboarding begins, your verified user list will appear here."}
        </p>
      </div>

      {/* Actionable Recovery */}
      {isSearchActive && (
        <button
          onClick={onClearFilters}
          className="mt-10 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-slate-900 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
        >
          Reset All Filters
        </button>
      )}

      {!isSearchActive && (
        <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
          <LuUserPlus className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
            Waiting for first registration
          </span>
        </div>
      )}
    </motion.div>
  );
};