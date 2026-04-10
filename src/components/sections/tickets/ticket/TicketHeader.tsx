"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuArrowLeft,
  LuCircleCheck,
  LuClock,
  LuBan,
  LuHistory,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Now includes "Past" as a distinct display status
interface TicketHeaderProps {
  status: "Upcoming" | "Used" | "Cancelled" | "Past";
}

const STATUS_CONFIG = {
  Upcoming: {
    label: "Upcoming",
    icon: LuClock,
    classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  Used: {
    label: "Used / Attended",
    icon: LuCircleCheck,
    classes: "bg-blue-50 text-blue-600 border-blue-100",
  },
  Past: {
    label: "Event Ended",
    icon: LuHistory,
    classes: "bg-slate-100 text-slate-500 border-slate-200",
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
    <header className="w-full bg-background border-b rounded-2xl border-border py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/tickets")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs font-black uppercase tracking-widest group cursor-pointer"
          >
            <LuArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to My Tickets
          </button>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest",
              cfg.classes,
            )}
          >
            <Icon className="w-3 h-3" />
            {cfg.label}
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">
            Your <span className="text-primary">Ticket.</span>
          </h1>
          <p className="text-muted-foreground text-xs font-medium mt-1 uppercase tracking-widest">
            Issued by DIUSCADI Core Verification System
          </p>
        </motion.div>
      </div>
    </header>
  );
};
