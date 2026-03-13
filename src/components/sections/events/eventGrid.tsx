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
import { useRouter } from "next/navigation";
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
      setDisplayLimit((prev) => prev + PAGE_SIZE);
      setIsLoading(false);
    }, 600);
  };

  const visibleEvents = events.slice(0, displayLimit);
  const hasMore = displayLimit < events.length;

  if (events.length === 0) {
    return (
      <section
        className={cn(
          "w-full",
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "py-20",
          "text-center",
        )}
      >
        <p className={cn("text-muted-foreground", "font-bold")}>
          No events found.
        </p>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "w-full",
        "max-w-7xl",
        "mx-auto",
        "px-4",
        "sm:px-6",
        "lg:px-8",
        "py-12",
      )}
    >
      <div
        className={cn(
          "grid",
          "grid-cols-1",
          "md:grid-cols-2",
          "lg:grid-cols-3",
          "gap-8",
          "mb-16",
        )}
      >
        <AnimatePresence mode="popLayout">
          {visibleEvents.map((event, index) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={cn(
                "group",
                "flex",
                "flex-col",
                "bg-background",
                "rounded-[2rem]",
                "border",
                "border-border",
                "overflow-hidden",
                "hover:shadow-2xl",
                "hover:shadow-slate-200/60",
                "transition-all",
                "duration-500",
              )}
            >
              {/* Image */}
              <div className={cn("relative", "h-56", "overflow-hidden")}>
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className={cn(
                    "object-cover",
                    "group-hover:scale-110",
                    "transition-transform",
                    "duration-700",
                  )}
                />
                <div
                  className={cn(
                    "absolute top-4 right-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg",
                    event.tag === "Upcoming" || event.tag === "Ongoing"
                      ? "bg-primary text-background"
                      : "bg-background/90 text-muted-foreground",
                  )}
                >
                  {event.tag}
                </div>
                {event.isFree && (
                  <div
                    className={cn(
                      "absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-background shadow-lg",
                    )}
                  >
                    Free
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={cn("p-8", "flex", "flex-col", "flex-1")}>
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-3",
                    "text-muted-foreground",
                    "text-xs",
                    "font-bold",
                    "mb-3",
                  )}
                >
                  <div
                    className={cn(
                      "flex",
                      "items-center",
                      "gap-1.5",
                      "text-primary",
                    )}
                  >
                    <LuCalendar className={cn("w-4", "h-4")} /> {event.date}
                  </div>
                  <div
                    className={cn("w-1", "h-1", "bg-slate-200", "rounded-full")}
                  />
                  <div className={cn("flex", "items-center", "gap-1.5")}>
                    <LuMapPin className={cn("w-4", "h-4")} /> {event.location}
                  </div>
                </div>
                <h3
                  className={cn(
                    "text-xl",
                    "font-bold",
                    "text-foreground",
                    "mb-6",
                    "group-hover:text-primary",
                    "transition-colors",
                  )}
                >
                  {event.title}
                </h3>
                <div
                  className={cn(
                    "mt-auto",
                    "pt-6",
                    "border-t",
                    "border-slate-50",
                  )}
                >
                  <button
                    onClick={() => router.push(`/events/${event.slug}`)}
                    className={cn(
                      "w-full",
                      "flex",
                      "items-center",
                      "justify-center",
                      "gap-2",
                      "py-4",
                      "rounded-2xl",
                      "font-black",
                      "text-sm",
                      "bg-foreground",
                      "text-background",
                      "hover:bg-primary",
                      "transition-all",
                      "cursor-pointer",
                    )}
                  >
                    Register Now <LuArrowRight className={cn("w-4", "h-4")} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div
          className={cn(
            "flex",
            "flex-col",
            "items-center",
            "justify-center",
            "gap-6",
          )}
        >
          <div className={cn("flex", "flex-col", "items-center", "gap-2")}>
            <span
              className={cn(
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-muted-foreground",
              )}
            >
              Showing {visibleEvents.length} of {events.length} Events
            </span>
            <div
              className={cn(
                "w-32",
                "h-1",
                "text-muted",
                "rounded-full",
                "overflow-hidden",
              )}
            >
              <div
                className={cn(
                  "h-full",
                  "bg-primary",
                  "transition-all",
                  "duration-500",
                )}
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
              <LuLoader className={cn("w-5", "h-5", "animate-spin")} />
            ) : (
              <LuPlus className={cn("w-5", "h-5")} />
            )}
            {isLoading ? "Fetching..." : "Load More"}
          </button>
        </div>
      )}
    </section>
  );
};
