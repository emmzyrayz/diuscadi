"use client";
// components/sections/tickets/ticket/TicketVisualCard.tsx
// E3: Added "Attended" badge for checked-in tickets
// Attended = status "Used" (checked-in) + attended flag from server confirmed

import React from "react";
import { motion } from "framer-motion";
import {
  LuMaximize,
  LuShieldCheck,
  LuInfo,
  LuCircleCheck,
  LuClock,
  LuBan,
  LuHistory,
  LuBadgeCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { QRCode, buildTicketQRValue } from "@/components/ui/QRCode";

interface TicketVisualCardProps {
  ticket: {
    inviteCode: string;
    eventName: string;
    eventImage: string;
    ticketType: string;
    status: "Upcoming" | "Used" | "Cancelled" | "Past";
    checkedInAt?: string | null; // ISO — when set on a Used ticket, shows Attended badge
  };
}

const STATUS_CONFIG = {
  Upcoming: {
    label: "Valid — Not Scanned",
    icon: LuClock,
    color: "text-emerald-500",
    qrOpacity: "opacity-100",
  },
  Used: {
    label: "Checked In",
    icon: LuCircleCheck,
    color: "text-blue-500",
    qrOpacity: "opacity-50",
  },
  Past: {
    label: "Event Ended",
    icon: LuHistory,
    color: "text-slate-400",
    qrOpacity: "opacity-30",
  },
  Cancelled: {
    label: "Cancelled",
    icon: LuBan,
    color: "text-rose-500",
    qrOpacity: "opacity-20",
  },
};

export const TicketVisualCard = ({ ticket }: TicketVisualCardProps) => {
  const statusCfg = STATUS_CONFIG[ticket.status];
  const StatusIcon = statusCfg.icon;
  const qrValue = buildTicketQRValue(ticket.inviteCode);
  const isInvalid = ticket.status === "Past" || ticket.status === "Cancelled";
  // Attended badge shown when ticket is "Used" (checked-in)
  const isAttended = ticket.status === "Used" && !!ticket.checkedInAt;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('relative', 'w-full', 'max-w-sm', 'mx-auto', 'filter', 'drop-shadow-2xl')}
    >
      <div
        className={cn(
          "bg-background rounded-[2.5rem] overflow-hidden flex flex-col",
          isInvalid && "opacity-70 grayscale-[30%]",
        )}
      >
        {/* Event image */}
        <div className={cn('relative', 'h-48', 'w-full', 'overflow-hidden', 'bg-muted')}>
          <Image
            src={ticket.eventImage || "/images/events/default.jpg"}
            alt={ticket.eventName}
            fill
            className="object-cover"
          />
          <div className={cn('absolute', 'inset-0', 'bg-gradient-to-t', 'from-foreground', 'via-foreground/40', 'to-transparent')} />
          <div className={cn('absolute', 'bottom-6', 'left-6', 'right-6')}>
            <span className={cn('px-2', 'py-0.5', 'bg-primary', 'text-background', 'text-[9px]', 'font-black', 'uppercase', 'tracking-widest', 'rounded-sm', 'inline-block', 'mb-2')}>
              Official Pass
            </span>
            <h3 className={cn('text-lg', 'font-black', 'text-background', 'tracking-tight', 'uppercase', 'leading-tight', 'line-clamp-2')}>
              {ticket.eventName}
            </h3>
          </div>
          <div className={cn('absolute', 'top-4', 'right-4', 'w-10', 'h-10', 'bg-background/10', 'backdrop-blur-md', 'rounded-full', 'border', 'border-background/20', 'flex', 'items-center', 'justify-center')}>
            <LuShieldCheck className={cn('w-5', 'h-5', 'text-primary/80')} />
          </div>
          {/* ── E3: Attended badge — top-left of image ── */}
          {isAttended && (
            <div className={cn('absolute', 'top-4', 'left-4')}>
              <div className={cn('flex', 'items-center', 'gap-1.5', 'px-3', 'py-1.5', 'bg-emerald-500', 'rounded-xl', 'shadow-lg')}>
                <LuBadgeCheck className={cn('w-3.5', 'h-3.5', 'text-background')} />
                <span className={cn('text-[9px]', 'font-black', 'text-background', 'uppercase', 'tracking-widest')}>
                  Attended
                </span>
              </div>
            </div>
          )}
          {/* Past/Cancelled overlay stamp */}
          {isInvalid && (
            <div className={cn('absolute', 'inset-0', 'flex', 'items-center', 'justify-center')}>
              <div className={cn('border-4', 'border-slate-400/60', 'rounded-2xl', 'px-6', 'py-3', 'rotate-[-15deg]')}>
                <p className={cn('text-slate-400/80', 'font-black', 'text-2xl', 'uppercase', 'tracking-widest')}>
                  {ticket.status === "Past" ? "Expired" : "Void"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ticket type + status */}
        <div className={cn('p-6', 'bg-background', 'space-y-4')}>
          <div className={cn('flex', 'justify-between', 'items-center')}>
            <div>
              <p className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                Tier
              </p>
              <p className={cn('text-sm', 'font-bold', 'text-primary')}>
                {ticket.ticketType}
              </p>
            </div>
            <div className={cn("flex items-center gap-1.5", statusCfg.color)}>
              <StatusIcon className={cn('w-4', 'h-4')} />
              <span className={cn('text-xs', 'font-black', 'uppercase', 'tracking-widest')}>
                {statusCfg.label}
              </span>
            </div>
          </div>
          {/* ── E3: Check-in timestamp when attended ── */}
          {isAttended && ticket.checkedInAt && (
            <div className={cn('flex', 'items-center', 'gap-2', 'px-3', 'py-2', 'bg-emerald-50', 'border', 'border-emerald-100', 'rounded-xl')}>
              <LuBadgeCheck className={cn('w-3.5', 'h-3.5', 'text-emerald-600', 'shrink-0')} />
              <p className={cn('text-[9px]', 'font-bold', 'text-emerald-700', 'uppercase', 'tracking-widest')}>
                Checked in{" "}
                {new Date(ticket.checkedInAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Perforation */}
        <div className={cn('relative', 'flex', 'items-center', 'justify-between', 'h-6', 'bg-background')}>
          <div className={cn('absolute', '-left-3', 'w-6', 'h-6', 'bg-muted', 'rounded-full', 'border', 'border-border')} />
          <div className={cn('flex-1', 'border-t-2', 'border-dashed', 'border-border', 'mx-4')} />
          <div className={cn('absolute', '-right-3', 'w-6', 'h-6', 'bg-muted', 'rounded-full', 'border', 'border-border')} />
        </div>

        {/* QR code */}
        <div className={cn('p-8', 'bg-background', 'flex', 'flex-col', 'items-center', 'text-center')}>
          <div className={cn('relative', 'group', 'p-4', 'bg-muted', 'rounded-3xl', 'border', 'border-border', 'mb-4')}>
            <div className={cn('absolute', 'top-2', 'left-2', 'w-4', 'h-4', 'border-t-2', 'border-l-2', 'border-primary/30')} />
            <div className={cn('absolute', 'bottom-2', 'right-2', 'w-4', 'h-4', 'border-b-2', 'border-r-2', 'border-primary/30')} />
            <div className={cn("transition-opacity", statusCfg.qrOpacity)}>
              <QRCode value={qrValue} size={128} className="rounded-xl" />
            </div>
            {isInvalid && (
              <div className={cn('absolute', 'inset-0', 'flex', 'items-center', 'justify-center', 'rounded-3xl', 'bg-background/40', 'backdrop-blur-[2px]')}>
                <StatusIcon
                  className={cn("w-10 h-10", statusCfg.color, "opacity-60")}
                />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className={cn('text-[10px]', 'font-black', 'text-foreground', 'uppercase', 'tracking-widest', 'flex', 'items-center', 'justify-center', 'gap-2')}>
              <LuMaximize className={cn('w-3', 'h-3', 'text-primary')} />
              {ticket.status === "Used"
                ? "Already Scanned"
                : ticket.status === "Past"
                  ? "QR Code Expired"
                  : ticket.status === "Cancelled"
                    ? "QR Code Invalidated"
                    : "Scan at Entrance"}
            </p>
            <p className={cn('font-mono', 'text-[10px]', 'text-muted-foreground', 'tracking-[0.2em]', 'font-bold')}>
              {ticket.inviteCode}
            </p>
          </div>
        </div>

        {/* Security footer */}
        <div className={cn('bg-foreground', 'py-3', 'px-6', 'flex', 'items-center', 'justify-center', 'gap-2')}>
          <LuInfo className={cn('w-3', 'h-3', 'text-muted-foreground')} />
          <p className={cn('text-[8px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-[0.3em]')}>
            Non-Transferable · Identity Linked
          </p>
        </div>
      </div>
    </motion.div>
  );
};
