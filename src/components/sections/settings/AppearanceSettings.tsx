"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuPaintbrush,
  LuSun,
  LuMoon,
  LuMonitor,
  LuCheck,
  LuLoader,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import { useUser } from "@/context/UserContext";
import type { ThemeMode, AccentColor } from "@/types/domain";
import { THEME_MODES, ACCENT_COLORS } from "@/types/domain";
import { toast } from "react-hot-toast";

const ACCENT_META: Record<AccentColor, { label: string; hex: string }> = {
  orange: { label: "Classic", hex: "#F97316" },
  emerald: { label: "Emerald", hex: "#10B981" },
  violet: { label: "Violet", hex: "#8B5CF6" },
  rose: { label: "Rose", hex: "#F43F5E" },
  amber: { label: "Amber", hex: "#F59E0B" },
};

const THEME_META: Record<
  ThemeMode,
  { label: string; icon: IconType; previewClass: string }
> = {
  light: {
    label: "Light",
    icon: LuSun,
    previewClass: "bg-muted border-border",
  },
  dark: {
    label: "Dark",
    icon: LuMoon,
    previewClass: "bg-foreground border-slate-800",
  },
  system: {
    label: "System",
    icon: LuMonitor,
    previewClass: "bg-gradient-to-br from-slate-50 to-foreground border-border",
  },
};

export const AppearanceSettingsSection = () => {
  const { profile, updatePreferences } = useUser();
  const prefs = profile?.preferences.appearance;

  // Initialise from prefs at mount time (component is keyed in page.tsx so it
  // remounts once profile loads — no useEffect sync needed).
  const [theme, setTheme] = useState<ThemeMode>(prefs?.theme ?? "system");
  const [accent, setAccent] = useState<AccentColor>(prefs?.accent ?? "orange");
  const [saving, setSaving] = useState(false);

  const save = async (patch: { theme?: ThemeMode; accent?: AccentColor }) => {
    setSaving(true);
    const result = await updatePreferences({
      appearance: { theme, accent, ...patch },
    });
    setSaving(false);
    if (!result.success) toast.error(result.error ?? "Failed to save");
  };

  const handleTheme = async (t: ThemeMode) => {
    setTheme(t);
    await save({ theme: t });
  };
  const handleAccent = async (a: AccentColor) => {
    setAccent(a);
    await save({ accent: a });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "p-8",
        "md:p-10",
        "shadow-sm",
      )}
    >
      <div className={cn("flex", "items-center", "justify-between", "mb-10")}>
        <div className={cn("flex", "items-center", "gap-3")}>
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
            <LuPaintbrush className={cn("w-5", "h-5")} />
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
              Interface Appearance
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
              Personalize the platform&apos;s visual identity
            </p>
          </div>
        </div>
        {saving && (
          <LuLoader
            className={cn("w-4", "h-4", "text-primary", "animate-spin")}
          />
        )}
      </div>

      <div className="space-y-12">
        {/* Theme */}
        <div className="space-y-4">
          <label
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-[0.2em]",
              "ml-1",
            )}
          >
            Visual Theme
          </label>
          <div className={cn("grid", "grid-cols-1", "sm:grid-cols-3", "gap-4")}>
            {THEME_MODES.map((t) => {
              const meta = THEME_META[t];
              const Icon = meta.icon;
              const active = theme === t;
              return (
                <button
                  key={t}
                  onClick={() => handleTheme(t)}
                  disabled={saving}
                  className={cn(
                    "group",
                    "relative",
                    "p-4",
                    "rounded-3xl",
                    "border-2",
                    "transition-all",
                    "text-left",
                    "cursor-pointer",
                    "disabled:cursor-wait",
                    active
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border hover:border-border hover:shadow-md",
                  )}
                >
                  <div
                    className={cn(
                      "w-full",
                      "h-20",
                      "rounded-xl",
                      "mb-4",
                      "border",
                      "overflow-hidden",
                      meta.previewClass,
                    )}
                  />
                  <div className={cn("flex", "items-center", "gap-2")}>
                    <Icon
                      className={cn(
                        "w-4",
                        "h-4",
                        "transition-colors",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px]",
                        "font-black",
                        "uppercase",
                        "tracking-widest",
                        active ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={cn(
                          "absolute",
                          "top-2",
                          "right-2",
                          "w-5",
                          "h-5",
                          "bg-primary",
                          "rounded-full",
                          "flex",
                          "items-center",
                          "justify-center",
                          "shadow-lg",
                        )}
                      >
                        <LuCheck
                          className={cn("w-3", "h-3", "text-background")}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent */}
        <div className={cn("space-y-4", "pt-8", "border-t", "border-slate-50")}>
          <div>
            <label
              className={cn(
                "text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.2em]",
                "ml-1",
              )}
            >
              Accent Identity
            </label>
            <p
              className={cn(
                "text-[11px]",
                "font-medium",
                "text-muted-foreground",
                "mt-1",
              )}
            >
              Change the highlights and primary action colors
            </p>
          </div>
          <div className={cn("flex", "flex-wrap", "gap-4")}>
            {ACCENT_COLORS.map((a) => {
              const meta = ACCENT_META[a];
              const active = accent === a;
              return (
                <button
                  key={a}
                  onClick={() => handleAccent(a)}
                  disabled={saving}
                  className={cn(
                    "group",
                    "relative",
                    "flex",
                    "flex-col",
                    "items-center",
                    "gap-2",
                    "cursor-pointer",
                    "disabled:cursor-wait",
                  )}
                >
                  <div
                    style={{ backgroundColor: meta.hex }}
                    className={cn(
                      "w-12",
                      "h-12",
                      "rounded-2xl",
                      "transition-all",
                      "flex",
                      "items-center",
                      "justify-center",
                      "shadow-lg",
                    )}
                  >
                    <AnimatePresence>
                      {active && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <LuCheck
                            className={cn("text-background", "w-5", "h-5")}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span
                    className={cn(
                      "text-[9px]",
                      "font-black",
                      "uppercase",
                      "tracking-tighter",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
};
