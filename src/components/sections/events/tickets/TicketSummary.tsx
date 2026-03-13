"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LuCalendar, LuMapPin, LuClock, LuTag } from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { RegisterEventData } from "@/app/events/[eventId]/register/page";

const FORMAT_LABEL: Record<string, string> = {
  physical: "In-Person",
  virtual: "Virtual",
  hybrid: "Hybrid",
};
const FORMAT_COLOR: Record<string, string> = {
  physical: "bg-emerald-100 text-emerald-700",
  virtual: "bg-blue-100 text-blue-700",
  hybrid: "bg-purple-100 text-purple-700",
};

function useCountdown(deadline: string) {
  const getRemaining = () => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      mins: Math.floor((diff % 3_600_000) / 60_000),
      secs: Math.floor((diff % 60_000) / 1_000),
    };
  };
  const [time, setTime] = useState(() => getRemaining());
  useEffect(() => {
    const id = setInterval(() => setTime(getRemaining()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);
  return time;
}

export const TicketEventSummary = ({ event }: { event: RegisterEventData }) => {
  const router = useRouter();
  const time = useCountdown(event.registrationDeadline);
  const fillPct = Math.min(
    100,
    Math.round((event.registered / event.capacity) * 100),
  );

  return (
    <section
      className={cn(
        "w-full",
        "bg-background",
        "py-10",
        "md:py-14",
        "border-b",
        "border-border",
      )}
    >
      <div className={cn("max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8")}>
        {/* Breadcrumb */}
        <div
          className={cn(
            "mb-8",
            "flex",
            "items-center",
            "gap-2",
            "text-xs",
            "font-bold",
            "text-muted-foreground",
            "uppercase",
            "tracking-widest",
          )}
        >
          <button
            onClick={() => router.push("/events")}
            className={cn(
              "hover:text-primary",
              "transition-colors",
              "cursor-pointer",
            )}
          >
            Events
          </button>
          <span className="text-slate-200">/</span>
          <button
            onClick={() => router.push(`/events/${event.slug}`)}
            className={cn(
              "hover:text-primary",
              "transition-colors",
              "truncate",
              "max-w-[200px]",
              "cursor-pointer",
            )}
          >
            {event.title}
          </button>
          <span className="text-slate-200">/</span>
          <span className="text-primary">Registration</span>
        </div>

        <div
          className={cn(
            "grid",
            "grid-cols-1",
            "lg:grid-cols-12",
            "gap-6",
            "items-stretch",
          )}
        >
          {/* Event card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "lg:col-span-8",
              "bg-muted",
              "border",
              "border-border",
              "rounded-[2.5rem]",
              "p-6",
              "md:p-8",
              "flex",
              "flex-col",
              "md:flex-row",
              "gap-6",
            )}
          >
            <div
              className={cn(
                "w-full",
                "md:w-44",
                "h-40",
                "md:h-44",
                "shrink-0",
                "rounded-[1.5rem]",
                "overflow-hidden",
              )}
            >
              <Image
                src={event.image}
                alt={event.title}
                width={176}
                height={176}
                className={cn("w-full", "h-full", "object-cover")}
              />
            </div>
            <div className={cn("flex-1", "space-y-4")}>
              <div className={cn("flex", "flex-wrap", "gap-2")}>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    FORMAT_COLOR[event.format] ?? "text-muted text-slate-600",
                  )}
                >
                  {FORMAT_LABEL[event.format] ?? event.format}
                </span>
                <span
                  className={cn(
                    "px-3",
                    "py-1",
                    "bg-foreground",
                    "text-background",
                    "rounded-full",
                    "text-[10px]",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                  )}
                >
                  {event.category}
                </span>
              </div>
              <h1
                className={cn(
                  "text-xl",
                  "md:text-3xl",
                  "font-black",
                  "text-foreground",
                  "leading-tight",
                )}
              >
                {event.title}
              </h1>
              <div
                className={cn("grid", "grid-cols-1", "sm:grid-cols-2", "gap-3")}
              >
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-2",
                    "text-muted-foreground",
                    "font-bold",
                    "text-sm",
                  )}
                >
                  <LuCalendar className={cn("w-4", "h-4", "text-primary")} />{" "}
                  {event.eventDate}
                </div>
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-2",
                    "text-muted-foreground",
                    "font-bold",
                    "text-sm",
                  )}
                >
                  <LuMapPin className={cn("w-4", "h-4", "text-primary")} />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
              </div>
              {/* Capacity bar */}
              <div>
                <div
                  className={cn(
                    "flex",
                    "justify-between",
                    "text-[10px]",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                    "text-muted-foreground",
                    "mb-1",
                  )}
                >
                  <span>Registration Capacity</span>
                  <span className="text-orange-600">
                    {event.slotsRemaining} Slots Left
                  </span>
                </div>
                <div
                  className={cn(
                    "w-full",
                    "h-1.5",
                    "bg-slate-200",
                    "rounded-full",
                    "overflow-hidden",
                  )}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPct}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className={cn("h-full", "bg-orange-500", "rounded-full")}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Countdown + price */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "lg:col-span-4",
              "bg-primary",
              "text-background",
              "rounded-[2.5rem]",
              "p-8",
              "relative",
              "overflow-hidden",
              "flex",
              "flex-col",
              "justify-center",
            )}
          >
            <div
              className={cn(
                "absolute",
                "top-0",
                "right-0",
                "w-32",
                "h-32",
                "bg-background/20",
                "rounded-full",
                "blur-3xl",
                "-mr-16",
                "-mt-16",
              )}
            />
            <div className={cn("relative", "z-10")}>
              <div
                className={cn(
                  "flex",
                  "items-center",
                  "gap-2",
                  "mb-6",
                  "opacity-80",
                )}
              >
                <LuClock className={cn("w-4", "h-4")} />
                <span
                  className={cn(
                    "text-xs",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                  )}
                >
                  Registration Closes In
                </span>
              </div>
              <div
                className={cn(
                  "grid",
                  "grid-cols-4",
                  "gap-2",
                  "text-center",
                  "mb-8",
                )}
              >
                {(
                  [
                    ["Days", time.days],
                    ["Hrs", time.hours],
                    ["Mins", time.mins],
                    ["Secs", time.secs],
                  ] as [string, number][]
                ).map(([label, val]) => (
                  <div key={label} className={cn("flex", "flex-col")}>
                    <span
                      className={cn(
                        "text-2xl",
                        "md:text-3xl",
                        "font-black",
                        "mb-0.5",
                      )}
                    >
                      {String(val).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "text-[9px]",
                        "font-bold",
                        "uppercase",
                        "opacity-60",
                        "tracking-widest",
                      )}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className={cn(
                  "pt-5",
                  "border-t",
                  "border-background/20",
                  "flex",
                  "items-center",
                  "gap-3",
                )}
              >
                <LuTag className={cn("w-4", "h-4", "rotate-90")} />
                <div>
                  <p
                    className={cn(
                      "text-[10px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                      "opacity-60",
                    )}
                  >
                    Ticket Price
                  </p>
                  <p className={cn("text-xl", "font-black")}>{event.price}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
