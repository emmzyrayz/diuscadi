"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuShieldAlert,
  LuBan,
  LuCircleCheck,
  LuShieldCheck,
  LuLoader,
  LuTriangleAlert,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import type { AdminUser } from "@/context/AdminContext";
import { resolveAdminFullName, resolveAdminInitial } from "@/utils/adminFullName";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user: AdminUser;
}

type Action = "suspend" | "ban" | "restore" | "role";

const ROLES = ["member", "moderator", "admin", "webmaster"] as const;

export const AdminUserRestrictModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
}) => {
  const { token } = useAuth();
  const { changeStatus, changeRole } = useAdmin();

  const [activeAction, setActiveAction] = useState<Action>("suspend");
  const [reason, setReason] = useState("");
  const [newRole, setNewRole] = useState(user.role);
  const [loading, setLoading] = useState(false);

  // Removed unused `isBanned` — it was computed but never referenced in JSX.
  // `isActive` is also unused directly — action tabs handle the logic.

  const handleConfirm = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (activeAction === "suspend") {
        await changeStatus(
          user.id,
          false,
          reason || "Suspended by admin",
          token,
        );
        toast.success(
          `${resolveAdminFullName(user.fullName as never)} has been suspended`,
        );
      } else if (activeAction === "ban") {
        await changeStatus(user.id, false, reason || "Banned by admin", token);
        toast.success(
          `${resolveAdminFullName(user.fullName as never)} has been banned`,
        );
      } else if (activeAction === "restore") {
        await changeStatus(user.id, true, undefined, token);
        toast.success(
          `${resolveAdminFullName(user.fullName as never)}'s account has been restored`,
        );
      } else if (activeAction === "role") {
        await changeRole(user.id, newRole, token);
        toast.success(`Role updated to ${newRole}`);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const ACTION_CONFIG = {
    suspend: {
      label: "Suspend Access",
      icon: LuShieldAlert,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100",
      desc: "Block login without deleting data. Reversible.",
    },
    ban: {
      label: "Ban Account",
      icon: LuBan,
      color: "text-rose-600",
      bg: "bg-rose-50 border-rose-100",
      desc: "Permanently block account. Tickets are invalidated.",
    },
    restore: {
      label: "Restore Account",
      icon: LuCircleCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
      desc: "Re-enable login and restore access.",
    },
    role: {
      label: "Change Role",
      icon: LuShieldCheck,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100",
      desc: "Update platform permissions for this user.",
    },
  };

  const current = ACTION_CONFIG[activeAction];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-background rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-foreground transition-colors cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <div className="p-8">
              {/* User identity */}
              <div
                className={cn(
                  "flex",
                  "items-center",
                  "gap-3",
                  "mb-8",
                  "p-4",
                  "bg-muted",
                  "rounded-2xl",
                )}
              >
                <div
                  className={cn(
                    "w-10",
                    "h-10",
                    "rounded-xl",
                    "bg-foreground",
                    "text-background",
                    "flex",
                    "items-center",
                    "justify-center",
                    "font-black",
                    "text-sm",
                  )}
                >
                  {resolveAdminInitial(user.fullName as never)}
                </div>
                <div>
                  <p className={cn("text-sm", "font-black", "text-foreground")}>
                    {resolveAdminFullName(user.fullName as never)}
                  </p>
                  <p
                    className={cn(
                      "text-[10px]",
                      "font-bold",
                      "text-muted-foreground",
                    )}
                  >
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Action tabs */}
              <div className={cn("grid", "grid-cols-4", "gap-2", "mb-6")}>
                {(["suspend", "ban", "restore", "role"] as Action[]).map(
                  (action) => {
                    const cfg = ACTION_CONFIG[action];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={action}
                        onClick={() => setActiveAction(action)}
                        className={cn(
                          "flex",
                          "flex-col",
                          "items-center",
                          "gap-1.5",
                          "p-3",
                          "rounded-2xl",
                          "border-2",
                          "transition-all",
                          "cursor-pointer",
                          activeAction === action
                            ? `${cfg.bg} border-current`
                            : "border-border bg-background",
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4",
                            "h-4",
                            activeAction === action
                              ? cfg.color
                              : "text-muted-foreground",
                          )}
                        />
                        <span
                          className={cn(
                            "text-[8px]",
                            "font-black",
                            "uppercase",
                            "tracking-widest",
                            activeAction === action
                              ? cfg.color
                              : "text-muted-foreground",
                          )}
                        >
                          {action}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>

              {/* Action description */}
              <div
                className={cn(
                  "flex",
                  "items-start",
                  "gap-3",
                  "p-4",
                  "rounded-2xl",
                  "border",
                  "mb-6",
                  current.bg,
                )}
              >
                <LuTriangleAlert
                  className={cn(
                    "w-4",
                    "h-4",
                    "shrink-0",
                    "mt-0.5",
                    current.color,
                  )}
                />
                <p
                  className={cn(
                    "text-[11px]",
                    "font-bold",
                    "leading-relaxed",
                    current.color,
                  )}
                >
                  {current.desc}
                </p>
              </div>

              {/* Role selector */}
              {activeAction === "role" && (
                <div className={cn("mb-6", "space-y-2")}>
                  <label
                    className={cn(
                      "text-[10px]",
                      "font-black",
                      "text-muted-foreground",
                      "uppercase",
                      "tracking-widest",
                    )}
                  >
                    New Role
                  </label>
                  <div className={cn("grid", "grid-cols-2", "gap-2")}>
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        onClick={() => setNewRole(r)}
                        className={cn(
                          "px-4",
                          "py-3",
                          "rounded-xl",
                          "border-2",
                          "text-[10px]",
                          "font-black",
                          "uppercase",
                          "tracking-widest",
                          "transition-all",
                          "cursor-pointer",
                          newRole === r
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason input */}
              {(activeAction === "suspend" || activeAction === "ban") && (
                <div className={cn("mb-6", "space-y-2")}>
                  <label
                    className={cn(
                      "text-[10px]",
                      "font-black",
                      "text-muted-foreground",
                      "uppercase",
                      "tracking-widest",
                    )}
                  >
                    Reason (optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Violation of community guidelines..."
                    rows={2}
                    className={cn(
                      "w-full",
                      "bg-muted",
                      "border",
                      "border-border",
                      "rounded-2xl",
                      "p-4",
                      "text-xs",
                      "font-medium",
                      "outline-none",
                      "focus:border-primary",
                      "resize-none",
                      "transition-all",
                    )}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={cn("flex", "items-center", "gap-3", "p-8", "pt-0")}>
              <button
                onClick={onClose}
                disabled={loading}
                className={cn(
                  "flex-1",
                  "px-6",
                  "py-4",
                  "rounded-2xl",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "text-muted-foreground",
                  "hover:bg-muted",
                  "transition-all",
                  "cursor-pointer",
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={cn(
                  "flex-1",
                  "flex",
                  "items-center",
                  "justify-center",
                  "gap-2",
                  "px-6",
                  "py-4",
                  "rounded-2xl",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "text-background",
                  "transition-all",
                  "shadow-xl",
                  "cursor-pointer",
                  "disabled:opacity-70",
                  activeAction === "restore" || activeAction === "role"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : activeAction === "ban"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-amber-500 hover:bg-amber-600",
                )}
              >
                {loading ? (
                  <>
                    <LuLoader className="w-4 h-4 animate-spin" /> Processing…
                  </>
                ) : (
                  <>{ACTION_CONFIG[activeAction].label}</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
