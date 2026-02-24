"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuCircleCheck,
  LuLaptop,
  LuBrainCircuit,
  LuCalendar,
  LuMapPin,
  LuTicket,
  LuCalendarPlus,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

// Define the Event interface
interface Event {
  id: string;
  title: string;
  overview: string;
  learningOutcomes: string[];
  date: string;
  location: string;
  slotsRemaining: number;
  category?: string;
  price?: string;
  duration?: string;
  instructor?: string;
  level?: string;
}

// Define the component props interface
interface MainContentProps {
  event: Event;
  isRegistered?: boolean;
}

export const EventMainContent = ({
  event,
  isRegistered = false,
}: MainContentProps) => {
  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-12', 'md:py-20')}>
      <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-12', 'gap-12', 'lg:gap-16')}>
        {/* LEFT COLUMN: 70% (8 cols) */}
        <div className={cn('lg:col-span-8', 'space-y-12')}>
          {/* A. About Event */}
          <div className="space-y-6">
            <h3 className={cn('text-2xl', 'font-black', 'text-slate-900', 'uppercase', 'tracking-tighter')}>
              About the Event
            </h3>
            <div className={cn('prose', 'prose-slate', 'max-w-none')}>
              <p className={cn('text-slate-600', 'leading-relaxed', 'text-lg', 'italic', 'border-l-4', 'border-primary', 'pl-6')}>
                {event.overview}
              </p>
              <div className={cn('mt-8', 'space-y-4', 'text-slate-600', 'leading-relaxed')}>
                <h4 className={cn('font-bold', 'text-slate-900')}>
                  What you will learn
                </h4>
                <ul className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-3', 'list-none', 'p-0')}>
                  {event.learningOutcomes.map((item: string, i: number) => (
                    <li
                      key={i}
                      className={cn('flex', 'items-start', 'gap-2', 'bg-slate-50', 'p-3', 'rounded-xl', 'border', 'border-slate-100')}
                    >
                      <LuCircleCheck className={cn('w-5', 'h-5', 'text-primary', 'shrink-0', 'mt-0.5')} />
                      <span className={cn('text-sm', 'font-medium')}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* B. Event Highlights */}
          <div className={cn('bg-slate-900', 'rounded-[2.5rem]', 'p-8', 'md:p-12', 'text-white')}>
            <h3 className={cn('text-xl', 'font-black', 'mb-8', 'uppercase', 'tracking-widest', 'text-primary')}>
              Event Highlights
            </h3>
            <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-8')}>
              {[
                { title: "Hands-on training", desc: "Live practical sessions" },
                { title: "Networking", desc: "Meet 500+ peers" },
                { title: "Certification", desc: "Digital & Physical" },
              ].map((h, i) => (
                <div key={i} className="space-y-2">
                  <div className={cn('w-10', 'h-10', 'bg-white/10', 'rounded-xl', 'flex', 'items-center', 'justify-center', 'text-primary')}>
                    <LuCircleCheck className={cn('w-6', 'h-6')} />
                  </div>
                  <h4 className={cn('font-bold', 'text-lg')}>{h.title}</h4>
                  <p className={cn('text-slate-400', 'text-xs', 'font-medium')}>{h.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* C. Requirements */}
          <div className={cn('p-8', 'border', 'border-slate-100', 'rounded-[2rem]', 'bg-white')}>
            <h3 className={cn('text-sm', 'font-black', 'text-slate-900', 'uppercase', 'tracking-widest', 'mb-6')}>
              Requirements
            </h3>
            <div className={cn('flex', 'flex-wrap', 'gap-4')}>
              <div className={cn('flex', 'items-center', 'gap-3', 'px-4', 'py-2', 'bg-slate-50', 'rounded-xl', 'text-slate-600', 'font-bold', 'text-sm')}>
                <LuLaptop className={cn('w-5', 'h-5')} /> Laptop Required
              </div>
              <div className={cn('flex', 'items-center', 'gap-3', 'px-4', 'py-2', 'bg-slate-50', 'rounded-xl', 'text-slate-600', 'font-bold', 'text-sm')}>
                <LuBrainCircuit className={cn('w-5', 'h-5')} /> Basic Programming
                Knowledge
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 30% (4 cols) - Sticky Card */}
        <div className="lg:col-span-4">
          <div className={cn('sticky', 'top-32', 'space-y-6')}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn('bg-white', 'border-2', 'border-slate-900', 'rounded-[2.5rem]', 'p-8', 'shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]')}
            >
              <div className="space-y-6">
                <div>
                  <h4 className={cn('text-xs', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'mb-4')}>
                    Registration Card
                  </h4>
                  <div className="space-y-4">
                    <div className={cn('flex', 'items-center', 'gap-3', 'text-slate-900', 'font-bold')}>
                      <LuCalendar className={cn('w-5', 'h-5', 'text-primary')} />
                      {event.date}
                    </div>
                    <div className={cn('flex', 'items-center', 'gap-3', 'text-slate-900', 'font-bold')}>
                      <LuMapPin className={cn('w-5', 'h-5', 'text-primary')} />
                      {event.location}
                    </div>
                    <div className={cn('flex', 'items-center', 'justify-between', 'p-4', 'bg-slate-50', 'rounded-2xl', 'border', 'border-slate-100')}>
                      <span className={cn('text-xs', 'font-bold', 'text-slate-500', 'uppercase')}>
                        Slots Left
                      </span>
                      <span className={cn('text-xl', 'font-black', 'text-orange-600')}>
                        {event.slotsRemaining}
                      </span>
                    </div>
                  </div>
                </div>

                {!isRegistered ? (
                  <button className={cn('w-full', 'py-5', 'bg-primary', 'hover:bg-orange-600', 'text-white', 'font-black', 'rounded-2xl', 'transition-all', 'shadow-lg', 'shadow-primary/20', 'flex', 'items-center', 'justify-center', 'gap-2')}>
                    Register Now
                    <LuCircleCheck className={cn('w-5', 'h-5')} />
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button className={cn('w-full', 'py-4', 'bg-slate-900', 'text-white', 'font-black', 'rounded-2xl', 'flex', 'items-center', 'justify-center', 'gap-2')}>
                      <LuTicket className={cn('w-5', 'h-5')} /> View Ticket
                    </button>
                    <button className={cn('w-full', 'py-4', 'border-2', 'border-slate-100', 'text-slate-900', 'font-black', 'rounded-2xl', 'flex', 'items-center', 'justify-center', 'gap-2', 'hover:bg-slate-50')}>
                      <LuCalendarPlus className={cn('w-5', 'h-5')} /> Add to Calendar
                    </button>
                  </div>
                )}

                <p className={cn('text-[10px]', 'text-center', 'text-slate-400', 'font-bold', 'uppercase', 'tracking-widest')}>
                  Secure checkout powered by DIUSCADI
                </p>
              </div>
            </motion.div>

            {/* Additional Sidebar Context */}
            <div className="px-8">
              <p className={cn('text-xs', 'text-slate-400', 'font-medium', 'leading-relaxed')}>
                Need group registration or corporate sponsorship? <br />
                <span className={cn('text-primary', 'font-bold', 'cursor-pointer', 'hover:underline')}>
                  Contact Support
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Export the Event type for use in other components
export type { Event };
