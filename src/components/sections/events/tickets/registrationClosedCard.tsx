"use client";
import React from "react";
import { LuMailWarning, LuArrowLeft } from "react-icons/lu";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RegistrationClosedCardProps {
  eventSlug: string;
  eventTitle: string;
  reason?: "closed" | "full"; // "closed" = manual admin close, "full" = capacity/tier sold out
}

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@diuscadi.org";

export const RegistrationClosedCard = ({
  eventSlug,
  eventTitle,
  reason = "closed",
}: RegistrationClosedCardProps) => {
  return (
    <div className={cn("max-w-xl", "mx-auto", "py-20", "px-4", "text-center")}>
      <div
        className={cn(
          "bg-muted",
          "border",
          "border-border",
          "rounded-[2.5rem]",
          "p-10",
          "md:p-16",
          "shadow-xl",
          "shadow-slate-200/50",
        )}
      >
        <div
          className={cn(
            "w-20",
            "h-20",
            "bg-amber-500/10",
            "text-amber-600",
            "rounded-full",
            "flex",
            "items-center",
            "justify-center",
            "mx-auto",
            "mb-6",
          )}
        >
          <LuMailWarning className={cn("w-10", "h-10")} />
        </div>
        <h2
          className={cn(
            "text-2xl",
            "md:text-3xl",
            "font-black",
            "text-foreground",
            "mb-4",
            "tracking-tight",
          )}
        >
          Registration Closed
        </h2>
        <p className={cn("text-muted-foreground", "font-medium", "mb-2")}>
          {reason === "full"
            ? `${eventTitle} is fully booked.`
            : `Registration for ${eventTitle} has been closed.`}
        </p>
        <p className={cn("text-muted-foreground", "font-medium", "mb-8")}>
          If you believe this is a mistake or need assistance, please reach out
          to{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className={cn("text-primary", "font-bold", "underline")}
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <Link
          href={`/events/${eventSlug}`}
          className={cn(
            "inline-flex",
            "items-center",
            "gap-2",
            "px-8",
            "py-4",
            "bg-foreground",
            "text-background",
            "font-black",
            "rounded-2xl",
            "hover:bg-slate-800",
            "transition-colors",
            "shadow-lg",
            "shadow-foreground/20",
          )}
        >
          <LuArrowLeft className={cn("w-5", "h-5")} />
          Back to Event
        </Link>
      </div>
    </div>
  );
};
