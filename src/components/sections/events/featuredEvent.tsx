"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuCalendar,
  LuMapPin,
  LuArrowRight,
  LuZap,
  LuUsers,
  LuClock,
  LuHistory,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getEventState, EVENT_STATE_CONFIG } from "@/lib/eventUtils";
import type { SpotlightEvent } from "@/app/events/page";

interface FeaturedEventProps {
  event: SpotlightEvent;
}

export const FeaturedEvent = ({ event }: FeaturedEventProps) => {
  const router = useRouter();

  const state = getEventState({
    eventDate: event.eventDate,
    endDate: event.endDate ?? null,
    registrationDeadline: event.registrationDeadline,
    slotsRemaining: event.slotsRemaining ?? 1,
    isFree: event.isFree,
  });

  const cfg = EVENT_STATE_CONFIG[state];
  const isPast = state === "past";
  const canReg = !cfg.btnDisabled;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative group w-full bg-background border border-border rounded-[2.5rem] overflow-hidden",
          "shadow-xl shadow-slate-200/50 flex flex-col lg:flex-row min-h-[450px]",
          isPast && "opacity-90",
        )}
      >
        {/* Image */}
        <div className="lg:w-1/2 relative overflow-hidden h-[250px] lg:h-auto">
          <Image
            src={event.image}
            alt={event.title}
            fill
            className={cn(
              "object-cover group-hover:scale-105 transition-transform duration-700 ease-out",
              isPast && "grayscale-[40%]",
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/40 to-transparent" />

          {/* Spotlight / Past badge */}
          <div
            className={cn(
              "absolute top-6 left-6 flex items-center gap-2 px-4 py-2 backdrop-blur-md rounded-xl shadow-lg",
              isPast ? "bg-slate-800/90" : "bg-background/95",
            )}
          >
            {isPast ? (
              <LuHistory className="w-4 h-4 text-slate-400" />
            ) : (
              <LuZap className="w-4 h-4 text-primary fill-primary" />
            )}
            <span
              className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                isPast ? "text-slate-400" : "text-foreground",
              )}
            >
              {isPast ? "Recently Concluded" : "Featured Spotlight"}
            </span>
          </div>

          {/* Past overlay banner */}
          {isPast && (
            <div className="absolute bottom-0 inset-x-0 py-3 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center gap-2">
              <LuClock className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                This event has ended — no registration available
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          {/* State badge */}
          <div className="flex items-center gap-3 mb-6">
            <span
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                cfg.badgeBg,
                cfg.badgeText,
              )}
            >
              {cfg.label}
            </span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-wider">
              <LuCalendar className="w-4 h-4" /> {event.date}
            </div>
            <div className="w-1 h-1 bg-slate-200 rounded-full" />
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-bold">
              <LuMapPin className="w-4 h-4" /> {event.location}
            </div>
          </div>

          <h2
            className={cn(
              "text-3xl md:text-4xl font-black mb-4 leading-tight",
              isPast ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {event.title}
          </h2>

          <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8 max-w-lg">
            {event.description}
          </p>

          {event.registered > 0 && (
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-primary/10">
                <LuUsers className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                <span className="text-foreground font-black">
                  {event.registered.toLocaleString()}
                </span>{" "}
                {isPast ? "people attended" : "people already registered"}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            {canReg ? (
              <>
                <button
                  onClick={() => router.push(`/events/${event.slug}`)}
                  className="px-8 py-4 bg-primary text-background font-black rounded-2xl hover:bg-orange-600 shadow-lg shadow-primary/20 transition-all flex items-center gap-2 group/btn cursor-pointer"
                >
                  {cfg.btnLabel}
                  <LuArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => router.push(`/events/${event.slug}`)}
                  className="px-8 py-4 bg-muted text-foreground font-bold rounded-2xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  View Details
                </button>
              </>
            ) : (
              /* Past or closed — only show View Details */
              <button
                onClick={() => router.push(`/events/${event.slug}`)}
                className="px-8 py-4 bg-muted text-foreground font-bold rounded-2xl hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-2"
              >
                <LuHistory className="w-4 h-4" />
                View Event Details
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
};
