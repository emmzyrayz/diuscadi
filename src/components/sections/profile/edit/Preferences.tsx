"use client";
import React, { useState } from "react";
import { LuSettings, LuBell, LuCalendarClock, LuMailbox } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../../lib/utils";
import { IconType } from "react-icons";

// Define proper TypeScript types
interface Preferences {
  emailNotify: boolean;
  reminders: boolean;
  newsletter: boolean;
}

interface PreferenceItemProps {
  icon: IconType;
  title: string;
  description: string;
  isActive: boolean;
  onToggle: () => void;
  delay?: number;
}

interface PreferenceConfig {
  key: keyof Preferences;
  icon: IconType;
  title: string;
  description: string;
}

export const PreferencesSection = () => {
  const [prefs, setPrefs] = useState<Preferences>({
    emailNotify: true,
    reminders: true,
    newsletter: false,
  });

  const togglePref = (key: keyof Preferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const preferenceConfigs: PreferenceConfig[] = [
    {
      key: "emailNotify",
      icon: LuBell,
      title: "Email Notifications",
      description:
        "Receive alerts about account activity and security updates.",
    },
    {
      key: "reminders",
      icon: LuCalendarClock,
      title: "Event Reminders",
      description: "Get notified 24 hours before your registered events start.",
    },
    {
      key: "newsletter",
      icon: LuMailbox,
      title: "DIUSCADI Newsletter",
      description:
        "A weekly digest of ecosystem news, tracks, and opportunities.",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ borderColor: "rgba(251, 146, 60, 0.2)" }}
      className={cn(
        "bg-white",
        "border-2",
        "border-slate-100",
        "rounded-[2.5rem]",
        "p-8",
        "md:p-10",
        "shadow-sm",
        "transition-all",
      )}
    >
      {/* 1. Section Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className={cn("flex", "items-center", "gap-3", "mb-10")}
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 180 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "w-10",
            "h-10",
            "rounded-xl",
            "bg-slate-50",
            "flex",
            "items-center",
            "justify-center",
            "text-primary",
            "border",
            "border-slate-100",
          )}
        >
          <LuSettings className={cn("w-5", "h-5")} />
        </motion.div>
        <div>
          <h3
            className={cn(
              "text-xl",
              "font-black",
              "text-slate-900",
              "tracking-tight",
            )}
          >
            System Preferences
          </h3>
          <p
            className={cn(
              "text-[10px]",
              "font-bold",
              "text-slate-400",
              "uppercase",
              "tracking-widest",
              "mt-1",
            )}
          >
            Customize your DIUSCADI notification experience
          </p>
        </div>
      </motion.div>

      {/* 2. Preferences List */}
      <div className="space-y-4">
        {preferenceConfigs.map((config, index) => (
          <PreferenceItem
            key={config.key}
            icon={config.icon}
            title={config.title}
            description={config.description}
            isActive={prefs[config.key]}
            onToggle={() => togglePref(config.key)}
            delay={0.3 + index * 0.1}
          />
        ))}
      </div>
    </motion.section>
  );
};

/* --- Internal Helper: Preference Row --- */
const PreferenceItem = ({
  icon: Icon,
  title,
  description,
  isActive,
  onToggle,
  delay = 0,
}: PreferenceItemProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ scale: 1.01, x: 4 }}
    className={cn(
      "group",
      "flex",
      "items-center",
      "justify-between",
      "p-6",
      "bg-slate-50/50",
      "rounded-3xl",
      "border",
      "border-transparent",
      "hover:border-slate-100",
      "hover:bg-white",
      "transition-all",
    )}
  >
    <div className={cn("flex", "items-start", "gap-5")}>
      <motion.div
        animate={
          isActive
            ? {
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }
            : {}
        }
        transition={{
          duration: 0.5,
        }}
        className={cn(
          "w-12",
          "h-12",
          "rounded-2xl",
          "flex",
          "items-center",
          "justify-center",
          "shrink-0",
          "transition-all",
          "duration-300",
          isActive
            ? "bg-primary text-white shadow-lg shadow-primary/20"
            : "bg-white text-slate-400 border border-slate-100",
        )}
      >
        <motion.div
          animate={
            isActive
              ? {
                  scale: [1, 1.2, 1],
                }
              : {}
          }
          transition={{
            duration: 0.3,
            delay: 0.1,
          }}
        >
          <Icon className={cn("w-5", "h-5")} />
        </motion.div>
      </motion.div>
      <div className="space-y-1">
        <h4
          className={cn(
            "text-sm",
            "font-black",
            "text-slate-900",
            "uppercase",
            "tracking-tight",
          )}
        >
          {title}
        </h4>
        <p
          className={cn(
            "text-xs",
            "font-medium",
            "text-slate-500",
            "leading-relaxed",
            "max-w-sm",
          )}
        >
          {description}
        </p>
      </div>
    </div>

    {/* Custom Toggle Switch */}
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative",
        "w-14",
        "h-8",
        "rounded-full",
        "transition-colors",
        "duration-300",
        "outline-none",
        "focus:ring-2",
        "focus:ring-primary/20",
        "focus:ring-offset-2",
        isActive ? "bg-emerald-500" : "bg-slate-200",
      )}
    >
      <motion.div
        animate={{ x: isActive ? 26 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "absolute",
          "top-1",
          "w-6",
          "h-6",
          "bg-white",
          "rounded-full",
          "shadow-md",
        )}
      >
        {/* Checkmark indicator when active */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn('absolute', 'inset-0', 'flex', 'items-center', 'justify-center')}
            >
              <div className={cn('w-2', 'h-2', 'bg-emerald-500', 'rounded-full')} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Ripple effect on toggle */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={cn('absolute', 'inset-0', 'bg-emerald-500', 'rounded-full')}
          />
        )}
      </AnimatePresence>
    </motion.button>
  </motion.div>
);

// Export types for reuse
export type { Preferences, PreferenceItemProps, PreferenceConfig };
