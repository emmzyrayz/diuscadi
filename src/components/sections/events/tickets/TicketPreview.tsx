"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuQrCode,
  LuCircleUser,
  LuMapPin,
  LuCalendar,
  LuZap,
} from "react-icons/lu";
import { Event } from "@/types/event";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface TicketPreviewProps {
  user: {
    name: string;
    avatar?: string;
  };
  event: Event;
  attendanceType: "physical" | "virtual";
}

export const TicketPreviewCard = ({
  user,
  event,
  attendanceType,
}: TicketPreviewProps) => {
  return (
    <section className={cn("w-full", "max-w-4xl", "mx-auto", "px-4", "py-12")}>
      <div className={cn("text-center", "mb-10")}>
        <h3
          className={cn(
            "text-sm",
            "font-black",
            "text-slate-400",
            "uppercase",
            "tracking-[0.3em]",
            "mb-2",
          )}
        >
          Live Preview
        </h3>
        <p className={cn("text-slate-500", "font-medium")}>
          Your pass will look exactly like this
        </p>
      </div>

      <motion.div
        initial={{ rotateY: -10, opacity: 0 }}
        whileInView={{ rotateY: 0, opacity: 1 }}
        className={cn(
          "relative",
          "mx-auto",
          "w-full",
          "max-w-[380px]",
          "perspective-1000",
        )}
      >
        {/* The Ticket Body */}
        <div
          className={cn(
            "bg-slate-900",
            "rounded-[2.5rem]",
            "overflow-hidden",
            "shadow-2xl",
            "shadow-slate-400/50",
            "border",
            "border-slate-800",
          )}
        >
          {/* 1. Ticket Header */}
          <div
            className={cn(
              "p-8",
              "pb-6",
              "flex",
              "items-center",
              "justify-between",
              "border-b",
              "border-white/5",
              "bg-linear-to-b",
              "from-white/5",
              "to-transparent",
            )}
          >
            <div className={cn("flex", "items-center", "gap-2")}>
              <div
                className={cn(
                  "w-8",
                  "h-8",
                  "bg-primary",
                  "rounded-lg",
                  "flex",
                  "items-center",
                  "justify-center",
                )}
              >
                <LuZap
                  className={cn("text-white", "w-5", "h-5", "fill-white")}
                />
              </div>
              <span
                className={cn("font-black", "text-white", "tracking-tighter")}
              >
                DIUSCADI
              </span>
            </div>
            <span
              className={cn(
                "px-3",
                "py-1",
                "bg-white/10",
                "rounded-full",
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-white/60",
              )}
            >
              {attendanceType === "physical" ? "Access Pass" : "Digital Entry"}
            </span>
          </div>

          {/* 2. User Identity Section */}
          <div className={cn("p-8", "text-center", "space-y-4")}>
            <div className={cn("relative", "inline-block")}>
              <div
                className={cn(
                  "w-24",
                  "h-24",
                  "rounded-[2rem]",
                  "overflow-hidden",
                  "bg-slate-800",
                  "border-2",
                  "border-primary/30",
                  "mx-auto",
                )}
              >
                {user.avatar ? (
                  <Image
                    height={300}
                    width={500}
                    src={user.avatar}
                    alt={user.name}
                    className={cn("w-full", "h-full", "object-cover")}
                  />
                ) : (
                  <LuCircleUser
                    className={cn("w-full", "h-full", "text-slate-600", "p-4")}
                  />
                )}
              </div>
              <div
                className={cn(
                  "absolute",
                  "-bottom-2",
                  "left-1/2",
                  "-translate-x-1/2",
                  "bg-primary",
                  "text-white",
                  "text-[8px]",
                  "font-black",
                  "uppercase",
                  "px-3",
                  "py-1",
                  "rounded-full",
                  "border-2",
                  "border-slate-900",
                )}
              >
                Verified
              </div>
            </div>

            <div className="space-y-1">
              <h4 className={cn("text-2xl", "font-black", "text-white")}>
                {user.name || "Your Name"}
              </h4>
              <p
                className={cn(
                  "text-primary",
                  "text-xs",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                Attendee
              </p>
            </div>
          </div>

          {/* 3. Perforation (The "Tear" effect) */}
          <div
            className={cn(
              "relative",
              "flex",
              "items-center",
              "justify-between",
              "px-2",
            )}
          >
            <div
              className={cn(
                "w-6",
                "h-6",
                "bg-white",
                "rounded-full",
                "-ml-5",
                "z-10",
              )}
            />
            <div
              className={cn(
                "flex-1",
                "border-t-2",
                "border-dashed",
                "border-white/10",
                "mx-2",
              )}
            />
            <div
              className={cn(
                "w-6",
                "h-6",
                "bg-white",
                "rounded-full",
                "-mr-5",
                "z-10",
              )}
            />
          </div>

          {/* 4. Event Details Section */}
          <div className={cn("p-8", "pt-6", "space-y-6")}>
            <div className="space-y-1">
              <p
                className={cn(
                  "text-[10px]",
                  "font-black",
                  "text-white/30",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                Event Title
              </p>
              <h5
                className={cn(
                  "text-lg",
                  "font-bold",
                  "text-white",
                  "leading-tight",
                )}
              >
                {event.title}
              </h5>
            </div>

            <div className={cn("grid", "grid-cols-2", "gap-4")}>
              <div className="space-y-1">
                <p
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "text-white/30",
                    "uppercase",
                    "tracking-widest",
                  )}
                >
                  Date
                </p>
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-2",
                    "text-white/80",
                    "text-xs",
                    "font-bold",
                  )}
                >
                  <LuCalendar
                    className={cn("w-3.5", "h-3.5", "text-primary")}
                  />
                  {event.date}
                </div>
              </div>
              <div className="space-y-1">
                <p
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "text-white/30",
                    "uppercase",
                    "tracking-widest",
                  )}
                >
                  Location
                </p>
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-2",
                    "text-white/80",
                    "text-xs",
                    "font-bold",
                  )}
                >
                  <LuMapPin className={cn("w-3.5", "h-3.5", "text-primary")} />
                  <span className="truncate">
                    {attendanceType === "physical"
                      ? event.location
                      : "Zoom Link"}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. QR Code Placeholder */}
            <div
              className={cn(
                "mt-8",
                "p-6",
                "bg-white",
                "rounded-[2rem]",
                "flex",
                "flex-col",
                "items-center",
                "justify-center",
                "gap-4",
              )}
            >
              <div
                className={cn(
                  "p-4",
                  "bg-slate-50",
                  "rounded-2xl",
                  "border-2",
                  "border-slate-100",
                  "opacity-20",
                  "group-hover:opacity-100",
                  "transition-opacity",
                )}
              >
                <LuQrCode className={cn("w-24", "h-24", "text-slate-900")} />
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    "text-[9px]",
                    "font-black",
                    "text-slate-400",
                    "uppercase",
                    "tracking-[0.2em]",
                  )}
                >
                  Ticket ID: DIU-2026-XXXX
                </p>
                <p
                  className={cn(
                    "text-[8px]",
                    "font-medium",
                    "text-slate-300",
                    "mt-1",
                  )}
                >
                  Scan at entrance for validation
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
