"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuCalendar, LuMapPin, LuArrowRight } from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { RelatedEventItem } from "@/app/events/[slug]/page";

interface RelatedEventsProps {
  events: RelatedEventItem[];
  currentSlug: string;
}

export const RelatedEvents = ({ events, currentSlug }: RelatedEventsProps) => {
  const router = useRouter();
  const visible = events.filter((e) => e.slug !== currentSlug).slice(0, 3);

  if (visible.length === 0) return null;

  return (
    <section className={cn("w-full", "bg-muted", "py-16")}>
      <div className={cn("max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8")}>
        <div className={cn("flex", "items-center", "justify-between", "mb-10")}>
          <h2
            className={cn(
              "text-2xl",
              "font-black",
              "text-foreground",
              "tracking-tight",
            )}
          >
            More In This Category
          </h2>
          <button
            onClick={() => router.push("/events")}
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "text-xs",
              "font-black",
              "text-primary",
              "hover:underline",
              "cursor-pointer",
            )}
          >
            All Events <LuArrowRight className={cn("w-4", "h-4")} />
          </button>
        </div>

        <div
          className={cn(
            "grid",
            "grid-cols-1",
            "md:grid-cols-2",
            "lg:grid-cols-3",
            "gap-6",
          )}
        >
          {visible.map((event, i) => (
            <motion.button
              key={event.id}
              onClick={() => router.push(`/events/${event.slug}`)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "group",
                "text-left",
                "bg-background",
                "rounded-[2rem]",
                "border",
                "border-border",
                "overflow-hidden",
                "hover:shadow-xl",
                "hover:shadow-slate-200/60",
                "transition-all",
                "duration-300",
                "cursor-pointer",
              )}
            >
              <div className={cn("relative", "h-44", "overflow-hidden")}>
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className={cn(
                    "object-cover",
                    "group-hover:scale-105",
                    "transition-transform",
                    "duration-500",
                  )}
                />
                <div
                  className={cn(
                    "absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow",
                    event.tag === "Upcoming"
                      ? "bg-primary text-background"
                      : "bg-background/90 text-muted-foreground",
                  )}
                >
                  {event.tag}
                </div>
              </div>
              <div className="p-6">
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-3",
                    "text-xs",
                    "text-muted-foreground",
                    "font-bold",
                    "mb-3",
                  )}
                >
                  <span
                    className={cn(
                      "flex",
                      "items-center",
                      "gap-1",
                      "text-primary",
                    )}
                  >
                    <LuCalendar className={cn("w-3", "h-3")} /> {event.date}
                  </span>
                  <span className={cn("flex", "items-center", "gap-1")}>
                    <LuMapPin className={cn("w-3", "h-3")} /> {event.location}
                  </span>
                </div>
                <h3
                  className={cn(
                    "text-base",
                    "font-black",
                    "text-foreground",
                    "group-hover:text-primary",
                    "transition-colors",
                    "line-clamp-2",
                  )}
                >
                  {event.title}
                </h3>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};
