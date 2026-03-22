"use client";
import React from "react";
import {
  LuCalendarDays,
  LuUsers,
  LuExternalLink,
  LuChevronRight,
  LuEllipsis,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { AdminEvent } from "@/context/AdminContext";

interface Props {
  events: AdminEvent[];
}

export const AdminUpcomingEventsPreview = ({ events }: Props) => {
  const upcoming = events
    .filter(
      (e) => e.status === "published" && new Date(e.eventDate) > new Date(),
    )
    .slice(0, 3);

  return (
    <section
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "p-8",
        "shadow-sm",
      )}
    >
      <div className={cn("flex", "items-center", "justify-between", "mb-8")}>
        <div className={cn("flex", "items-center", "gap-3")}>
          <div
            className={cn(
              "w-10",
              "h-10",
              "rounded-xl",
              "bg-muted",
              "flex",
              "items-center",
              "justify-center",
              "text-primary",
              "border",
              "border-border",
            )}
          >
            <LuCalendarDays className={cn("w-5", "h-5")} />
          </div>
          <div>
            <h3
              className={cn(
                "text-sm",
                "font-black",
                "text-foreground",
                "uppercase",
                "tracking-widest",
              )}
            >
              Operational Radar
            </h3>
            <p
              className={cn(
                "text-[9px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-widest",
                "mt-1",
              )}
            >
              Upcoming Schedule
            </p>
          </div>
        </div>
        <button
          className={cn(
            "p-2",
            "hover:bg-muted",
            "rounded-lg",
            "transition-colors",
          )}
        >
          <LuEllipsis className={cn("w-5", "h-5", "text-muted-foreground")} />
        </button>
      </div>

      <div className="space-y-4">
        {upcoming.length === 0 ? (
          <p
            className={cn(
              "text-sm",
              "font-bold",
              "text-muted-foreground",
              "text-center",
              "py-8",
            )}
          >
            No upcoming events
          </p>
        ) : (
          upcoming.map((event) => {
            const fillPct =
              event.capacity > 0
                ? Math.round((event.registered / event.capacity) * 100)
                : 0;
            const isSoldOut = fillPct >= 100;
            return (
              <div
                key={event.id}
                className={cn(
                  "group",
                  "p-5",
                  "bg-muted",
                  "rounded-3xl",
                  "border",
                  "border-transparent",
                  "hover:border-border",
                  "hover:bg-background",
                  "transition-all",
                )}
              >
                <div className={cn("flex", "flex-col", "gap-4")}>
                  <div className={cn("flex", "items-start", "justify-between")}>
                    <div className="space-y-1">
                      <p
                        className={cn(
                          "text-[9px]",
                          "font-black",
                          "text-primary",
                          "uppercase",
                          "tracking-widest",
                        )}
                      >
                        {new Date(event.eventDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <h4
                        className={cn(
                          "text-sm",
                          "font-black",
                          "text-foreground",
                          "uppercase",
                          "tracking-tight",
                          "group-hover:text-primary",
                          "transition-colors",
                          "line-clamp-1",
                        )}
                      >
                        {event.title}
                      </h4>
                    </div>
                    <Link
                      href={`/admin/events`}
                      className={cn(
                        "w-8",
                        "h-8",
                        "rounded-lg",
                        "bg-background",
                        "border",
                        "border-border",
                        "flex",
                        "items-center",
                        "justify-center",
                        "text-muted-foreground",
                        "hover:text-primary",
                        "hover:border-primary",
                        "transition-all",
                      )}
                    >
                      <LuExternalLink className={cn("w-4", "h-4")} />
                    </Link>
                  </div>
                  <div className="space-y-2">
                    <div className={cn("flex", "justify-between", "items-end")}>
                      <div
                        className={cn(
                          "flex",
                          "items-center",
                          "gap-1.5",
                          "text-muted-foreground",
                        )}
                      >
                        <LuUsers className={cn("w-3", "h-3")} />
                        <span
                          className={cn(
                            "text-[10px]",
                            "font-black",
                            "uppercase",
                          )}
                        >
                          {event.registered}{" "}
                          <span className="text-slate-300">
                            / {event.capacity}
                          </span>
                        </span>
                      </div>
                      <span
                        className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${isSoldOut ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}
                      >
                        {isSoldOut ? "Sold Out" : "Selling"}
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
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${isSoldOut ? "bg-rose-500" : "bg-primary"}`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Link
        href="/admin/events"
        className={cn(
          "w-full",
          "mt-8",
          "py-4",
          "bg-foreground",
          "text-background",
          "rounded-2xl",
          "font-black",
          "text-[10px]",
          "uppercase",
          "tracking-[0.2em]",
          "hover:bg-primary",
          "transition-all",
          "shadow-xl",
          "shadow-foreground/10",
          "flex",
          "items-center",
          "justify-center",
          "gap-2",
          "group",
        )}
      >
        Manage All Events
        <LuChevronRight
          className={cn(
            "w-4",
            "h-4",
            "group-hover:translate-x-1",
            "transition-transform",
          )}
        />
      </Link>
    </section>
  );
};
