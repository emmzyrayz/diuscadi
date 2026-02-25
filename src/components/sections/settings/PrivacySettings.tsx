"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../lib/utils";
import {
  LuLock,
  LuEye,
  LuEyeOff,
  LuMail,
  LuPhone,
  LuDownload,
  LuShieldAlert,
  LuInfo,
} from "react-icons/lu";
import { IconType } from "react-icons";

// Define proper TypeScript types
interface PrivacyToggleProps {
  icon: IconType;
  label: string;
  desc: string;
  delay?: number;
}

interface PrivacyOption {
  id: string;
  icon: IconType;
  label: string;
  desc: string;
}

export const PrivacySettingsSection = () => {
  const [profilePrivate, setProfilePrivate] = useState(false);

  const privacyOptions: PrivacyOption[] = [
    {
      id: "email",
      icon: LuMail,
      label: "Display Email on Digital ID",
      desc: "Allow verified event attendees to see your primary email.",
    },
    {
      id: "phone",
      icon: LuPhone,
      label: "Display Phone Number",
      desc: "Show your contact number for direct networking during sessions.",
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
          whileHover={{ scale: 1.1, rotate: -10 }}
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
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <LuLock className={cn("w-5", "h-5")} />
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
            Privacy & Visibility
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
            Manage your digital footprint and data access
          </p>
        </div>
      </motion.div>

      {/* 2. Global Visibility Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.01 }}
        className={cn(
          "mb-10",
          "p-8",
          "rounded-[2rem]",
          "border-2",
          "transition-all",
          "duration-300",
          profilePrivate
            ? "bg-slate-900 border-slate-800 text-white"
            : "bg-blue-50/30 border-blue-100 text-slate-900",
        )}
      >
        <div
          className={cn(
            "flex",
            "flex-col",
            "md:flex-row",
            "items-start",
            "md:items-center",
            "justify-between",
            "gap-6",
          )}
        >
          <div className={cn("flex", "items-start", "gap-4")}>
            <motion.div
              animate={
                profilePrivate
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
                profilePrivate
                  ? "bg-white/10 text-primary"
                  : "bg-white text-primary shadow-sm",
              )}
            >
              <AnimatePresence mode="wait">
                {profilePrivate ? (
                  <motion.div
                    key="private"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <LuEyeOff className={cn("w-6", "h-6")} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="public"
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -180 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <LuEye className={cn("w-6", "h-6")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <div>
              <h4
                className={cn(
                  "text-sm",
                  "font-black",
                  "uppercase",
                  "tracking-tight",
                )}
              >
                Private Profile Mode
              </h4>
              <p
                className={cn(
                  "text-xs",
                  "font-medium",
                  "mt-1",
                  "leading-relaxed",
                  "max-w-sm",
                  profilePrivate ? "text-slate-400" : "text-slate-500",
                )}
              >
                When enabled, your profile is hidden from the DIUSCADI directory
                and only visible via direct link.
              </p>
            </div>
          </div>
          <motion.button
            onClick={() => setProfilePrivate(!profilePrivate)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "px-8",
              "py-3",
              "rounded-xl",
              "font-black",
              "text-[10px]",
              "uppercase",
              "tracking-widest",
              "transition-all",
              "duration-300",
              profilePrivate
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-white border border-blue-200 text-blue-600",
            )}
          >
            {profilePrivate ? "Go Public" : "Make Private"}
          </motion.button>
        </div>
      </motion.div>

      {/* 3. Granular Privacy List */}
      <div className="space-y-4">
        <motion.label
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={cn(
            "text-[10px]",
            "font-black",
            "text-slate-400",
            "uppercase",
            "tracking-[0.2em]",
            "ml-1",
          )}
        >
          Data Display Preferences
        </motion.label>

        {privacyOptions.map((option, index) => (
          <PrivacyToggle
            key={option.id}
            icon={option.icon}
            label={option.label}
            desc={option.desc}
            delay={0.6 + index * 0.1}
          />
        ))}

        {/* 4. Data Portability (Advanced UX) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={cn(
            "mt-10",
            "pt-8",
            "border-t",
            "border-slate-50",
            "flex",
            "flex-col",
            "md:flex-row",
            "items-center",
            "justify-between",
            "gap-6",
          )}
        >
          <div className={cn("flex", "items-center", "gap-3")}>
            <LuInfo className={cn("w-5", "h-5", "text-slate-300")} />
            <p className={cn("text-[11px]", "font-medium", "text-slate-500")}>
              You can request a full archive of your DIUSCADI data at any time.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "px-6",
              "py-3",
              "bg-slate-50",
              "border",
              "border-slate-100",
              "text-slate-600",
              "rounded-xl",
              "font-black",
              "text-[10px]",
              "uppercase",
              "tracking-widest",
              "hover:bg-slate-900",
              "hover:text-white",
              "transition-colors",
            )}
          >
            <motion.div
              whileHover={{ y: [0, -2, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <LuDownload className={cn("w-4", "h-4")} />
            </motion.div>
            Export Data (.JSON)
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  );
};

/* --- Internal Helper --- */
const PrivacyToggle = ({
  icon: Icon,
  label,
  desc,
  delay = 0,
}: PrivacyToggleProps) => {
  const [active, setActive] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.01, x: 4 }}
      className={cn(
        "flex",
        "items-center",
        "justify-between",
        "p-6",
        "bg-slate-50/50",
        "rounded-3xl",
        "border",
        "border-transparent",
        "hover:border-slate-100",
        "transition-all",
      )}
    >
      <div className={cn("flex", "items-start", "gap-4")}>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "w-10",
            "h-10",
            "bg-white",
            "rounded-xl",
            "flex",
            "items-center",
            "justify-center",
            "text-slate-400",
            "border",
            "border-slate-100",
          )}
        >
          <Icon className={cn("w-5", "h-5")} />
        </motion.div>
        <div>
          <h4
            className={cn(
              "text-[11px]",
              "font-black",
              "text-slate-900",
              "uppercase",
              "tracking-tight",
            )}
          >
            {label}
          </h4>
          <p className={cn("text-[10px]", "font-medium", "text-slate-500")}>
            {desc}
          </p>
        </div>
      </div>
      <motion.button
        onClick={() => setActive(!active)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "w-10",
          "h-5",
          "rounded-full",
          "relative",
          "transition-colors",
          "duration-300",
          "focus:ring-2",
          "focus:ring-primary/20",
          "focus:ring-offset-2",
          "outline-none",
          active ? "bg-emerald-500" : "bg-slate-200",
        )}
      >
        <motion.div
          animate={{ x: active ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "absolute",
            "top-1",
            "w-3",
            "h-3",
            "bg-white",
            "rounded-full",
            "shadow-sm",
          )}
        >
          {/* Indicator dot when enabled */}
          <AnimatePresence>
            {active && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn('absolute', 'inset-0', 'flex', 'items-center', 'justify-center')}
              >
                <div className={cn('w-1', 'h-1', 'bg-emerald-500', 'rounded-full')} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Ripple effect on toggle */}
        <AnimatePresence>
          {active && (
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
};

// Export types for reuse
export type { PrivacyToggleProps, PrivacyOption };
