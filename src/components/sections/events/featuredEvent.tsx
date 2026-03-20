"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuCalendar,
  LuMapPin,
  LuArrowRight,
  LuZap,
  LuUsers,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { SpotlightEvent } from "@/app/events/page";

interface FeaturedEventProps {
  event: SpotlightEvent;
}

export const FeaturedEvent = ({ event }: FeaturedEventProps) => {
  const router = useRouter();

  return (
    <section
      className={cn(
        "w-full",
        "max-w-7xl",
        "mx-auto",
        "px-4",
        "sm:px-6",
        "lg:px-8",
        "py-8",
        "md:py-12",
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative",
          "group",
          "w-full",
          "bg-background",
          "border",
          "border-border",
          "rounded-[2.5rem]",
          "overflow-hidden",
          "shadow-xl",
          "shadow-slate-200/50",
          "flex",
          "flex-col",
          "lg:flex-row",
          "min-h-[450px]",
        )}
      >
        {/* Image */}
        <div
          className={cn(
            "lg:w-1/2",
            "relative",
            "overflow-hidden",
            "h-[250px]",
            "lg:h-auto",
          )}
        >
          <Image
            src={event.image}
            alt={event.title}
            fill
            className={cn(
              "object-cover",
              "group-hover:scale-105",
              "transition-transform",
              "duration-700",
              "ease-out",
            )}
          />
          <div
            className={cn(
              "absolute",
              "inset-0",
              "bg-gradient-to-r",
              "from-foreground/40",
              "to-transparent",
            )}
          />
          <div
            className={cn(
              "absolute",
              "top-6",
              "left-6",
              "flex",
              "items-center",
              "gap-2",
              "px-4",
              "py-2",
              "bg-background/95",
              "backdrop-blur-md",
              "rounded-xl",
              "shadow-lg",
              "shadow-black/10",
            )}
          >
            <LuZap
              className={cn("w-4", "h-4", "text-primary", "fill-primary")}
            />
            <span
              className={cn(
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-foreground",
              )}
            >
              Featured Spotlight
            </span>
          </div>
        </div>

        {/* Content */}
        <div
          className={cn(
            "lg:w-1/2",
            "p-8",
            "md:p-12",
            "flex",
            "flex-col",
            "justify-center",
          )}
        >
          <div className={cn("flex", "items-center", "gap-4", "mb-6")}>
            <div
              className={cn(
                "flex",
                "items-center",
                "gap-1.5",
                "text-primary",
                "text-xs",
                "font-black",
                "uppercase",
                "tracking-wider",
              )}
            >
              <LuCalendar className={cn("w-4", "h-4")} /> {event.date}
            </div>
            <div className={cn("w-1", "h-1", "bg-slate-200", "rounded-full")} />
            <div
              className={cn(
                "flex",
                "items-center",
                "gap-1.5",
                "text-muted-foreground",
                "text-xs",
                "font-bold",
              )}
            >
              <LuMapPin className={cn("w-4", "h-4")} /> {event.location}
            </div>
          </div>

          <h2
            className={cn(
              "text-3xl",
              "md:text-4xl",
              "font-black",
              "text-foreground",
              "mb-4",
              "leading-tight",
            )}
          >
            {event.title}
          </h2>

          <p
            className={cn(
              "text-muted-foreground",
              "text-sm",
              "md:text-base",
              "leading-relaxed",
              "mb-8",
              "max-w-lg",
            )}
          >
            {event.description}
          </p>

          {/* Registered count — no fake avatars, just a real count with icon */}
          {event.registered > 0 && (
            <div className={cn("flex", "items-center", "gap-3", "mb-8")}>
              <div
                className={cn(
                  "flex",
                  "items-center",
                  "justify-center",
                  "w-9",
                  "h-9",
                  "rounded-2xl",
                  "bg-primary/10",
                )}
              >
                <LuUsers className={cn("w-4", "h-4", "text-primary")} />
              </div>
              <span
                className={cn("text-xs", "font-bold", "text-muted-foreground")}
              >
                <span className={cn("text-foreground", "font-black")}>
                  {event.registered.toLocaleString()}
                </span>{" "}
                people already registered
              </span>
            </div>
          )}

          <div className={cn("flex", "flex-wrap", "gap-4")}>
            <button
              onClick={() => router.push(`/events/${event.slug}`)}
              className={cn(
                "px-8",
                "py-4",
                "bg-primary",
                "text-background",
                "font-black",
                "rounded-2xl",
                "hover:bg-orange-600",
                "shadow-lg",
                "shadow-primary/20",
                "transition-all",
                "flex",
                "items-center",
                "gap-2",
                "group/btn",
                "cursor-pointer",
              )}
            >
              Register Now
              <LuArrowRight
                className={cn(
                  "w-5",
                  "h-5",
                  "group-hover/btn:translate-x-1",
                  "transition-transform",
                )}
              />
            </button>
            <button
              onClick={() => router.push(`/events/${event.slug}`)}
              className={cn(
                "px-8",
                "py-4",
                "bg-muted",
                "text-foreground",
                "font-bold",
                "rounded-2xl",
                "hover:text-muted",
                "transition-all",
                "cursor-pointer",
              )}
            >
              View Details
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
