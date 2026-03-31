"use client";
import { useEffect } from "react";
import { useEvents } from "@/context/EventContext";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Clock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import img1 from "@/assets/img/downloads/Diuscadi-2023-Testimonial-Thumbnail-1920x1272.webp";
import { cn } from "@/lib/utils";

export const UpcomingEvent = () => {
  const { publicEvents, loadPublicEvents, publicEventsLoading } = useEvents();

  useEffect(() => {
    loadPublicEvents(1); // Load the single latest upcoming event
  }, [loadPublicEvents]);

  if (publicEventsLoading) return <div className="py-24 text-center">Loading Event...</div>;

  // Handle Empty State (Production)
  if (publicEvents.length === 0) {
    return (
      <section className="py-24 bg-background text-center">
        <p className="text-muted-foreground">No upcoming events at the moment. Check back soon!</p>
      </section>
    );
  }

  const event = publicEvents[0];
  const isDummy = event.id.includes("dummy");

  return (
    <section className={cn("w-full rounded-2xl py-24", "bg-background")}>
      <div className={cn("min-w-full", "mx-auto", "px-6")}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={cn(
            "relative",
            "w-full",
            "rounded-[2.5rem]",
            "overflow-hidden",
            "shadow-2xl",
            "bg-foreground",
          )}
        >
          {/* DEMO BADGE */}
          {isDummy && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-yellow-500/90 text-black px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
              <AlertCircle className="w-3 h-3" /> DEMO DATA
            </div>
          )}

          {/* BACKGROUND IMAGE WITH OVERLAY */}
          <div className={cn("absolute", "inset-0", "w-full", "h-full", "z-0")}>
            <Image
              src={img1} // Replace with a wide shot of a previous event or a cool tech/campus background
              alt="Upcoming Event Background"
              fill
              className={cn("object-cover", "opacity-40", "mix-blend-overlay")}
            />
            {/* Gradient overlay to ensure text is always readable */}
            <div
              className={cn(
                "absolute",
                "inset-0",
                "bg-linear-to-r",
                "from-foreground",
                "via-foreground/90",
                "to-transparent",
                "md:to-foreground/40",
              )}
            />
          </div>

          {/* FOREGROUND CONTENT */}
          <div
            className={cn(
              "relative",
              "z-10",
              "flex",
              "flex-col",
              "md:flex-row",
              "items-center",
              "justify-between",
              "p-8",
              "md:p-16",
              "gap-10",
            )}
          >
            {/* Left Side: Event Info */}
            <div className={cn("w-full", "md:w-2/3", "space-y-8")}>
              {/* Event Badge */}
              <div
                className={cn(
                  "inline-flex",
                  "items-center",
                  "gap-2",
                  "px-4",
                  "py-2",
                  "rounded-full",
                  "bg-background/10",
                  "backdrop-blur-md",
                  "border",
                  "border-background/20",
                  "text-background",
                  "text-sm",
                  "font-semibold",
                  "tracking-wide",
                  "uppercase",
                )}
              >
                <span className={cn("relative", "flex", "h-3", "w-3")}>
                  <span
                    className={cn(
                      "animate-ping",
                      "absolute",
                      "inline-flex",
                      "h-full",
                      "w-full",
                      "rounded-full",
                      "bg-secondary",
                      "opacity-75",
                    )}
                  ></span>
                  <span
                    className={cn(
                      "relative",
                      "inline-flex",
                      "rounded-full",
                      "h-3",
                      "w-3",
                      "bg-secondary",
                    )}
                  ></span>
                </span>
                Next Big Event
              </div>

              {/* Title & Description */}
              <div className={cn("space-y-4", "text-background", "text-left")}>
                <h2
                  className={cn(
                    "text-3xl",
                    "md:text-5xl",
                    "font-extrabold",
                    "leading-tight",
                    "tracking-tight",
                  )}
                >
                  #LASCDSS5:{" "}
                  <span className="text-primary">Life After School</span>{" "}
                  Bootcamp 2026
                </h2>
                <p
                  className={cn(
                    "text-slate-300",
                    "text-lg",
                    "md:text-xl",
                    "max-w-2xl",
                    "leading-relaxed",
                  )}
                >
                  Join hundreds of fresh graduates for an intensive 2-day
                  bootcamp. Master interview skills, network with top employers,
                  and build a resilient career roadmap.
                </p>
              </div>

              {/* Event Metadata (Date, Time, Location) */}
              <div
                className={cn(
                  "flex",
                  "flex-wrap",
                  "items-center",
                  "gap-6",
                  "pt-2",
                )}
              >
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-3",
                    "text-slate-200",
                    "bg-background/5",
                    "px-4",
                    "py-3",
                    "rounded-xl",
                    "backdrop-blur-sm",
                    "border",
                    "border-background/10",
                  )}
                >
                  <CalendarDays className={cn("w-5", "h-5", "text-primary")} />
                  <span className="font-medium">Oct 15 - 16, 2026</span>
                </div>
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-3",
                    "text-slate-200",
                    "bg-background/5",
                    "px-4",
                    "py-3",
                    "rounded-xl",
                    "backdrop-blur-sm",
                    "border",
                    "border-background/10",
                  )}
                >
                  <Clock className={cn("w-5", "h-5", "text-primary")} />
                  <span className="font-medium">9:00 AM WAT</span>
                </div>
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-3",
                    "text-slate-200",
                    "bg-background/5",
                    "px-4",
                    "py-3",
                    "rounded-xl",
                    "backdrop-blur-sm",
                    "border",
                    "border-background/10",
                  )}
                >
                  <MapPin className={cn("w-5", "h-5", "text-primary")} />
                  <span className="font-medium">Nnamdi Azikiwe University</span>
                </div>
              </div>
            </div>

            {/* Right Side: CTA & Urgency */}
            <div
              className={cn(
                "w-full",
                "md:w-1/3",
                "flex",
                "flex-col",
                "items-start",
                "md:items-end",
                "gap-6",
                "border-t",
                "border-background/10",
                "md:border-t-0",
                "md:border-l",
                "pt-8",
                "md:pt-0",
                "md:pl-10",
                "mt-4",
                "md:mt-0",
              )}
            >
              <div className={cn("text-left", "md:text-right", "space-y-2")}>
                <p className={cn("text-slate-300", "font-medium")}>
                  Limited Seats Available
                </p>
                <p className={cn("text-background/60", "text-sm")}>
                  Registration closes in 14 days.
                </p>
              </div>

              <div className={cn("flex", "flex-col", "w-full", "gap-3")}>
                {/* Primary Action */}
                <Button
                  size="lg"
                  asChild
                  className={cn(
                    "flex flex-row ",
                    "w-full",
                    "h-14",
                    "text-lg",
                    "font-bold",
                    "shadow-lg",
                    "shadow-primary/30",
                    "hover:scale-105",
                    "transition-transform",
                  )}
                >
                  <Link href={`/events/${event.slug}/register`}>
                    Register Now{" "}
                    <ArrowRight className={cn("ml-2", "w-5", "h-5")} />
                  </Link>
                </Button>

                {/* Secondary Action (Leads to the dynamic event page you mentioned) */}
                <Button
                  variant="outline"
                  asChild
                  size="lg"
                  className={cn(
                    "w-full",
                    "h-14",
                    "text-lg",
                    "text-background",
                    "border-background/20",
                    "bg-background/5",
                    "hover:bg-background/10",
                    "hover:text-background",
                    "backdrop-blur-md",
                  )}
                >
                  <Link href={`/events/${event.slug}`}>
                    View Full Agenda
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
