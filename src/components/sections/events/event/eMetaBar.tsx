"use client";
import React, { useEffect, useState } from "react";
import { LuTicket, LuClock, LuHistory, LuBan } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { getEventState, EVENT_STATE_CONFIG } from "@/lib/eventUtils";
import type { EventDetail } from "@/app/events/[slug]/page";

function useCountdown(deadline: string) {
  const target = new Date(deadline).getTime();
  const [diff, setDiff] = useState(() => target - Date.now());

  useEffect(() => {
    const id = setInterval(() => setDiff(target - Date.now()), 60_000);
    return () => clearInterval(id);
  }, [target]);

  if (diff <= 0) return "Registration closed";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

export const EventMetaBar = ({ event }: { event: EventDetail }) => {
  const router = useRouter();
  const countdown = useCountdown(event.registrationDeadline);

  const state = getEventState({
    eventDate: event.eventDateIso,
    endDate: event.endDateIso ?? null,
    registrationDeadline: event.registrationDeadline,
    slotsRemaining: event.slotsRemaining,
    isFree: event.isFree,
  });

  const cfg = EVENT_STATE_CONFIG[state];
  const isPast = state === "past";
  const canReg = !cfg.btnDisabled;

  const fillPct = Math.min(
    100,
    Math.round((event.registered / event.capacity) * 100),
  );

  // Bar colour by state
  const barColor = isPast
    ? "bg-slate-400"
    : state === "soldout"
      ? "bg-rose-500"
      : state === "closed"
        ? "bg-slate-400"
        : "bg-primary";

  return (
    <div className="sticky top-[72px] z-40 w-full bg-background border-b border-border shadow-sm overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 md:h-24 flex items-center justify-between">
        {/* Left: stats */}
        <div className="flex items-center gap-8 md:gap-12 overflow-x-auto no-scrollbar">
          {/* Price */}
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Entry Fee
            </span>
            <span className="text-lg font-black text-foreground">
              {event.price}
            </span>
          </div>

          <div className="hidden sm:block w-px h-8 bg-border" />

          {/* Availability */}
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Availability
            </span>
            <div className="flex items-center gap-2">
              {isPast ? (
                <span className="text-lg font-black text-slate-400 flex items-center gap-1.5">
                  <LuHistory className="w-4 h-4" /> Ended
                </span>
              ) : state === "soldout" ? (
                <span className="text-lg font-black text-rose-500">
                  Sold Out
                </span>
              ) : state === "closed" || state === "free-closed" ? (
                <span className="text-lg font-black text-slate-500 flex items-center gap-1.5">
                  <LuBan className="w-4 h-4" /> Closed
                </span>
              ) : (
                <>
                  <span
                    className={cn(
                      "text-lg font-black",
                      event.slotsRemaining <= 20
                        ? "text-rose-500"
                        : "text-orange-600",
                    )}
                  >
                    {event.slotsRemaining}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    Seats Left
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-border" />

          {/* Duration */}
          {event.duration && (
            <div className="hidden md:flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Duration
              </span>
              <div className="flex items-center gap-1.5 text-foreground font-bold">
                <LuClock className="w-4 h-4 text-primary" />
                {event.duration}
              </div>
            </div>
          )}
        </div>

        {/* Right: CTA */}
        <div className="flex items-center gap-4">
          {/* Countdown — only show when registration is open */}
          {canReg && (
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-bold text-foreground leading-none">
                Registration closes
              </span>
              <span className="text-[10px] font-black text-primary uppercase mt-1">
                {countdown}
              </span>
            </div>
          )}

          {/* State label for non-registerable events */}
          {!canReg && (
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-bold text-muted-foreground leading-none">
                {cfg.label}
              </span>
              {isPast && (
                <span className="text-[10px] font-black text-slate-400 uppercase mt-1">
                  {new Date(event.eventDateIso).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          )}

          <button
            disabled={!canReg}
            onClick={() =>
              canReg && router.push(`/events/${event.slug}/register`)
            }
            className={cn(
              "flex items-center gap-2 px-6 md:px-10 py-3.5 font-black rounded-2xl transition-all shadow-lg",
              canReg
                ? "bg-primary text-background hover:bg-orange-600 shadow-primary/20 hover:scale-105 active:scale-95 cursor-pointer"
                : isPast
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                  : state === "soldout"
                    ? "bg-rose-100 text-rose-400 cursor-not-allowed shadow-none"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none",
            )}
          >
            {isPast || !canReg ? (
              <LuBan className="w-5 h-5" />
            ) : (
              <LuTicket className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">{cfg.btnLabel}</span>
            <span className="sm:hidden">
              {canReg ? "Register" : isPast ? "Ended" : "Closed"}
            </span>
          </button>
        </div>
      </div>

      {/* Capacity bar — greyed out for past/closed */}
      <div className="w-full h-1 bg-muted">
        <div
          className={cn("h-full transition-all duration-1000", barColor)}
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  );
};
