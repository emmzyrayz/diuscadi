"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuTicket, LuArrowRight } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { EventDetail } from "@/app/events/[eventId]/page";

export const FinalCTA = ({ event }: { event: EventDetail }) => {
  const isSoldOut = event.slotsRemaining === 0;
  const registeredStr =
    event.registered > 0 ? `${event.registered.toLocaleString()}+` : "Many";

  return (
    <section
      className={cn(
        "w-full",
        "max-w-7xl",
        "mx-auto",
        "px-4",
        "sm:px-6",
        "lg:px-8",
        "py-20",
      )}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className={cn(
          "relative",
          "bg-primary",
          "rounded-[3rem]",
          "p-8",
          "md:p-20",
          "text-center",
          "overflow-hidden",
        )}
      >
        {/* Background glows */}
        <div
          className={cn(
            "absolute",
            "top-0",
            "right-0",
            "w-64",
            "h-64",
            "bg-background/10",
            "rounded-full",
            "blur-3xl",
            "-mr-32",
            "-mt-32",
          )}
        />
        <div
          className={cn(
            "absolute",
            "bottom-0",
            "left-0",
            "w-64",
            "h-64",
            "bg-foreground/10",
            "rounded-full",
            "blur-3xl",
            "-ml-32",
            "-mb-32",
          )}
        />

        <div className={cn("relative", "z-10", "max-w-3xl", "mx-auto")}>
          <h2
            className={cn(
              "text-3xl",
              "md:text-6xl",
              "font-black",
              "text-background",
              "mb-6",
              "tracking-tighter",
            )}
          >
            Don&apos;t miss out on <br />
            <span className={cn("text-foreground", "italic")}>
              this experience.
            </span>
          </h2>

          <p
            className={cn(
              "text-background/80",
              "text-lg",
              "md:text-xl",
              "font-medium",
              "mb-10",
            )}
          >
            Join {registeredStr} others already registered for&nbsp;
            <br className={cn("hidden", "md:block")} />
            <strong
              className={cn(
                "text-background",
                "underline",
                "decoration-background/30",
                "underline-offset-4",
              )}
            >
              {event.title}
            </strong>
            .
          </p>

          <div
            className={cn(
              "flex",
              "flex-col",
              "sm:flex-row",
              "items-center",
              "justify-center",
              "gap-4",
            )}
          >
            <button
              disabled={isSoldOut}
              className={cn(
                "w-full sm:w-auto px-10 py-5 font-black rounded-2xl flex items-center justify-center gap-3 shadow-2xl transition-all",
                isSoldOut
                  ? "bg-slate-600 text-background/50 cursor-not-allowed"
                  : "bg-foreground text-background hover:scale-105 cursor-pointer",
              )}
            >
              <LuTicket className={cn("w-6", "h-6")} />
              {isSoldOut
                ? "Sold Out"
                : event.isFree
                  ? "Claim Your Free Seat"
                  : "Register Now"}
            </button>
            <button
              className={cn(
                "w-full",
                "sm:w-auto",
                "px-10",
                "py-5",
                "bg-background",
                "text-primary",
                "font-black",
                "rounded-2xl",
                "flex",
                "items-center",
                "justify-center",
                "gap-3",
                "hover:bg-muted",
                "transition-all",
                "cursor-pointer",
              )}
            >
              Invite a Friend
              <LuArrowRight className={cn("w-5", "h-5")} />
            </button>
          </div>

          <p
            className={cn(
              "mt-8",
              "text-[10px]",
              "text-background/60",
              "font-black",
              "uppercase",
              "tracking-[0.2em]",
            )}
          >
            Limited to {event.capacity.toLocaleString()} total participants.
          </p>
        </div>
      </motion.div>
    </section>
  );
};
