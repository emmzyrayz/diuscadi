"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuMaximize, LuShieldCheck, LuInfo, LuCircleCheck, LuClock, LuBan } from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { QRCode, buildTicketQRValue } from "@/components/ui/QRCode";

interface TicketVisualCardProps {
  ticket: {
    inviteCode: string;
    eventName:  string;
    eventImage: string;
    ticketType: string;
    status:     "Upcoming" | "Used" | "Cancelled";
  };
}

const STATUS_CONFIG = {
  Upcoming:  { label: "Upcoming",    icon: LuClock,       color: "text-emerald-500" },
  Used:      { label: "Checked In",  icon: LuCircleCheck, color: "text-muted-foreground" },
  Cancelled: { label: "Cancelled",   icon: LuBan,         color: "text-rose-500" },
};

export const TicketVisualCard = ({ ticket }: TicketVisualCardProps) => {
  const statusCfg  = STATUS_CONFIG[ticket.status];
  const StatusIcon = statusCfg.icon;
  const qrValue    = buildTicketQRValue(ticket.inviteCode);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("relative", "w-full", "max-w-sm", "mx-auto", "filter", "drop-shadow-2xl")}
    >
      <div className={cn(
        "bg-background", "rounded-[2.5rem]", "overflow-hidden", "flex", "flex-col",
        ticket.status === "Cancelled" ? "opacity-60 grayscale" : "",
      )}>
        {/* Event image */}
        <div className={cn("relative", "h-48", "w-full", "overflow-hidden", "text-muted")}>
          <Image src={ticket.eventImage || "/images/events/default.jpg"} alt={ticket.eventName} fill className={cn("object-cover")} />
          <div className={cn("absolute", "inset-0", "bg-gradient-to-t", "from-foreground", "via-foreground/40", "to-transparent")} />
          <div className={cn("absolute", "bottom-6", "left-6", "right-6")}>
            <span className={cn("px-2", "py-0.5", "bg-primary", "text-background", "text-[9px]", "font-black", "uppercase", "tracking-widest", "rounded-sm", "inline-block", "mb-2")}>
              Official Pass
            </span>
            <h3 className={cn("text-lg", "font-black", "text-background", "tracking-tight", "uppercase", "leading-tight", "line-clamp-2")}>
              {ticket.eventName}
            </h3>
          </div>
          <div className={cn("absolute", "top-4", "right-4", "w-10", "h-10", "bg-background/10", "backdrop-blur-md", "rounded-full", "border", "border-background/20", "flex", "items-center", "justify-center")}>
            <LuShieldCheck className={cn("w-5", "h-5", "text-primary/80")} />
          </div>
        </div>

        {/* Ticket type + status */}
        <div className={cn("p-6", "bg-background", "space-y-4")}>
          <div className={cn("flex", "justify-between", "items-center")}>
            <div>
              <p className={cn("text-[9px]", "font-black", "text-muted-foreground", "uppercase", "tracking-widest")}>Tier</p>
              <p className={cn("text-sm", "font-bold", "text-primary")}>{ticket.ticketType}</p>
            </div>
            <div className={cn("flex", "items-center", "gap-1.5", statusCfg.color)}>
              <StatusIcon className={cn("w-4", "h-4")} />
              <span className={cn("text-xs", "font-black", "uppercase", "tracking-widest")}>{statusCfg.label}</span>
            </div>
          </div>
        </div>

        {/* Perforation */}
        <div className={cn("relative", "flex", "items-center", "justify-between", "h-6", "bg-background")}>
          <div className={cn("absolute", "-left-3", "w-6", "h-6", "bg-muted", "rounded-full", "border", "border-border")} />
          <div className={cn("flex-1", "border-t-2", "border-dashed", "border-border", "mx-4")} />
          <div className={cn("absolute", "-right-3", "w-6", "h-6", "bg-muted", "rounded-full", "border", "border-border")} />
        </div>

        {/* Real QR code */}
        <div className={cn("p-8", "bg-background", "flex", "flex-col", "items-center", "text-center")}>
          <div className={cn("relative", "group", "p-4", "bg-muted", "rounded-3xl", "border", "border-border", "mb-4")}>
            {/* Corner brackets */}
            <div className={cn("absolute", "top-2", "left-2", "w-4", "h-4", "border-t-2", "border-l-2", "border-primary/30")} />
            <div className={cn("absolute", "bottom-2", "right-2", "w-4", "h-4", "border-b-2", "border-r-2", "border-primary/30")} />
            {/* Real QR */}
            <QRCode
              value={qrValue}
              size={128}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <p className={cn("text-[10px]", "font-black", "text-foreground", "uppercase", "tracking-widest", "flex", "items-center", "justify-center", "gap-2")}>
              <LuMaximize className={cn("w-3", "h-3", "text-primary")} />
              {ticket.status === "Used" ? "Already Scanned" : "Scan at Entrance"}
            </p>
            <p className={cn("font-mono", "text-[10px]", "text-muted-foreground", "tracking-[0.2em]", "font-bold")}>
              {ticket.inviteCode}
            </p>
          </div>
        </div>

        {/* Security footer */}
        <div className={cn("bg-foreground", "py-3", "px-6", "flex", "items-center", "justify-center", "gap-2")}>
          <LuInfo className={cn("w-3", "h-3", "text-muted-foreground")} />
          <p className={cn("text-[8px]", "font-black", "text-muted-foreground", "uppercase", "tracking-[0.3em]")}>
            Non-Transferable · Identity Linked
          </p>
        </div>
      </div>
    </motion.div>
  );
};