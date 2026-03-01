"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuCopy,
  LuDownload,
  LuQrCode,
  LuUser,
  LuCalendar,
  LuMapPin,
  LuHistory,
  LuShieldCheck,
  LuActivity,
  LuCircleCheck,
} from "react-icons/lu";
import Image from "next/image";
import { cn } from "@/lib/utils";

// TypeScript Interfaces
interface TicketData {
  ticketCode: string;
  status: "Upcoming" | "Used" | "Cancelled";
  ticketType: string;
  issuedDate: string;
  checkInTime?: string;
  ownerName: string;
  ownerAvatar: string;
  ownerEmail: string;
  eventName: string;
  eventLocation: string;
  activities: ActivityLog[];
}

interface ActivityLog {
  id: string;
  time: string;
  action: string;
  actor: string;
  success?: boolean;
}

interface TicketDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TicketData;
}

interface StatBlockProps {
  label: string;
  value: string;
  highlight?: boolean;
  delay?: number;
}

interface ActivityRowProps {
  time: string;
  action: string;
  actor: string;
  success?: boolean;
  delay?: number;
}

export const AdminTicketDetailsModal: React.FC<TicketDetailsProps> = ({
  isOpen,
  onClose,
  ticket,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ticket.ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    console.log("Downloading ticket:", ticket.ticketCode);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "z-200",
            "flex",
            "items-center",
            "justify-center",
            "p-4",
          )}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={cn(
              "absolute",
              "inset-0",
              "bg-slate-950/60",
              "backdrop-blur-md",
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
              "max-w-4xl",
              "bg-white",
              "rounded-[3.5rem]",
              "shadow-2xl",
              "overflow-hidden",
              "flex",
              "flex-col",
              "md:flex-row",
              "max-h-[90vh]",
            )}
          >
            {/* 1. TicketQRCodeSection (Left Sidebar) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "w-full",
                "md:w-[320px]",
                "bg-slate-50",
                "p-10",
                "border-r",
                "border-slate-100",
                "flex",
                "flex-col",
                "items-center",
              )}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "w-full",
                  "aspect-square",
                  "bg-white",
                  "rounded-3xl",
                  "p-6",
                  "shadow-sm",
                  "border",
                  "border-slate-200",
                  "mb-6",
                  "group",
                  "relative",
                )}
              >
                <div
                  className={cn(
                    "w-full",
                    "h-full",
                    "bg-slate-100",
                    "rounded-xl",
                    "flex",
                    "items-center",
                    "justify-center",
                    "overflow-hidden",
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
                    <LuQrCode
                      className={cn("w-32", "h-32", "text-slate-900")}
                    />
                  </motion.div>
                </div>
              </motion.div>

              <div className={cn("text-center", "space-y-4", "w-full")}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p
                    className={cn(
                      "text-[10px]",
                      "font-black",
                      "text-slate-400",
                      "uppercase",
                      "tracking-widest",
                      "mb-1",
                    )}
                  >
                    Pass Identity
                  </p>
                  <h4
                    className={cn(
                      "text-lg",
                      "font-black",
                      "text-slate-900",
                      "font-mono",
                      "tracking-tighter",
                      "uppercase",
                    )}
                  >
                    {ticket.ticketCode}
                  </h4>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={cn("flex", "gap-2")}
                >
                  <motion.button
                    onClick={handleCopy}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex-1",
                      "flex",
                      "items-center",
                      "justify-center",
                      "gap-2",
                      "py-3",
                      "bg-white",
                      "border",
                      "border-slate-200",
                      "rounded-xl",
                      "text-[10px]",
                      "font-black",
                      "uppercase",
                      "tracking-tight",
                      "hover:border-slate-900",
                      "transition-all",
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          className={cn("flex", "items-center", "gap-2")}
                        >
                          <LuCircleCheck
                            className={cn("w-3.5", "h-3.5", "text-emerald-500")}
                          />
                          Copied
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={cn("flex", "items-center", "gap-2")}
                        >
                          <LuCopy className={cn("w-3.5", "h-3.5")} /> Copy
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  <motion.button
                    onClick={handleDownload}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex-1",
                      "flex",
                      "items-center",
                      "justify-center",
                      "gap-2",
                      "py-3",
                      "bg-slate-900",
                      "text-white",
                      "rounded-xl",
                      "text-[10px]",
                      "font-black",
                      "uppercase",
                      "tracking-tight",
                      "hover:bg-primary",
                      "hover:text-slate-900",
                      "transition-all",
                    )}
                  >
                    <LuDownload className={cn("w-3.5", "h-3.5")} /> Save
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Content Area */}
            <div className={cn("flex-1", "overflow-y-auto")}>
              <div className={cn("p-10", "space-y-10")}>
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={cn("flex", "justify-between", "items-start")}
                >
                  <div className={cn("space-y-1")}>
                    <h3
                      className={cn(
                        "text-2xl",
                        "font-black",
                        "text-slate-900",
                        "uppercase",
                        "tracking-tighter",
                      )}
                    >
                      Ticket Dossier
                    </h3>
                    <p
                      className={cn(
                        "text-xs",
                        "font-bold",
                        "text-slate-400",
                        "uppercase",
                        "tracking-widest",
                      )}
                    >
                      Administrative Audit View
                    </p>
                  </div>
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "p-2",
                      "hover:bg-slate-100",
                      "rounded-full",
                      "transition-colors",
                    )}
                  >
                    <LuX className={cn("w-6", "h-6", "text-slate-300")} />
                  </motion.button>
                </motion.div>

                {/* 2. TicketInfoSection */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={cn(
                    "grid",
                    "grid-cols-2",
                    "lg:grid-cols-4",
                    "gap-4",
                  )}
                >
                  <StatBlock
                    label="Status"
                    value={ticket.status}
                    highlight
                    delay={0.1}
                  />
                  <StatBlock
                    label="Tier"
                    value={ticket.ticketType}
                    delay={0.15}
                  />
                  <StatBlock
                    label="Issued On"
                    value={ticket.issuedDate}
                    delay={0.2}
                  />
                  <StatBlock
                    label="Check-in"
                    value={ticket.checkInTime || "—"}
                    delay={0.25}
                  />
                </motion.section>

                <div
                  className={cn(
                    "grid",
                    "grid-cols-1",
                    "lg:grid-cols-2",
                    "gap-8",
                  )}
                >
                  {/* 3. UserInfoSection */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={cn("space-y-4")}
                  >
                    <h4
                      className={cn(
                        "text-[10px]",
                        "font-black",
                        "text-slate-400",
                        "uppercase",
                        "tracking-[0.2em]",
                        "flex",
                        "items-center",
                        "gap-2",
                      )}
                    >
                      <LuUser className={cn("w-3", "h-3")} /> Owner Details
                    </h4>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={cn(
                        "p-6",
                        "bg-slate-50",
                        "rounded-[2rem]",
                        "border",
                        "border-slate-100",
                        "flex",
                        "items-center",
                        "gap-4",
                      )}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={cn(
                          "w-12",
                          "h-12",
                          "rounded-full",
                          "bg-slate-200",
                          "border-2",
                          "border-white",
                          "shadow-sm",
                          "overflow-hidden",
                        )}
                      >
                        <Image
                          height={300}
                          width={500}
                          src={ticket.ownerAvatar}
                          alt={ticket.ownerName}
                          className={cn("w-full", "h-full", "object-cover")}
                        />
                      </motion.div>
                      <div>
                        <p
                          className={cn(
                            "text-sm",
                            "font-black",
                            "text-slate-900",
                          )}
                        >
                          {ticket.ownerName}
                        </p>
                        <p
                          className={cn(
                            "text-[10px]",
                            "font-bold",
                            "text-slate-400",
                            "lowercase",
                          )}
                        >
                          {ticket.ownerEmail}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* 4. EventInfoSection */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 }}
                    className={cn("space-y-4")}
                  >
                    <h4
                      className={cn(
                        "text-[10px]",
                        "font-black",
                        "text-slate-400",
                        "uppercase",
                        "tracking-[0.2em]",
                        "flex",
                        "items-center",
                        "gap-2",
                      )}
                    >
                      <LuActivity className={cn("w-3", "h-3")} /> Targeted Event
                    </h4>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={cn(
                        "p-6",
                        "bg-slate-50",
                        "rounded-[2rem]",
                        "border",
                        "border-slate-100",
                        "flex",
                        "items-center",
                        "gap-4",
                      )}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={cn(
                          "w-12",
                          "h-12",
                          "rounded-xl",
                          "bg-slate-900",
                          "flex",
                          "items-center",
                          "justify-center",
                          "text-primary",
                        )}
                      >
                        <LuCalendar className={cn("w-6", "h-6")} />
                      </motion.div>
                      <div>
                        <p
                          className={cn(
                            "text-sm",
                            "font-black",
                            "text-slate-900",
                          )}
                        >
                          {ticket.eventName}
                        </p>
                        <p
                          className={cn(
                            "text-[10px]",
                            "font-bold",
                            "text-slate-400",
                            "uppercase",
                            "tracking-widest",
                            "flex",
                            "items-center",
                            "gap-1",
                          )}
                        >
                          <LuMapPin className={cn("w-3", "h-3")} />{" "}
                          {ticket.eventLocation}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>

                {/* 5. TicketActivitySection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={cn("space-y-4")}
                >
                  <h4
                    className={cn(
                      "text-[10px]",
                      "font-black",
                      "text-slate-400",
                      "uppercase",
                      "tracking-[0.2em]",
                      "flex",
                      "items-center",
                      "gap-2",
                    )}
                  >
                    <LuHistory className={cn("w-3", "h-3")} /> Verification
                    Ledger
                  </h4>
                  <div
                    className={cn(
                      "border",
                      "border-slate-100",
                      "rounded-3xl",
                      "overflow-hidden",
                      "text-[10px]",
                      "font-bold",
                      "uppercase",
                      "tracking-widest",
                    )}
                  >
                    {ticket.activities.map((activity, index) => (
                      <ActivityRow
                        key={activity.id}
                        time={activity.time}
                        action={activity.action}
                        actor={activity.actor}
                        success={activity.success}
                        delay={0.55 + index * 0.05}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* --- Helpers --- */
const StatBlock: React.FC<StatBlockProps> = ({
  label,
  value,
  highlight = false,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={cn("flex", "flex-col", "gap-1")}
  >
    <span
      className={cn(
        "text-[8px]",
        "font-black",
        "text-slate-400",
        "uppercase",
        "tracking-widest",
      )}
    >
      {label}
    </span>
    <span
      className={cn(
        "text-[11px]",
        "font-black",
        "uppercase",
        "tracking-tight",
        highlight ? "text-blue-600" : "text-slate-900",
      )}
    >
      {value}
    </span>
  </motion.div>
);

const ActivityRow: React.FC<ActivityRowProps> = ({
  time,
  action,
  actor,
  success = false,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    whileHover={{ backgroundColor: "rgb(248 250 252)" }}
    className={cn(
      "flex",
      "items-center",
      "justify-between",
      "p-4",
      "bg-white",
      "border-b",
      "border-slate-50",
      "last:border-0",
    )}
  >
    <div className={cn("flex", "items-center", "gap-4")}>
      <span className={cn("text-slate-300", "w-24")}>{time}</span>
      <span className={success ? "text-emerald-600" : "text-slate-600"}>
        {action}
      </span>
    </div>
    <span
      className={cn(
        "text-slate-400",
        "bg-slate-50",
        "px-2",
        "py-1",
        "rounded-md",
      )}
    >
      {actor}
    </span>
  </motion.div>
);

// Export types
export type {
  TicketDetailsProps,
  TicketData,
  ActivityLog,
  StatBlockProps,
  ActivityRowProps,
};
