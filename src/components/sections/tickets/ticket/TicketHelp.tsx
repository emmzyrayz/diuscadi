"use client";
import React from "react";
import { LuInfo, LuMail, LuArrowRight } from "react-icons/lu";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const TicketHelpSection = () => (
  <section className={cn("w-full", "max-w-4xl", "mx-auto", "px-4", "pb-12")}>
    <div
      className={cn(
        "bg-muted",
        "rounded-[2rem]",
        "p-8",
        "md:p-10",
        "border",
        "border-border",
        "flex",
        "flex-col",
        "md:flex-row",
        "items-center",
        "justify-between",
        "gap-8",
        "text-center",
        "md:text-left",
      )}
    >
      <div
        className={cn(
          "flex",
          "flex-col",
          "md:flex-row",
          "items-center",
          "md:items-start",
          "gap-5",
        )}
      >
        <div
          className={cn(
            "w-14",
            "h-14",
            "bg-blue-100",
            "text-blue-600",
            "rounded-2xl",
            "flex",
            "items-center",
            "justify-center",
            "shrink-0",
          )}
        >
          <LuInfo className={cn("w-7", "h-7")} />
        </div>
        <div>
          <h3
            className={cn(
              "text-xl",
              "font-black",
              "text-foreground",
              "mb-2",
              "tracking-tight",
            )}
          >
            Having trouble?
          </h3>
          <p
            className={cn(
              "text-sm",
              "font-medium",
              "text-muted-foreground",
              "leading-relaxed",
            )}
          >
            Can&apos;t complete your registration or need special assistance?{" "}
            <br className={cn("hidden", "md:block")} />
            Our support team is here to help.
          </p>
        </div>
      </div>
      <div
        className={cn(
          "flex",
          "flex-col",
          "sm:flex-row",
          "items-center",
          "gap-3",
          "w-full",
          "md:w-auto",
          "shrink-0",
        )}
      >
        <a
          href="mailto:support@diuscadi.org.ng"
          className={cn(
            "w-full",
            "sm:w-auto",
            "px-6",
            "py-3.5",
            "bg-background",
            "border-2",
            "border-border",
            "hover:border-blue-600",
            "hover:text-blue-600",
            "rounded-xl",
            "text-sm",
            "font-bold",
            "text-slate-700",
            "transition-all",
            "flex",
            "items-center",
            "justify-center",
            "gap-2",
            "group",
          )}
        >
          <LuMail
            className={cn(
              "w-4",
              "h-4",
              "text-muted-foreground",
              "group-hover:text-blue-600",
              "transition-colors",
            )}
          />
          Email Support
        </a>
        <Link
          href="/events#faqs"
          className={cn(
            "w-full",
            "sm:w-auto",
            "px-6",
            "py-3.5",
            "hover:text-muted",
            "rounded-xl",
            "text-sm",
            "font-bold",
            "text-slate-600",
            "transition-all",
            "flex",
            "items-center",
            "justify-center",
            "gap-2",
            "group",
          )}
        >
          Read FAQs
          <LuArrowRight
            className={cn(
              "w-4",
              "h-4",
              "group-hover:translate-x-1",
              "transition-all",
            )}
          />
        </Link>
      </div>
    </div>
  </section>
);
