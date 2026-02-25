"use client";
import React, { useEffect, useState } from "react";
import {
  LuSave,
  LuCircleX,
  LuCircleCheck,
  LuCloudUpload,
  LuRefreshCw,
} from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../../lib/utils";

interface SaveChangesProps {
  isSaving: boolean;
  lastSaved: Date | null;
  hasChanges: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export const SaveChangesSection = ({
  isSaving,
  lastSaved,
  hasChanges,
  onSave,
  onCancel,
}: SaveChangesProps) => {
  return (
    <section
      className={cn(
        "mt-12",
        "p-8",
        "bg-slate-900",
        "rounded-[2.5rem]",
        "text-white",
        "shadow-2xl",
        "relative",
        "overflow-hidden",
      )}
    >
      {/* Background Decorative Element */}
      <div
        className={cn(
          "absolute",
          "top-0",
          "right-0",
          "w-64",
          "h-64",
          "bg-primary/10",
          "rounded-full",
          "blur-[80px]",
          "-mr-32",
          "-mt-32",
        )}
      />

      <div
        className={cn(
          "relative",
          "z-10",
          "flex",
          "flex-col",
          "md:flex-row",
          "items-center",
          "justify-between",
          "gap-8",
        )}
      >
        {/* 1. Status Information */}
        <div className={cn("flex", "items-center", "gap-4")}>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${
              hasChanges
                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
            }`}
          >
            {isSaving ? (
              <LuRefreshCw className={cn("w-6", "h-6", "animate-spin")} />
            ) : hasChanges ? (
              <LuCloudUpload className={cn("w-6", "h-6", "animate-bounce")} />
            ) : (
              <LuCircleCheck className={cn("w-6", "h-6")} />
            )}
          </div>

          <div className="space-y-1">
            <h4
              className={cn(
                "text-sm",
                "font-black",
                "uppercase",
                "tracking-tight",
              )}
            >
              {hasChanges
                ? "Unsaved Changes Detected"
                : "All Changes Synchronized"}
            </h4>
            <p
              className={cn(
                "text-[10px]",
                "font-bold",
                "text-slate-400",
                "uppercase",
                "tracking-widest",
              )}
            >
              {lastSaved
                ? `Last synced: ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Waiting for changes..."}
            </p>
          </div>
        </div>

        {/* 2. Action Buttons */}
        <div
          className={cn("flex", "items-center", "gap-4", "w-full", "md:w-auto")}
        >
          <button
            onClick={onCancel}
            className={cn(
              "flex-1",
              "md:flex-none",
              "flex",
              "items-center",
              "justify-center",
              "gap-2",
              "px-8",
              "py-4",
              "bg-white/5",
              "hover:bg-white/10",
              "text-white",
              "rounded-2xl",
              "font-black",
              "text-[10px]",
              "uppercase",
              "tracking-widest",
              "transition-all",
              "border",
              "border-white/10",
            )}
          >
            <LuCircleX className={cn("w-4", "h-4")} />
            Discard
          </button>

          <button
            onClick={onSave}
            disabled={!hasChanges || isSaving}
            className={`
              flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
              ${
                hasChanges && !isSaving
                  ? "bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }
            `}
          >
            <LuSave className={cn("w-4", "h-4")} />
            Commit Changes
          </button>
        </div>
      </div>
    </section>
  );
};
