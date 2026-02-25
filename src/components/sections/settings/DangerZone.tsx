"use client";
import React, { useState } from "react";
import {
  LuTriangleAlert,
  LuLogOut,
  LuUserMinus,
  LuTrash2,
  LuShieldAlert,
  LuX,
  LuLock,
} from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../lib/utils";
import { IconType } from "react-icons";

// Define proper TypeScript types
interface DangerActionRowProps {
  icon: IconType;
  title: string;
  desc: string;
  buttonText: string;
  onAction: () => void;
  delay?: number;
}

interface DangerAction {
  id: string;
  icon: IconType;
  title: string;
  desc: string;
  buttonText: string;
  action: () => void;
}

export const DangerZoneSection = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const dangerActions: DangerAction[] = [
    {
      id: "logout",
      icon: LuLogOut,
      title: "Sign Out of Session",
      desc: "Safely end your current session on this device.",
      buttonText: "Logout",
      action: () => console.log("Logging out..."),
    },
    {
      id: "deactivate",
      icon: LuUserMinus,
      title: "Deactivate Account",
      desc: "Temporarily disable your profile. You can reactivate anytime.",
      buttonText: "Deactivate",
      action: () => console.log("Deactivating..."),
    },
  ];

  const handleDelete = () => {
    if (confirmText === "DELETE") {
      console.log("Deleting account...");
      setShowDeleteModal(false);
      setConfirmText("");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
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
      {/* Decorative Warning Background */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.08, 0.05],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
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

      {/* 1. Section Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "flex",
          "items-center",
          "gap-3",
          "mb-10",
          "relative",
          "z-10",
        )}
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "w-10",
            "h-10",
            "rounded-xl",
            "bg-white",
            "flex",
            "items-center",
            "justify-center",
            "text-rose-600",
            "border",
            "border-rose-100",
            "shadow-sm",
          )}
        >
          <motion.div
            animate={{
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <LuTriangleAlert className={cn("w-5", "h-5")} />
          </motion.div>
        </motion.div>
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
      </motion.div>

      {/* 2. Danger Actions List */}
      <div className="space-y-4">
        {/* Sign Out & Deactivate */}
        {dangerActions.map((action, index) => (
          <DangerActionRow
            key={action.id}
            icon={action.icon}
            title={action.title}
            desc={action.desc}
            buttonText={action.buttonText}
            onAction={action.action}
            delay={0.3 + index * 0.1}
          />
        ))}

        {/* Permanent Delete */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.01, x: 4 }}
          className={cn(
            "flex",
            "flex-col",
            "md:flex-row",
            "items-start",
            "md:items-center",
            "justify-between",
            "p-6",
            "bg-white",
            "border",
            "border-rose-100",
            "rounded-3xl",
            "gap-6",
          )}
        >
          <div className={cn("flex", "items-start", "gap-4")}>
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
                Delete Account
              </h4>
              <p
                className={cn(
                  "text-xs",
                  "font-medium",
                  "text-slate-500",
                  "mt-1",
                  "max-w-sm",
                )}
              >
                Permanently remove all your data, tickets, and professional
                history. This cannot be undone.
              </p>
            </div>
          </div>
          <motion.button
            onClick={() => setShowDeleteModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "w-full",
              "md:w-auto",
              "px-8",
              "py-4",
              "bg-rose-600",
              "text-white",
              "rounded-2xl",
              "font-black",
              "text-[10px]",
              "uppercase",
              "tracking-widest",
              "hover:bg-rose-700",
              "transition-colors",
              "shadow-lg",
              "shadow-rose-200",
            )}
          >
            Delete Permanently
          </motion.button>
        </motion.div>
      </div>

      {/* 3. Confirmation Modal (Portal) */}
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
                "bg-slate-900/60",
                "backdrop-blur-sm",
              )}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={cn(
                "relative",
                "w-full",
                "max-w-md",
                "bg-white",
                "rounded-[2.5rem]",
                "p-8",
                "shadow-2xl",
                "overflow-hidden",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  "flex",
                  "justify-between",
                  "items-center",
                  "mb-6",
                )}
              >
                <motion.div
                  animate={{
                    rotate: [0, -5, 5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
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
                </motion.div>
                <motion.button
                  onClick={() => setShowDeleteModal(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn("text-slate-400", "hover:text-slate-900")}
                >
                  <LuX className={cn("w-6", "h-6")} />
                </motion.button>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  "text-2xl",
                  "font-black",
                  "text-slate-900",
                  "tracking-tight",
                  "mb-2",
                )}
              >
                Are you absolutely sure?
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  "text-sm",
                  "text-slate-500",
                  "mb-8",
                  "leading-relaxed",
                )}
              >
                This action will delete the{" "}
                <span className={cn("font-bold", "text-slate-900")}>
                  DIUSCADI
                </span>{" "}
                account and all associated data. To confirm, please type{" "}
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
                below.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <div className="relative">
                  <LuLock
                    className={cn(
                      "absolute",
                      "left-4",
                      "top-1/2",
                      "-translate-y-1/2",
                      "text-slate-400",
                      "w-4",
                      "h-4",
                    )}
                  />
                  <motion.input
                    type="text"
                    placeholder="Type DELETE to confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    whileFocus={{ scale: 1.01 }}
                    className={cn(
                      "w-full",
                      "bg-slate-50",
                      "border",
                      "border-slate-100",
                      "rounded-xl",
                      "pl-12",
                      "pr-4",
                      "py-4",
                      "text-sm",
                      "font-bold",
                      "text-slate-900",
                      "outline-none",
                      "focus:border-rose-300",
                      "transition-all",
                    )}
                  />
                </div>

                <div className={cn("flex", "gap-3")}>
                  <motion.button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setConfirmText("");
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex-1",
                      "px-6",
                      "py-4",
                      "bg-slate-100",
                      "text-slate-600",
                      "rounded-2xl",
                      "font-black",
                      "text-[10px]",
                      "uppercase",
                      "tracking-widest",
                      "hover:bg-slate-200",
                      "transition-colors",
                    )}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleDelete}
                    disabled={confirmText !== "DELETE"}
                    whileHover={confirmText === "DELETE" ? { scale: 1.05 } : {}}
                    whileTap={confirmText === "DELETE" ? { scale: 0.95 } : {}}
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
                        ? "bg-rose-600 text-white shadow-xl shadow-rose-200 cursor-pointer"
                        : "bg-slate-100 text-slate-300 cursor-not-allowed",
                    )}
                  >
                    Confirm
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

/* --- Internal Row Helper --- */
const DangerActionRow = ({
  icon: Icon,
  title,
  desc,
  buttonText,
  onAction,
  delay = 0,
}: DangerActionRowProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ scale: 1.01, x: 4 }}
    className={cn(
      "flex",
      "flex-col",
      "md:flex-row",
      "items-start",
      "md:items-center",
      "justify-between",
      "p-6",
      "hover:bg-white",
      "rounded-3xl",
      "transition-all",
      "gap-6",
      "border",
      "border-transparent",
      "hover:border-rose-100",
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
          "shadow-sm",
          "shrink-0",
        )}
      >
        <Icon className={cn("w-5", "h-5")} />
      </motion.div>
      <div>
        <h4
          className={cn("text-sm", "font-black", "text-slate-900", "uppercase")}
        >
          {title}
        </h4>
        <p className={cn("text-xs", "font-medium", "text-slate-500", "mt-1")}>
          {desc}
        </p>
      </div>
    </div>
    <motion.button
      onClick={onAction}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "w-full",
        "md:w-auto",
        "px-6",
        "py-3",
        "border-2",
        "border-slate-200",
        "text-slate-600",
        "rounded-xl",
        "font-black",
        "text-[10px]",
        "uppercase",
        "tracking-widest",
        "hover:border-rose-200",
        "hover:text-rose-600",
        "transition-colors",
      )}
    >
      {buttonText}
    </motion.button>
  </motion.div>
);

// Export types for reuse
export type { DangerActionRowProps, DangerAction };