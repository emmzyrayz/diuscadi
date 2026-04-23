"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuTicket, LuArrowRight, LuClock, LuHistory } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { getEventState, EVENT_STATE_CONFIG } from "@/lib/eventUtils";
import type { EventDetail } from "@/app/events/[slug]/page";

export const FinalCTA = ({ event }: { event: EventDetail }) => {
  const router = useRouter();

  const state = getEventState({
    eventDate: event.eventDateIso,
    endDate: event.endDateIso ?? null,
    registrationDeadline: event.registrationDeadline,
    slotsRemaining: event.slotsRemaining,
    isFree: event.isFree,
  });

  const cfg = EVENT_STATE_CONFIG[state];
  const isPast = state === "past";
  const isSoldOut = state === "soldout";
  const isClosed = state === "closed" || state === "free-closed";
  const canReg = !cfg.btnDisabled;
  const registeredStr =
    event.registered > 0 ? `${event.registered.toLocaleString()}+` : "Many";

  // Background colour changes by state
  const sectionBg = isPast
    ? "bg-slate-800"
    : isSoldOut
      ? "bg-rose-600"
      : isClosed
        ? "bg-slate-700"
        : "bg-primary";

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className={cn(
          "relative rounded-[3rem] p-8 md:p-20 text-center overflow-hidden",
          sectionBg,
        )}
      >
        {/* Background glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-background/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-foreground/10 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* State indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {isPast && <LuHistory className="w-5 h-5 text-background/60" />}
            {(isSoldOut || isClosed) && (
              <LuClock className="w-5 h-5 text-background/60" />
            )}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-background/60">
              {cfg.label}
            </span>
          </div>

          <h2 className="text-3xl md:text-6xl font-black text-background mb-6 tracking-tighter">
            {isPast ? (
              <>
                This event has <br />
                <span className="text-background/50 italic">
                  already ended.
                </span>
              </>
            ) : isSoldOut ? (
              <>
                All seats are <br />
                <span className="italic">taken.</span>
              </>
            ) : isClosed ? (
              <>
                Registration is <br />
                <span className="italic">now closed.</span>
              </>
            ) : (
              <>
                Don&apos;t miss out on <br />
                <span className="text-foreground italic">this experience.</span>
              </>
            )}
          </h2>

          <p className="text-background/80 text-lg md:text-xl font-medium mb-10">
            {isPast ? (
              <>
                {registeredStr} people attended{" "}
                <strong className="text-background underline decoration-background/30 underline-offset-4">
                  {event.title}
                </strong>
                .
              </>
            ) : (
              <>
                Join {registeredStr} others already registered for&nbsp;
                <br className="hidden md:block" />
                <strong className="text-background underline decoration-background/30 underline-offset-4">
                  {event.title}
                </strong>
                .
              </>
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {canReg ? (
              <>
                <button
                  onClick={() => router.push(`/events/${event.slug}/register`)}
                  className="w-full sm:w-auto px-10 py-5 font-black rounded-2xl flex items-center justify-center gap-3 shadow-2xl bg-foreground text-background hover:scale-105 cursor-pointer transition-all"
                >
                  <LuTicket className="w-6 h-6" />
                  {cfg.btnLabel}
                </button>
                <button className="w-full sm:w-auto px-10 py-5 bg-background text-primary font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-muted transition-all cursor-pointer">
                  Invite a Friend
                  <LuArrowRight className="w-5 h-5" />
                </button>
              </>
            ) : (
              /* Past / sold out / closed — single "View Gallery" or back to events */
              <>
                <div className="w-full sm:w-auto px-10 py-5 font-black rounded-2xl flex items-center justify-center gap-3 bg-background/20 text-background cursor-not-allowed">
                  <LuTicket className="w-6 h-6 opacity-50" />
                  {cfg.btnLabel}
                </div>
                <button
                  onClick={() =>
                    router.push(isPast ? "/gallery" : "/home/events")
                  }
                  className="w-full sm:w-auto px-10 py-5 bg-background text-primary font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-muted transition-all cursor-pointer"
                >
                  {isPast ? "View Gallery" : "Browse Other Events"}
                  <LuArrowRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {!isPast && (
            <p className="mt-8 text-[10px] text-background/60 font-black uppercase tracking-[0.2em]">
              Limited to {event.capacity.toLocaleString()} total participants.
            </p>
          )}
        </div>
      </motion.div>
    </section>
  );
};
