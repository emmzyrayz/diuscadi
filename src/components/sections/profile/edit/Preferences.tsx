"use client";
import React from "react";
import { LuSettings, LuBell, LuCalendarClock, LuMailbox } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../../lib/utils";
import { IconType } from "react-icons";
import { useUser } from "@/context/UserContext";

type PrefKey = "emailNotifications" | "eventReminders" | "newsletter";

interface PreferenceConfig {
  key: PrefKey;
  icon: IconType;
  title: string;
  description: string;
}

const PREF_CONFIGS: PreferenceConfig[] = [
  {
    key: "emailNotifications",
    icon: LuBell,
    title: "Email Notifications",
    description: "Receive alerts about account activity and security updates.",
  },
  {
    key: "eventReminders",
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

export const PreferencesSection = () => {
  const { profile, updatePreferences } = useUser();

  // Read live values from UserContext — falls back to safe defaults
  const prefs = profile?.preferences ?? {
    emailNotifications: true,
    eventReminders: true,
    newsletter: false,
  };

  const handleToggle = async (key: PrefKey) => {
    await updatePreferences({ [key]: !prefs[key as keyof typeof prefs] });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "p-8",
        "md:p-10",
        "shadow-sm",
        "transition-all",
        "hover:border-primary/20",
      )}
    >
      <div className={cn("flex", "items-center", "gap-3", "mb-10")}>
        <div
          className={cn(
            "w-10",
            "h-10",
            "rounded-xl",
            "bg-muted",
            "flex",
            "items-center",
            "justify-center",
            "text-primary",
            "border",
            "border-border",
          )}
        >
          <LuSettings className={cn("w-5", "h-5")} />
        </div>
        <div>
          <h3
            className={cn(
              "text-xl",
              "font-black",
              "text-foreground",
              "tracking-tight",
            )}
          >
            System Preferences
          </h3>
          <p
            className={cn(
              "text-[10px]",
              "font-bold",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
              "mt-1",
            )}
          >
            Customize your DIUSCADI notification experience
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {PREF_CONFIGS.map((config, index) => {
          const isActive = !!prefs[config.key as keyof typeof prefs];
          return (
            <motion.div
              key={config.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.01, x: 4 }}
              className={cn(
                "group",
                "flex",
                "items-center",
                "justify-between",
                "p-6",
                "bg-muted/50",
                "rounded-3xl",
                "border",
                "border-transparent",
                "hover:border-border",
                "hover:bg-background",
                "transition-all",
              )}
            >
              <div className={cn("flex", "items-start", "gap-5")}>
                <div
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
                      ? "bg-primary text-background shadow-lg shadow-primary/20"
                      : "bg-background text-muted-foreground border border-border",
                  )}
                >
                  <config.icon className={cn("w-5", "h-5")} />
                </div>
                <div className="space-y-1">
                  <h4
                    className={cn(
                      "text-sm",
                      "font-black",
                      "text-foreground",
                      "uppercase",
                      "tracking-tight",
                    )}
                  >
                    {config.title}
                  </h4>
                  <p
                    className={cn(
                      "text-xs",
                      "font-medium",
                      "text-muted-foreground",
                      "leading-relaxed",
                      "max-w-sm",
                    )}
                  >
                    {config.description}
                  </p>
                </div>
              </div>

              <motion.button
                onClick={() => handleToggle(config.key)}
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
                    "bg-background",
                    "rounded-full",
                    "shadow-md",
                  )}
                >
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "absolute",
                          "inset-0",
                          "flex",
                          "items-center",
                          "justify-center",
                        )}
                      >
                        <div
                          className={cn(
                            "w-2",
                            "h-2",
                            "bg-emerald-500",
                            "rounded-full",
                          )}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
};
