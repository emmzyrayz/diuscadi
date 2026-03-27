"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuCalendar,
  LuMapPin,
  LuUsers,
  LuTag,
  LuArrowLeft,
  LuShare2,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { EventDetail } from "@/app/events/[slug]/page";

const FORMAT_LABEL: Record<string, string> = {
  physical: "In-Person",
  virtual: "Virtual",
  hybrid: "Hybrid",
};

const FORMAT_COLOR: Record<string, string> = {
  physical: "bg-emerald-500 text-background",
  virtual: "bg-blue-500 text-background",
  hybrid: "bg-purple-500 text-background",
};

export const EventHero = ({ event }: { event: EventDetail }) => {
  const router = useRouter();

  const locationLine =
    [event.location.venue, event.location.city, event.location.state]
      .filter(Boolean)
      .join(", ") ||
    FORMAT_LABEL[event.format] ||
    event.format;

  const fillPct = Math.min(
    100,
    Math.round((event.registered / event.capacity) * 100),
  );

  return (
    <section
      className={cn(
        "relative",
        "w-full",
        "min-h-[70vh]",
        "overflow-hidden",
        "bg-slate-950",
      )}
    >
      {/* Background image */}
      <Image
        src={event.image}
        alt={event.title}
        fill
        priority
        className={cn("object-cover", "opacity-30")}
      />
      {/* Gradient overlay */}
      <div
        className={cn(
          "absolute",
          "inset-0",
          "bg-gradient-to-t",
          "from-slate-950",
          "via-slate-950/60",
          "to-transparent",
        )}
      />

      {/* Back button */}
      <div
        className={cn("absolute", "top-[88px]", "left-4", "sm:left-8", "z-20")}
      >
        <button
          onClick={() => router.push("/events")}
          className={cn(
            "flex",
            "items-center",
            "gap-2",
            "px-4",
            "py-2",
            "bg-background/10",
            "backdrop-blur-md",
            "text-background",
            "text-xs",
            "font-black",
            "uppercase",
            "tracking-widest",
            "rounded-xl",
            "hover:bg-background/20",
            "transition-all",
            "cursor-pointer",
          )}
        >
          <LuArrowLeft className={cn("w-4", "h-4")} /> Events
        </button>
      </div>

      {/* Content */}
      <div
        className={cn(
          "relative",
          "z-10",
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "pt-40",
          "pb-20",
          "flex",
          "flex-col",
          "justify-end",
          "min-h-[70vh]",
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Badges row */}
          <div className={cn("flex", "flex-wrap", "items-center", "gap-3")}>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                FORMAT_COLOR[event.format] ??
                  "bg-background/20 text-background",
              )}
            >
              {FORMAT_LABEL[event.format] ?? event.format}
            </span>
            {event.level && (
              <span
                className={cn(
                  "px-3",
                  "py-1",
                  "rounded-full",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "bg-background/10",
                  "text-background/80",
                )}
              >
                {event.level}
              </span>
            )}
            <span
              className={cn(
                "px-3",
                "py-1",
                "rounded-full",
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "bg-background/10",
                "text-background/80",
              )}
            >
              {event.category}
            </span>
          </div>

          {/* Title */}
          <h1
            className={cn(
              "text-4xl",
              "sm:text-5xl",
              "lg:text-7xl",
              "font-black",
              "text-background",
              "tracking-tighter",
              "leading-none",
              "max-w-4xl",
            )}
          >
            {event.title}
          </h1>

          {/* Short description */}
          {event.shortDescription && (
            <p
              className={cn(
                "text-background/70",
                "text-base",
                "md:text-lg",
                "max-w-2xl",
                "font-medium",
                "leading-relaxed",
              )}
            >
              {event.shortDescription}
            </p>
          )}

          {/* Meta row */}
          <div
            className={cn(
              "flex",
              "flex-wrap",
              "items-center",
              "gap-6",
              "text-background/80",
              "text-sm",
              "font-bold",
            )}
          >
            <div className={cn("flex", "items-center", "gap-2")}>
              <LuCalendar className={cn("w-4", "h-4", "text-primary")} />
              {event.eventDate}
            </div>
            {locationLine && (
              <div className={cn("flex", "items-center", "gap-2")}>
                <LuMapPin className={cn("w-4", "h-4", "text-primary")} />
                {locationLine}
              </div>
            )}
            <div className={cn("flex", "items-center", "gap-2")}>
              <LuUsers className={cn("w-4", "h-4", "text-primary")} />
              {event.registered.toLocaleString()} registered
            </div>
            {event.tags.length > 0 && (
              <div className={cn("flex", "items-center", "gap-2")}>
                <LuTag className={cn("w-4", "h-4", "text-primary")} />
                {event.tags.slice(0, 3).join(" · ")}
              </div>
            )}
          </div>

          {/* Capacity bar */}
          <div className={cn("max-w-xs", "space-y-1")}>
            <div
              className={cn(
                "flex",
                "justify-between",
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
              )}
            >
              <span className="text-background/50">Spots Filled</span>
              <span className="text-primary">{fillPct}%</span>
            </div>
            <div
              className={cn(
                "w-full",
                "h-1.5",
                "bg-background/10",
                "rounded-full",
                "overflow-hidden",
              )}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${fillPct}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={cn("h-full", "bg-primary", "rounded-full")}
              />
            </div>
          </div>

          {/* Share */}
          <button
            onClick={() =>
              navigator.share?.({
                title: event.title,
                url: window.location.href,
              })
            }
            className={cn(
              "inline-flex",
              "items-center",
              "gap-2",
              "text-background/50",
              "hover:text-background",
              "text-xs",
              "font-bold",
              "transition-colors",
              "cursor-pointer",
            )}
          >
            <LuShare2 className={cn("w-4", "h-4")} /> Share Event
          </button>
        </motion.div>
      </div>
    </section>
  );
};
