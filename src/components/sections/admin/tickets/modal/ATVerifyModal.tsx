"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuShieldCheck,
  LuX,
  LuTicket,
  LuTriangleAlert,
  LuUserCheck,
  LuHistory,
  LuSearch,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";

// TypeScript Types
type VerificationStatus = "Idle" | "Valid" | "Used" | "Cancelled" | "Invalid";

interface AdminTicketVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ResultCardProps {
  type: VerificationStatus;
  onReset: () => void;
}

interface ResultConfig {
  bg: string;
  icon: IconType;
  title: string;
  desc: string;
  btn: string;
}

export const AdminTicketVerifyModal: React.FC<AdminTicketVerifyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [ticketCode, setTicketCode] = useState("");
  const [status, setStatus] = useState<VerificationStatus>("Idle");
  const [isVerifying, setIsVerifying] = useState(false);

  // Reset state on close
  const handleClose = () => {
    setStatus("Idle");
    setTicketCode("");
    onClose();
  };

  const handleVerify = () => {
    setIsVerifying(true);
    // Simulate verification
    setTimeout(() => {
      // Mock logic - in real app, this would call an API
      if (ticketCode.includes("VALID")) {
        setStatus("Valid");
      } else if (ticketCode.includes("USED")) {
        setStatus("Used");
      } else if (ticketCode.includes("CANCEL")) {
        setStatus("Cancelled");
      } else if (ticketCode) {
        setStatus("Invalid");
      } else {
        setStatus("Valid"); // Default for demo
      }
      setIsVerifying(false);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "z-250",
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
            className={cn(
              "absolute",
              "inset-0",
              "bg-slate-950/80",
              "backdrop-blur-md",
            )}
            onClick={handleClose}
          />

          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative",
              "w-full",
              "max-w-md",
              "bg-white",
              "rounded-[3rem]",
              "shadow-2xl",
              "overflow-hidden",
            )}
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "p-8",
                "pb-4",
                "flex",
                "justify-between",
                "items-center",
              )}
            >
              <div
                className={cn(
                  "flex",
                  "items-center",
                  "gap-2",
                  "text-slate-400",
                )}
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <LuShieldCheck className={cn("w-4", "h-4")} />
                </motion.div>
                <span
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "uppercase",
                    "tracking-[0.2em]",
                  )}
                >
                  Gate Protocol v1.0
                </span>
              </div>
              <motion.button
                onClick={handleClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className={cn("p-2", "hover:bg-slate-100", "rounded-full")}
              >
                <LuX className={cn("w-5", "h-5")} />
              </motion.button>
            </motion.div>

            <div className={cn("p-8", "pt-0", "space-y-6")}>
              <AnimatePresence mode="wait">
                {status === "Idle" ? (
                  /* --- 1. TicketCodeInput Section --- */
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className={cn("space-y-6")}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className={cn("text-center")}
                    >
                      <h2
                        className={cn(
                          "text-3xl",
                          "font-black",
                          "text-slate-900",
                          "tracking-tighter",
                          "uppercase",
                        )}
                      >
                        Manual Verify
                      </h2>
                      <p
                        className={cn(
                          "text-[11px]",
                          "font-bold",
                          "text-slate-400",
                          "uppercase",
                          "mt-2",
                        )}
                      >
                        Enter Invite Code or Ticket Reference
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className={cn("relative", "group")}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 2,
                        }}
                        className={cn(
                          "absolute",
                          "left-5",
                          "top-1/2",
                          "-translate-y-1/2",
                        )}
                      >
                        <LuSearch
                          className={cn(
                            "w-5",
                            "h-5",
                            "text-slate-300",
                            "group-focus-within:text-primary",
                            "transition-colors",
                          )}
                        />
                      </motion.div>
                      <input
                        autoFocus
                        type="text"
                        value={ticketCode}
                        onChange={(e) =>
                          setTicketCode(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && ticketCode) {
                            handleVerify();
                          }
                        }}
                        placeholder="E.G. DIU-882-XY"
                        className={cn(
                          "w-full",
                          "bg-slate-50",
                          "border-2",
                          "border-slate-100",
                          "p-6",
                          "pl-14",
                          "rounded-3xl",
                          "text-lg",
                          "font-black",
                          "tracking-widest",
                          "placeholder:text-slate-200",
                          "outline-none",
                          "focus:border-slate-900",
                          "transition-all",
                        )}
                      />
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      onClick={handleVerify}
                      disabled={isVerifying || !ticketCode}
                      whileHover={
                        !isVerifying && ticketCode ? { scale: 1.02 } : {}
                      }
                      whileTap={
                        !isVerifying && ticketCode ? { scale: 0.98 } : {}
                      }
                      className={cn(
                        "w-full",
                        "py-6",
                        "bg-slate-900",
                        "text-white",
                        "rounded-3xl",
                        "text-xs",
                        "font-black",
                        "uppercase",
                        "tracking-[0.2em]",
                        "hover:bg-primary",
                        "hover:text-slate-900",
                        "transition-all",
                        "shadow-xl",
                        "shadow-slate-900/20",
                        "flex",
                        "items-center",
                        "justify-center",
                        "gap-3",
                        "disabled:opacity-50",
                        "disabled:cursor-not-allowed",
                      )}
                    >
                      {isVerifying ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          >
                            <LuShieldCheck className={cn("w-4", "h-4")} />
                          </motion.div>
                          Verifying...
                        </>
                      ) : (
                        "Confirm Entry Credentials"
                      )}
                    </motion.button>
                  </motion.div>
                ) : (
                  /* --- 2. ResultCard Section --- */
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className={cn("space-y-6")}
                  >
                    <ResultCard
                      type={status}
                      onReset={() => {
                        setStatus("Idle");
                        setTicketCode("");
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* --- Result Card Sub-Component --- */
const ResultCard: React.FC<ResultCardProps> = ({ type, onReset }) => {
  const configs: Record<Exclude<VerificationStatus, "Idle">, ResultConfig> = {
    Valid: {
      bg: "bg-emerald-500",
      icon: LuUserCheck,
      title: "Valid Ticket",
      desc: "Identity Confirmed. Access Granted.",
      btn: "Complete Check-in",
    },
    Used: {
      bg: "bg-amber-500",
      icon: LuHistory,
      title: "Already Used",
      desc: "Ticket was scanned at 09:41 AM.",
      btn: "Try Different Code",
    },
    Cancelled: {
      bg: "bg-rose-600",
      icon: LuTriangleAlert,
      title: "Cancelled Ticket",
      desc: "Revoked. Check Admin Audit Logs.",
      btn: "Deny Entry",
    },
    Invalid: {
      bg: "bg-slate-900",
      icon: LuTicket,
      title: "Invalid Ticket",
      desc: "Code not found in manifest.",
      btn: "Retry Input",
    },
  };

  const config = configs[type as Exclude<VerificationStatus, "Idle">];
  const Icon = config.icon;

  return (
    <div className={cn("space-y-6")}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn(
          "p-10",
          "rounded-[2.5rem]",
          config.bg,
          "text-white",
          "text-center",
          "shadow-2xl",
        )}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          className={cn(
            "w-20",
            "h-20",
            "bg-white/20",
            "rounded-[2rem]",
            "flex",
            "items-center",
            "justify-center",
            "mx-auto",
            "mb-6",
          )}
        >
          <motion.div
            animate={
              type === "Valid"
                ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0],
                  }
                : {}
            }
            transition={{
              duration: 0.5,
              repeat: type === "Valid" ? Infinity : 0,
              repeatDelay: 1,
            }}
          >
            <Icon className={cn("w-10", "h-10", "text-white")} />
          </motion.div>
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "text-3xl",
            "font-black",
            "uppercase",
            "tracking-tighter",
            "mb-2",
          )}
        >
          {config.title}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={cn(
            "text-xs",
            "font-bold",
            "uppercase",
            "tracking-widest",
            "opacity-80",
          )}
        >
          {config.desc}
        </motion.p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={onReset}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full",
          "py-5",
          "bg-slate-100",
          "text-slate-900",
          "rounded-2xl",
          "text-[10px]",
          "font-black",
          "uppercase",
          "tracking-widest",
          "hover:bg-slate-200",
          "transition-colors",
        )}
      >
        {config.btn}
      </motion.button>
    </div>
  );
};

// Export types
export type {
  AdminTicketVerifyModalProps,
  VerificationStatus,
  ResultCardProps,
  ResultConfig,
};