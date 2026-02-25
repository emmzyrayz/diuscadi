"use client";
import React from "react";
import {
  LuCalendarDays,
  LuUsers,
  LuExternalLink,
  LuChevronRight,
  LuEllipsis,
} from "react-icons/lu";
import { cn } from "../../../lib/utils";

// 1. TypeScript Interfaces
interface EventPreviewData {
  id: string;
  title: string;
  date: string;
  registrations: number;
  capacity: number;
  status: "selling" | "sold-out" | "draft";
}

interface EventPreviewCardProps {
  event: EventPreviewData;
}

// 2. Mock Data for the Preview
const UPCOMING_EVENTS: EventPreviewData[] = [
  {
    id: "ev-01",
    title: "Web3 Hackathon 2026",
    date: "Mar 12, 2026",
    registrations: 450,
    capacity: 500,
    status: "selling",
  },
  {
    id: "ev-02",
    title: "AI Policy Summit",
    date: "Apr 05, 2026",
    registrations: 120,
    capacity: 150,
    status: "selling",
  },
  {
    id: "ev-03",
    title: "Tech Founders Mixer",
    date: "May 20, 2026",
    registrations: 80,
    capacity: 80,
    status: "sold-out",
  },
];

export const AdminUpcomingEventsPreview: React.FC = () => {
  return (
    <section
      className={cn(
        "bg-white",
        "border-2",
        "border-slate-100",
        "rounded-[2.5rem]",
        "p-8",
        "shadow-sm",
      )}
    >
      {/* Section Header */}
      <div className={cn("flex", "items-center", "justify-between", "mb-8")}>
        <div className={cn("flex", "items-center", "gap-3")}>
          <div
            className={cn(
              "w-10",
              "h-10",
              "rounded-xl",
              "bg-slate-50",
              "flex",
              "items-center",
              "justify-center",
              "text-primary",
              "border",
              "border-slate-100",
            )}
          >
            <LuCalendarDays className={cn("w-5", "h-5")} />
          </div>
          <div>
            <h3
              className={cn(
                "text-sm",
                "font-black",
                "text-slate-900",
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
                "text-slate-400",
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
            "hover:bg-slate-50",
            "rounded-lg",
            "transition-colors",
          )}
        >
          <LuEllipsis className={cn("w-5", "h-5", "text-slate-400")} />
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {UPCOMING_EVENTS.map((event) => (
          <EventPreviewCard key={event.id} event={event} />
        ))}
      </div>

      {/* View All Button */}
      <button
        className={cn(
          "w-full",
          "mt-8",
          "py-4",
          "bg-slate-900",
          "text-white",
          "rounded-2xl",
          "font-black",
          "text-[10px]",
          "uppercase",
          "tracking-[0.2em]",
          "hover:bg-primary",
          "hover:text-slate-900",
          "transition-all",
          "shadow-xl",
          "shadow-slate-900/10",
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
      </button>
    </section>
  );
};

/* --- Subcomponent: EventPreviewCard --- */
const EventPreviewCard: React.FC<EventPreviewCardProps> = ({ event }) => {
  const fillPercentage = (event.registrations / event.capacity) * 100;

  return (
    <div className={cn('group', 'p-5', 'bg-slate-50', 'rounded-3xl', 'border', 'border-transparent', 'hover:border-slate-200', 'hover:bg-white', 'transition-all')}>
      <div className={cn('flex', 'flex-col', 'gap-4')}>
        {/* Top Row: Title & Action */}
        <div className={cn('flex', 'items-start', 'justify-between')}>
          <div className="space-y-1">
            <p className={cn('text-[9px]', 'font-black', 'text-primary', 'uppercase', 'tracking-widest')}>
              {event.date}
            </p>
            <h4 className={cn('text-sm', 'font-black', 'text-slate-900', 'uppercase', 'tracking-tight', 'group-hover:text-primary', 'transition-colors')}>
              {event.title}
            </h4>
          </div>
          <button className={cn('w-8', 'h-8', 'rounded-lg', 'bg-white', 'border', 'border-slate-100', 'flex', 'items-center', 'justify-center', 'text-slate-400', 'hover:text-primary', 'hover:border-primary', 'transition-all')}>
            <LuExternalLink className={cn('w-4', 'h-4')} />
          </button>
        </div>

        {/* Middle Row: Capacity Gauge (Elite Detail) */}
        <div className="space-y-2">
          <div className={cn('flex', 'justify-between', 'items-end')}>
            <div className={cn('flex', 'items-center', 'gap-1.5', 'text-slate-500')}>
              <LuUsers className={cn('w-3', 'h-3')} />
              <span className={cn('text-[10px]', 'font-black', 'uppercase')}>
                {event.registrations}{" "}
                <span className="text-slate-300">/ {event.capacity}</span>
              </span>
            </div>
            <span
              className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                event.status === "sold-out"
                  ? "bg-rose-100 text-rose-600"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {event.status === "sold-out" ? "Sold Out" : "Selling"}
            </span>
          </div>

          {/* Progress Bar */}
          <div className={cn('w-full', 'h-1.5', 'bg-slate-200', 'rounded-full', 'overflow-hidden')}>
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                event.status === "sold-out" ? "bg-rose-500" : "bg-primary"
              }`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
