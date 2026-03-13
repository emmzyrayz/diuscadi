"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuArrowLeft, LuCircleCheck, LuClock, LuBan } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface TicketHeaderProps {
  status: "Upcoming" | "Used" | "Cancelled";
}

const STATUS_CONFIG = {
  Upcoming: {
    label: "Upcoming",
    icon: LuClock,
    classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  Used: {
    label: "Used / Checked-In",
    icon: LuCircleCheck,
    classes: "text-muted text-muted-foreground border-border",
  },
  Cancelled: {
    label: "Cancelled",
    icon: LuBan,
    classes: "bg-rose-100 text-rose-700 border-rose-200",
  },
};

export const TicketViewHeader = ({ status }: TicketHeaderProps) => {
  const router = useRouter();
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <header
      className={cn(
        "w-full",
        "bg-background",
        "border-b",
        "border-border",
        "py-6",
      )}
    >
      <div className={cn("max-w-4xl", "mx-auto", "px-4", "sm:px-6")}>
        <div className={cn("flex", "items-center", "justify-between", "mb-6")}>
          <button
            onClick={() => router.push("/home/tickets")}
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "text-muted-foreground",
              "hover:text-primary",
              "transition-colors",
              "text-xs",
              "font-black",
              "uppercase",
              "tracking-widest",
              "group",
              "cursor-pointer",
            )}
          >
            <LuArrowLeft
              className={cn(
                "w-4",
                "h-4",
                "group-hover:-translate-x-1",
                "transition-transform",
              )}
            />
            Back to My Tickets
          </button>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest",
              cfg.classes,
            )}
          >
            <Icon className={cn("w-3", "h-3")} />
            {cfg.label}
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1
            className={cn(
              "text-3xl",
              "md:text-4xl",
              "font-black",
              "text-foreground",
              "tracking-tighter",
            )}
          >
            Your <span className="text-primary">Ticket.</span>
          </h1>
          <p
            className={cn(
              "text-muted-foreground",
              "text-xs",
              "font-medium",
              "mt-1",
              "uppercase",
              "tracking-widest",
            )}
          >
            Issued by DIUSCADI Core Verification System
          </p>
        </motion.div>
      </div>
    </header>
  );
};
