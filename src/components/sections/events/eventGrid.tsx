"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuCalendar,
  LuMapPin,
  LuArrowRight,
  LuPlus,
  LuLoader,
  LuClock,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getEventState, EVENT_STATE_CONFIG } from "@/lib/eventUtils";
import type { EventItem } from "@/app/events/page";

const PAGE_SIZE = 6;

interface EventsGridProps {
  events: EventItem[];
}

export const EventsGrid = ({ events }: EventsGridProps) => {
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLoadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setDisplayLimit((p) => p + PAGE_SIZE);
      setIsLoading(false);
    }, 600);
  };

  const visibleEvents = events.slice(0, displayLimit);
  const hasMore = displayLimit < events.length;

  if (events.length === 0) {
    return (
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-muted-foreground font-bold">No events found.</p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <AnimatePresence mode="popLayout">
          {visibleEvents.map((event, index) => {
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
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn(
                  "group flex flex-col bg-background rounded-[2rem] border border-border overflow-hidden",
                  "hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500",
                  isPast && "opacity-70",
                )}
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className={cn(
                      "object-cover group-hover:scale-110 transition-transform duration-700",
                      isPast && "grayscale-[30%]",
                    )}
                  />

                  {/* Greyed overlay for past events */}
                  {isPast && (
                    <div className="absolute inset-0 bg-foreground/20" />
                  )}

                  {/* State badge */}
                  <div
                    className={cn(
                      "absolute top-4 right-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg",
                      cfg.badgeBg,
                      cfg.badgeText,
                    )}
                  >
                    {cfg.badgeLabel}
                  </div>

                  {/* Free badge */}
                  {state === "free" && (
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-background shadow-lg">
                      Free
                    </div>
                  )}

                  {/* Past ribbon */}
                  {isPast && (
                    <div className="absolute bottom-0 inset-x-0 py-2 bg-foreground/70 backdrop-blur-sm text-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-background/80">
                        This event has ended
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-muted-foreground text-xs font-bold mb-3">
                    <div className="flex items-center gap-1.5 text-primary">
                      <LuCalendar className="w-4 h-4" /> {event.date}
                    </div>
                    <div className="w-1 h-1 bg-slate-200 rounded-full" />
                    <div className="flex items-center gap-1.5">
                      <LuMapPin className="w-4 h-4" /> {event.location}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-6 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>

                  <div className="mt-auto pt-6 border-t border-slate-50">
                    {canReg ? (
                      <button
                        onClick={() => router.push(`/events/${event.slug}`)}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm bg-foreground text-background hover:bg-primary transition-all cursor-pointer"
                      >
                        {cfg.btnLabel} <LuArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm",
                          isPast
                            ? "bg-muted text-muted-foreground cursor-default"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed",
                        )}
                      >
                        {isPast ? (
                          <>
                            <LuClock className="w-4 h-4" /> View Past Event
                          </>
                        ) : (
                          cfg.btnLabel
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Showing {visibleEvents.length} of {events.length} Events
            </span>
            <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${(visibleEvents.length / events.length) * 100}%`,
                }}
              />
            </div>
          </div>
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-3 px-10 py-5 bg-background border-2 border-foreground rounded-[2rem]",
              "text-foreground font-black text-sm uppercase tracking-widest transition-all hover:bg-foreground hover:text-background cursor-pointer",
              isLoading && "opacity-70 cursor-wait",
            )}
          >
            {isLoading ? (
              <LuLoader className="w-5 h-5 animate-spin" />
            ) : (
              <LuPlus className="w-5 h-5" />
            )}
            {isLoading ? "Fetching..." : "Load More"}
          </button>
        </div>
      )}
    </section>
  );
};
