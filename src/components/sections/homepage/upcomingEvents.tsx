"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuMapPin,
  LuClock,
  LuExternalLink,
  LuCircleCheck,
  LuCalendar,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export type EventStatus =
  | "registered"
  | "checked-in"
  | "cancelled"
  | "Confirmed"
  | "On Waitlist"
  | "Completed";

export interface ScheduledEvent {
  id: string | number;
  date: string;
  month: string;
  type: string;
  title: string;
  time: string;
  location: string;
  status: EventStatus;
  link?: string;
}

interface UpcomingEventsProps {
  events: ScheduledEvent[];
}

function statusLabel(status: EventStatus): string {
  if (status === "checked-in" || status === "registered") return "Confirmed";
  if (status === "cancelled") return "Completed";
  return status;
}

function isWaitlist(status: EventStatus): boolean {
  return status === "On Waitlist";
}

export const UpcomingEvents = ({ events }: UpcomingEventsProps) => {
  const router = useRouter();

  // ── Calendar sync ──────────────────────────────────────────────────────────
  // TODO: implement Google Calendar / Google Tasks integration:
  //   1. OAuth flow via /api/auth/google-calendar
  //   2. POST to Google Calendar API with event details
  //   3. Alternatively use the `add to calendar` open web standard:
  //      webcal:// link or .ics file generation server-side
  const handleSyncCalendar = () => {
    // For now: open Google Calendar new event page pre-filled with the
    // first upcoming event as a temporary stopgap
    if (events.length === 0) return;
    const first = events[0];
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(first.title)}&details=${encodeURIComponent(first.location)}&location=${encodeURIComponent(first.location)}`;
    window.open(gcalUrl, "_blank");
    // TODO: replace with full multi-event sync via Google Calendar API
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (events.length === 0) {
    return (
      <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mt-16')}>
        <div className={cn('flex', 'items-center', 'justify-between', 'mb-8')}>
          <div>
            <h3 className={cn('text-xl', 'font-black', 'text-foreground', 'leading-none')}>
              Your Schedule
            </h3>
            <p className={cn('text-sm', 'text-muted-foreground', 'mt-1')}>
              Events you&apos;re participating in
            </p>
          </div>
        </div>
        <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-16', 'bg-background', 'border', 'border-dashed', 'border-border', 'rounded-[2.5rem]', 'text-center', 'gap-4')}>
          <div className={cn('w-16', 'h-16', 'bg-muted', 'rounded-3xl', 'flex', 'items-center', 'justify-center')}>
            <LuCalendar className={cn('w-8', 'h-8', 'text-slate-300')} />
          </div>
          <div>
            <p className={cn('text-[11px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
              No upcoming events
            </p>
            <p className={cn('text-xs', 'text-muted-foreground', 'mt-1')}>
              Events you register for will appear here
            </p>
          </div>
          <button
            onClick={() => router.push("/events")}
            className={cn('px-6', 'py-2.5', 'bg-foreground', 'text-background', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'hover:bg-primary', 'transition-all', 'cursor-pointer')}
          >
            Browse Events
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mt-16')}>
      <div className={cn('flex', 'items-center', 'justify-between', 'mb-8')}>
        <div>
          <h3 className={cn('text-xl', 'font-black', 'text-foreground', 'leading-none')}>
            Your Schedule
          </h3>
          <p className={cn('text-sm', 'text-muted-foreground', 'mt-1')}>
            Events you&apos;re participating in
          </p>
        </div>
        <button
          onClick={handleSyncCalendar}
          className={cn('text-sm', 'font-bold', 'text-primary', 'px-4', 'py-2', 'bg-primary/5', 'rounded-xl', 'hover:bg-primary/10', 'transition-colors', 'cursor-pointer')}
        >
          {/* TODO: replace label with "Connected to Google Calendar" when OAuth is done */}
          Sync to Calendar
        </button>
      </div>

      <div className="space-y-4">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn('group', 'flex', 'flex-col', 'md:flex-row', 'items-center', 'bg-background', 'border', 'border-border', 'rounded-[1.5rem]', 'p-4', 'md:p-6', 'hover:shadow-md', 'transition-all', 'border-l-4', 'border-l-primary')}
          >
            {/* Date */}
            <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'min-w-[80px]', 'md:border-r', 'border-border', 'md:pr-8', 'mb-4', 'md:mb-0')}>
              <span className={cn('text-2xl', 'font-black', 'text-foreground', 'leading-none')}>
                {event.date}
              </span>
              <span className={cn('text-xs', 'font-bold', 'text-primary', 'mt-1')}>
                {event.month}
              </span>
            </div>

            {/* Content */}
            <div className={cn('flex-1', 'md:px-8', 'text-center', 'md:text-left')}>
              <div className={cn('flex', 'flex-wrap', 'items-center', 'justify-center', 'md:justify-start', 'gap-2', 'mb-2')}>
                <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-muted-foreground')}>
                  {event.type}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                    isWaitlist(event.status)
                      ? "bg-amber-50 text-amber-600"
                      : "bg-green-50 text-green-600",
                  )}
                >
                  <LuCircleCheck className={cn('w-3', 'h-3')} />
                  {statusLabel(event.status)}
                </span>
              </div>
              <h4 className={cn('text-lg', 'font-bold', 'text-foreground', 'group-hover:text-primary', 'transition-colors')}>
                {event.title}
              </h4>
              <div className={cn('flex', 'flex-wrap', 'items-center', 'justify-center', 'md:justify-start', 'gap-4', 'mt-3', 'text-sm', 'text-muted-foreground')}>
                <div className={cn('flex', 'items-center', 'gap-1.5')}>
                  <LuClock className={cn('w-4', 'h-4')} />
                  {event.time}
                </div>
                <div className={cn('flex', 'items-center', 'gap-1.5')}>
                  <LuMapPin className={cn('w-4', 'h-4')} />
                  {event.location}
                </div>
              </div>
            </div>

            {/* Action */}
            <div className={cn('mt-6', 'md:mt-0')}>
              <button
                onClick={() => event.link && router.push(event.link)}
                className={cn('flex', 'items-center', 'gap-2', 'px-6', 'py-3', 'bg-foreground', 'text-background', 'font-bold', 'rounded-xl', 'hover:bg-primary', 'transition-all', 'group-hover:shadow-lg', 'group-hover:shadow-primary/20', 'cursor-pointer')}
              >
                Join Info <LuExternalLink className={cn('w-4', 'h-4')} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
