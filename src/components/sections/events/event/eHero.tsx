"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuCalendar, LuMapPin, LuArrowLeft, LuShare2, LuHeart } from "react-icons/lu";
import { cn } from "../../../../lib/utils";
import Image from "next/image";
import { Event } from "@/types/event";

// Define the shape of our event data for TypeScript safety
interface EventHeroProps {
  event: Event;
}

export const EventHero = ({ event }: EventHeroProps) => {
  // Fallback image if event.image is undefined
    const eventImage = event.image || "/images/default-event-bg.jpg";
    
  return (
    <section
      className={cn(
        "relative",
        "w-full",
        "min-h-[550px]",
        "flex",
        "items-end",
        "overflow-hidden",
        "bg-slate-900",
      )}
    >
      {/* Dynamic Background Image */}
      <div className={cn("absolute", "inset-0", "z-0")}>
        <Image
          height={300}
          width={500}
          src={eventImage}
          alt={event.title}
          className={cn("w-full", "h-full", "object-cover", "opacity-60")}
        />
        <div
          className={cn(
            "absolute",
            "inset-0",
            "bg-linear-to-t",
            "from-slate-950",
            "via-slate-950/40",
            "to-transparent",
          )}
        />
      </div>

      <div
        className={cn(
          "relative",
          "z-10",
          "w-full",
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "pb-12",
          "md:pb-20",
        )}
      >
        {/* Navigation & Actions */}
        <div
          className={cn(
            "flex",
            "items-center",
            "justify-between",
            "mb-12",
            "md:mb-24",
          )}
        >
          <button
            onClick={() => window.history.back()}
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "text-white/70",
              "hover:text-white",
              "font-bold",
              "text-sm",
              "transition-colors",
              "group",
            )}
          >
            <LuArrowLeft
              className={cn(
                "w-4",
                "h-4",
                "group-hover:-translate-x-1",
                "transition-transform",
              )}
            />
            Back to Events
          </button>

          <div className={cn("flex", "items-center", "gap-3")}>
            <button
              className={cn(
                "p-3",
                "bg-white/10",
                "backdrop-blur-md",
                "rounded-xl",
                "text-white",
                "hover:bg-white/20",
                "transition-all",
                "border",
                "border-white/5",
              )}
            >
              <LuShare2 className={cn("w-5", "h-5")} />
            </button>
            <button
              className={cn(
                "p-3",
                "bg-white/10",
                "backdrop-blur-md",
                "rounded-xl",
                "text-white",
                "hover:text-primary",
                "transition-all",
                "border",
                "border-white/5",
              )}
            >
              <LuHeart className={cn("w-5", "h-5")} />
            </button>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div
              className={cn(
                "inline-flex",
                "items-center",
                "gap-2",
                "px-3",
                "py-1",
                "bg-primary",
                "rounded-lg",
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-white",
                "shadow-lg",
                "shadow-primary/30",
              )}
            >
              Registration Open
            </div>

            {/* The Dynamic Title */}
            <h1
              className={cn(
                "text-4xl",
                "md:text-7xl",
                "font-black",
                "text-white",
                "leading-[1.1]",
                "tracking-tighter",
              )}
            >
              {event.title.split(":").length > 1 ? (
                <>
                  {event.title.split(":")[0]}:<br />
                  <span className="text-primary">
                    {event.title.split(":")[1]}
                  </span>
                </>
              ) : (
                event.title
              )}
            </h1>

            <div
              className={cn(
                "flex",
                "flex-wrap",
                "items-center",
                "gap-6",
                "text-white/80",
                "font-medium",
              )}
            >
              <div className={cn("flex", "items-center", "gap-2", "text-lg")}>
                <LuCalendar className={cn("text-primary", "w-6", "h-6")} />
                {event.date}
              </div>
              <div className={cn("flex", "items-center", "gap-2", "text-lg")}>
                <LuMapPin className={cn("text-primary", "w-6", "h-6")} />
                {event.location}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};;