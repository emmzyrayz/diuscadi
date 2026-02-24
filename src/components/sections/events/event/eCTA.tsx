"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuTicket, LuArrowRight } from "react-icons/lu";
import { Event } from "@/types/event";
import { cn } from "../../../../lib/utils";

export const FinalCTA = ({ event }: { event: Event }) => {
  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-20')}>
      <div className={cn('relative', 'bg-primary', 'rounded-[3rem]', 'p-8', 'md:p-20', 'text-center', 'overflow-hidden')}>
        {/* Background Patterns */}
        <div className={cn('absolute', 'top-0', 'right-0', 'w-64', 'h-64', 'bg-white/10', 'rounded-full', 'blur-3xl', '-mr-32', '-mt-32')} />
        <div className={cn('absolute', 'bottom-0', 'left-0', 'w-64', 'h-64', 'bg-slate-900/10', 'rounded-full', 'blur-3xl', '-ml-32', '-mb-32')} />

        <div className={cn('relative', 'z-10', 'max-w-3xl', 'mx-auto')}>
          <h2 className={cn('text-3xl', 'md:text-6xl', 'font-black', 'text-white', 'mb-6', 'tracking-tighter')}>
            Don’t miss out on this <br />
            <span className={cn('text-slate-900', 'italic')}>experience.</span>
          </h2>

          <p className={cn('text-white/80', 'text-lg', 'md:text-xl', 'font-medium', 'mb-10')}>
            Join {event.totalCapacity - event.slotsRemaining}+ others already
            registered for the <br className={cn('hidden', 'md:block')} />
            <strong className={cn('text-white', 'underline', 'decoration-white/30', 'underline-offset-4')}>
              {event.title}
            </strong>
            .
          </p>

          <div className={cn('flex', 'flex-col', 'sm:flex-row', 'items-center', 'justify-center', 'gap-4')}>
            <button className={cn('w-full', 'sm:w-auto', 'px-10', 'py-5', 'bg-slate-900', 'text-white', 'font-black', 'rounded-2xl', 'flex', 'items-center', 'justify-center', 'gap-3', 'hover:scale-105', 'transition-all', 'shadow-2xl')}>
              <LuTicket className={cn('w-6', 'h-6')} />
              Claim Your Free Seat
            </button>
            <button className={cn('w-full', 'sm:w-auto', 'px-10', 'py-5', 'bg-white', 'text-primary', 'font-black', 'rounded-2xl', 'flex', 'items-center', 'justify-center', 'gap-3', 'hover:bg-slate-50', 'transition-all')}>
              Invite a Friend
              <LuArrowRight className={cn('w-5', 'h-5')} />
            </button>
          </div>

          <p className={cn('mt-8', 'text-[10px]', 'text-white/60', 'font-black', 'uppercase', 'tracking-[0.2em]')}>
            Limited to {event.totalCapacity} total participants.
          </p>
        </div>
      </div>
    </section>
  );
};
