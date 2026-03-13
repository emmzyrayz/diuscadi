"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuMic, LuLock } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { EventDetail } from "@/app/events/[eventId]/page";

export const SpeakersSection = ({ event }: { event: EventDetail }) => {
  const hasSpeakers = false; // wire up when speakers[] added to EventDocument

  if (!hasSpeakers) {
    return (
      <section className={cn("w-full", "py-16")}>
        <div
          className={cn("max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8")}
        >
          <div className={cn("flex", "items-center", "gap-3", "mb-10")}>
            <div className={cn("p-2", "bg-primary/10", "rounded-xl")}>
              <LuMic className={cn("w-5", "h-5", "text-primary")} />
            </div>
            <h2
              className={cn(
                "text-2xl",
                "font-black",
                "text-foreground",
                "tracking-tight",
              )}
            >
              Speakers & Facilitators
            </h2>
          </div>

          {/* Placeholder cards */}
          <div
            className={cn(
              "grid",
              "grid-cols-2",
              "sm:grid-cols-3",
              "lg:grid-cols-4",
              "gap-4",
            )}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={cn(
                  "flex",
                  "flex-col",
                  "items-center",
                  "gap-3",
                  "p-6",
                  "bg-muted",
                  "border",
                  "border-border",
                  "rounded-[2rem]",
                  "opacity-50",
                )}
              >
                <div
                  className={cn(
                    "w-16",
                    "h-16",
                    "rounded-full",
                    "bg-slate-200",
                    "flex",
                    "items-center",
                    "justify-center",
                  )}
                >
                  <LuLock
                    className={cn("w-5", "h-5", "text-muted-foreground")}
                  />
                </div>
                <div className={cn("text-center")}>
                  <div
                    className={cn(
                      "h-3",
                      "w-20",
                      "bg-slate-200",
                      "rounded-full",
                      "mb-2",
                    )}
                  />
                  <div
                    className={cn(
                      "h-2",
                      "w-14",
                      "text-muted",
                      "rounded-full",
                      "mx-auto",
                    )}
                  />
                </div>
              </motion.div>
            ))}
          </div>
          <p
            className={cn(
              "mt-6",
              "text-center",
              "text-xs",
              "text-muted-foreground",
              "font-bold",
            )}
          >
            Speakers will be announced soon.
          </p>
        </div>
      </section>
    );
  }

  return null;
};
