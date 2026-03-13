"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuTriangleAlert,
  LuLogOut,
  LuUserMinus,
  LuTrash2,
  LuShieldAlert,
  LuX,
  LuLock,
  LuLoader,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

interface DangerRowProps {
  icon: IconType;
  title: string;
  desc: string;
  buttonText: string;
  onAction: () => void;
  loading?: boolean;
  delay?: number;
}

export const DangerZoneSection = () => {
  const { logout } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      toast.error("Logout failed.");
      setLoggingOut(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    toast("Account deactivation is coming soon.", { icon: "ℹ️" });
    setDeactivating(false);
  };

  const handleDelete = () => {
    if (confirmText !== "DELETE") return;
    toast.error(
      "Account deletion initiated — you will receive a confirmation email.",
    );
    setShowDeleteModal(false);
    setConfirmText("");
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-rose-50/30",
        "border-2",
        "border-rose-100",
        "rounded-[2.5rem]",
        "p-8",
        "md:p-10",
        "shadow-sm",
        "overflow-hidden",
        "relative",
      )}
    >
      {/* Decorative blur */}
      <div
        className={cn(
          "absolute",
          "-top-12",
          "-right-12",
          "w-40",
          "h-40",
          "bg-rose-500/5",
          "rounded-full",
          "blur-3xl",
          "pointer-events-none",
        )}
      />

      {/* Header */}
      <div
        className={cn(
          "flex",
          "items-center",
          "gap-3",
          "mb-10",
          "relative",
          "z-10",
        )}
      >
        <div
          className={cn(
            "w-10",
            "h-10",
            "rounded-xl",
            "bg-background",
            "flex",
            "items-center",
            "justify-center",
            "text-rose-600",
            "border",
            "border-rose-100",
            "shadow-sm",
          )}
        >
          <LuTriangleAlert className={cn("w-5", "h-5")} />
        </div>
        <div>
          <h3
            className={cn(
              "text-xl",
              "font-black",
              "text-rose-900",
              "tracking-tight",
            )}
          >
            Danger Zone
          </h3>
          <p
            className={cn(
              "text-[10px]",
              "font-bold",
              "text-rose-400",
              "uppercase",
              "tracking-widest",
              "mt-1",
            )}
          >
            Irreversible account actions and access control
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <DangerRow
          icon={LuLogOut}
          title="Sign Out of Session"
          desc="Safely end your current session on this device."
          buttonText="Logout"
          onAction={handleLogout}
          loading={loggingOut}
          delay={0.1}
        />
        <DangerRow
          icon={LuUserMinus}
          title="Deactivate Account"
          desc="Temporarily disable your profile. You can reactivate anytime."
          buttonText="Deactivate"
          onAction={handleDeactivate}
          loading={deactivating}
          delay={0.2}
        />

        {/* Permanent delete */}
        <motion.div
          whileHover={{ scale: 1.01, x: 4 }}
          className={cn(
            "flex",
            "flex-col",
            "md:flex-row",
            "items-start",
            "md:items-center",
            "justify-between",
            "p-6",
            "bg-background",
            "border",
            "border-rose-100",
            "rounded-3xl",
            "gap-6",
          )}
        >
          <div className={cn("flex", "items-start", "gap-4")}>
            <div
              className={cn(
                "w-10",
                "h-10",
                "bg-rose-50",
                "rounded-xl",
                "flex",
                "items-center",
                "justify-center",
                "text-rose-600",
                "shrink-0",
              )}
            >
              <LuTrash2 className={cn("w-5", "h-5")} />
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
                Delete Account
              </h4>
              <p
                className={cn(
                  "text-xs",
                  "font-medium",
                  "text-muted-foreground",
                  "mt-1",
                  "max-w-sm",
                )}
              >
                Permanently remove all your data, tickets, and history. This
                cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className={cn(
              "w-full",
              "md:w-auto",
              "px-8",
              "py-4",
              "bg-rose-600",
              "text-background",
              "rounded-2xl",
              "font-black",
              "text-[10px]",
              "uppercase",
              "tracking-widest",
              "hover:bg-rose-700",
              "transition-colors",
              "shadow-lg",
              "shadow-rose-200",
              "cursor-pointer",
            )}
          >
            Delete Permanently
          </button>
        </motion.div>
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div
            className={cn(
              "fixed",
              "inset-0",
              "z-50",
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
              onClick={() => setShowDeleteModal(false)}
              className={cn(
                "absolute",
                "inset-0",
                "bg-foreground/60",
                "backdrop-blur-sm",
              )}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative",
                "w-full",
                "max-w-md",
                "bg-background",
                "rounded-[2.5rem]",
                "p-8",
                "shadow-2xl",
              )}
            >
              <div
                className={cn(
                  "flex",
                  "justify-between",
                  "items-center",
                  "mb-6",
                )}
              >
                <div
                  className={cn(
                    "w-12",
                    "h-12",
                    "bg-rose-100",
                    "text-rose-600",
                    "rounded-2xl",
                    "flex",
                    "items-center",
                    "justify-center",
                  )}
                >
                  <LuShieldAlert className={cn("w-6", "h-6")} />
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={cn(
                    "text-muted-foreground",
                    "hover:text-foreground",
                    "cursor-pointer",
                  )}
                >
                  <LuX className={cn("w-6", "h-6")} />
                </button>
              </div>

              <h3
                className={cn(
                  "text-2xl",
                  "font-black",
                  "text-foreground",
                  "tracking-tight",
                  "mb-2",
                )}
              >
                Are you absolutely sure?
              </h3>
              <p
                className={cn(
                  "text-sm",
                  "text-muted-foreground",
                  "mb-8",
                  "leading-relaxed",
                )}
              >
                This deletes your{" "}
                <span className={cn("font-bold", "text-foreground")}>
                  DIUSCADI
                </span>{" "}
                account and all associated data. Type{" "}
                <span
                  className={cn(
                    "font-mono",
                    "font-bold",
                    "text-rose-600",
                    "bg-rose-50",
                    "px-1",
                  )}
                >
                  DELETE
                </span>{" "}
                to confirm.
              </p>

              <div className="space-y-4">
                <div className="relative">
                  <LuLock
                    className={cn(
                      "absolute",
                      "left-4",
                      "top-1/2",
                      "-translate-y-1/2",
                      "text-muted-foreground",
                      "w-4",
                      "h-4",
                    )}
                  />
                  <input
                    type="text"
                    placeholder="Type DELETE to confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className={cn(
                      "w-full",
                      "bg-muted",
                      "border",
                      "border-border",
                      "rounded-xl",
                      "pl-12",
                      "pr-4",
                      "py-4",
                      "text-sm",
                      "font-bold",
                      "text-foreground",
                      "outline-none",
                      "focus:border-rose-300",
                      "transition-all",
                    )}
                  />
                </div>
                <div className={cn("flex", "gap-3")}>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setConfirmText("");
                    }}
                    className={cn(
                      "flex-1",
                      "px-6",
                      "py-4",
                      "text-muted",
                      "text-slate-600",
                      "rounded-2xl",
                      "font-black",
                      "text-[10px]",
                      "uppercase",
                      "tracking-widest",
                      "hover:bg-slate-200",
                      "transition-colors",
                      "cursor-pointer",
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={confirmText !== "DELETE"}
                    className={cn(
                      "flex-1",
                      "px-6",
                      "py-4",
                      "rounded-2xl",
                      "font-black",
                      "text-[10px]",
                      "uppercase",
                      "tracking-widest",
                      "transition-all",
                      confirmText === "DELETE"
                        ? "bg-rose-600 text-background shadow-xl shadow-rose-200 cursor-pointer"
                        : "text-muted text-slate-300 cursor-not-allowed",
                    )}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

const DangerRow = ({
  icon: Icon,
  title,
  desc,
  buttonText,
  onAction,
  loading = false,
  delay = 0,
}: DangerRowProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    whileHover={{ scale: 1.01, x: 4 }}
    className={cn(
      "flex",
      "flex-col",
      "md:flex-row",
      "items-start",
      "md:items-center",
      "justify-between",
      "p-6",
      "hover:bg-background",
      "rounded-3xl",
      "transition-all",
      "gap-6",
      "border",
      "border-transparent",
      "hover:border-rose-100",
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
          "shadow-sm",
          "shrink-0",
        )}
      >
        <Icon className={cn("w-5", "h-5")} />
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
          {title}
        </h4>
        <p
          className={cn(
            "text-xs",
            "font-medium",
            "text-muted-foreground",
            "mt-1",
          )}
        >
          {desc}
        </p>
      </div>
    </div>
    <button
      onClick={onAction}
      disabled={loading}
      className={cn(
        "w-full",
        "md:w-auto",
        "px-6",
        "py-3",
        "border-2",
        "border-border",
        "text-slate-600",
        "rounded-xl",
        "font-black",
        "text-[10px]",
        "uppercase",
        "tracking-widest",
        "hover:border-rose-200",
        "hover:text-rose-600",
        "transition-colors",
        "flex",
        "items-center",
        "justify-center",
        "gap-2",
        "cursor-pointer",
        "disabled:opacity-50",
      )}
    >
      {loading && <LuLoader className={cn("w-3", "h-3", "animate-spin")} />}
      {buttonText}
    </button>
  </motion.div>
);
