"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuShieldX,
  LuKey,
  LuSmartphone,
  LuMonitor,
  LuLogOut,
  LuHistory,
  LuShieldCheck,
  LuTriangleAlert,
} from "react-icons/lu";
import { cn } from "../../../lib/utils";
import { IconType } from "react-icons";

// Define proper TypeScript types
interface SessionItemProps {
  icon: IconType;
  device: string;
  location: string;
  isCurrent: boolean;
  delay?: number;
}

interface Session {
  id: string;
  icon: IconType;
  device: string;
  location: string;
  isCurrent: boolean;
}

export const SecuritySettingsSection = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const sessions: Session[] = [
    {
      id: "1",
      icon: LuMonitor,
      device: "Chrome on MacOS",
      location: "Lagos, Nigeria",
      isCurrent: true,
    },
    {
      id: "2",
      icon: LuSmartphone,
      device: "Safari on iPhone 15",
      location: "Abuja, Nigeria",
      isCurrent: false,
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
        className={cn("flex", "items-center", "justify-between", "mb-10")}
      >
        <div className={cn("flex", "items-center", "gap-3")}>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "w-10",
              "h-10",
              "rounded-xl",
              "bg-slate-50",
              "flex",
              "items-center",
              "justify-center",
              "text-emerald-600",
              "border",
              "border-slate-100",
            )}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <LuShieldX className={cn("w-5", "h-5")} />
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
              Security & Access
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
              Protect your account and managed sessions
            </p>
          </div>
        </div>
        {/* Elite UX: Last Password Change */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "hidden",
            "md:flex",
            "items-center",
            "gap-2",
            "px-4",
            "py-2",
            "bg-slate-50",
            "rounded-xl",
            "border",
            "border-slate-100",
          )}
        >
          <LuHistory className={cn("w-3", "h-3", "text-slate-400")} />
          <span
            className={cn(
              "text-[9px]",
              "font-black",
              "text-slate-500",
              "uppercase",
              "tracking-tighter",
            )}
          >
            Password updated 42 days ago
          </span>
        </motion.div>
      </motion.div>

      <div className="space-y-4">
        {/* Change Password Setting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.01, x: 4 }}
          className={cn(
            "p-6",
            "bg-slate-50",
            "rounded-3xl",
            "border",
            "border-transparent",
            "hover:border-slate-100",
            "hover:bg-white",
            "transition-all",
          )}
        >
          <div
            className={cn(
              "flex",
              "flex-col",
              "md:flex-row",
              "md:items-center",
              "justify-between",
              "gap-6",
            )}
          >
            <div className={cn("flex", "items-start", "gap-4")}>
              <motion.div
                whileHover={{ rotate: 15 }}
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
                  "shrink-0",
                )}
              >
                <LuKey className={cn("w-5", "h-5")} />
              </motion.div>
              <div>
                <h4
                  className={cn(
                    "text-sm",
                    "font-black",
                    "text-slate-900",
                    "uppercase",
                  )}
                >
                  Account Password
                </h4>
                <p
                  className={cn(
                    "text-xs",
                    "font-medium",
                    "text-slate-500",
                    "mt-1",
                  )}
                >
                  Set a unique password to protect your account.
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-6",
                "py-3",
                "bg-slate-900",
                "text-white",
                "rounded-xl",
                "font-black",
                "text-[10px]",
                "uppercase",
                "tracking-widest",
                "hover:bg-primary",
                "transition-colors",
                "shadow-lg",
                "shadow-slate-900/10",
              )}
            >
              Update Password
            </motion.button>
          </div>
        </motion.div>

        {/* 2FA Setting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.01, x: 4 }}
          className={cn(
            "p-6",
            "rounded-3xl",
            "border",
            "transition-all",
            is2FAEnabled
              ? "bg-emerald-50/30 border-emerald-100"
              : "bg-slate-50 border-transparent",
          )}
        >
          <div
            className={cn(
              "flex",
              "flex-col",
              "md:flex-row",
              "md:items-center",
              "justify-between",
              "gap-6",
            )}
          >
            <div className={cn("flex", "items-start", "gap-4")}>
              <motion.div
                animate={
                  is2FAEnabled
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
                  is2FAEnabled
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-white text-slate-400",
                )}
              >
                <LuSmartphone className={cn("w-5", "h-5")} />
              </motion.div>
              <div>
                <div className={cn("flex", "items-center", "gap-2")}>
                  <h4
                    className={cn(
                      "text-sm",
                      "font-black",
                      "text-slate-900",
                      "uppercase",
                    )}
                  >
                    Two-Factor Authentication
                  </h4>
                  <AnimatePresence>
                    {is2FAEnabled && (
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
                        <LuShieldCheck
                          className={cn("w-4", "h-4", "text-emerald-500")}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p
                  className={cn(
                    "text-xs",
                    "font-medium",
                    "text-slate-500",
                    "mt-1",
                  )}
                >
                  Add an extra layer of security to your login attempts.
                </p>
              </div>
            </div>
            <motion.button
              onClick={() => setIs2FAEnabled(!is2FAEnabled)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-6",
                "py-3",
                "rounded-xl",
                "font-black",
                "text-[10px]",
                "uppercase",
                "tracking-widest",
                "transition-all",
                is2FAEnabled
                  ? "bg-white border border-emerald-200 text-emerald-600"
                  : "bg-white border border-slate-200 text-slate-900",
              )}
            >
              {is2FAEnabled ? "Disable 2FA" : "Enable 2FA"}
            </motion.button>
          </div>
        </motion.div>

        {/* Login Sessions & Connected Devices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={cn("p-8", "bg-slate-50", "rounded-[2rem]", "space-y-6")}
        >
          <div className={cn("flex", "items-center", "justify-between")}>
            <h4
              className={cn(
                "text-[10px]",
                "font-black",
                "text-slate-400",
                "uppercase",
                "tracking-widest",
              )}
            >
              Active Sessions
            </h4>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "text-[9px]",
                "font-black",
                "text-rose-500",
                "uppercase",
                "hover:underline",
              )}
            >
              Log out all devices
            </motion.button>
          </div>

          <div className="space-y-3">
            {sessions.map((session, index) => (
              <SessionItem
                key={session.id}
                icon={session.icon}
                device={session.device}
                location={session.location}
                isCurrent={session.isCurrent}
                delay={0.7 + index * 0.1}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

/* --- Internal Helper for Sessions --- */
const SessionItem = ({
  icon: Icon,
  device,
  location,
  isCurrent,
  delay = 0,
}: SessionItemProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ scale: 1.01, x: 4 }}
    className={cn(
      "flex",
      "items-center",
      "justify-between",
      "p-4",
      "bg-white",
      "rounded-2xl",
      "border",
      "border-slate-100",
      "shadow-sm",
    )}
  >
    <div className={cn("flex", "items-center", "gap-4")}>
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "w-10",
          "h-10",
          "bg-slate-50",
          "rounded-xl",
          "flex",
          "items-center",
          "justify-center",
          "text-slate-400",
        )}
      >
        <Icon className={cn("w-5", "h-5")} />
      </motion.div>
      <div>
        <p
          className={cn(
            "text-xs",
            "font-bold",
            "text-slate-900",
            "flex",
            "items-center",
            "gap-2",
          )}
        >
          {device}
          <AnimatePresence>
            {isCurrent && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "px-1.5",
                  "py-0.5",
                  "bg-blue-50",
                  "text-blue-600",
                  "rounded",
                  "text-[7px]",
                  "font-black",
                  "uppercase",
                )}
              >
                Current Session
              </motion.span>
            )}
          </AnimatePresence>
        </p>
        <p
          className={cn(
            "text-[10px]",
            "font-medium",
            "text-slate-400",
            "mt-0.5",
          )}
        >
          {location}
        </p>
      </div>
    </div>
    {!isCurrent && (
      <motion.button
        whileHover={{ scale: 1.2, rotate: 10 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "p-2",
          "text-slate-300",
          "hover:text-rose-500",
          "transition-colors",
        )}
      >
        <LuLogOut className={cn("w-4", "h-4")} />
      </motion.button>
    )}
  </motion.div>
);

// Export types for reuse
export type { SessionItemProps, Session };
