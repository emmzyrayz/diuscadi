"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuCalendar,
  LuMapPin,
  LuTicket,
  LuDownload,
  LuExternalLink,
  LuCalendarPlus,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Ticket {
  id: string;
  eventName: string;
  eventDate: string;
  location: string;
  type: "Physical" | "Virtual";
  status: "Upcoming" | "Used" | "Cancelled";
  image: string;
}

const TicketCard = ({ ticket }: { ticket: Ticket }) => {
  const statusStyles = {
    Upcoming: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Used: "bg-slate-100 text-slate-500 border-slate-200",
    Cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  };

  // Fallback image if undefined
  const ticketImage = ticket.image || "/images/default-event-bg.jpg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, scale: 1.01 }}
      className={cn('group', 'bg-white', 'border-2', 'border-slate-100', 'hover:border-primary/30', 'rounded-[2.5rem]', 'overflow-hidden', 'transition-all', 'hover:shadow-xl', 'hover:shadow-slate-200/50', 'flex', 'flex-col', 'md:flex-row cursor-pointer')}
    >
      {/* 1. Left Section: Image (Visual Anchor) */}
      <div className={cn('relative', 'w-full', 'md:w-52', 'h-40', 'md:h-48', 'overflow-hidden', 'rounded-t-[2.5rem]', 'md:rounded-l-[2.5rem]', 'md:rounded-tr-none')}>
        <Image
          width={500}
          height={300}
          src={ticketImage}
          alt={ticket.eventName}
          className={cn('w-full', 'h-full', 'object-cover', 'group-hover:scale-110', 'transition-transform', 'duration-500')}
        />
        <div className={cn('absolute', 'top-4', 'left-4')}>
          <span
            className={cn(
              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border backdrop-blur-md bg-white/90 shadow-sm",
              statusStyles[ticket.status],
            )}
          >
            {ticket.status}
          </span>
        </div>
      </div>

      {/* 2. Middle Section: Information */}
      <div className={cn('flex-1', 'p-6', 'md:p-8', 'space-y-4')}>
        <div className="space-y-1">
          <div className={cn('flex', 'items-center', 'gap-2', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-primary')}>
            <LuTicket className={cn('w-3', 'h-3')} /> {ticket.type} Access
          </div>
          <h3 className={cn('text-xl', 'font-black', 'text-slate-900', 'leading-tight', 'group-hover:text-primary', 'transition-colors')}>
            {ticket.eventName}
          </h3>
        </div>

        <div className={cn('grid', 'grid-cols-1', 'sm:grid-cols-2', 'gap-y-2', 'gap-x-6')}>
          <div className={cn('flex', 'items-center', 'gap-2', 'text-slate-500', 'text-xs', 'font-bold')}>
            <LuCalendar className={cn('w-4', 'h-4', 'text-slate-300')} />
            {ticket.eventDate}
          </div>
          <div className={cn('flex', 'items-center', 'gap-2', 'text-slate-500', 'text-xs', 'font-bold')}>
            <LuMapPin className={cn('w-4', 'h-4', 'text-slate-300')} />
            <span className="truncate">{ticket.location}</span>
          </div>
        </div>

        <div className="pt-2">
          <span className={cn('text-[10px]', 'font-mono', 'text-slate-300', 'uppercase', 'tracking-widest')}>
            Ticket ID: {ticket.id}
          </span>
        </div>
      </div>

      {/* 3. Right Section: Actions */}
      <div className={cn('w-full', 'md:w-64', 'bg-slate-50/50', 'p-6', 'md:p-8', 'border-t', 'md:border-t-0', 'md:border-l', 'border-slate-100', 'flex', 'flex-col', 'justify-center', 'gap-3')}>
        <button className={cn('w-full', 'py-3', 'bg-slate-900', 'text-white', 'rounded-xl', 'text-xs', 'font-black', 'uppercase', 'tracking-widest', 'hover:bg-primary', 'transition-all', 'flex', 'items-center', 'justify-center', 'gap-2')}>
          View Ticket <LuExternalLink className={cn('w-4', 'h-4')} />
        </button>

        <div className={cn('grid', 'grid-cols-2', 'gap-2')}>
          <button className={cn('py-3', 'bg-white', 'border', 'border-slate-200', 'text-slate-600', 'rounded-xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'hover:border-slate-400', 'transition-all', 'flex', 'items-center', 'justify-center', 'gap-2')}>
            <LuDownload className={cn('w-3.5', 'h-3.5')} /> PDF
          </button>
          <button className={cn('py-3', 'bg-white', 'border', 'border-slate-200', 'text-slate-600', 'rounded-xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'hover:border-slate-400', 'transition-all', 'flex', 'items-center', 'justify-center', 'gap-2')}>
            <LuCalendarPlus className={cn('w-3.5', 'h-3.5')} /> Sync
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const TicketListSection = ({ tickets }: { tickets: Ticket[] }) => {
  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'pb-20', 'space-y-6')}>
      {tickets.length === 0 ? (
        <div className={cn('text-center', 'py-20')}>
          <p className={cn('text-slate-400', 'font-bold')}>No tickets found</p>
        </div>
      ) : (
        tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
      )}
    </section>
  );
};

// Export the Ticket type for reuse
export type { Ticket };
