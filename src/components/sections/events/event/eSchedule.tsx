"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuCalendarClock, LuLock } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { EventDetail } from "@/app/events/[eventId]/page";

// Schedule is not yet stored in EventDocument — rendered as a
// "coming soon" placeholder that preserves visual hierarchy.
// Wire up once the schedule field is added to the model.

export const EventSchedule = ({ event }: { event: EventDetail }) => {
  // Will be replaced when schedule data exists on the document
  const hasSchedule = false;

  if (!hasSchedule) {
    return (
      <section className={cn("w-full", "bg-muted", "py-16")}>
        <div
          className={cn("max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8")}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
              "flex",
              "flex-col",
              "sm:flex-row",
              "sm:items-center",
              "justify-between",
              "gap-6",
              "mb-10",
            )}
          >
            <div className={cn("flex", "items-center", "gap-3")}>
              <div className={cn("p-2", "bg-primary/10", "rounded-xl")}>
                <LuCalendarClock className={cn("w-5", "h-5", "text-primary")} />
              </div>
              <h2
                className={cn(
                  "text-2xl",
                  "font-black",
                  "text-foreground",
                  "tracking-tight",
                )}
              >
                Event Schedule
              </h2>
            </div>
            <span
              className={cn(
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-muted-foreground",
              )}
            >
              {event.eventDate}
            </span>
          </motion.div>

          {/* Placeholder timeline */}
          <div
            className={cn(
              "relative",
              "pl-8",
              "border-l-2",
              "border-dashed",
              "border-border",
              "space-y-6",
            )}
          >
            {[
              "Opening Ceremony",
              "Keynote Address",
              "Workshop Sessions",
              "Networking Break",
              "Closing Remarks",
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={cn(
                  "relative",
                  "flex",
                  "items-center",
                  "gap-4",
                  "p-5",
                  "bg-background",
                  "border",
                  "border-border",
                  "rounded-2xl",
                  "opacity-50",
                )}
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    "absolute",
                    "-left-[1.65rem]",
                    "w-5",
                    "h-5",
                    "rounded-full",
                    "bg-slate-200",
                    "border-4",
                    "border-slate-50",
                  )}
                />
                <LuLock
                  className={cn("w-4", "h-4", "text-slate-300", "shrink-0")}
                />
                <div>
                  <p
                    className={cn(
                      "text-sm",
                      "font-bold",
                      "text-muted-foreground",
                    )}
                  >
                    {item}
                  </p>
                  <p
                    className={cn(
                      "text-[10px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                      "text-slate-300",
                      "mt-0.5",
                    )}
                  >
                    Schedule TBA
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <p
            className={cn(
              "mt-8",
              "text-center",
              "text-xs",
              "text-muted-foreground",
              "font-bold",
            )}
          >
            Full schedule will be published closer to the event date.
          </p>
        </div>
      </section>
    );
  }

  return null; // replace with real schedule render when data exists
};
