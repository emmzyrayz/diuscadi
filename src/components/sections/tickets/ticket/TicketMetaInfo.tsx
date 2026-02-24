"use client";
import React, { useState } from "react";
import {
  LuCalendar,
  LuClock,
  LuMapPin,
  LuTicket,
  LuFingerprint,
  LuArmchair,
  LuCopy,
  LuCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";

interface TicketMetaInfoProps {
  ticket: {
    id: string;
    eventName: string;
    eventDate: string;
    eventTime: string;
    location: string;
    type: string;
    status: string;
    seat?: string;
  };
}

interface InfoItemProps {
  icon: IconType;
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
}

export const TicketMetaInfo = ({ ticket }: TicketMetaInfoProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ticket.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "bg-white",
        "border-2",
        "border-slate-100",
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
          "text-slate-900",
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
        {/* Event Main Info */}
        <div className="space-y-1">
          <p
            className={cn(
              "text-[10px]",
              "font-black",
              "text-slate-400",
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
              "text-slate-900",
              "leading-tight",
            )}
          >
            {ticket.eventName}
          </h2>
        </div>

        {/* Grid Stats */}
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
            label="Venue Location"
            value={ticket.location}
            className="sm:col-span-2"
          />
        </div>

        {/* Divider */}
        <div className={cn("h-px", "bg-slate-100", "w-full")} />

        {/* Ticket Specifics */}
        <div className={cn("grid", "grid-cols-2", "gap-8")}>
          <InfoItem
            icon={LuTicket}
            label="Pass Category"
            value={ticket.type}
            valueClassName="text-primary"
          />
          {ticket.seat && (
            <InfoItem
              icon={LuArmchair}
              label="Assigned Seat"
              value={ticket.seat}
            />
          )}
        </div>

        {/* Ticket ID with Copy Action */}
        <div
          className={cn(
            "bg-slate-50",
            "rounded-2xl",
            "p-4",
            "flex",
            "items-center",
            "justify-between",
            "group",
            "border",
            "border-slate-100",
            "transition-colors",
            "hover:border-slate-200",
          )}
        >
          <div className={cn("flex", "items-center", "gap-3")}>
            <div
              className={cn(
                "w-8",
                "h-8",
                "rounded-lg",
                "bg-white",
                "flex",
                "items-center",
                "justify-center",
                "border",
                "border-slate-100",
              )}
            >
              <LuFingerprint className={cn("w-4", "h-4", "text-slate-400")} />
            </div>
            <div>
              <p
                className={cn(
                  "text-[9px]",
                  "font-black",
                  "text-slate-400",
                  "uppercase",
                  "tracking-widest",
                  "leading-none",
                  "mb-1",
                )}
              >
                Unique Ticket ID
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
                {ticket.id}
              </p>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className={cn(
              "p-2",
              "hover:bg-white",
              "rounded-lg",
              "transition-all",
              "text-slate-400",
              "hover:text-primary",
              "active:scale-90",
              "shadow-xs",
            )}
          >
            {copied ? (
              <LuCheck className={cn("w-4", "h-4", "text-emerald-500")} />
            ) : (
              <LuCopy className={cn("w-4", "h-4")} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* Internal Helper Component */
const InfoItem = ({
  icon: Icon,
  label,
  value,
  className,
  valueClassName,
}: InfoItemProps) => (
  <div className={cn("flex items-start gap-4", className)}>
    <div
      className={cn(
        "w-10",
        "h-10",
        "rounded-xl",
        "bg-slate-50",
        "flex",
        "items-center",
        "justify-center",
        "shrink-0",
        "border",
        "border-slate-100",
      )}
    >
      <Icon className={cn("w-5", "h-5", "text-slate-400")} />
    </div>
    <div className="space-y-1">
      <p
        className={cn(
          "text-[9px]",
          "font-black",
          "text-slate-400",
          "uppercase",
          "tracking-widest",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "text-sm font-bold text-slate-700 leading-snug",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  </div>
);