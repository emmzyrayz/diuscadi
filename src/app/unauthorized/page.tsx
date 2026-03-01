"use client";
import React from "react";
import Link from "next/link";
import { LuShieldAlert, LuArrowLeft, LuLifeBuoy } from "react-icons/lu";
import { motion } from "framer-motion";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-white border border-slate-100 rounded-[3rem] p-12 shadow-2xl shadow-slate-200/50"
      >
        {/* 1. Icon & Status */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center relative">
            <LuShieldAlert className="w-12 h-12" />
            <div className="absolute inset-0 bg-rose-500/10 blur-2xl rounded-full" />
          </div>
        </div>

        {/* 2. Error Messaging */}
        <div className="space-y-3 mb-10">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
            Access Denied
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
            Your current account level does not have permission to view this
            sector.
          </p>
        </div>

        {/* 3. Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/admin/analytics"
            className="flex items-center justify-center gap-3 w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-slate-900 transition-all shadow-xl shadow-slate-900/10"
          >
            <LuArrowLeft className="w-4 h-4" /> Return to Safe Zone
          </Link>

          <button className="flex items-center justify-center gap-2 w-full py-4 text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-900 transition-colors">
            <LuLifeBuoy className="w-4 h-4" /> Request Elevated Access
          </button>
        </div>

        {/* 4. Support Footer */}
        <div className="mt-12 pt-8 border-t border-slate-50">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
            Error Code: 403_FORBIDDEN_RESTRICTED_AREA
          </p>
        </div>
      </motion.div>
    </div>
  );
}
