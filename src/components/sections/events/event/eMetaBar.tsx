"use client";
import React from "react";
import { LuTicket, LuClock } from "react-icons/lu";
import { Event } from "@/types/event"; // Import the Event type
import { cn } from "../../../../lib/utils";

interface MetaBarProps {
  event: Event; // Single Event object, not array
}

export const EventMetaBar = ({ event }: MetaBarProps) => {
  return (
    <div className={cn('sticky', 'top-[72px]', 'z-40', 'w-full', 'bg-white', 'border-b', 'border-slate-100', 'shadow-sm', 'overflow-hidden')}>
      <div className={cn('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'h-20', 'md:h-24', 'flex', 'items-center', 'justify-between')}>
        {/* Left Side: Key Stats */}
        <div className={cn('flex', 'items-center', 'gap-8', 'md:gap-12', 'overflow-x-auto', 'no-scrollbar')}>
          {/* Price Stat */}
          <div className={cn('flex', 'flex-col')}>
            <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400')}>
              Entry Fee
            </span>
            <span className={cn('text-lg', 'font-black', 'text-slate-900')}>
              {event.price}
            </span>
          </div>

          <div className={cn('hidden', 'sm:block', 'w-px', 'h-8', 'bg-slate-100')} />

          {/* Availability Stat */}
          <div className={cn('flex', 'flex-col', 'shrink-0')}>
            <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400')}>
              Availability
            </span>
            <div className={cn('flex', 'items-center', 'gap-2')}>
              <span className={cn('text-lg', 'font-black', 'text-orange-600')}>
                {event.slotsRemaining}
              </span>
              <span className={cn('text-xs', 'font-bold', 'text-slate-500')}>
                Seats Left
              </span>
            </div>
          </div>

          <div className={cn('hidden', 'sm:block', 'w-px', 'h-8', 'bg-slate-100')} />

          {/* Time Stat */}
          <div className={cn('hidden', 'md:flex', 'flex-col')}>
            <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400')}>
              Duration
            </span>
            <div className={cn('flex', 'items-center', 'gap-1.5', 'text-slate-900', 'font-bold')}>
              <LuClock className={cn('w-4', 'h-4', 'text-primary')} />
              {event.time}
            </div>
          </div>
        </div>

        {/* Right Side: Quick CTA */}
        <div className={cn('flex', 'items-center', 'gap-4')}>
          <div className={cn('hidden', 'lg:flex', 'flex-col', 'text-right')}>
            <span className={cn('text-xs', 'font-bold', 'text-slate-900', 'leading-none')}>
              Registration closes in
            </span>
            <span className={cn('text-[10px]', 'font-black', 'text-primary', 'uppercase', 'mt-1')}>
              4 Days, 12 Hours
            </span>
          </div>

          <button className={cn('flex', 'items-center', 'gap-2', 'px-6', 'md:px-10', 'py-3.5', 'bg-primary', 'text-white', 'font-black', 'rounded-2xl', 'hover:bg-orange-600', 'transition-all', 'shadow-lg', 'shadow-primary/20', 'hover:scale-105', 'active:scale-95')}>
            <LuTicket className={cn('w-5', 'h-5')} />
            <span className={cn('hidden', 'sm:inline')}>Secure Your Seat</span>
            <span className="sm:hidden">Register</span>
          </button>
        </div>
      </div>

      {/* Visual Capacity Bar (Bottom of sticky bar) */}
      <div className={cn('w-full', 'h-1', 'bg-slate-50', 'flex')}>
        <div
          className={cn('h-full', 'bg-primary', 'transition-all', 'duration-1000')}
          style={{
            width: `${((event.totalCapacity - event.slotsRemaining) / event.totalCapacity) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};
