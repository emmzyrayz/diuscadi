"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuCalendar,
  LuMapPin,
//   LuUsers,
  LuArrowRight,
  LuZap,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Image1 from "@/assets/img/downloads/Diuscadi-2023-Testimonial-Thumbnail-1920x1272.webp"

export const FeaturedEvent = () => {
  // Mock data for the spotlight event
  const event = {
    title: "National Career Strategy Summit 2026",
    date: "Saturday, April 12 • 09:00 AM",
    location: "Eko Hotels & Suites, Lagos / Hybrid",
    description:
      "Join 5,000+ professionals and industry leaders for Nigeria's largest career transformation event. Featuring keynote speakers from Google, Microsoft, and top African startups.",
    image: Image1,
    attendees: "1.2k already registered",
  };

  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-8', 'md:py-12')}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('relative', 'group', 'w-full', 'bg-white', 'border', 'border-slate-100', 'rounded-[2.5rem]', 'overflow-hidden', 'shadow-xl', 'shadow-slate-200/50', 'flex', 'flex-col', 'lg:flex-row', 'min-h-[450px]')}
      >
        {/* LEFT/TOP: Image Section */}
        <div className={cn('lg:w-1/2', 'relative', 'overflow-hidden', 'h-[250px]', 'lg:h-auto')}>
                  <Image
                      height={300}
                      width={500}
            src={event.image}
            alt={event.title}
            className={cn('absolute', 'inset-0', 'w-full', 'h-full', 'object-cover', 'group-hover:scale-105', 'transition-transform', 'duration-700', 'ease-out')}
          />
          <div className={cn('absolute', 'inset-0', 'bg-linear-to-r', 'from-slate-900/40', 'to-transparent')} />

          {/* Spotlight Badge */}
          <div className={cn('absolute', 'top-6', 'left-6', 'flex', 'items-center', 'gap-2', 'px-4', 'py-2', 'bg-white/95', 'backdrop-blur-md', 'rounded-xl', 'shadow-lg', 'shadow-black/10')}>
            <LuZap className={cn('w-4', 'h-4', 'text-primary', 'fill-primary')} />
            <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-900')}>
              Featured Spotlight
            </span>
          </div>
        </div>

        {/* RIGHT/BOTTOM: Content Section */}
        <div className={cn('lg:w-1/2', 'p-8', 'md:p-12', 'flex', 'flex-col', 'justify-center')}>
          <div className={cn('flex', 'items-center', 'gap-4', 'mb-6')}>
            <div className={cn('flex', 'items-center', 'gap-1.5', 'text-primary', 'text-xs', 'font-black', 'uppercase', 'tracking-wider')}>
              <LuCalendar className={cn('w-4', 'h-4')} />
              {event.date}
            </div>
            <div className={cn('w-1', 'h-1', 'bg-slate-200', 'rounded-full')} />
            <div className={cn('flex', 'items-center', 'gap-1.5', 'text-slate-500', 'text-xs', 'font-bold')}>
              <LuMapPin className={cn('w-4', 'h-4')} />
              {event.location}
            </div>
          </div>

          <h2 className={cn('text-3xl', 'md:text-4xl', 'font-black', 'text-slate-900', 'mb-4', 'leading-tight')}>
            {event.title}
          </h2>

          <p className={cn('text-slate-500', 'text-sm', 'md:text-base', 'leading-relaxed', 'mb-8', 'max-w-lg')}>
            {event.description}
          </p>

          <div className={cn('flex', 'items-center', 'gap-3', 'mb-8')}>
            <div className={cn('flex', '-space-x-2')}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn('w-6', 'h-6', 'rounded-full', 'border-2', 'border-white', 'bg-slate-200', 'overflow-hidden')}
                >
                  <Image height={300} width={500} src={`https://i.pravatar.cc/100?u=${i}`} alt="avatar" />
                </div>
              ))}
            </div>
            <span className={cn('text-xs', 'font-bold', 'text-slate-400', 'italic')}>
              {event.attendees}
            </span>
          </div>

          <div className={cn('flex', 'flex-wrap', 'gap-4')}>
            <button className={cn('px-8', 'py-4', 'bg-primary', 'text-white', 'font-black', 'rounded-2xl', 'hover:bg-orange-600', 'shadow-lg', 'shadow-primary/20', 'transition-all', 'flex', 'items-center', 'gap-2', 'group/btn cursor-pointer')}>
              Register Now
              <LuArrowRight className={cn('w-5', 'h-5', 'group-hover/btn:translate-x-1', 'transition-transform')} />
            </button>
            <button className={cn('px-8', 'py-4', 'bg-slate-50', 'text-slate-900', 'font-bold', 'rounded-2xl', 'hover:bg-slate-100', 'transition-all cursor-pointer')}>
              View Details
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
