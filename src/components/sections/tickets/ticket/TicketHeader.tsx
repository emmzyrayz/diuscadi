"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuArrowLeft, LuCircleCheck, LuClock, LuBan } from "react-icons/lu";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TicketHeaderProps {
  status: "Upcoming" | "Used" | "Cancelled";
}

export const TicketViewHeader = ({ status }: TicketHeaderProps) => {
  // Map statuses to specific styles and icons
  const statusConfig = {
    Upcoming: {
      label: "Upcoming",
      icon: LuClock,
      classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    Used: {
      label: "Used / Checked-In",
      icon: LuCircleCheck,
      classes: "bg-slate-100 text-slate-500 border-slate-200",
    },
    Cancelled: {
      label: "Cancelled",
      icon: LuBan,
      classes: "bg-rose-100 text-rose-700 border-rose-200",
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <header className={cn('w-full', 'bg-white', 'border-b', 'border-slate-100', 'py-6')}>
      <div className={cn('max-w-4xl', 'mx-auto', 'px-4', 'sm:px-6')}>
        {/* Top Row: Navigation & Badge */}
        <div className={cn('flex', 'items-center', 'justify-between', 'mb-6')}>
          <Link
            href="/ticket"
            className={cn('flex', 'items-center', 'gap-2', 'text-slate-400', 'hover:text-primary', 'transition-colors', 'text-xs', 'font-black', 'uppercase', 'tracking-widest', 'group')}
          >
            <LuArrowLeft className={cn('w-4', 'h-4', 'group-hover:-translate-x-1', 'transition-transform')} />
            Back to My Tickets
          </Link>

          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-xs",
              currentStatus.classes,
            )}
          >
            <currentStatus.icon className={cn('w-3', 'h-3')} />
            {currentStatus.label}
          </div>
        </div>

        {/* Bottom Row: Title */}
        <div className={cn('flex', 'flex-col', 'md:flex-row', 'md:items-end', 'justify-between', 'gap-4')}>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className={cn('text-3xl', 'md:text-4xl', 'font-black', 'text-slate-900', 'tracking-tighter')}>
              Your <span className="text-primary">Ticket.</span>
            </h1>
            <p className={cn('text-slate-400', 'text-xs', 'font-medium', 'mt-1', 'uppercase', 'tracking-widest')}>
              Issued by DIUSCADI Core Verification System
            </p>
          </motion.div>

          {/* Optional: Print Shortcut for desktop */}
          <button
            onClick={() => window.print()}
            className={cn('hidden', 'md:flex', 'items-center', 'gap-2', 'text-slate-300', 'hover:text-slate-900', 'transition-colors', 'text-[10px]', 'font-black', 'uppercase', 'tracking-[0.2em]')}
          >
            Print Receipt
          </button>
        </div>
      </div>
    </header>
  );
};
