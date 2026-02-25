"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { LuChevronLeft, LuSave } from "react-icons/lu";
import { motion } from "framer-motion";

interface EditProfileHeaderProps {
  isSaving: boolean;
  hasChanges: boolean;
  onSave: () => void;
}

export const EditProfileHeader = ({
  isSaving,
  hasChanges,
  onSave,
}: EditProfileHeaderProps) => {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* 1. Navigation & Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/profile")}
            className="group flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-900 hover:text-white transition-all duration-300"
          >
            <LuChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div className="hidden sm:block w-px h-6 bg-slate-200 mx-2" />

          <div className="space-y-0.5">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              Edit Profile
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Management Dashboard
            </p>
          </div>
        </div>

        {/* 2. Actions */}
        <div className="flex items-center gap-3">
          {hasChanges && !isSaving && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:block text-[10px] font-black text-amber-600 uppercase tracking-widest mr-2"
            >
              Unsaved Changes
            </motion.span>
          )}

          <button
            onClick={onSave}
            disabled={isSaving}
            className={`
              relative flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
              ${
                isSaving
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
              }
            `}
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <LuSave className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Line (Visual feedback for unsaved changes) */}
      {hasChanges && (
        <motion.div
          layoutId="saveProgress"
          className="absolute bottom-0 left-0 h-[2px] bg-primary"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
        />
      )}
    </header>
  );
};
