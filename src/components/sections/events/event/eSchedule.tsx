"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuClock,
  LuCoffee,
  LuMic,
  LuUsers,
  LuChevronRight,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

const scheduleData = [
  {
    time: "09:00 AM",
    title: "Registration & Breakfast",
    desc: "Check-in at the main lobby and collect your attendee badge and welcome kit.",
    type: "Logistics",
    icon: <LuUsers className={cn('w-5', 'h-5')} />,
  },
  {
    time: "10:00 AM",
    title: "Opening Keynote: Future of African Tech",
    desc: "A vision for the next decade of digital transformation across the continent.",
    type: "Keynote",
    icon: <LuMic className={cn('w-5', 'h-5')} />,
  },
  {
    time: "11:30 AM",
    title: "Workshop: Building Scalable Careers",
    desc: "Interactive session on architectural career growth and personal branding.",
    type: "Workshop",
    icon: <LuChevronRight className={cn('w-5', 'h-5')} />,
  },
  {
    time: "01:00 PM",
    title: "Lunch Break & Networking",
    desc: "Complimentary lunch served in the garden. Great time to meet fellow attendees.",
    type: "Break",
    icon: <LuCoffee className={cn('w-5', 'h-5')} />,
  },
  {
    time: "02:30 PM",
    title: "1-on-1 Mentorship Speed Dating",
    desc: "15-minute rapid-fire advice sessions with industry executives.",
    type: "Special",
    icon: <LuClock className={cn('w-5', 'h-5')} />,
  },
];

export const EventSchedule = () => {
  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-20', 'bg-slate-50/50', 'rounded-[3rem]', 'my-12', 'border', 'border-slate-100')}>
      <div className={cn('text-center', 'max-w-2xl', 'mx-auto', 'mb-16')}>
        <h3 className={cn('text-sm', 'font-black', 'text-primary', 'uppercase', 'tracking-[0.3em]', 'mb-4')}>
          The Itinerary
        </h3>
        <h2 className={cn('text-3xl', 'md:text-5xl', 'font-black', 'text-slate-900', 'tracking-tighter')}>
          Event{" "}
          <span className={cn('underline', 'decoration-primary/30', 'decoration-8', 'underline-offset-4')}>
            Schedule
          </span>
        </h2>
      </div>

      <div className={cn('max-w-4xl', 'mx-auto', 'relative')}>
        {/* The Central Timeline Line */}
        <div className={cn('absolute', 'left-8', 'md:left-1/2', 'top-0', 'bottom-0', 'w-px', 'bg-slate-200', '-translate-x-1/2', 'hidden', 'md:block')} />

        <div className="space-y-12">
          {scheduleData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative flex flex-col md:flex-row items-start md:items-center gap-8",
                index % 2 === 0 ? "md:flex-row-reverse" : "",
              )}
            >
              {/* Desktop Time Indicator */}
              <div className={cn('hidden', 'md:flex', 'flex-1', 'justify-end', 'text-right', 'px-8')}>
                <div
                  className={cn(
                    "text-xl font-black transition-colors",
                    index === 1 ? "text-primary" : "text-slate-400",
                  )}
                >
                  {item.time}
                </div>
              </div>

              {/* Central Icon Node */}
              <div className={cn('z-10', 'shrink-0', 'w-16', 'h-16', 'bg-white', 'border-4', 'border-slate-50', 'rounded-2xl', 'flex', 'items-center', 'justify-center', 'text-slate-900', 'shadow-xl', 'shadow-slate-200/50')}>
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    item.type === "Break"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-slate-900 text-white",
                  )}
                >
                  {item.icon}
                </div>
              </div>

              {/* Content Card */}
              <div className={cn('flex-1', 'w-full', 'bg-white', 'p-6', 'md:p-8', 'rounded-[2rem]', 'border', 'border-slate-100', 'shadow-sm', 'hover:shadow-md', 'transition-shadow')}>
                <div className={cn('md:hidden', 'text-primary', 'font-black', 'text-sm', 'mb-2')}>
                  {item.time}
                </div>
                <div className={cn('flex', 'items-center', 'gap-3', 'mb-2')}>
                  <span className={cn('px-3', 'py-0.5', 'bg-slate-100', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-500', 'rounded-md')}>
                    {item.type}
                  </span>
                </div>
                <h4 className={cn('text-xl', 'font-bold', 'text-slate-900', 'mb-2')}>
                  {item.title}
                </h4>
                <p className={cn('text-slate-500', 'text-sm', 'leading-relaxed')}>
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
