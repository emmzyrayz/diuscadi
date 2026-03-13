"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuCalendar, LuMapPin, LuArrowRight, LuInfo } from "react-icons/lu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface EventSummaryProps {
  event: {
    slug: string;
    title: string;
    date: string;
    location: string;
    image: string;
    overview: string;
  };
}

export const EventSummarySection = ({ event }: EventSummaryProps) => (
  <section
    className={cn("w-full", "mt-12", "pt-12", "border-t", "border-border")}
  >
    <div className={cn("flex", "items-center", "gap-3", "mb-6")}>
      <div
        className={cn(
          "w-8",
          "h-8",
          "rounded-lg",
          "text-muted",
          "flex",
          "items-center",
          "justify-center",
          "text-muted-foreground",
        )}
      >
        <LuInfo className={cn("w-4", "h-4")} />
      </div>
      <h3
        className={cn(
          "text-xl",
          "font-black",
          "text-foreground",
          "tracking-tight",
        )}
      >
        Event Details
      </h3>
    </div>

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "group",
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2rem]",
        "overflow-hidden",
        "flex",
        "flex-col",
        "sm:flex-row",
        "hover:border-primary/30",
        "hover:shadow-xl",
        "hover:shadow-slate-200/50",
        "transition-all",
      )}
    >
      {/* Image */}
      <div
        className={cn(
          "w-full",
          "sm:w-48",
          "md:w-56",
          "h-40",
          "sm:h-auto",
          "shrink-0",
          "relative",
          "overflow-hidden",
          "text-muted",
        )}
      >
        <Image
          src={event.image || "/images/events/default.jpg"}
          alt={event.title}
          fill
          className={cn(
            "object-cover",
            "group-hover:scale-105",
            "transition-transform",
            "duration-500",
          )}
        />
      </div>

      {/* Content */}
      <div
        className={cn(
          "flex-1",
          "p-6",
          "md:p-8",
          "flex",
          "flex-col",
          "justify-between",
          "gap-4",
        )}
      >
        <div>
          <h4
            className={cn(
              "text-lg",
              "md:text-xl",
              "font-black",
              "text-foreground",
              "leading-tight",
              "mb-2",
              "group-hover:text-primary",
              "transition-colors",
            )}
          >
            {event.title}
          </h4>
          <p
            className={cn(
              "text-sm",
              "font-medium",
              "text-muted-foreground",
              "line-clamp-2",
              "mb-4",
            )}
          >
            {event.overview}
          </p>
          <div
            className={cn(
              "flex",
              "flex-wrap",
              "items-center",
              "gap-x-6",
              "gap-y-2",
            )}
          >
            <div
              className={cn(
                "flex",
                "items-center",
                "gap-2",
                "text-xs",
                "font-bold",
                "text-slate-600",
              )}
            >
              <LuCalendar className={cn("w-4", "h-4", "text-primary")} />{" "}
              {event.date}
            </div>
            <div
              className={cn(
                "flex",
                "items-center",
                "gap-2",
                "text-xs",
                "font-bold",
                "text-slate-600",
              )}
            >
              <LuMapPin className={cn("w-4", "h-4", "text-slate-300")} />{" "}
              {event.location}
            </div>
          </div>
        </div>
        <div
          className={cn(
            "pt-4",
            "mt-auto",
            "border-t",
            "border-slate-50",
            "flex",
            "justify-end",
          )}
        >
          <Link
            href={`/events/${event.slug}`}
            className={cn(
              "inline-flex",
              "items-center",
              "gap-2",
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "text-muted-foreground",
              "hover:text-primary",
              "transition-colors",
            )}
          >
            View Full Event Page <LuArrowRight className={cn("w-4", "h-4")} />
          </Link>
        </div>
      </div>
    </motion.div>
  </section>
);
