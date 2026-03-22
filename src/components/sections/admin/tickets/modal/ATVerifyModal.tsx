"use client";
// modal/ATVerifyModal.tsx
// Standalone manual verification modal used by event staff.
// Calls POST /api/events/check-in with the entered invite code.
// Used separately from TicketScannerModal — this one shows a richer
// result card with check-in time from the API response.

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
  LuLoader,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { IconType } from "react-icons";

type VerificationStatus =
  | "Idle"
  | "Valid"
  | "Used"
  | "Cancelled"
  | "Invalid"
  | "Error";

interface AdminTicketVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ResultConfig {
  bg: string;
  Icon: IconType; // capitalised so it can be used as JSX
  title: string;
  desc: string;
  btn: string;
}

export const AdminTicketVerifyModal: React.FC<AdminTicketVerifyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { token } = useAuth();
  const [ticketCode, setTicketCode] = useState("");
  const [status, setStatus] = useState<VerificationStatus>("Idle");
  const [isVerifying, setIsVerifying] = useState(false);
  const [checkedInTime, setCheckedInTime] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleClose = () => {
    setStatus("Idle");
    setTicketCode("");
    setCheckedInTime(null);
    setErrorMsg("");
    onClose();
  };

  const handleVerify = async () => {
    if (!ticketCode.trim() || !token) return;
    setIsVerifying(true);
    try {
      const res = await fetch("/api/events/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: ticketCode.trim().toUpperCase() }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("Valid");
        onSuccess?.();
      } else if (res.status === 409) {
        // Already checked in — API may return checkedInAt
        setStatus("Used");
        if (data.checkedInAt) {
          setCheckedInTime(
            new Date(data.checkedInAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
        }
      } else if (res.status === 400 || res.status === 404) {
        setStatus("Invalid");
        setErrorMsg(data.error ?? "Code not found in manifest");
      } else if (res.status === 403) {
        setStatus("Cancelled");
        setErrorMsg(data.error ?? "Ticket has been revoked");
      } else {
        setStatus("Error");
        setErrorMsg(data.error ?? "Verification failed");
      }
    } catch {
      setStatus("Error");
      setErrorMsg("Network error — check connection");
    } finally {
      setIsVerifying(false);
    }
  };

  const CONFIGS: Record<Exclude<VerificationStatus, "Idle">, ResultConfig> = {
    Valid: {
      bg: "bg-emerald-500",
      Icon: LuUserCheck,
      title: "Valid Ticket",
      desc: "Identity Confirmed. Access Granted.",
      btn: "Complete Check-in",
    },
    Used: {
      bg: "bg-amber-500",
      Icon: LuHistory,
      title: "Already Used",
      desc: checkedInTime
        ? `Ticket was scanned at ${checkedInTime}.`
        : "Ticket was already scanned.",
      btn: "Try Different Code",
    },
    Cancelled: {
      bg: "bg-rose-600",
      Icon: LuTriangleAlert,
      title: "Cancelled Ticket",
      desc: errorMsg || "Revoked. Check Admin Audit Logs.",
      btn: "Deny Entry",
    },
    Invalid: {
      bg: "bg-foreground",
      Icon: LuTicket,
      title: "Invalid Ticket",
      desc: errorMsg || "Code not found in manifest.",
      btn: "Retry Input",
    },
    Error: {
      bg: "bg-rose-600",
      Icon: LuTriangleAlert,
      title: "Error",
      desc: errorMsg || "Verification failed.",
      btn: "Retry",
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "z-[250]",
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
                  "text-muted-foreground",
                )}
              >
                <LuShieldCheck className={cn("w-4", "h-4")} />
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
                className={cn(
                  "p-2",
                  "hover:bg-muted",
                  "rounded-full",
                  "cursor-pointer",
                )}
              >
                <LuX className={cn("w-5", "h-5")} />
              </motion.button>
            </div>

            <div className={cn("p-8", "pt-0", "space-y-6")}>
              <AnimatePresence mode="wait">
                {status === "Idle" ? (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className={cn("space-y-6")}
                  >
                    <div className={cn("text-center")}>
                      <h2
                        className={cn(
                          "text-3xl",
                          "font-black",
                          "text-foreground",
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
                          "text-muted-foreground",
                          "uppercase",
                          "mt-2",
                        )}
                      >
                        Enter Invite Code or Ticket Reference
                      </p>
                    </div>

                    <div className={cn("relative", "group")}>
                      <LuSearch
                        className={cn(
                          "absolute",
                          "left-5",
                          "top-1/2",
                          "-translate-y-1/2",
                          "w-5",
                          "h-5",
                          "text-slate-300",
                          "group-focus-within:text-primary",
                          "transition-colors",
                        )}
                      />
                      <input
                        autoFocus
                        type="text"
                        value={ticketCode}
                        onChange={(e) =>
                          setTicketCode(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && ticketCode) handleVerify();
                        }}
                        placeholder="E.G. DIU-882-XY"
                        className={cn(
                          "w-full",
                          "bg-muted",
                          "border-2",
                          "border-border",
                          "p-6",
                          "pl-14",
                          "rounded-3xl",
                          "text-lg",
                          "font-black",
                          "tracking-widest",
                          "placeholder:text-slate-200",
                          "outline-none",
                          "focus:border-foreground",
                          "transition-all",
                        )}
                      />
                    </div>

                    <motion.button
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
                        "bg-foreground",
                        "text-background",
                        "rounded-3xl",
                        "text-xs",
                        "font-black",
                        "uppercase",
                        "tracking-[0.2em]",
                        "hover:bg-primary",
                        "hover:text-foreground",
                        "transition-all",
                        "shadow-xl",
                        "shadow-foreground/20",
                        "flex",
                        "items-center",
                        "justify-center",
                        "gap-3",
                        "disabled:opacity-50",
                        "disabled:cursor-not-allowed",
                        "cursor-pointer",
                      )}
                    >
                      {isVerifying ? (
                        <>
                          <LuLoader
                            className={cn("w-4", "h-4", "animate-spin")}
                          />{" "}
                          Verifying…
                        </>
                      ) : (
                        "Confirm Entry Credentials"
                      )}
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className={cn("space-y-6")}
                  >
                    <ResultCard
                      config={CONFIGS[status]}
                      status={status}
                      onReset={() => {
                        setStatus("Idle");
                        setTicketCode("");
                        setCheckedInTime(null);
                        setErrorMsg("");
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

// ResultCard receives the resolved config — no need to index inside JSX
const ResultCard: React.FC<{
  config: ResultConfig;
  status: VerificationStatus;
  onReset: () => void;
}> = ({ config, status, onReset }) => {
  // Icon is already capitalised in ResultConfig — safe to use as JSX
  const { Icon } = config;

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
          "text-background",
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
            "bg-background/20",
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
              status === "Valid"
                ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }
                : {}
            }
            transition={{
              duration: 0.5,
              repeat: status === "Valid" ? Infinity : 0,
              repeatDelay: 1,
            }}
          >
            <Icon className={cn("w-10", "h-10", "text-background")} />
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
        onClick={onReset}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full",
          "py-5",
          "text-foreground",
          "rounded-2xl",
          "text-[10px]",
          "font-black",
          "uppercase",
          "tracking-widest",
          "hover:bg-slate-200",
          "transition-colors",
          "cursor-pointer",
        )}
      >
        {config.btn}
      </motion.button>
    </div>
  );
};

export type { AdminTicketVerifyModalProps, VerificationStatus, ResultConfig };
