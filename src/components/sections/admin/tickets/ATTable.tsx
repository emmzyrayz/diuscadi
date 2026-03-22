"use client";
// ATTable.tsx
// Uses AdminTicket from the page — no MOCK_TICKETS, no fake avatars.
// Verify button calls POST /api/events/check-in.
// Cancel button opens ATCancelModal via Portal.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuTicket,
  LuCalendar,
  LuEllipsis,
  LuShieldCheck,
  LuCircleX,
  LuEye,
  LuCircleCheck,
  LuUser,
  LuExternalLink,
} from "react-icons/lu";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Portal } from "@/components/ui/Portal";
import { AdminTicketCancelModal } from "./modal/ATCancelModal";
import { AdminTicketDetailsModal } from "./modal/ATDetailsModal";
import type { AdminTicket } from "@/app/admin/tickets/page";

interface TableProps {
  tickets: AdminTicket[];
  onMutation?: () => void;
}

export const AdminTicketsTable: React.FC<TableProps> = ({
  tickets,
  onMutation,
}) => (
  <div className="w-full bg-background border-2 border-border rounded-[2.5rem] overflow-hidden shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1100px]">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            {[
              "Attendee",
              "Ticket Identity",
              "Event Context",
              "Usage Status",
              "Verification",
            ].map((h, i) => (
              <th
                key={h}
                className={cn(
                  "py-6",
                  "text-[10px]",
                  "font-black",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-[0.2em]",
                  i === 0
                    ? "pl-10 pr-6"
                    : i === 4
                      ? "pr-10 pl-6 text-right"
                      : "px-6",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {tickets.map((ticket) => (
            <AdminTicketRow
              key={ticket.id}
              ticket={ticket}
              onMutation={onMutation}
            />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const AdminTicketRow: React.FC<{
  ticket: AdminTicket;
  onMutation?: () => void;
}> = ({ ticket, onMutation }) => {
  const { token } = useAuth();
  const isInvalid =
    ticket.status === "cancelled" || ticket.status === "expired";
  const isUpcoming = ticket.status === "upcoming";

  const [showMenu, setShowMenu] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!token || !isUpcoming) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/events/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: ticket.inviteCode }),
      });
      if (res.ok) onMutation?.();
    } catch {
      // silently fail — status stays unchanged
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = async (reason: string) => {
    if (!token) return;
    const res = await fetch(`/api/admin/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "cancel", reason }),
    });
    if (res.ok) {
      setShowCancel(false);
      onMutation?.();
    }
  };

  const STATUS_STYLES: Record<string, string> = {
    upcoming: "bg-emerald-50 text-emerald-600",
    used: "bg-slate-200 text-muted-foreground",
    cancelled: "bg-rose-50 text-rose-600",
    expired: "bg-muted text-muted-foreground",
  };

  const DOT_STYLES: Record<string, string> = {
    upcoming: "bg-emerald-500",
    used: "bg-slate-400",
    cancelled: "bg-rose-500",
    expired: "bg-slate-300",
  };

  return (
    <>
      <tr
        className={cn(
          "group",
          "transition-all",
          "hover:bg-muted/50",
          isInvalid && "opacity-60",
        )}
      >
        {/* Attendee */}
        <td className="pl-10 pr-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden border border-border flex items-center justify-center text-sm font-black text-muted-foreground shrink-0">
              {ticket.userAvatar ? (
                <Image
                  src={ticket.userAvatar}
                  alt=""
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{ticket.userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {ticket.userName}
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                {ticket.userEmail}
              </span>
            </div>
          </div>
        </td>

        {/* Ticket identity */}
        <td className="px-6 py-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <LuTicket className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-black text-foreground font-mono tracking-tighter">
                {ticket.inviteCode}
              </span>
            </div>
          </div>
        </td>

        {/* Event context */}
        <td className="px-6 py-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-700 line-clamp-1">
              {ticket.eventTitle}
            </span>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <LuCalendar className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {new Date(ticket.eventDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </td>

        {/* Status */}
        <td className="px-6 py-6">
          <span
            className={cn(
              "px-3",
              "py-1.5",
              "rounded-full",
              "text-[9px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "inline-flex",
              "items-center",
              "gap-2",
              STATUS_STYLES[ticket.status] ?? "bg-muted text-muted-foreground",
            )}
          >
            <div
              className={cn(
                "w-1.5",
                "h-1.5",
                "rounded-full",
                DOT_STYLES[ticket.status] ?? "bg-slate-300",
              )}
            />
            {ticket.status}
          </span>
        </td>

        {/* Actions */}
        <td className="pr-10 pl-6 py-6 text-right">
          <div className="flex items-center justify-end gap-2">
            {isUpcoming ? (
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="p-2.5 bg-foreground text-background rounded-xl hover:bg-primary hover:text-foreground transition-all shadow-lg shadow-foreground/10 disabled:opacity-50 cursor-pointer"
                title="Verify Entry"
              >
                {verifying ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <LuShieldCheck className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <LuShieldCheck className="w-4 h-4" />
                )}
              </button>
            ) : (
              <button
                disabled
                className="p-2.5 bg-muted text-slate-300 rounded-xl cursor-not-allowed"
              >
                <LuCircleX className="w-4 h-4" />
              </button>
            )}

            {/* Overflow menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2.5 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <LuEllipsis className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                      className="absolute right-0 top-12 w-48 bg-background border border-border rounded-2xl shadow-2xl z-20 p-2"
                    >
                      <MenuItem
                        icon={LuEye}
                        label="View Details"
                        onClick={() => {
                          setShowMenu(false);
                          setShowDetails(true);
                        }}
                      />
                      {isUpcoming && (
                        <MenuItem
                          icon={LuCircleCheck}
                          label="Mark as Used"
                          onClick={() => {
                            setShowMenu(false);
                            handleVerify();
                          }}
                          color="text-emerald-600"
                        />
                      )}
                      {!isInvalid && (
                        <MenuItem
                          icon={LuCircleX}
                          label="Cancel Ticket"
                          onClick={() => {
                            setShowMenu(false);
                            setShowCancel(true);
                          }}
                          color="text-rose-600"
                        />
                      )}
                      <div className="h-px bg-muted my-1" />
                      <MenuItem
                        icon={LuUser}
                        label="View User"
                        onClick={() => setShowMenu(false)}
                      />
                      <MenuItem
                        icon={LuExternalLink}
                        label="View Event"
                        onClick={() => setShowMenu(false)}
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </td>
      </tr>

      {/* Modals via Portal */}
      <Portal>
        <AdminTicketDetailsModal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          ticket={ticket}
        />
      </Portal>

      <Portal>
        <AdminTicketCancelModal
          isOpen={showCancel}
          onClose={() => setShowCancel(false)}
          onConfirm={handleCancel}
          ticketCode={ticket.inviteCode}
          userName={ticket.userName}
        />
      </Portal>
    </>
  );
};

const MenuItem: React.FC<{
  icon: React.ElementType;
  label: string;
  color?: string;
  onClick: () => void;
}> = ({ icon: Icon, label, color = "text-slate-600", onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full",
      "flex",
      "items-center",
      "gap-3",
      "px-3",
      "py-2.5",
      "rounded-xl",
      "hover:bg-muted",
      "transition-colors",
      "cursor-pointer",
      color,
    )}
  >
    <Icon className={cn("w-4", "h-4")} />
    <span
      className={cn("text-[10px]", "font-black", "uppercase", "tracking-tight")}
    >
      {label}
    </span>
  </button>
);
