"use client";
import React, { useState } from "react";
import {
  LuPaintbrush,
  LuSun,
  LuMoon,
  LuMonitor,
  LuCheck,
} from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../lib/utils";
import { IconType } from "react-icons";

// Define proper TypeScript types
type ThemeMode = "light" | "dark" | "system";

interface AccentColor {
  name: string;
  color: string;
}

interface ThemeCardProps {
  active: boolean;
  onClick: () => void;
  icon: IconType;
  label: string;
  previewClass: string;
  delay?: number;
}

export const AppearanceSettingsSection = () => {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [accent, setAccent] = useState("#3B82F6"); // DIUSCADI Primary Blue

  const accents: AccentColor[] = [
    { name: "Classic", color: "#3B82F6" },
    { name: "Emerald", color: "#10B981" },
    { name: "Violet", color: "#8B5CF6" },
    { name: "Rose", color: "#F43F5E" },
    { name: "Amber", color: "#F59E0B" },
  ];

  const themes: Array<{
    mode: ThemeMode;
    icon: IconType;
    label: string;
    previewClass: string;
  }> = [
    {
      mode: "light",
      icon: LuSun,
      label: "Light",
      previewClass: "bg-slate-50 border-slate-200",
    },
    {
      mode: "dark",
      icon: LuMoon,
      label: "Dark",
      previewClass: "bg-slate-900 border-slate-800",
    },
    {
      mode: "system",
      icon: LuMonitor,
      label: "System",
      previewClass:
        "bg-gradient-to-br from-slate-50 to-slate-900 border-slate-200",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "bg-white",
        "border-2",
        "border-slate-100",
        "rounded-[2.5rem]",
        "p-8",
        "md:p-10",
        "shadow-sm",
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
          whileHover={{ scale: 1.1, rotate: 15 }}
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
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <LuPaintbrush className={cn("w-5", "h-5")} />
          </motion.div>
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
            Interface Appearance
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
            Personalize the platform&apos;s visual identity
          </p>
        </div>
      </motion.div>

      <div className="space-y-12">
        {/* 2. Theme Selector (Visual Cards) */}
        <div className="space-y-4">
          <motion.label
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "text-[10px]",
              "font-black",
              "text-slate-400",
              "uppercase",
              "tracking-[0.2em]",
              "ml-1",
            )}
          >
            Visual Theme
          </motion.label>
          <div className={cn("grid", "grid-cols-1", "sm:grid-cols-3", "gap-4")}>
            {themes.map((themeOption, index) => (
              <ThemeCard
                key={themeOption.mode}
                active={theme === themeOption.mode}
                onClick={() => setTheme(themeOption.mode)}
                icon={themeOption.icon}
                label={themeOption.label}
                previewClass={themeOption.previewClass}
                delay={0.4 + index * 0.1}
              />
            ))}
          </div>
        </div>

        {/* 3. Accent Color Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={cn("space-y-4", "pt-8", "border-t", "border-slate-50")}
        >
          <div>
            <label
              className={cn(
                "text-[10px]",
                "font-black",
                "text-slate-400",
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
                "text-slate-500",
                "mt-1",
              )}
            >
              Change the highlights and primary action colors
            </p>
          </div>

          <div className={cn("flex", "flex-wrap", "gap-4")}>
            {accents.map((item, index) => (
              <motion.button
                key={item.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.05 }}
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAccent(item.color)}
                className={cn(
                  "group",
                  "relative",
                  "flex",
                  "flex-col",
                  "items-center",
                  "gap-2",
                )}
              >
                <motion.div
                  animate={
                    accent === item.color
                      ? {
                          scale: [1, 1.1, 1],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.3,
                  }}
                  className={cn(
                    "w-12",
                    "h-12",
                    "rounded-2xl",
                    "transition-all",
                    "duration-300",
                    "flex",
                    "items-center",
                    "justify-center",
                    "shadow-lg",
                    "relative",
                    "overflow-hidden",
                  )}
                  style={{ backgroundColor: item.color }}
                >
                  <AnimatePresence>
                    {accent === item.color && (
                      <>
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 15,
                          }}
                        >
                          <LuCheck className={cn("text-white", "w-5", "h-5")} />
                        </motion.div>
                        {/* Ripple effect */}
                        <motion.div
                          initial={{ scale: 0, opacity: 0.5 }}
                          animate={{ scale: 2, opacity: 0 }}
                          transition={{ duration: 0.6 }}
                          className={cn('absolute', 'inset-0', 'bg-white', 'rounded-2xl')}
                        />
                      </>
                    )}
                  </AnimatePresence>
                </motion.div>
                <span
                  className={cn(
                    "text-[9px]",
                    "font-black",
                    "uppercase",
                    "tracking-tighter",
                    "transition-colors",
                    accent === item.color ? "text-slate-900" : "text-slate-400",
                  )}
                >
                  {item.name}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

/* --- Internal Helper for Theme Selection --- */
const ThemeCard = ({
  active,
  onClick,
  icon: Icon,
  label,
  previewClass,
  delay = 0,
}: ThemeCardProps) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ scale: 1.02, y: -4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "group",
      "relative",
      "p-4",
      "rounded-3xl",
      "border-2",
      "transition-all",
      "text-left",
      active
        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
        : "border-slate-100 hover:border-slate-200 hover:shadow-md",
    )}
  >
    <motion.div
      animate={
        active
          ? {
              scale: [1, 1.02, 1],
            }
          : {}
      }
      transition={{
        duration: 0.3,
      }}
      className={cn(
        "w-full",
        "h-20",
        "rounded-xl",
        "mb-4",
        "border",
        previewClass,
        "transition-all",
        "overflow-hidden",
        "relative",
      )}
    >
      {/* Shimmer effect on hover */}
      <motion.div
        className={cn('absolute', 'inset-0', 'bg-linear-to-r', 'from-transparent', 'via-white/20', 'to-transparent')}
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6 }}
      />
      <div className={cn("p-2", "space-y-1", "relative", "z-10")}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "2rem" }}
          transition={{ delay: delay + 0.2 }}
          className={cn("h-1", "bg-current", "opacity-20", "rounded-full")}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "3rem" }}
          transition={{ delay: delay + 0.3 }}
          className={cn("h-1", "bg-current", "opacity-10", "rounded-full")}
        />
      </div>
    </motion.div>
    <div className={cn("flex", "items-center", "gap-2")}>
      <motion.div
        animate={
          active
            ? {
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1],
              }
            : {}
        }
        transition={{
          duration: 0.5,
        }}
      >
        <Icon
          className={cn(
            "w-4",
            "h-4",
            "transition-colors",
            active ? "text-primary" : "text-slate-400",
          )}
        />
      </motion.div>
      <span
        className={cn(
          "text-[10px]",
          "font-black",
          "uppercase",
          "tracking-widest",
          "transition-colors",
          active ? "text-slate-900" : "text-slate-400",
        )}
      >
        {label}
      </span>
    </div>

    {/* Active indicator */}
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn('absolute', 'top-2', 'right-2', 'w-5', 'h-5', 'bg-primary', 'rounded-full', 'flex', 'items-center', 'justify-center', 'shadow-lg', 'shadow-primary/30')}
        >
          <LuCheck className={cn('w-3', 'h-3', 'text-white')} />
        </motion.div>
      )}
    </AnimatePresence>
  </motion.button>
);

// Export types for reuse
export type { ThemeMode, AccentColor, ThemeCardProps };
