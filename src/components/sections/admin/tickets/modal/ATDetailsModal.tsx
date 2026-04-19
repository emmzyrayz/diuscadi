"use client";
// modal/ATDetailsModal.tsx
// Read-only ticket detail view using AdminTicket.
// Save PDF calls GET /api/tickets/[id]/pdf via downloadPdf() from shareUtils.
// Note: the PDF route uses the registration's MongoDB _id (ticket.id), not the inviteCode.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuCopy,
  LuDownload,
  LuUser,
  LuCalendar,
  LuQrCode,
  LuCircleCheck,
  LuInfo,
  LuLoader,
} from "react-icons/lu";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { downloadPdf } from "@/lib/shareUtils";
import { useAuth } from "@/context/AuthContext";
import type { AdminTicket } from "@/app/admin/tickets/page";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ticket: AdminTicket;
}

export const AdminTicketDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  ticket,
}) => {
  const { token } = useAuth();
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ticket.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePdf = async () => {
    if (downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      await downloadPdf(
        {
          type: "ticket",
          id: ticket.id,
          filename: `diuscadi-ticket-${ticket.inviteCode}.pdf`,
        },
        token ?? undefined,
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  const STATUS_STYLE: Record<string, string> = {
    registered: "bg-blue-50 text-blue-600",
    "checked-in": "bg-emerald-50 text-emerald-600",
    cancelled: "bg-rose-50 text-rose-600",
    expired: "bg-muted text-muted-foreground",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "z-[200]",
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
              "max-w-2xl",
              "bg-background",
              "rounded-[3.5rem]",
              "shadow-2xl",
              "overflow-hidden",
              "flex",
              "flex-col",
              "max-h-[90vh]",
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "px-8",
                "py-6",
                "border-b",
                "border-border",
                "flex",
                "items-center",
                "justify-between",
              )}
            >
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
                  Ticket Dossier
                </h3>
                <p
                  className={cn(
                    "text-[10px]",
                    "font-bold",
                    "text-muted-foreground",
                    "uppercase",
                    "tracking-widest",
                    "mt-0.5",
                  )}
                >
                  Admin View
                </p>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "p-2",
                  "hover:bg-muted",
                  "rounded-2xl",
                  "text-muted-foreground",
                  "transition-colors",
                  "cursor-pointer",
                )}
              >
                <LuX className={cn("w-5", "h-5")} />
              </button>
            </div>

            <div
              className={cn("flex-1", "overflow-y-auto", "p-8", "space-y-8")}
            >
              {/* QR + code */}
              <div
                className={cn(
                  "flex",
                  "flex-col",
                  "sm:flex-row",
                  "items-center",
                  "gap-6",
                  "p-6",
                  "bg-muted",
                  "rounded-3xl",
                )}
              >
                <div
                  className={cn(
                    "w-24",
                    "h-24",
                    "bg-background",
                    "rounded-2xl",
                    "border",
                    "border-border",
                    "flex",
                    "items-center",
                    "justify-center",
                    "shrink-0",
                  )}
                >
                  <LuQrCode className={cn("w-12", "h-12", "text-foreground")} />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p
                      className={cn(
                        "text-[9px]",
                        "font-black",
                        "text-muted-foreground",
                        "uppercase",
                        "tracking-widest",
                        "mb-1",
                      )}
                    >
                      Ticket Code
                    </p>
                    <p
                      className={cn(
                        "text-lg",
                        "font-black",
                        "text-foreground",
                        "font-mono",
                        "tracking-tighter",
                      )}
                    >
                      {ticket.inviteCode}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* Copy */}
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "flex",
                        "items-center",
                        "gap-2",
                        "px-4",
                        "py-2",
                        "bg-background",
                        "border",
                        "border-border",
                        "rounded-xl",
                        "text-[10px]",
                        "font-black",
                        "uppercase",
                        "tracking-tight",
                        "hover:border-foreground",
                        "transition-all",
                        "cursor-pointer",
                      )}
                    >
                      <AnimatePresence mode="wait">
                        {copied ? (
                          <motion.div
                            key="c"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="flex items-center gap-1.5"
                          >
                            <LuCircleCheck className="w-3.5 h-3.5 text-emerald-500" />{" "}
                            Copied
                          </motion.div>
                        ) : (
                          <motion.div
                            key="u"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="flex items-center gap-1.5"
                          >
                            <LuCopy className="w-3.5 h-3.5" /> Copy
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>

                    {/* Save PDF — now live */}
                    <button
                      onClick={handleSavePdf}
                      disabled={downloadingPdf}
                      className={cn(
                        "flex",
                        "items-center",
                        "gap-2",
                        "px-4",
                        "py-2",
                        "bg-foreground",
                        "text-background",
                        "rounded-xl",
                        "text-[10px]",
                        "font-black",
                        "uppercase",
                        "tracking-tight",
                        "hover:bg-primary",
                        "hover:text-foreground",
                        "transition-all",
                        "cursor-pointer",
                        "disabled:opacity-50",
                        "disabled:cursor-not-allowed",
                      )}
                    >
                      {downloadingPdf ? (
                        <LuLoader className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LuDownload className="w-3.5 h-3.5" />
                      )}
                      {downloadingPdf ? "Generating…" : "Save PDF"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status row */}
              <div
                className={cn("grid", "grid-cols-2", "sm:grid-cols-3", "gap-4")}
              >
                <StatBlock label="Status" value={ticket.status} highlight />
                <StatBlock
                  label="Issued"
                  value={new Date(ticket.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                />
                <StatBlock
                  label="Check-in"
                  value={
                    ticket.checkedInAt
                      ? new Date(ticket.checkedInAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"
                  }
                />
              </div>

              {/* Owner */}
              <div className="space-y-3">
                <p
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "text-muted-foreground",
                    "uppercase",
                    "tracking-[0.2em]",
                    "flex",
                    "items-center",
                    "gap-2",
                  )}
                >
                  <LuUser className="w-3 h-3" /> Owner
                </p>
                <div
                  className={cn(
                    "p-5",
                    "bg-muted",
                    "rounded-2xl",
                    "border",
                    "border-border",
                    "flex",
                    "items-center",
                    "gap-4",
                  )}
                >
                  <div
                    className={cn(
                      "w-12",
                      "h-12",
                      "rounded-full",
                      "bg-slate-200",
                      "border-2",
                      "border-background",
                      "shadow-sm",
                      "overflow-hidden",
                      "flex",
                      "items-center",
                      "justify-center",
                      "font-black",
                      "text-muted-foreground",
                    )}
                  >
                    {ticket.userAvatar ? (
                      <Image
                        src={ticket.userAvatar}
                        alt={ticket.userName}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{ticket.userName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p
                      className={cn("text-sm", "font-black", "text-foreground")}
                    >
                      {ticket.userName}
                    </p>
                    <p
                      className={cn(
                        "text-[10px]",
                        "font-bold",
                        "text-muted-foreground",
                      )}
                    >
                      {ticket.userEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event */}
              <div className="space-y-3">
                <p
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "text-muted-foreground",
                    "uppercase",
                    "tracking-[0.2em]",
                    "flex",
                    "items-center",
                    "gap-2",
                  )}
                >
                  <LuCalendar className="w-3 h-3" /> Event
                </p>
                <div
                  className={cn(
                    "p-5",
                    "bg-muted",
                    "rounded-2xl",
                    "border",
                    "border-border",
                    "flex",
                    "items-center",
                    "gap-4",
                  )}
                >
                  <div
                    className={cn(
                      "w-12",
                      "h-12",
                      "rounded-xl",
                      "bg-foreground",
                      "flex",
                      "items-center",
                      "justify-center",
                      "text-primary",
                      "shrink-0",
                    )}
                  >
                    <LuCalendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p
                      className={cn("text-sm", "font-black", "text-foreground")}
                    >
                      {ticket.eventTitle}
                    </p>
                    <p
                      className={cn(
                        "text-[10px]",
                        "font-bold",
                        "text-muted-foreground",
                        "uppercase",
                      )}
                    >
                      {new Date(ticket.eventDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity info banner */}
              <div
                className={cn(
                  "flex",
                  "items-start",
                  "gap-3",
                  "p-4",
                  "bg-amber-50",
                  "border",
                  "border-amber-100",
                  "rounded-2xl",
                )}
              >
                <LuInfo className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className={cn("text-[11px]", "font-bold", "text-amber-700")}>
                  Verification ledger coming soon.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const StatBlock: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ label, value, highlight }) => (
  <div className="space-y-1">
    <p
      className={cn(
        "text-[8px]",
        "font-black",
        "text-muted-foreground",
        "uppercase",
        "tracking-widest",
      )}
    >
      {label}
    </p>
    <p
      className={cn(
        "text-[11px]",
        "font-black",
        "uppercase",
        "tracking-tight",
        highlight ? "text-blue-600" : "text-foreground",
      )}
    >
      {value}
    </p>
  </div>
);
