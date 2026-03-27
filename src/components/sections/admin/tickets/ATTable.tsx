"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={cn(
      "w-full",
      "bg-background",
      "px-4",
      "py-2",
      "border-2",
      "border-border",
      "rounded-[2.5rem]",
      "shadow-sm",
    )}
  >
    <div className="w-full">
      <table
        className={cn(
          "w-full",
          "text-left",
          "border-collapse",
          "min-w-[360px]",
        )}
      >
        <thead>
          <tr className={cn("bg-muted/50", "border-b", "border-border")}>
            {/* Attendee — always visible */}
            <th
              className={cn(
                "px-3",
                "md:px-4",
                "lg:px-6",
                "py-3",
                "lg:py-5",
                "text-[8px]",
                "md:text-[9px]",
                "lg:text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.1em]",
                "md:tracking-[0.15em]",
                "lg:tracking-[0.2em]",
              )}
            >
              Attendee
            </th>
            {/* Ticket Identity — md+ */}
            <th
              className={cn(
                "hidden",
                "md:table-cell",
                "px-4",
                "lg:px-6",
                "py-3",
                "lg:py-5",
                "text-[9px]",
                "lg:text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.15em]",
                "lg:tracking-[0.2em]",
              )}
            >
              Ticket Identity
            </th>
            {/* Event Context — lg+ */}
            <th
              className={cn(
                "hidden",
                "lg:table-cell",
                "px-4",
                "lg:px-6",
                "py-3",
                "lg:py-5",
                "text-[9px]",
                "lg:text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.15em]",
                "lg:tracking-[0.2em]",
              )}
            >
              Event Context
            </th>
            {/* Status — always visible */}
            <th
              className={cn(
                "px-2",
                "md:px-4",
                "lg:px-6",
                "py-3",
                "lg:py-5",
                "text-[8px]",
                "md:text-[9px]",
                "lg:text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.1em]",
                "md:tracking-[0.15em]",
                "lg:tracking-[0.2em]",
              )}
            >
              Status
            </th>
            {/* Actions */}
            <th
              className={cn(
                "pr-3",
                "md:pr-5",
                "lg:pr-8",
                "pl-2",
                "py-3",
                "lg:py-5",
                "text-[8px]",
                "md:text-[9px]",
                "lg:text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.1em]",
                "text-right",
              )}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className={cn("divide-y", "divide-slate-50")}>
          {tickets.map((ticket, index) => (
            <AdminTicketRow
              key={ticket.id}
              ticket={ticket}
              onMutation={onMutation}
              delay={0.1 + index * 0.04}
            />
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
);

const AdminTicketRow: React.FC<{
  ticket: AdminTicket;
  onMutation?: () => void;
  delay?: number;
}> = ({ ticket, onMutation, delay = 0 }) => {
  const { token } = useAuth();
  const router = useRouter();
  const isInvalid = ticket.status === "cancelled";
  const isUpcoming = ticket.status === "registered";

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
      /* silently fail */
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
    registered: "bg-emerald-50 text-emerald-600 border-emerald-100",
    "checked-in": "bg-slate-100 text-muted-foreground border-slate-200",
    cancelled: "bg-rose-50 text-rose-600 border-rose-100",
  };

  const DOT_STYLES: Record<string, string> = {
    registered: "bg-emerald-500",
    "checked-in": "bg-slate-400",
    cancelled: "bg-rose-500",
  };

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay }}
        className={cn(
          "group transition-all hover:bg-muted/50",
          isInvalid && "opacity-60",
        )}
      >
        {/* ── Attendee ── */}
        <td
          className={cn(
            "px-3",
            "md:px-4",
            "lg:px-6",
            "py-2.5",
            "md:py-3",
            "lg:py-5",
          )}
        >
          <div
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "md:gap-3",
              "lg:gap-4",
            )}
          >
            <div
              className={cn(
                "relative shrink-0 rounded-xl bg-muted overflow-hidden border border-border",
                "flex items-center justify-center font-black text-muted-foreground",
                "w-7 h-7 text-[10px] md:w-9 md:h-9 md:text-xs lg:w-10 lg:h-10 lg:text-sm",
              )}
            >
              {ticket.userAvatar ? (
                <Image
                  src={ticket.userAvatar}
                  alt=""
                  width={40}
                  height={40}
                  className={cn('w-full', 'h-full', 'object-cover')}
                />
              ) : (
                <span>{ticket.userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className={cn("flex", "flex-col", "min-w-0")}>
              <span
                className={cn(
                  "tracking-tight transition-colors truncate",
                  "text-[11px] md:text-xs lg:text-sm",
                  "font-semibold md:font-bold lg:font-black",
                  "text-foreground group-hover:text-primary",
                )}
              >
                {ticket.userName}
              </span>
              <span
                className={cn(
                  "text-[8px]",
                  "md:text-[9px]",
                  "font-medium",
                  "md:font-bold",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-widest",
                  "mt-0.5",
                  "truncate",
                )}
              >
                {ticket.userEmail}
              </span>
            </div>
          </div>
        </td>

        {/* ── Ticket Identity — md+ ── */}
        <td
          className={cn(
            "hidden",
            "md:table-cell",
            "px-4",
            "lg:px-6",
            "py-3",
            "lg:py-5",
          )}
        >
          <div className={cn("flex", "items-center", "gap-2")}>
            <LuTicket
              className={cn("w-3.5", "h-3.5", "text-muted-foreground")}
            />
            <span
              className={cn(
                "text-xs",
                "font-black",
                "text-foreground",
                "font-mono",
                "tracking-tighter",
              )}
            >
              {ticket.inviteCode}
            </span>
          </div>
        </td>

        {/* ── Event Context — lg+ ── */}
        <td
          className={cn(
            "hidden",
            "lg:table-cell",
            "px-4",
            "lg:px-6",
            "py-3",
            "lg:py-5",
          )}
        >
          <div className={cn("flex", "flex-col", "gap-1.5")}>
            <span
              className={cn(
                "text-xs",
                "font-bold",
                "text-slate-700",
                "line-clamp-1",
              )}
            >
              {ticket.eventTitle}
            </span>
            <div
              className={cn(
                "flex",
                "items-center",
                "gap-1.5",
                "text-muted-foreground",
              )}
            >
              <LuCalendar className={cn("w-3", "h-3")} />
              <span
                className={cn(
                  "text-[9px]",
                  "font-bold",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                {new Date(ticket.eventDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </td>

        {/* ── Status ── */}
        <td
          className={cn(
            "px-2",
            "md:px-4",
            "lg:px-6",
            "py-2.5",
            "md:py-3",
            "lg:py-5",
          )}
        >
          <span
            className={cn(
              "rounded-full border font-black uppercase inline-flex items-center",
              "px-1.5 py-0.5 text-[7px] tracking-[0.1em] gap-1",
              "md:px-3 md:py-1.5 md:text-[9px] md:tracking-widest md:gap-2",
              STATUS_STYLES[ticket.status] ??
                "bg-muted text-muted-foreground border-slate-200",
            )}
          >
            <div
              className={cn(
                "rounded-full shrink-0",
                "w-1 h-1 md:w-1.5 md:h-1.5",
                DOT_STYLES[ticket.status] ?? "bg-slate-300",
              )}
            />
            {ticket.status}
          </span>
        </td>

        {/* ── Actions — same pattern as AUTable: ellipsis button + absolute dropdown inside relative td ── */}
        <td
          className={cn(
            "pr-2",
            "md:pr-5",
            "lg:pr-8",
            "pl-1",
            "md:pl-2",
            "py-2.5",
            "md:py-3",
            "lg:py-5",
            "text-right",
            "relative",
          )}
        >
          {/* Verify / disabled button sits outside the dropdown anchor */}
          <div
            className={cn(
              "inline-flex",
              "items-center",
              "justify-end",
              "gap-1.5",
              "md:gap-2",
            )}
          >
            {isUpcoming ? (
              <button
                onClick={handleVerify}
                disabled={verifying}
                className={cn(
                  "p-1.5",
                  "md:p-2",
                  "bg-foreground",
                  "text-background",
                  "rounded-lg",
                  "md:rounded-xl",
                  "hover:bg-primary",
                  "hover:text-foreground",
                  "transition-all",
                  "shadow-md",
                  "shadow-foreground/10",
                  "disabled:opacity-50",
                  "cursor-pointer",
                )}
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
                    <LuShieldCheck
                      className={cn("w-3.5", "h-3.5", "md:w-4", "md:h-4")}
                    />
                  </motion.div>
                ) : (
                  <LuShieldCheck
                    className={cn("w-3.5", "h-3.5", "md:w-4", "md:h-4")}
                  />
                )}
              </button>
            ) : (
              <button
                disabled
                className={cn(
                  "p-1.5",
                  "md:p-2",
                  "bg-muted",
                  "text-slate-300",
                  "rounded-lg",
                  "md:rounded-xl",
                  "cursor-not-allowed",
                )}
              >
                <LuCircleX
                  className={cn("w-3.5", "h-3.5", "md:w-4", "md:h-4")}
                />
              </button>
            )}

            {/* Ellipsis — anchors the absolute dropdown via the relative td */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={cn(
                "p-1.5",
                "md:p-2",
                "hover:bg-background",
                "border",
                "border-transparent",
                "hover:border-border",
                "rounded-lg",
                "text-muted-foreground",
                "hover:text-foreground",
                "transition-all",
                "cursor-pointer",
              )}
            >
              <LuEllipsis className={cn("w-4", "h-4", "md:w-5", "md:h-5")} />
            </button>
          </div>

          {/* Dropdown — absolute relative to the td, same as AUTable */}
          <AnimatePresence>
            {showMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn("fixed", "inset-0", "z-10")}
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={cn(
                    "absolute",
                    "right-1",
                    "md:right-5",
                    "lg:right-8",
                    "top-10",
                    "md:top-12",
                    "w-44",
                    "md:w-48",
                    "lg:w-52",
                    "bg-background",
                    "border",
                    "border-border",
                    "rounded-2xl",
                    "shadow-2xl",
                    "z-20",
                    "p-1.5",
                    "md:p-2",
                  )}
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
                  <div className={cn("h-px", "bg-muted", "my-1")} />
                  <MenuItem
                    icon={LuUser}
                    label="View User"
                    onClick={() => {
                      setShowMenu(false);
                      router.push(`/admin/users?highlight=${ticket.userId}`);
                    }}
                  />
                  <MenuItem
                    icon={LuExternalLink}
                    label="View Event"
                    onClick={() => {
                      setShowMenu(false);
                      router.push(`/admin/events?highlight=${ticket.eventId}`);
                    }}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </td>
      </motion.tr>

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
      "w-full flex items-center gap-2.5 px-2.5 md:px-3 py-2 md:py-2.5 rounded-xl hover:bg-muted transition-colors cursor-pointer",
      color,
    )}
  >
    <Icon className={cn("w-3.5", "h-3.5", "md:w-4", "md:h-4")} />
    <span
      className={cn(
        "text-[9px]",
        "md:text-[10px]",
        "font-black",
        "uppercase",
        "tracking-tight",
      )}
    >
      {label}
    </span>
  </button>
);
