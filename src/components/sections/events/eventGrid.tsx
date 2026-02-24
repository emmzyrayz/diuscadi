"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuCalendar,
  LuMapPin,
  LuArrowRight,
  LuPlus,
  LuLoader,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Mock Data
const ALL_EVENTS = [
  {
    id: 1,
    title: "Product Design Mastery",
    date: "Mar 22",
    location: "Lagos",
    tag: "Upcoming",
    image:
      "https://images.unsplash.com/photo-1558403194-611308249627?q=80&w=400",
  },
  {
    id: 2,
    title: "Backend with Go",
    date: "Mar 28",
    location: "Virtual",
    tag: "Upcoming",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400",
  },
  {
    id: 3,
    title: "Networking Mixer",
    date: "Feb 10",
    location: "Abuja",
    tag: "Past",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=400",
  },
  {
    id: 4,
    title: "React Summit 2026",
    date: "Apr 05",
    location: "Lagos",
    tag: "Upcoming",
    image:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400",
  },
  {
    id: 5,
    title: "Startup Funding 101",
    date: "Apr 12",
    location: "Virtual",
    tag: "Upcoming",
    image:
      "https://images.unsplash.com/photo-1553484771-047a44eee27b?q=80&w=400",
  },
  {
    id: 6,
    title: "AI in Fintech",
    date: "May 01",
    location: "Lagos",
    tag: "Upcoming",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=400",
  },
];

export const EventsGrid = () => {
  const [displayLimit, setDisplayLimit] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = () => {
    setIsLoading(true);
    // Simulate API Fetch Delay
    setTimeout(() => {
      setDisplayLimit((prev) => prev + 3);
      setIsLoading(false);
    }, 800);
  };

  const visibleEvents = ALL_EVENTS.slice(0, displayLimit);
  const hasMore = displayLimit < ALL_EVENTS.length;

  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-12')}>
      {/* GRID CONTAINER */}
      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-8', 'mb-16')}>
        <AnimatePresence mode="popLayout">
          {visibleEvents.map((event, index) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={cn('group', 'flex', 'flex-col', 'bg-white', 'rounded-[2rem]', 'border', 'border-slate-100', 'overflow-hidden', 'hover:shadow-2xl', 'hover:shadow-slate-200/60', 'transition-all', 'duration-500')}
            >
              {/* Image Header */}
              <div className={cn('relative', 'h-56', 'overflow-hidden')}>
                <Image
                  height={300}
                  width={500}
                  src={event.image}
                  alt={event.title}
                  className={cn('w-full', 'h-full', 'object-cover', 'group-hover:scale-110', 'transition-transform', 'duration-700')}
                />
                <div
                  className={cn(
                    "absolute top-4 right-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg",
                    event.tag === "Upcoming"
                      ? "bg-primary text-white"
                      : "bg-white/90 text-slate-500",
                  )}
                >
                  {event.tag}
                </div>
              </div>

              {/* Content */}
              <div className={cn('p-8', 'flex', 'flex-col', 'flex-1')}>
                <div className={cn('flex', 'items-center', 'gap-3', 'text-slate-400', 'text-xs', 'font-bold', 'mb-3')}>
                  <div className={cn('flex', 'items-center', 'gap-1.5', 'text-primary')}>
                    <LuCalendar className={cn('w-4', 'h-4')} /> {event.date}
                  </div>
                  <div className={cn('w-1', 'h-1', 'bg-slate-200', 'rounded-full')} />
                  <div className={cn('flex', 'items-center', 'gap-1.5')}>
                    <LuMapPin className={cn('w-4', 'h-4')} /> {event.location}
                  </div>
                </div>
                <h3 className={cn('text-xl', 'font-bold', 'text-slate-900', 'mb-6', 'group-hover:text-primary', 'transition-colors')}>
                  {event.title}
                </h3>
                <div className={cn('mt-auto', 'pt-6', 'border-t', 'border-slate-50')}>
                  <button className={cn('w-full', 'flex', 'items-center', 'justify-center', 'gap-2', 'py-4', 'rounded-2xl', 'font-black', 'text-sm', 'bg-slate-900', 'text-white', 'hover:bg-primary', 'transition-all')}>
                    Register Now <LuArrowRight className={cn('w-4', 'h-4')} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* INTEGRATED LOAD MORE BUTTON */}
      {hasMore && (
        <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'gap-6')}>
          <div className={cn('flex', 'flex-col', 'items-center', 'gap-2')}>
            <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400')}>
              Showing {visibleEvents.length} of {ALL_EVENTS.length} Events
            </span>
            <div className={cn('w-32', 'h-1', 'bg-slate-100', 'rounded-full', 'overflow-hidden')}>
              <div
                className={cn('h-full', 'bg-primary', 'transition-all', 'duration-500')}
                style={{
                  width: `${(visibleEvents.length / ALL_EVENTS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-3 px-10 py-5 bg-white border-2 border-slate-900 rounded-[2rem]",
              "text-slate-900 font-black text-sm uppercase tracking-widest transition-all hover:bg-slate-900 hover:text-white",
              isLoading && "opacity-70 cursor-wait",
            )}
          >
            {isLoading ? (
              <LuLoader className={cn('w-5', 'h-5', 'animate-spin')} />
            ) : (
              <LuPlus className={cn('w-5', 'h-5')} />
            )}
            {isLoading ? "Fetching..." : "Load More"}
          </button>
        </div>
      )}
    </section>
  );
};
