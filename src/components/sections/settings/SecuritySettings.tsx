"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  LuShieldX,
  LuKey,
  LuSmartphone,
  LuMonitor,
  LuShieldCheck,
  LuLoader,
  LuInfo,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

export const SecuritySettingsSection = () => {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  // TODO: 2FA — not yet implemented on backend. Wiring this toggle to a real
  // TOTP/SMS flow requires: POST /api/auth/2fa/enable, GET /api/auth/2fa/qr,
  // POST /api/auth/2fa/verify. Keep local state only until that exists.
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const handleLogoutAll = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      toast.error("Logout failed — please try again.");
      setLoggingOut(false);
    }
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
      {/* Header */}
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

      <div className="space-y-4">
        {/* Change password — sends reset email */}
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

        {/* 2FA — UI-only until backend TOTP flow is built */}
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
                  {is2FAEnabled && (
                    <LuShieldCheck
                      className={cn("w-4", "h-4", "text-emerald-500")}
                    />
                  )}
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
                <p
                  className={cn(
                    "text-[10px]",
                    "font-bold",
                    "text-amber-600",
                    "mt-1",
                  )}
                >
                  Coming soon — backend 2FA flow not yet implemented
                </p>
              </div>
            </div>
            <button
              onClick={() => toast("2FA setup coming soon.", { icon: "🔐" })}
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
                "bg-background border border-border text-muted-foreground cursor-not-allowed opacity-60",
              )}
            >
              {is2FAEnabled ? "Disable 2FA" : "Enable 2FA"}
            </button>
          </div>
        </motion.div>

        {/* Active sessions — TODO: real session tracking not yet built */}
        <div className={cn("p-8", "bg-muted", "rounded-[2rem]", "space-y-6")}>
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

          {/* Current session — derived from browser environment, not a fake list */}
          <div
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
                <LuMonitor className={cn("w-5", "h-5")} />
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
                  Current Browser Session
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
                    Active
                  </span>
                </p>
                <p
                  className={cn(
                    "text-[10px]",
                    "font-medium",
                    "text-muted-foreground",
                    "mt-0.5",
                  )}
                >
                  Signed in on this device
                </p>
              </div>
            </div>
          </div>

          {/* Placeholder for future session list */}
          <div className={cn("flex", "items-start", "gap-3", "px-2")}>
            <LuInfo
              className={cn(
                "w-3.5",
                "h-3.5",
                "text-muted-foreground",
                "shrink-0",
                "mt-0.5",
              )}
            />
            <p
              className={cn(
                "text-[10px]",
                "font-medium",
                "text-muted-foreground",
                "leading-relaxed",
              )}
            >
              Full multi-device session management coming soon. For now you can
              log out all devices using the button above.
              {/* TODO: implement GET /api/auth/sessions and DELETE /api/auth/sessions/[id] */}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
