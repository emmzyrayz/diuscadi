"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuCalendarClock,
  LuLock,
  LuCoffee,
  LuUsers,
  LuMic,
  LuWrench,
  LuNetwork,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { EventDetail } from "@/app/events/[slug]/page";

const TYPE_ICON: Record<string, React.ReactNode> = {
  session: <LuCalendarClock className={cn("w-4", "h-4")} />,
  break: <LuCoffee className={cn("w-4", "h-4")} />,
  workshop: <LuWrench className={cn("w-4", "h-4")} />,
  keynote: <LuMic className={cn("w-4", "h-4")} />,
  networking: <LuNetwork className={cn("w-4", "h-4")} />,
};

const TYPE_COLOR: Record<string, string> = {
  session: "bg-primary/10 text-primary",
  break: "bg-amber-100 text-amber-700",
  workshop: "bg-emerald-100 text-emerald-700",
  keynote: "bg-violet-100 text-violet-700",
  networking: "bg-sky-100 text-sky-700",
};

const PLACEHOLDER_ITEMS = [
  "Opening Ceremony",
  "Keynote Address",
  "Workshop Sessions",
  "Networking Break",
  "Closing Remarks",
];

export const EventSchedule = ({ event }: { event: EventDetail }) => {
  const hasSchedule = event.schedule.length > 0;

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
            {PLACEHOLDER_ITEMS.map((item, i) => (
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

  return (
    <section className={cn("w-full", "bg-muted", "py-16")}>
      <div className={cn("max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8")}>
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

        <div
          className={cn(
            "relative",
            "pl-8",
            "border-l-2",
            "border-border",
            "space-y-6",
          )}
        >
          {event.schedule.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className={cn(
                "relative",
                "flex",
                "items-start",
                "gap-4",
                "p-5",
                "bg-background",
                "border",
                "border-border",
                "rounded-2xl",
                "hover:border-primary/20",
                "transition-colors",
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
                  "bg-primary",
                  "border-4",
                  "border-muted",
                )}
              />

              {/* Type icon */}
              <div
                className={cn(
                  "p-2",
                  "rounded-xl",
                  "shrink-0",
                  TYPE_COLOR[item.type] ?? "bg-muted text-muted-foreground",
                )}
              >
                {TYPE_ICON[item.type] ?? (
                  <LuCalendarClock className={cn("w-4", "h-4")} />
                )}
              </div>

              <div className={cn("flex-1", "min-w-0")}>
                <div className={cn("flex", "items-center", "gap-3", "mb-1")}>
                  <span
                    className={cn(
                      "text-[10px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                      "text-primary",
                    )}
                  >
                    {item.time}
                  </span>
                  <span
                    className={cn(
                      "text-[9px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                      "px-2",
                      "py-0.5",
                      "rounded-full",
                      TYPE_COLOR[item.type] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.type}
                  </span>
                </div>
                <p className={cn("text-sm", "font-black", "text-foreground")}>
                  {item.title}
                </p>
                {item.speaker && (
                  <p
                    className={cn(
                      "text-[10px]",
                      "font-bold",
                      "text-muted-foreground",
                      "mt-0.5",
                    )}
                  >
                    Speaker: {item.speaker}
                  </p>
                )}
                {item.description && (
                  <p
                    className={cn(
                      "text-xs",
                      "text-muted-foreground",
                      "mt-1",
                      "leading-relaxed",
                    )}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
