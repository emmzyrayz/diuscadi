"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../lib/utils";
import {
  LuBellRing,
  LuMail,
  LuTicket,
  LuCalendarCheck,
  LuMegaphone,
  LuClock,
  LuCircleCheck,
} from "react-icons/lu";
import { IconType } from "react-icons";

// Define proper TypeScript types
type NotificationFrequency = "instant" | "daily" | "weekly";

interface NotificationToggleProps {
  icon: IconType;
  title: string;
  desc: string;
  defaultChecked: boolean;
  delay?: number;
}

interface NotificationConfig {
  id: string;
  icon: IconType;
  title: string;
  desc: string;
  defaultChecked: boolean;
}

export const NotificationSettingsSection = () => {
  const [frequency, setFrequency] = useState<NotificationFrequency>("instant");

  const notificationConfigs: NotificationConfig[] = [
    {
      id: "tickets",
      icon: LuTicket,
      title: "Ticket & Booking Updates",
      desc: "Get notified about purchase confirmations and QR codes.",
      defaultChecked: true,
    },
    {
      id: "reminders",
      icon: LuCalendarCheck,
      title: "Event Reminders",
      desc: "Receive alerts 24h and 1h before your registered events.",
      defaultChecked: true,
    },
    {
      id: "messages",
      icon: LuMail,
      title: "Direct Messages",
      desc: "Notifications when other DIUSCADI members message you.",
      defaultChecked: false,
    },
    {
      id: "marketing",
      icon: LuMegaphone,
      title: "Marketing & News",
      desc: "Stay updated on new tracks, sessions, and platform features.",
      defaultChecked: false,
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
            animate={{
              rotate: [0, -15, 15, -15, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <LuBellRing className={cn("w-5", "h-5")} />
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
            Notification Channels
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
            Choose how and when we reach you
          </p>
        </div>
      </motion.div>

      {/* 2. Frequency Control (Advanced UX) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.01 }}
        className={cn(
          "mb-10",
          "p-6",
          "bg-slate-900",
          "rounded-3xl",
          "flex",
          "flex-col",
          "md:flex-row",
          "items-center",
          "justify-between",
          "gap-6",
          "overflow-hidden",
          "relative",
        )}
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
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
            "w-32",
            "h-32",
            "bg-primary/20",
            "rounded-full",
            "blur-3xl",
            "-mr-16",
            "-mt-16",
          )}
        />
        <div
          className={cn("flex", "items-center", "gap-4", "relative", "z-10")}
        >
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className={cn(
              "w-10",
              "h-10",
              "bg-white/10",
              "rounded-xl",
              "flex",
              "items-center",
              "justify-center",
              "text-primary",
            )}
          >
            <LuClock className={cn("w-5", "h-5")} />
          </motion.div>
          <div>
            <h4
              className={cn(
                "text-sm",
                "font-black",
                "text-white",
                "uppercase",
                "tracking-tight",
              )}
            >
              Delivery Frequency
            </h4>
            <p className={cn("text-[10px]", "font-bold", "text-slate-400")}>
              Control the volume of emails
            </p>
          </div>
        </div>

        <motion.select
          value={frequency}
          onChange={(e) =>
            setFrequency(e.target.value as NotificationFrequency)
          }
          whileFocus={{ scale: 1.02 }}
          className={cn(
            "relative",
            "z-10",
            "w-full",
            "md:w-48",
            "bg-white/10",
            "border",
            "border-white/10",
            "rounded-xl",
            "px-4",
            "py-3",
            "text-xs",
            "font-black",
            "text-white",
            "uppercase",
            "tracking-widest",
            "outline-none",
            "focus:bg-white/20",
            "transition-all",
            "cursor-pointer",
          )}
        >
          <option value="instant" className="text-slate-900">
            Instant
          </option>
          <option value="daily" className="text-slate-900">
            Daily Digest
          </option>
          <option value="weekly" className="text-slate-900">
            Weekly Wrap
          </option>
        </motion.select>
      </motion.div>

      {/* 3. Toggle List */}
      <div className="space-y-3">
        {notificationConfigs.map((config, index) => (
          <NotificationToggle
            key={config.id}
            icon={config.icon}
            title={config.title}
            desc={config.desc}
            defaultChecked={config.defaultChecked}
            delay={0.4 + index * 0.1}
          />
        ))}
      </div>
    </motion.section>
  );
};

/* --- Internal Toggle Component --- */
const NotificationToggle = ({
  icon: Icon,
  title,
  desc,
  defaultChecked,
  delay = 0,
}: NotificationToggleProps) => {
  const [enabled, setEnabled] = useState(defaultChecked);

  return (
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
        "rounded-[2rem]",
        "border",
        "transition-all",
        enabled
          ? "bg-white border-slate-100 shadow-sm"
          : "bg-slate-50 border-transparent opacity-70",
      )}
    >
      <div className={cn("flex", "items-start", "gap-4")}>
        <motion.div
          animate={
            enabled
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
            "w-10",
            "h-10",
            "rounded-xl",
            "flex",
            "items-center",
            "justify-center",
            "shrink-0",
            "transition-all",
            "duration-300",
            enabled
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "bg-white text-slate-300 border border-slate-100",
          )}
        >
          <motion.div
            animate={
              enabled
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
        <div className="space-y-0.5">
          <h4
            className={cn(
              "text-sm",
              "font-black",
              "uppercase",
              "tracking-tight",
              "transition-colors",
              enabled ? "text-slate-900" : "text-slate-400",
            )}
          >
            {title}
          </h4>
          <p
            className={cn(
              "text-xs",
              "font-medium",
              "text-slate-500",
              "max-w-sm",
              "leading-snug",
            )}
          >
            {desc}
          </p>
        </div>
      </div>

      <motion.button
        onClick={() => setEnabled(!enabled)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative",
          "w-12",
          "h-6",
          "rounded-full",
          "transition-colors",
          "duration-300",
          "focus:ring-2",
          "focus:ring-primary/20",
          "focus:ring-offset-2",
          "outline-none",
          enabled ? "bg-emerald-500" : "bg-slate-200",
        )}
      >
        <motion.div
          animate={{ x: enabled ? 28 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "absolute",
            "top-1",
            "w-4",
            "h-4",
            "bg-white",
            "rounded-full",
            "shadow-sm",
          )}
        >
          {/* Indicator dot when enabled */}
          <AnimatePresence>
            {enabled && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn('absolute', 'inset-0', 'flex', 'items-center', 'justify-center')}
              >
                <div className={cn('w-1.5', 'h-1.5', 'bg-emerald-500', 'rounded-full')} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Ripple effect on toggle */}
        <AnimatePresence>
          {enabled && (
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
export type {
  NotificationFrequency,
  NotificationToggleProps,
  NotificationConfig,
};
