"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconType } from "react-icons";
import { LuActivity, LuLayers } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface Props {
  onStatusChange: (v: string) => void;
  onTypeChange: (v: string) => void;
}

export const APToolbar: React.FC<Props> = ({
  onStatusChange,
  onTypeChange,
}) => {
  const [status, setStatus] = useState("pending");
  const [type, setType] = useState("All");

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "p-6",
        "shadow-sm",
      )}
    >
      <div className={cn("flex", "flex-wrap", "items-center", "gap-4")}>
        {/* Status tabs */}
        <div className="flex items-center gap-2 bg-muted p-1.5 rounded-2xl border border-border">
          {["pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                onStatusChange(s);
              }}
              className={cn(
                "px-4",
                "py-2",
                "rounded-xl",
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "transition-all",
                "cursor-pointer",
                status === s
                  ? "bg-background text-foreground shadow-md border border-border"
                  : "text-muted-foreground hover:text-slate-600",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <APDropdown
          label="Type"
          icon={LuLayers}
          current={type}
          options={["All", "committee", "skills"]}
          onChange={(v) => {
            setType(v);
            onTypeChange(v === "All" ? "" : v);
          }}
        />

        {/* Live indicator for pending */}
        {status === "pending" && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
              Live Queue
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const APDropdown: React.FC<{
  label: string;
  icon: IconType;
  current: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ label, icon: Icon, current, options, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={cn(
          "flex",
          "items-center",
          "gap-3",
          "px-5",
          "py-4",
          "bg-background",
          "border",
          "border-border",
          "rounded-2xl",
          "transition-all",
        )}
      >
        <Icon className={cn("w-4", "h-4", "text-muted-foreground")} />
        <div>
          <p
            className={cn(
              "text-[8px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "leading-none",
              "mb-1",
              "tracking-widest",
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "text-[10px]",
              "font-black",
              "text-foreground",
              "uppercase",
              "tracking-tight",
            )}
          >
            {current}
          </p>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "absolute",
              "top-full",
              "left-0",
              "mt-2",
              "min-w-[160px]",
              "bg-background",
              "border",
              "border-border",
              "rounded-2xl",
              "shadow-2xl",
              "p-2",
              "z-50",
            )}
          >
            {options.map((opt, i) => (
              <motion.button
                key={opt}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={cn(
                  "w-full",
                  "text-left",
                  "px-4",
                  "py-3",
                  "rounded-xl",
                  "text-[10px]",
                  "font-black",
                  "text-slate-600",
                  "uppercase",
                  "tracking-widest",
                  "hover:bg-muted",
                  "hover:text-primary",
                  "transition-colors",
                  "flex",
                  "items-center",
                  "justify-between",
                )}
              >
                {opt}
                {current === opt && (
                  <div
                    className={cn(
                      "w-1.5",
                      "h-1.5",
                      "rounded-full",
                      "bg-primary",
                    )}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
