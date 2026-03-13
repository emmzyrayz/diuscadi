"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuBuilding2 } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { EventDetail } from "@/app/events/[eventId]/page";

export const SponsorsSection = ({ event }: { event: EventDetail }) => {
  const hasSponsors = false; // wire up when sponsors[] added to EventDocument

  if (!hasSponsors)
    return (
      <section className={cn("w-full", "bg-muted", "py-14")}>
        <div
          className={cn(
            "max-w-7xl",
            "mx-auto",
            "px-4",
            "sm:px-6",
            "lg:px-8",
            "text-center",
          )}
        >
          <div
            className={cn(
              "flex",
              "items-center",
              "justify-center",
              "gap-3",
              "mb-8",
            )}
          >
            <LuBuilding2 className={cn("w-5", "h-5", "text-muted-foreground")} />
            <h2
              className={cn(
                "text-sm",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-muted-foreground",
              )}
            >
              Powered By
            </h2>
          </div>
          <div
            className={cn(
              "flex",
              "flex-wrap",
              "items-center",
              "justify-center",
              "gap-6",
            )}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  "h-8",
                  "w-24",
                  "bg-slate-200",
                  "rounded-lg",
                  "opacity-40",
                )}
              />
            ))}
          </div>
          <p className={cn("mt-6", "text-xs", "text-slate-300", "font-bold")}>
            Interested in sponsoring {event.title}?{" "}
            <span className={cn("underline", "cursor-pointer")}>
              Get in touch
            </span>
            .
          </p>
        </div>
      </section>
    );

  return null;
};
