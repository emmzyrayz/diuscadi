"use client";
import React, { useState } from "react";
import {
  LuCalendar,
  LuClock,
  LuMapPin,
  LuTicket,
  LuFingerprint,
  LuCopy,
  LuCheck,
  LuShieldCheck,
  LuReceipt,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";

interface TicketMetaInfoProps {
  ticket: {
    inviteCode: string;
    eventName: string;
    eventDate: string;
    eventTime: string;
    location: string;
    ticketType: string;
    status: string;
    registeredAt: string;
    price: string;
  };
}

const InfoItem = ({
  icon: Icon,
  label,
  value,
  valueClass,
  className,
}: {
  icon: IconType;
  label: string;
  value: string;
  valueClass?: string;
  className?: string;
}) => (
  <div className={cn("flex", "items-start", "gap-4", className)}>
    <div
      className={cn(
        "w-10",
        "h-10",
        "rounded-xl",
        "bg-muted",
        "flex",
        "items-center",
        "justify-center",
        "shrink-0",
        "border",
        "border-border",
      )}
    >
      <Icon className={cn("w-5", "h-5", "text-muted-foreground")} />
    </div>
    <div className="space-y-0.5">
      <p
        className={cn(
          "text-[9px]",
          "font-black",
          "text-muted-foreground",
          "uppercase",
          "tracking-widest",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "text-sm",
          "font-bold",
          "text-slate-700",
          "leading-snug",
          valueClass,
        )}
      >
        {value}
      </p>
    </div>
  </div>
);

export const TicketMetaInfo = ({ ticket }: TicketMetaInfoProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ticket.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "p-8",
        "md:p-10",
        "shadow-sm",
      )}
    >
      <h3
        className={cn(
          "text-sm",
          "font-black",
          "text-foreground",
          "uppercase",
          "tracking-[0.2em]",
          "mb-8",
          "flex",
          "items-center",
          "gap-2",
        )}
      >
        <span
          className={cn(
            "w-2",
            "h-2",
            "bg-primary",
            "rounded-full",
            "animate-pulse",
          )}
        />
        Entry Information
      </h3>

      <div className="space-y-8">
        {/* Event name */}
        <div className="space-y-1">
          <p
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
            )}
          >
            Selected Event
          </p>
          <h2
            className={cn(
              "text-xl",
              "font-black",
              "text-foreground",
              "leading-tight",
            )}
          >
            {ticket.eventName}
          </h2>
        </div>

        {/* Grid */}
        <div className={cn("grid", "grid-cols-1", "sm:grid-cols-2", "gap-8")}>
          <InfoItem
            icon={LuCalendar}
            label="Event Date"
            value={ticket.eventDate}
          />
          <InfoItem
            icon={LuClock}
            label="Door Opening"
            value={ticket.eventTime}
          />
          <InfoItem
            icon={LuMapPin}
            label="Venue"
            value={ticket.location}
            className="sm:col-span-2"
          />
        </div>

        <div className={cn("h-px", "text-muted")} />

        <div className={cn("grid", "grid-cols-1", "sm:grid-cols-3", "gap-8")}>
          <InfoItem
            icon={LuTicket}
            label="Pass Category"
            value={ticket.ticketType}
            valueClass="text-primary"
          />
          <InfoItem icon={LuReceipt} label="Amount Paid" value={ticket.price} />
          <InfoItem
            icon={LuShieldCheck}
            label="Registered On"
            value={ticket.registeredAt}
          />
        </div>

        {/* Invite code / copy */}
        <div
          className={cn(
            "bg-muted",
            "rounded-2xl",
            "p-4",
            "flex",
            "items-center",
            "justify-between",
            "border",
            "border-border",
            "hover:border-border",
            "transition-colors",
          )}
        >
          <div className={cn("flex", "items-center", "gap-3")}>
            <div
              className={cn(
                "w-8",
                "h-8",
                "rounded-lg",
                "bg-background",
                "flex",
                "items-center",
                "justify-center",
                "border",
                "border-border",
              )}
            >
              <LuFingerprint
                className={cn("w-4", "h-4", "text-muted-foreground")}
              />
            </div>
            <div>
              <p
                className={cn(
                  "text-[9px]",
                  "font-black",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-widest",
                  "leading-none",
                  "mb-1",
                )}
              >
                Invite / Scan Code
              </p>
              <p
                className={cn(
                  "font-mono",
                  "text-xs",
                  "font-bold",
                  "text-slate-600",
                  "tracking-wider",
                  "uppercase",
                )}
              >
                {ticket.inviteCode}
              </p>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className={cn(
              "p-2",
              "hover:bg-background",
              "rounded-lg",
              "transition-all",
              "text-muted-foreground",
              "hover:text-primary",
              "active:scale-90",
              "cursor-pointer",
            )}
          >
            {copied ? (
              <LuCheck className={cn("w-4", "h-4", "text-emerald-500")} />
            ) : (
              <LuCopy className={cn("w-4", "h-4")} />
            )}
          </button>
        </div>

        {/* Reminder */}
        <div
          className={cn(
            "p-4",
            "bg-orange-50",
            "rounded-2xl",
            "border",
            "border-orange-100",
          )}
        >
          <p
            className={cn(
              "text-[11px]",
              "font-bold",
              "text-orange-700",
              "leading-relaxed",
            )}
          >
            Present a valid government-issued ID matching your registered name
            at the gate.
          </p>
        </div>
      </div>
    </div>
  );
};
