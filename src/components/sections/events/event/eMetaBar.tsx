"use client";
import React, { useEffect, useState } from "react";
import { LuTicket, LuClock } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { EventDetail } from "@/app/events/[eventId]/page";

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

  const fillPct = Math.min(
    100,
    Math.round((event.registered / event.capacity) * 100),
  );
  const isAlmostFull = event.slotsRemaining > 0 && event.slotsRemaining <= 20;
  const isSoldOut = event.slotsRemaining === 0;

  return (
    <div
      className={cn(
        "sticky",
        "top-[72px]",
        "z-40",
        "w-full",
        "bg-background",
        "border-b",
        "border-border",
        "shadow-sm",
        "overflow-hidden",
      )}
    >
      <div
        className={cn(
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "h-20",
          "md:h-24",
          "flex",
          "items-center",
          "justify-between",
        )}
      >
        {/* Left: Stats */}
        <div
          className={cn(
            "flex",
            "items-center",
            "gap-8",
            "md:gap-12",
            "overflow-x-auto",
            "no-scrollbar",
          )}
        >
          {/* Price */}
          <div className={cn("flex", "flex-col")}>
            <span
              className={cn(
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-muted-foreground",
              )}
            >
              Entry Fee
            </span>
            <span className={cn("text-lg", "font-black", "text-foreground")}>
              {event.price}
            </span>
          </div>

          <div
            className={cn("hidden", "sm:block", "w-px", "h-8", "text-muted")}
          />

          {/* Availability */}
          <div className={cn("flex", "flex-col", "shrink-0")}>
            <span
              className={cn(
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-muted-foreground",
              )}
            >
              Availability
            </span>
            <div className={cn("flex", "items-center", "gap-2")}>
              {isSoldOut ? (
                <span className={cn("text-lg", "font-black", "text-red-500")}>
                  Sold Out
                </span>
              ) : (
                <>
                  <span
                    className={cn(
                      "text-lg",
                      "font-black",
                      isAlmostFull ? "text-red-500" : "text-orange-600",
                    )}
                  >
                    {event.slotsRemaining}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      "font-bold",
                      "text-muted-foreground",
                    )}
                  >
                    Seats Left
                  </span>
                </>
              )}
            </div>
          </div>

          <div
            className={cn("hidden", "sm:block", "w-px", "h-8", "text-muted")}
          />

          {/* Duration */}
          {event.duration && (
            <div className={cn("hidden", "md:flex", "flex-col")}>
              <span
                className={cn(
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "text-muted-foreground",
                )}
              >
                Duration
              </span>
              <div
                className={cn(
                  "flex",
                  "items-center",
                  "gap-1.5",
                  "text-foreground",
                  "font-bold",
                )}
              >
                <LuClock className={cn("w-4", "h-4", "text-primary")} />
                {event.duration}
              </div>
            </div>
          )}
        </div>

        {/* Right: CTA */}
        <div className={cn("flex", "items-center", "gap-4")}>
          <div className={cn("hidden", "lg:flex", "flex-col", "text-right")}>
            <span
              className={cn(
                "text-xs",
                "font-bold",
                "text-foreground",
                "leading-none",
              )}
            >
              Registration closes
            </span>
            <span
              className={cn(
                "text-[10px]",
                "font-black",
                "text-primary",
                "uppercase",
                "mt-1",
              )}
            >
              {countdown}
            </span>
          </div>
          <button
            disabled={isSoldOut}
            onClick={() =>
              !isSoldOut && router.push(`/events/${event.slug}/register`)
            }
            className={cn(
              "flex items-center gap-2 px-6 md:px-10 py-3.5 font-black rounded-2xl transition-all shadow-lg",
              isSoldOut
                ? "bg-slate-200 text-muted-foreground cursor-not-allowed shadow-none"
                : "bg-primary text-background hover:bg-orange-600 shadow-primary/20 hover:scale-105 active:scale-95 cursor-pointer",
            )}
          >
            <LuTicket className={cn("w-5", "h-5")} />
            <span className={cn("hidden", "sm:inline")}>
              {isSoldOut ? "Sold Out" : "Secure Your Seat"}
            </span>
            <span className="sm:hidden">{isSoldOut ? "Full" : "Register"}</span>
          </button>
        </div>
      </div>

      {/* Capacity bar */}
      <div className={cn("w-full", "h-1", "bg-muted")}>
        <div
          className={cn(
            "h-full",
            "bg-primary",
            "transition-all",
            "duration-1000",
          )}
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  );
};
