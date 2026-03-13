"use client";
import React from "react";
import { LuTicket, LuDownload, LuArrowRight } from "react-icons/lu";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TicketPageHeaderProps {
  ticketCount: number;
}

export const TicketPageHeader = ({ ticketCount }: TicketPageHeaderProps) => (
  <section
    className={cn(
      "w-full",
      "bg-background",
      "border-b",
      "border-border",
      "pt-12",
      "pb-8",
    )}
  >
    <div className={cn("max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8")}>
      <div
        className={cn(
          "flex",
          "flex-col",
          "md:flex-row",
          "md:items-end",
          "justify-between",
          "gap-6",
        )}
      >
        {/* Left */}
        <div className="space-y-2">
          <div
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "text-primary",
              "font-black",
              "text-[10px]",
              "uppercase",
              "tracking-[0.3em]",
              "mb-2",
            )}
          >
            <LuTicket className={cn("w-4", "h-4")} />
            User Dashboard
          </div>
          <h1
            className={cn(
              "text-4xl",
              "md:text-5xl",
              "font-black",
              "text-foreground",
              "tracking-tighter",
            )}
          >
            My <span className="text-primary">Tickets.</span>
          </h1>
          <p className={cn("text-muted-foreground", "font-medium", "max-w-md")}>
            {ticketCount > 0
              ? `You have ${ticketCount} ticket${ticketCount !== 1 ? "s" : ""} — access passes, history, and upcoming events.`
              : "Access your digital passes, manage upcoming registrations, and view your event history."}
          </p>
        </div>

        {/* Right */}
        <div className={cn("flex", "flex-wrap", "items-center", "gap-3")}>
          <Link
            href="/events"
            className={cn(
              "px-6",
              "py-4",
              "bg-foreground",
              "text-background",
              "font-black",
              "rounded-2xl",
              "flex",
              "items-center",
              "gap-3",
              "hover:bg-slate-800",
              "transition-all",
              "shadow-xl",
              "shadow-foreground/10",
              "group",
            )}
          >
            Browse More Events
            <LuArrowRight
              className={cn(
                "w-5",
                "h-5",
                "group-hover:translate-x-1",
                "transition-transform",
              )}
            />
          </Link>
          <button
            className={cn(
              "p-4",
              "bg-background",
              "border-2",
              "border-border",
              "text-muted-foreground",
              "hover:text-primary",
              "hover:border-primary",
              "rounded-2xl",
              "transition-all",
              "group",
              "relative",
              "cursor-pointer",
            )}
          >
            <LuDownload className={cn("w-6", "h-6")} />
            <span
              className={cn(
                "absolute",
                "-top-12",
                "left-1/2",
                "-translate-x-1/2",
                "bg-foreground",
                "text-background",
                "text-[10px]",
                "px-3",
                "py-1.5",
                "rounded-lg",
                "opacity-0",
                "group-hover:opacity-100",
                "transition-opacity",
                "whitespace-nowrap",
                "pointer-events-none",
                "font-bold",
              )}
            >
              Download All (PDF)
            </span>
          </button>
        </div>
      </div>
      <div
        className={cn("mt-10", "h-1", "w-20", "bg-primary", "rounded-full")}
      />
    </div>
  </section>
);
