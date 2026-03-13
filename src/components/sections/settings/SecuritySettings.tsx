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
  LuLoader,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

interface SessionItemProps {
  icon: IconType;
  device: string;
  location: string;
  isCurrent: boolean;
  delay?: number;
}

export const SecuritySettingsSection = () => {
  const { logout } = useAuth();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogoutAll = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      toast.error("Logout failed — please try again.");
      setLoggingOut(false);
    }
  };

  const sessions = [
    {
      id: "1",
      icon: LuMonitor,
      device: "Chrome on Desktop",
      location: "Benin City, Nigeria",
      isCurrent: true,
    },
    {
      id: "2",
      icon: LuSmartphone,
      device: "Safari on iPhone 15",
      location: "Lagos, Nigeria",
      isCurrent: false,
    },
  ];

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
      {/* Header */}
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
              "text-emerald-600",
              "border",
              "border-border",
            )}
          >
            <LuShieldX className={cn("w-5", "h-5")} />
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
              Security & Access
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
              Protect your account and manage sessions
            </p>
          </div>
        </div>
        <div
          className={cn(
            "hidden",
            "md:flex",
            "items-center",
            "gap-2",
            "px-4",
            "py-2",
            "bg-muted",
            "rounded-xl",
            "border",
            "border-border",
          )}
        >
          <LuHistory className={cn("w-3", "h-3", "text-muted-foreground")} />
          <span
            className={cn(
              "text-[9px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-tighter",
            )}
          >
            Password updated recently
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Change password */}
        <motion.div
          whileHover={{ scale: 1.01, x: 4 }}
          className={cn(
            "p-6",
            "bg-muted",
            "rounded-3xl",
            "border",
            "border-transparent",
            "hover:border-border",
            "hover:bg-background",
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
              <div
                className={cn(
                  "w-10",
                  "h-10",
                  "bg-background",
                  "rounded-xl",
                  "flex",
                  "items-center",
                  "justify-center",
                  "text-muted-foreground",
                  "shrink-0",
                )}
              >
                <LuKey className={cn("w-5", "h-5")} />
              </div>
              <div>
                <h4
                  className={cn(
                    "text-sm",
                    "font-black",
                    "text-foreground",
                    "uppercase",
                  )}
                >
                  Account Password
                </h4>
                <p
                  className={cn(
                    "text-xs",
                    "font-medium",
                    "text-muted-foreground",
                    "mt-1",
                  )}
                >
                  Set a unique password to protect your account.
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                toast("Password reset email sent — check your inbox.", {
                  icon: "📧",
                })
              }
              className={cn(
                "px-6",
                "py-3",
                "bg-foreground",
                "text-background",
                "rounded-xl",
                "font-black",
                "text-[10px]",
                "uppercase",
                "tracking-widest",
                "hover:bg-primary",
                "transition-colors",
                "shadow-lg",
                "shadow-foreground/10",
                "cursor-pointer",
              )}
            >
              Update Password
            </button>
          </div>
        </motion.div>

        {/* 2FA */}
        <motion.div
          whileHover={{ scale: 1.01, x: 4 }}
          className={cn(
            "p-6",
            "rounded-3xl",
            "border",
            "transition-all",
            is2FAEnabled
              ? "bg-emerald-50/30 border-emerald-100"
              : "bg-muted border-transparent",
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
              <div
                className={cn(
                  "w-10",
                  "h-10",
                  "rounded-xl",
                  "flex",
                  "items-center",
                  "justify-center",
                  "shrink-0",
                  "transition-all",
                  is2FAEnabled
                    ? "bg-emerald-500 text-background shadow-lg shadow-emerald-500/20"
                    : "bg-background text-muted-foreground",
                )}
              >
                <LuSmartphone className={cn("w-5", "h-5")} />
              </div>
              <div>
                <div className={cn("flex", "items-center", "gap-2")}>
                  <h4
                    className={cn(
                      "text-sm",
                      "font-black",
                      "text-foreground",
                      "uppercase",
                    )}
                  >
                    Two-Factor Authentication
                  </h4>
                  <AnimatePresence>
                    {is2FAEnabled && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
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
                    "text-muted-foreground",
                    "mt-1",
                  )}
                >
                  Add an extra layer of security to your login.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIs2FAEnabled(!is2FAEnabled);
                toast(is2FAEnabled ? "2FA disabled." : "2FA enabled!");
              }}
              className={cn(
                "px-6",
                "py-3",
                "rounded-xl",
                "font-black",
                "text-[10px]",
                "uppercase",
                "tracking-widest",
                "transition-all",
                "cursor-pointer",
                is2FAEnabled
                  ? "bg-background border border-emerald-200 text-emerald-600"
                  : "bg-background border border-border text-foreground",
              )}
            >
              {is2FAEnabled ? "Disable 2FA" : "Enable 2FA"}
            </button>
          </div>
        </motion.div>

        {/* Active sessions */}
        <div
          className={cn("p-8", "bg-muted", "rounded-[2rem]", "space-y-6")}
        >
          <div className={cn("flex", "items-center", "justify-between")}>
            <h4
              className={cn(
                "text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-widest",
              )}
            >
              Active Sessions
            </h4>
            <button
              onClick={handleLogoutAll}
              disabled={loggingOut}
              className={cn(
                "text-[9px]",
                "font-black",
                "text-rose-500",
                "uppercase",
                "hover:underline",
                "cursor-pointer",
                "flex",
                "items-center",
                "gap-1.5",
                "disabled:opacity-50",
              )}
            >
              {loggingOut && (
                <LuLoader className={cn("w-3", "h-3", "animate-spin")} />
              )}
              Log out all devices
            </button>
          </div>
          <div className="space-y-3">
            {sessions.map((s, i) => (
              <SessionItem
                key={s.id}
                icon={s.icon}
                device={s.device}
                location={s.location}
                isCurrent={s.isCurrent}
                delay={0.1 * i}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

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
    transition={{ delay }}
    whileHover={{ scale: 1.01, x: 4 }}
    className={cn(
      "flex",
      "items-center",
      "justify-between",
      "p-4",
      "bg-background",
      "rounded-2xl",
      "border",
      "border-border",
      "shadow-sm",
    )}
  >
    <div className={cn("flex", "items-center", "gap-4")}>
      <div
        className={cn(
          "w-10",
          "h-10",
          "bg-muted",
          "rounded-xl",
          "flex",
          "items-center",
          "justify-center",
          "text-muted-foreground",
        )}
      >
        <Icon className={cn("w-5", "h-5")} />
      </div>
      <div>
        <p
          className={cn(
            "text-xs",
            "font-bold",
            "text-foreground",
            "flex",
            "items-center",
            "gap-2",
          )}
        >
          {device}
          {isCurrent && (
            <span
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
              Current
            </span>
          )}
        </p>
        <p
          className={cn(
            "text-[10px]",
            "font-medium",
            "text-muted-foreground",
            "mt-0.5",
          )}
        >
          {location}
        </p>
      </div>
    </div>
    {!isCurrent && (
      <button
        className={cn(
          "p-2",
          "text-slate-300",
          "hover:text-rose-500",
          "transition-colors",
          "cursor-pointer",
        )}
      >
        <LuLogOut className={cn("w-4", "h-4")} />
      </button>
    )}
  </motion.div>
);
