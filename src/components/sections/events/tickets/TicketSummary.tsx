"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LuCalendar, LuMapPin,  LuClock, LuTag } from "react-icons/lu";
import { Event } from "@/types/event";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface TicketEventSummaryProps {
  event: Event;
}

export const TicketEventSummary = ({ event }: TicketEventSummaryProps) => {

    const eventImage = event.image || "/images/default-event-bg.jpg";

  // Mock Countdown Logic
  const [timeLeft, setTimeLeft] = useState({
    days: 12,
    hours: 5,
    mins: 42,
    secs: 10,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => ({
        ...prev,
        secs: prev.secs > 0 ? prev.secs - 1 : 59,
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className={cn('w-full', 'bg-slate-50', 'py-10', 'md:py-16', 'border-b', 'border-slate-200')}>
      <div className={cn('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8')}>
        {/* Header Breadcrumb/Back */}
        <div className={cn('mb-8', 'flex', 'items-center', 'gap-2', 'text-xs', 'font-bold', 'text-slate-400', 'uppercase', 'tracking-widest')}>
          <span>Events</span>
          <span className="text-slate-200">/</span>
          <span className="text-slate-900">{event.title}</span>
          <span className="text-slate-200">/</span>
          <span className="text-primary">Registration</span>
        </div>

        <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-12', 'gap-8', 'items-start')}>
          {/* Main Summary Card (8 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn('lg:col-span-8', 'bg-white', 'rounded-[2.5rem]', 'p-6', 'md:p-10', 'shadow-xl', 'shadow-slate-200/50', 'border', 'border-white', 'flex', 'flex-col', 'md:flex-row', 'gap-8')}
          >
            {/* Event Banner Image */}
            <div className={cn('w-full', 'md:w-48', 'h-48', 'md:h-48', 'shrink-0', 'rounded-[1.5rem]', 'overflow-hidden', 'shadow-inner')}>
                          <Image
                              height={300}
                              width={500}
                src={eventImage}
                alt={event.title}
                className={cn('w-full', 'h-full', 'object-cover')}
              />
            </div>

            {/* Content Details */}
            <div className={cn('flex-1', 'space-y-4')}>
              <div className={cn('flex', 'flex-wrap', 'items-center', 'gap-3')}>
                <span
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                    event.type === "Virtual"
                      ? "bg-blue-100 text-blue-600"
                      : event.type === "Hybrid"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-emerald-100 text-emerald-600",
                  )}
                >
                  {event.type} Session
                </span>
                <span className={cn('px-4', 'py-1.5', 'bg-slate-900', 'text-white', 'rounded-full', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest')}>
                  {event.category}
                </span>
              </div>

              <h1 className={cn('text-2xl', 'md:text-4xl', 'font-black', 'text-slate-900', 'leading-tight')}>
                {event.title}
              </h1>

              <div className={cn('grid', 'grid-cols-1', 'sm:grid-cols-2', 'gap-4', 'pt-2')}>
                <div className={cn('flex', 'items-center', 'gap-3', 'text-slate-500', 'font-bold', 'text-sm')}>
                  <div className={cn('w-8', 'h-8', 'rounded-lg', 'bg-slate-50', 'flex', 'items-center', 'justify-center', 'text-primary')}>
                    <LuCalendar className={cn('w-4', 'h-4')} />
                  </div>
                  {event.date}
                </div>
                <div className={cn('flex', 'items-center', 'gap-3', 'text-slate-500', 'font-bold', 'text-sm')}>
                  <div className={cn('w-8', 'h-8', 'rounded-lg', 'bg-slate-50', 'flex', 'items-center', 'justify-center', 'text-primary')}>
                    <LuMapPin className={cn('w-4', 'h-4')} />
                  </div>
                  <span className="line-clamp-1">{event.location}</span>
                </div>
              </div>

              {/* Slots Remaining Indicator */}
              <div className="pt-4">
                <div className={cn('flex', 'items-center', 'justify-between', 'text-[10px]', 'font-black', 'uppercase', 'tracking-[0.2em]', 'mb-2', 'text-slate-400')}>
                  <span>Registration Capacity</span>
                  <span className="text-orange-600">
                    {event.slotsRemaining} Slots Left
                  </span>
                </div>
                <div className={cn('w-full', 'h-2', 'bg-slate-100', 'rounded-full', 'overflow-hidden')}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(event.slotsRemaining / event.totalCapacity) * 100}%`,
                    }}
                    className={cn('h-full', 'bg-orange-500')}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mini Countdown Timer (4 cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn('lg:col-span-4', 'bg-primary', 'text-white', 'rounded-[2.5rem]', 'p-8', 'relative', 'overflow-hidden', 'h-full', 'flex', 'flex-col', 'justify-center')}
          >
            {/* Background Glow */}
            <div className={cn('absolute', 'top-0', 'right-0', 'w-32', 'h-32', 'bg-white/20', 'rounded-full', 'blur-3xl', '-mr-16', '-mt-16')} />

            <div className={cn('relative', 'z-10')}>
              <div className={cn('flex', 'items-center', 'gap-2', 'mb-6', 'opacity-80')}>
                <LuClock className={cn('w-5', 'h-5')} />
                <span className={cn('text-xs', 'font-black', 'uppercase', 'tracking-widest')}>
                  Registration Closes In
                </span>
              </div>

              <div className={cn('grid', 'grid-cols-4', 'gap-4', 'text-center')}>
                {[
                  { label: "Days", value: timeLeft.days },
                  { label: "Hrs", value: timeLeft.hours },
                  { label: "Mins", value: timeLeft.mins },
                  { label: "Secs", value: timeLeft.secs },
                ].map((unit, i) => (
                  <div key={i} className={cn('flex', 'flex-col')}>
                    <span className={cn('text-3xl', 'md:text-4xl', 'font-black', 'mb-1')}>
                      {unit.value.toString().padStart(2, "0")}
                    </span>
                    <span className={cn('text-[10px]', 'font-bold', 'uppercase', 'opacity-60', 'tracking-widest')}>
                      {unit.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className={cn('mt-8', 'pt-6', 'border-t', 'border-white/20')}>
                <div className={cn('flex', 'items-center', 'gap-3')}>
                  <LuTag className={cn('w-5', 'h-5', 'rotate-90')} />
                  <div>
                    <p className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'opacity-60')}>
                      Ticket Price
                    </p>
                    <p className={cn('text-xl', 'font-black')}>{event.price}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
