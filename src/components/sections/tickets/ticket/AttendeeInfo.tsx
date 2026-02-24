"use client";
import React from "react";
import {
  LuSquareUser,
  LuUser,
  LuMail,
  LuPhone,
  LuShieldCheck,
} from "react-icons/lu";

import { cn } from "../../../../lib/utils";
import Image from "next/image";

interface AttendeeInfoProps {
  attendee: {
    name: string;
    email: string;
    phone: string;
    avatar?: string; // Optional, but adds a premium touch if you have profile pics
  };
}

export const AttendeeInfoSection = ({ attendee }: AttendeeInfoProps) => {
  return (
    <section
      className={cn("w-full", "mt-8", "pt-8", "border-t", "border-slate-100")}
    >
      {/* Section Header */}
      <div className={cn("flex", "items-center", "gap-3", "mb-6")}>
        <div
          className={cn(
            "w-8",
            "h-8",
            "rounded-lg",
            "bg-slate-100",
            "flex",
            "items-center",
            "justify-center",
            "text-slate-500",
          )}
        >
          <LuSquareUser className={cn("w-4", "h-4")} />
        </div>
        <div>
          <h3
            className={cn(
              "text-xl",
              "font-black",
              "text-slate-900",
              "tracking-tight",
              "leading-none",
            )}
          >
            Attendee Information
          </h3>
          <p
            className={cn(
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "text-slate-400",
              "mt-1",
              "flex",
              "items-center",
              "gap-1",
            )}
          >
            <LuShieldCheck className={cn("w-3", "h-3", "text-emerald-500")} />
            Verified Profile Data
          </p>
        </div>
      </div>

      {/* Identity Data Card */}
      <div
        className={cn(
          "bg-white",
          "border-2",
          "border-slate-100",
          "rounded-[2rem]",
          "p-6",
          "md:p-8",
          "flex",
          "flex-col",
          "md:flex-row",
          "items-start",
          "md:items-center",
          "gap-8",
        )}
      >
        {/* Optional Avatar / Placeholder */}
        <div
          className={cn(
            "shrink-0",
            "w-20",
            "h-20",
            "rounded-2xl",
            "bg-slate-50",
            "border-2",
            "border-slate-100",
            "flex",
            "items-center",
            "justify-center",
            "overflow-hidden",
          )}
        >
          {attendee.avatar ? (
            <Image
              height={300}
              width={500}
              src={attendee.avatar}
              alt={attendee.name}
              className={cn("w-full", "h-full", "object-cover")}
            />
          ) : (
            <LuUser className={cn("w-8", "h-8", "text-slate-300")} />
          )}
        </div>

        {/* Info Grid */}
        <div
          className={cn(
            "flex-1",
            "w-full",
            "grid",
            "grid-cols-1",
            "sm:grid-cols-3",
            "gap-6",
          )}
        >
          {/* Name */}
          <div className="space-y-1">
            <p
              className={cn(
                "text-[9px]",
                "font-black",
                "text-slate-400",
                "uppercase",
                "tracking-widest",
                "flex",
                "items-center",
                "gap-1.5",
              )}
            >
              <LuUser className={cn("w-3", "h-3")} /> Full Name
            </p>
            <p className={cn("text-sm", "font-bold", "text-slate-900")}>
              {attendee.name}
            </p>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <p
              className={cn(
                "text-[9px]",
                "font-black",
                "text-slate-400",
                "uppercase",
                "tracking-widest",
                "flex",
                "items-center",
                "gap-1.5",
              )}
            >
              <LuMail className={cn("w-3", "h-3")} /> Email Address
            </p>
            <p
              className={cn(
                "text-sm",
                "font-bold",
                "text-slate-900",
                "truncate",
              )}
            >
              {attendee.email}
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <p
              className={cn(
                "text-[9px]",
                "font-black",
                "text-slate-400",
                "uppercase",
                "tracking-widest",
                "flex",
                "items-center",
                "gap-1.5",
              )}
            >
              <LuPhone className={cn("w-3", "h-3")} /> Phone Number
            </p>
            <p className={cn("text-sm", "font-bold", "text-slate-900")}>
              {attendee.phone || "Not provided"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
