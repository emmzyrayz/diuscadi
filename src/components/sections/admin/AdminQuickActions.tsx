"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuPlus,
  LuUsers,
  LuTicket,
  LuDownload,
  LuCommand,
  LuZap,
} from "react-icons/lu";
import { cn } from "../../../lib/utils";
import { IconType } from "react-icons";

// Define proper TypeScript types
interface ActionButtonProps {
  icon: IconType;
  label: string;
  shortcut: string;
  primary?: boolean;
  delay?: number;
  onClick?: () => void;
}

interface QuickAction {
  id: string;
  icon: IconType;
  label: string;
  shortcut: string;
  primary?: boolean;
  action: () => void;
}

export const AdminQuickActions = () => {
  const quickActions: QuickAction[] = [
    {
      id: "create-event",
      icon: LuPlus,
      label: "Create Event",
      shortcut: "N",
      primary: true,
      action: () => console.log("Creating event..."),
    },
    {
      id: "view-users",
      icon: LuUsers,
      label: "View User Base",
      shortcut: "U",
      action: () => console.log("Viewing users..."),
    },
    {
      id: "manage-tickets",
      icon: LuTicket,
      label: "Manage Tickets",
      shortcut: "T",
      action: () => console.log("Managing tickets..."),
    },
    {
      id: "export-manifest",
      icon: LuDownload,
      label: "Export Manifest",
      shortcut: "E",
      action: () => console.log("Exporting manifest..."),
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "bg-slate-900",
        "rounded-[2.5rem]",
        "p-8",
        "text-white",
        "shadow-2xl",
        "relative",
        "overflow-hidden",
        "group",
      )}
    >
      {/* Background Glow Effect */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn(
          "absolute",
          "top-0",
          "right-0",
          "w-96",
          "h-96",
          "bg-primary/5",
          "rounded-full",
          "blur-[100px]",
          "-mr-48",
          "-mt-48",
          "transition-opacity",
          "group-hover:opacity-100",
        )}
      />

      <div className={cn("relative", "z-10")}>
        {/* 1. Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={cn("flex", "items-center", "justify-between", "mb-8")}
        >
          <div className={cn("flex", "items-center", "gap-3")}>
            <motion.div
              whileHover={{ rotate: 90, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "w-8",
                "h-8",
                "rounded-lg",
                "bg-white/10",
                "flex",
                "items-center",
                "justify-center",
                "text-primary",
              )}
            >
              <LuCommand className={cn("w-4", "h-4")} />
            </motion.div>
            <h3
              className={cn(
                "text-sm",
                "font-black",
                "uppercase",
                "tracking-[0.3em]",
                "text-slate-400",
              )}
            >
              Command Center
            </h3>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "hidden",
              "md:flex",
              "items-center",
              "gap-2",
              "px-3",
              "py-1",
              "bg-white/5",
              "rounded-full",
              "border",
              "border-white/5",
            )}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <LuZap className={cn("w-3", "h-3", "text-primary")} />
            </motion.div>
            <span
              className={cn(
                "text-[8px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-slate-500",
              )}
            >
              Fast Actions Active
            </span>
          </motion.div>
        </motion.div>

        {/* 2. Action Grid - Fixed responsive grid */}
        <div
          className={cn(
            "grid",
            "grid-cols-1",
            "sm:grid-cols-2",
            "lg:grid-cols-2",
            "xl:grid-cols-4",
            "gap-4",
          )}
        >
          {quickActions.map((action, index) => (
            <ActionButton
              key={action.id}
              icon={action.icon}
              label={action.label}
              shortcut={action.shortcut}
              primary={action.primary}
              onClick={action.action}
              delay={0.4 + index * 0.1}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
};

/* --- Internal Helper: Quick Action Button --- */
const ActionButton = ({
  icon: Icon,
  label,
  shortcut,
  primary = false,
  delay = 0,
  onClick,
}: ActionButtonProps) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: primary ? 1.02 : 1.01, y: -2 }}
      whileTap={{ scale: primary ? 0.98 : 0.99 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        "group",
        "flex",
        "items-center",
        "justify-between",
        "px-6",
        "py-5",
        "rounded-2xl",
        "transition-all",
        "duration-300",
        "relative",
        "overflow-hidden",
        primary
          ? "bg-secondary text-slate-900 shadow-xl shadow-primary/20"
          : "bg-white/5 text-white border border-white/5 hover:bg-white/10 hover:border-white/10",
      )}
    >
      {/* Shimmer effect on hover - Fixed gradient class */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 0.6 }}
        />
      )}

      <div className={cn("flex", "items-center", "gap-4", "relative", "z-10")}>
        <motion.div
          animate={isHovered ? { rotate: primary ? 180 : 360 } : { rotate: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
          className={cn(
            "w-10",
            "h-10",
            "rounded-xl",
            "flex",
            "items-center",
            "justify-center",
            "transition-colors",
            "duration-300",
            primary
              ? "bg-slate-900/10"
              : "bg-white/5 group-hover:bg-primary/20 group-hover:text-primary",
          )}
        >
          <Icon className={cn("w-5", "h-5")} />
        </motion.div>
        <span
          className={cn(
            "text-[11px]",
            "font-black",
            "uppercase",
            "tracking-wider",
          )}
        >
          {label}
        </span>
      </div>

      {/* The Shortcut Badge (Premium Detail) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.2 }}
        whileHover={{ scale: 1.1 }}
        className={cn(
          "hidden",
          "xl:flex",
          "w-6",
          "h-6",
          "items-center",
          "justify-center",
          "rounded-md",
          "border",
          "text-[9px]",
          "font-black",
          "relative",
          "z-10",
          primary
            ? "border-slate-900/20 text-slate-900/40"
            : "border-white/10 text-slate-600",
        )}
      >
        {shortcut}
      </motion.div>
    </motion.button>
  );
};

// Export types for reuse
export type { ActionButtonProps, QuickAction };
