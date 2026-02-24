"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuSearch, LuDownload, LuArrowRight, LuTicket } from "react-icons/lu";
import Link from "next/link";
import { cn } from "../../../lib/utils";

export const TicketPageHeader = () => {
  return (
    <section className={cn('w-full', 'bg-white', 'border-b', 'border-slate-100', 'pt-12', 'pb-8')}>
      <div className={cn('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8')}>
        <div className={cn('flex', 'flex-col', 'md:flex-row', 'md:items-end', 'justify-between', 'gap-6')}>
          {/* Left Side: Title & Context */}
          <div className="space-y-2">
            <div className={cn('flex', 'items-center', 'gap-2', 'text-primary', 'font-black', 'text-[10px]', 'uppercase', 'tracking-[0.3em]', 'mb-2')}>
              <LuTicket className={cn('w-4', 'h-4')} />
              User Dashboard
            </div>
            <h1 className={cn('text-4xl', 'md:text-5xl', 'font-black', 'text-slate-900', 'tracking-tighter')}>
              My <span className={cn('text-primary', 'text-outline-sm')}>Tickets.</span>
            </h1>
            <p className={cn('text-slate-500', 'font-medium', 'max-w-md')}>
              Access your digital passes, manage upcoming registrations, and
              view your event history in one place.
            </p>
          </div>

          {/* Right Side: Quick Actions */}
          <div className={cn('flex', 'flex-wrap', 'items-center', 'gap-3')}>
            <Link
              href="/events"
              className={cn('px-6', 'py-4', 'bg-slate-900', 'text-white', 'font-black', 'rounded-2xl', 'flex', 'items-center', 'gap-3', 'hover:bg-slate-800', 'transition-all', 'shadow-xl', 'shadow-slate-900/10', 'group')}
            >
              Browse More Events
              <LuArrowRight className={cn('w-5', 'h-5', 'group-hover:translate-x-1', 'transition-transform')} />
            </Link>

            <button className={cn('p-4', 'bg-white', 'border-2', 'border-slate-100', 'text-slate-400', 'hover:text-primary', 'hover:border-primary', 'rounded-2xl', 'transition-all', 'group', 'relative')}>
              <LuDownload className={cn('w-6', 'h-6')} />
              {/* Tooltip */}
              <span className={cn('absolute', '-top-12', 'left-1/2', '-translate-x-1/2', 'bg-slate-900', 'text-white', 'text-[10px]', 'px-3', 'py-1.5', 'rounded-lg', 'opacity-0', 'group-hover:opacity-100', 'transition-opacity', 'whitespace-nowrap', 'pointer-events-none', 'font-bold')}>
                Download All (PDF)
              </span>
            </button>
          </div>
        </div>

        {/* Decorative Divider */}
        <div className={cn('mt-10', 'h-1', 'w-20', 'bg-primary', 'rounded-full')} />
      </div>
    </section>
  );
};
