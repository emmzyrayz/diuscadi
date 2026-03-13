"use client";
import React from "react";
import {
  LuSquareUser,
  LuTicket,
  LuCalendar,
  LuShieldCheck,
  LuCircleCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

// AttendeeInfo shows ticket-level data (what we actually have from context).
// Name/email/phone are NOT in TicketDetail from API — those live in UserContext.
// We show the ticket ownership data that IS available.
interface AttendeeInfoProps {
  ticket: {
    inviteCode: string;
    registeredAt: string;
    ticketType: string;
    checkedInAt: string | null;
  };
}

export const AttendeeInfoSection = ({ ticket }: AttendeeInfoProps) => (
  <section
    className={cn("w-full", "mt-8", "pt-8", "border-t", "border-border")}
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
        <LuSquareUser className={cn("w-4", "h-4")} />
      </div>
      <div>
        <h3
          className={cn(
            "text-xl",
            "font-black",
            "text-foreground",
            "tracking-tight",
            "leading-none",
          )}
        >
          Registration Details
        </h3>
        <p
          className={cn(
            "text-[10px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "text-muted-foreground",
            "mt-1",
            "flex",
            "items-center",
            "gap-1",
          )}
        >
          <LuShieldCheck className={cn("w-3", "h-3", "text-emerald-500")} />{" "}
          Verified Booking
        </p>
      </div>
    </div>

    <div
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2rem]",
        "p-6",
        "md:p-8",
      )}
    >
      <div className={cn("grid", "grid-cols-1", "sm:grid-cols-3", "gap-6")}>
        {/* Ticket type */}
        <div className="space-y-1">
          <p
            className={cn(
              "text-[9px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
              "flex",
              "items-center",
              "gap-1.5",
            )}
          >
            <LuTicket className={cn("w-3", "h-3")} /> Ticket Tier
          </p>
          <p className={cn("text-sm", "font-bold", "text-primary")}>
            {ticket.ticketType}
          </p>
        </div>

        {/* Registration date */}
        <div className="space-y-1">
          <p
            className={cn(
              "text-[9px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
              "flex",
              "items-center",
              "gap-1.5",
            )}
          >
            <LuCalendar className={cn("w-3", "h-3")} /> Registered On
          </p>
          <p className={cn("text-sm", "font-bold", "text-foreground")}>
            {ticket.registeredAt}
          </p>
        </div>

        {/* Check-in status */}
        <div className="space-y-1">
          <p
            className={cn(
              "text-[9px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
              "flex",
              "items-center",
              "gap-1.5",
            )}
          >
            <LuCircleCheck className={cn("w-3", "h-3")} /> Check-In Status
          </p>
          {ticket.checkedInAt ? (
            <p className={cn("text-sm", "font-bold", "text-emerald-600")}>
              Checked in · {ticket.checkedInAt}
            </p>
          ) : (
            <p className={cn("text-sm", "font-bold", "text-muted-foreground")}>
              Not yet checked in
            </p>
          )}
        </div>
      </div>

      {/* Invite code */}
      <div
        className={cn(
          "mt-6",
          "pt-6",
          "border-t",
          "border-border",
          "flex",
          "items-center",
          "gap-3",
        )}
      >
        <LuShieldCheck
          className={cn("w-4", "h-4", "text-emerald-500", "shrink-0")}
        />
        <p className={cn("text-xs", "font-bold", "text-muted-foreground")}>
          This ticket is electronically linked to your{" "}
          <span className={cn("text-foreground", "font-black")}>
            DIUSCADI ID
          </span>{" "}
          via invite code{" "}
          <span className={cn("font-mono", "text-primary")}>
            {ticket.inviteCode}
          </span>
          . Ensure your name matches your valid government-issued ID.
        </p>
      </div>
    </div>
  </section>
);
