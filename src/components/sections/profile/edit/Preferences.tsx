"use client";
// components/sections/profile/edit/Preferences.tsx
// Rewritten to match the actual UserPreferences schema in types/domain.ts.
// Previous version used flat keys (emailNotifications, newsletter) that don't
// exist in the schema — every toggle was silently failing at the API layer.
//
// Each toggle/select calls updatePreferences() immediately with the full
// sub-object it's changing, since the backend does a full $set replace on
// preferences.notifications (or .appearance) at once.

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuSettings,
  LuBell,
  LuCalendarClock,
  LuMessageSquare,
  LuMegaphone,
  LuTicket,
  LuSun,
  LuMoon,
  LuMonitor,
} from "react-icons/lu";
import { IconType } from "react-icons";
import { cn } from "../../../../lib/utils";
import { useUser } from "@/context/UserContext";
import type {
  NotificationFrequency,
  ThemeMode,
  AccentColor,
} from "@/types/domain";
import { NOTIF_FREQS, THEME_MODES, ACCENT_COLORS } from "@/types/domain";

// ── Notification toggle configs ───────────────────────────────────────────────
interface NotifToggleConfig {
  key: "tickets" | "reminders" | "messages" | "marketing";
  icon: IconType;
  title: string;
  description: string;
}

const NOTIF_TOGGLES: NotifToggleConfig[] = [
  {
    key: "tickets",
    icon: LuTicket,
    title: "Ticket Confirmations",
    description: "Receive ticket confirmations and QR codes for events you register for.",
  },
  {
    key: "reminders",
    icon: LuCalendarClock,
    title: "Event Reminders",
    description: "Get notified 24 h and 1 h before your registered events start.",
  },
  {
    key: "messages",
    icon: LuMessageSquare,
    title: "Direct Messages",
    description: "Alerts when other DIUSCADI members message you.",
  },
  {
    key: "marketing",
    icon: LuMegaphone,
    title: "Platform Updates",
    description: "Ecosystem news, opportunities, and new DIUSCADI features.",
  },
];

const FREQ_LABELS: Record<NotificationFrequency, string> = {
  instant: "Instant",
  daily: "Daily digest",
  weekly: "Weekly digest",
};

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: IconType }[] = [
  { value: "light", label: "Light", icon: LuSun },
  { value: "dark",  label: "Dark",  icon: LuMoon },
  { value: "system",label: "System",icon: LuMonitor },
];

// Tailwind-safe color classes keyed by accent slug
const ACCENT_BG: Record<AccentColor, string> = {
  orange:  "bg-orange-500",
  emerald: "bg-emerald-500",
  violet:  "bg-violet-500",
  rose:    "bg-rose-500",
  amber:   "bg-amber-500",
  sky:     "bg-sky-500",
  indigo:  "bg-indigo-500",
  cyan:    "bg-cyan-500",
};

// ── Component ─────────────────────────────────────────────────────────────────

export const PreferencesSection = () => {
  const { profile, updatePreferences } = useUser();

  // Safe reads — fall back to sane defaults if preferences aren't loaded yet
  const notif = profile?.preferences?.notifications ?? {
    frequency: "instant" as NotificationFrequency,
    tickets: true,
    reminders: true,
    messages: false,
    marketing: false,
  };

  const appearance = profile?.preferences?.appearance ?? {
    theme: "light" as ThemeMode,
    accent: "sky" as AccentColor,
  };

  // ── Handlers — each sends the FULL sub-object so the backend $set is clean ──

  const handleNotifToggle = async (
    key: "tickets" | "reminders" | "messages" | "marketing",
  ) => {
    await updatePreferences({
      notifications: { ...notif, [key]: !notif[key] },
    });
  };

  const handleFrequency = async (frequency: NotificationFrequency) => {
    await updatePreferences({
      notifications: { ...notif, frequency },
    });
  };

  const handleTheme = async (theme: ThemeMode) => {
    await updatePreferences({
      appearance: { ...appearance, theme },
    });
  };

  const handleAccent = async (accent: AccentColor) => {
    await updatePreferences({
      appearance: { ...appearance, accent },
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ borderColor: "rgba(251, 146, 60, 0.2)" }}
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "p-8",
        "md:p-10",
        "shadow-sm",
        "transition-all",
      )}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className={cn("flex", "items-center", "gap-3", "mb-10")}
      >
        <div
          className={cn(
            "w-10", "h-10", "rounded-xl", "bg-muted",
            "flex", "items-center", "justify-center",
            "text-primary", "border", "border-border",
          )}
        >
          <LuSettings className="w-5 h-5" />
        </div>
        <div>
          <h3 className={cn("text-xl", "font-black", "text-foreground", "tracking-tight")}>
            System Preferences
          </h3>
          <p className={cn("text-[10px]", "font-bold", "text-muted-foreground", "uppercase", "tracking-widest", "mt-1")}>
            Customize your DIUSCADI experience
          </p>
        </div>
      </motion.div>

      {/* ── Notification toggles ──────────────────────────────────────── */}
      <div className="mb-10">
        <p className={cn("text-[10px]", "font-black", "text-muted-foreground", "uppercase", "tracking-widest", "ml-1", "mb-4")}>
          Notifications
        </p>
        <div className="space-y-3">
          {NOTIF_TOGGLES.map((config, index) => {
            const isActive = !!notif[config.key];
            return (
              <motion.div
                key={config.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
                whileHover={{ scale: 1.01, x: 4 }}
                className={cn(
                  "group", "flex", "items-center", "justify-between",
                  "p-5", "bg-muted/50", "rounded-3xl",
                  "border", "border-transparent",
                  "hover:border-border", "hover:bg-background",
                  "transition-all",
                )}
              >
                <div className={cn("flex", "items-start", "gap-4")}>
                  <div
                    className={cn(
                      "w-10", "h-10", "rounded-2xl",
                      "flex", "items-center", "justify-center",
                      "shrink-0", "transition-all", "duration-300",
                      isActive
                        ? "bg-primary text-background shadow-lg shadow-primary/20"
                        : "bg-background text-muted-foreground border border-border",
                    )}
                  >
                    <config.icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className={cn("text-sm", "font-black", "text-foreground", "uppercase", "tracking-tight")}>
                      {config.title}
                    </h4>
                    <p className={cn("text-xs", "font-medium", "text-muted-foreground", "leading-relaxed", "max-w-xs")}>
                      {config.description}
                    </p>
                  </div>
                </div>

                {/* Toggle switch */}
                <motion.button
                  onClick={() => handleNotifToggle(config.key)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative", "w-14", "h-8", "rounded-full",
                    "transition-colors", "duration-300",
                    "outline-none", "focus:ring-2", "focus:ring-primary/20", "focus:ring-offset-2",
                    "shrink-0", "cursor-pointer",
                    isActive ? "bg-emerald-500" : "bg-slate-200",
                  )}
                >
                  <motion.div
                    animate={{ x: isActive ? 26 : 4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={cn("absolute", "top-1", "w-6", "h-6", "bg-background", "rounded-full", "shadow-md")}
                  >
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className={cn("absolute", "inset-0", "flex", "items-center", "justify-center")}
                        >
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Notification frequency ────────────────────────────────────── */}
      <div className="mb-10">
        <p className={cn("text-[10px]", "font-black", "text-muted-foreground", "uppercase", "tracking-widest", "ml-1", "mb-4")}>
          Delivery frequency
        </p>
        <div className="grid grid-cols-3 gap-3">
          {NOTIF_FREQS.map((freq) => (
            <button
              key={freq}
              onClick={() => handleFrequency(freq)}
              className={cn(
                "py-3", "rounded-2xl", "border-2",
                "text-[10px]", "font-black", "uppercase", "tracking-widest",
                "transition-all", "cursor-pointer",
                notif.frequency === freq
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/40 text-muted-foreground",
              )}
            >
              {FREQ_LABELS[freq]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Theme ─────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <p className={cn("text-[10px]", "font-black", "text-muted-foreground", "uppercase", "tracking-widest", "ml-1", "mb-4")}>
          Appearance
        </p>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleTheme(value)}
              className={cn(
                "flex", "items-center", "justify-center", "gap-2",
                "py-4", "rounded-2xl", "border-2",
                "text-[10px]", "font-black", "uppercase", "tracking-widest",
                "transition-all", "cursor-pointer",
                appearance.theme === value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/40 text-muted-foreground",
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Accent color ──────────────────────────────────────────────── */}
      <div>
        <p className={cn("text-[10px]", "font-black", "text-muted-foreground", "uppercase", "tracking-widest", "ml-1", "mb-4")}>
          Accent color
        </p>
        <div className="flex flex-wrap gap-3">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleAccent(color)}
              title={color}
              className={cn(
                "w-10", "h-10", "rounded-xl",
                "border-2", "transition-all", "cursor-pointer",
                ACCENT_BG[color],
                appearance.accent === color
                  ? "border-foreground scale-110 shadow-md ring-2 ring-foreground/20"
                  : "border-transparent hover:border-foreground/50 hover:scale-105",
              )}
            />
          ))}
        </div>
        <p className={cn("text-[9px]", "font-bold", "text-muted-foreground", "ml-1", "mt-3")}>
          Current accent:{" "}
          <span className="text-foreground capitalize">{appearance.accent}</span>
        </p>
      </div>
    </motion.section>
  );
};