"use client";
// modal/AUEditModal.tsx
// Edits a user's name and role via AdminContext.changeRole.
// Email is read-only (auth concern). Phone not in AdminUser schema yet.
// Avatar change goes through the existing Cloudinary pipeline — TODO.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuUser,
  LuMail,
  LuShieldCheck,
  LuSave,
  LuUserPlus,
  LuLoader,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import type { AdminUser } from "@/context/AdminContext";
import { resolveAdminFullName } from "@/utils/adminFullName";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  user: AdminUser | null;
}

const ROLES = ["member", "moderator", "admin", "webmaster"] as const;

export const AdminUserEditModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  user,
}) => {
  const { token } = useAuth();
  const { changeRole } = useAdmin();

  const [role, setRole] = useState(user?.role ?? "member");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (role !== user.role) {
        await changeRole(user.id, role, token);
        toast.success(`Role updated to ${role}`);
      }
      onSave?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "z-[110]",
            "flex",
            "items-center",
            "justify-center",
            "p-4",
          )}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={cn(
              "absolute",
              "inset-0",
              "bg-foreground/60",
              "backdrop-blur-sm",
            )}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative",
              "w-full",
              "max-w-lg",
              "bg-background",
              "rounded-[3rem]",
              "shadow-2xl",
              "overflow-hidden",
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "p-8",
                "border-b",
                "border-border",
                "flex",
                "items-center",
                "justify-between",
                "bg-muted/50",
              )}
            >
              <div className={cn("flex", "items-center", "gap-4")}>
                <div
                  className={cn(
                    "w-10",
                    "h-10",
                    "bg-foreground",
                    "rounded-xl",
                    "flex",
                    "items-center",
                    "justify-center",
                    "text-primary",
                  )}
                >
                  <LuUserPlus className={cn("w-5", "h-5")} />
                </div>
                <div>
                  <h3
                    className={cn(
                      "text-xl",
                      "font-black",
                      "text-foreground",
                      "uppercase",
                      "tracking-tighter",
                    )}
                  >
                    Edit User
                  </h3>
                  <p
                    className={cn(
                      "text-[10px]",
                      "font-bold",
                      "text-muted-foreground",
                      "uppercase",
                      "tracking-widest",
                    )}
                  >
                    {user.vaultId.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "p-2",
                  "hover:bg-slate-200",
                  "rounded-full",
                  "transition-colors",
                  "cursor-pointer",
                )}
              >
                <LuX className={cn("w-5", "h-5", "text-muted-foreground")} />
              </button>
            </div>

            <div className={cn("p-8", "space-y-6")}>
              {/* Read-only name */}
              <div className={cn("space-y-2")}>
                <label
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                    "text-muted-foreground",
                  )}
                >
                  Full Name (read-only)
                </label>
                <div className={cn("relative")}>
                  <LuUser
                    className={cn(
                      "absolute",
                      "left-4",
                      "top-1/2",
                      "-translate-y-1/2",
                      "w-4",
                      "h-4",
                      "text-slate-300",
                    )}
                  />
                  <input
                    disabled
                    value={resolveAdminFullName(user.fullName)}
                    className={cn(
                      "w-full",
                      "bg-muted/50",
                      "border",
                      "border-border",
                      "p-4",
                      "pl-12",
                      "rounded-2xl",
                      "text-[11px]",
                      "font-bold",
                      "text-muted-foreground",
                      "outline-none",
                      "cursor-not-allowed",
                    )}
                  />
                </div>
              </div>

              {/* Read-only email */}
              <div className={cn("space-y-2")}>
                <label
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                    "text-muted-foreground",
                  )}
                >
                  Email (read-only)
                </label>
                <div className={cn("relative")}>
                  <LuMail
                    className={cn(
                      "absolute",
                      "left-4",
                      "top-1/2",
                      "-translate-y-1/2",
                      "w-4",
                      "h-4",
                      "text-slate-300",
                    )}
                  />
                  <input
                    disabled
                    value={user.email}
                    className={cn(
                      "w-full",
                      "bg-muted/50",
                      "border",
                      "border-border",
                      "p-4",
                      "pl-12",
                      "rounded-2xl",
                      "text-[11px]",
                      "font-bold",
                      "text-muted-foreground",
                      "outline-none",
                      "cursor-not-allowed",
                    )}
                  />
                </div>
                <p
                  className={cn(
                    "text-[9px]",
                    "font-bold",
                    "text-muted-foreground",
                  )}
                >
                  Email changes must be done by the user via account settings.
                </p>
              </div>

              {/* Editable role */}
              <div className={cn("space-y-3")}>
                <label
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                    "text-muted-foreground",
                    "flex",
                    "items-center",
                    "gap-2",
                  )}
                >
                  <LuShieldCheck className={cn("w-3.5", "h-3.5")} /> Platform
                  Role
                </label>
                <div className={cn("grid", "grid-cols-2", "gap-2")}>
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
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
                        role === r
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-slate-300",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className={cn(
                "p-8",
                "bg-muted/50",
                "border-t",
                "border-border",
                "flex",
                "items-center",
                "gap-4",
              )}
            >
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
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className={cn(
                  "flex-1",
                  "flex",
                  "items-center",
                  "justify-center",
                  "gap-2",
                  "px-8",
                  "py-4",
                  "bg-foreground",
                  "text-background",
                  "rounded-2xl",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "hover:bg-primary",
                  "hover:text-foreground",
                  "transition-all",
                  "shadow-xl",
                  "cursor-pointer",
                  "disabled:opacity-70",
                )}
              >
                {loading ? (
                  <>
                    <LuLoader className="w-4 h-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <LuSave className={cn("w-4", "h-4")} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
