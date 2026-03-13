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
import { cn } from "@/lib/utils";
import Image from "next/image";
import type {
  RegisterEventData,
  RegisterUserData,
} from "@/app/events/[eventId]/register/page";

interface TicketPreviewProps {
  user: RegisterUserData;
  event: RegisterEventData;
  attendanceType: "physical" | "virtual";
}

export const TicketPreviewCard = ({
  user,
  event,
  attendanceType,
}: TicketPreviewProps) => {
  const locationLine =
    attendanceType === "virtual" ? "Zoom / Online" : event.location;

  return (
    <div className={cn("w-full", "px-4", "py-6")}>
      <div className={cn("text-center", "mb-6")}>
        <h3
          className={cn(
            "text-xs",
            "font-black",
            "text-muted-foreground",
            "uppercase",
            "tracking-[0.3em]",
            "mb-1",
          )}
        >
          Live Preview
        </h3>
        <p className={cn("text-muted-foreground", "text-xs", "font-medium")}>
          Your pass will look exactly like this
        </p>
      </div>

      <motion.div
        initial={{ rotateY: -10, opacity: 0 }}
        whileInView={{ rotateY: 0, opacity: 1 }}
        className={cn("mx-auto", "w-full", "max-w-[340px]")}
      >
        <div
          className={cn(
            "bg-foreground",
            "rounded-[2.5rem]",
            "overflow-hidden",
            "shadow-2xl",
            "shadow-slate-400/40",
            "border",
            "border-slate-800",
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "px-8",
              "py-6",
              "flex",
              "items-center",
              "justify-between",
              "border-b",
              "border-background/5",
              "bg-gradient-to-b",
              "from-background/5",
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
                  className={cn(
                    "text-background",
                    "w-4",
                    "h-4",
                    "fill-background",
                  )}
                />
              </div>
              <span
                className={cn(
                  "font-black",
                  "text-background",
                  "tracking-tighter",
                  "text-sm",
                )}
              >
                DIUSCADI
              </span>
            </div>
            <span
              className={cn(
                "px-3",
                "py-1",
                "bg-background/10",
                "rounded-full",
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-background/60",
              )}
            >
              {attendanceType === "physical" ? "Access Pass" : "Digital Entry"}
            </span>
          </div>

          {/* User */}
          <div className={cn("px-8", "py-6", "text-center", "space-y-4")}>
            <div className={cn("relative", "inline-block")}>
              <div
                className={cn(
                  "w-20",
                  "h-20",
                  "rounded-[1.5rem]",
                  "overflow-hidden",
                  "bg-slate-800",
                  "border-2",
                  "border-primary/30",
                  "mx-auto",
                )}
              >
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={80}
                    height={80}
                    className={cn("w-full", "h-full", "object-cover")}
                  />
                ) : (
                  <LuCircleUser
                    className={cn("w-full", "h-full", "text-slate-600", "p-3")}
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
                  "text-background",
                  "text-[8px]",
                  "font-black",
                  "uppercase",
                  "px-2",
                  "py-0.5",
                  "rounded-full",
                  "border-2",
                  "border-foreground",
                  "whitespace-nowrap",
                )}
              >
                Verified
              </div>
            </div>
            <div className={cn("space-y-0.5", "pt-1")}>
              <h4 className={cn("text-lg", "font-black", "text-background")}>
                {user.name || "Your Name"}
              </h4>
              <p
                className={cn(
                  "text-primary",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                Attendee
              </p>
            </div>
          </div>

          {/* Tear */}
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
                "w-5",
                "h-5",
                "bg-background",
                "rounded-full",
                "-ml-4",
              )}
            />
            <div
              className={cn(
                "flex-1",
                "border-t-2",
                "border-dashed",
                "border-background/10",
                "mx-1",
              )}
            />
            <div
              className={cn(
                "w-5",
                "h-5",
                "bg-background",
                "rounded-full",
                "-mr-4",
              )}
            />
          </div>

          {/* Event details */}
          <div className={cn("px-8", "py-6", "space-y-5")}>
            <div>
              <p
                className={cn(
                  "text-[10px]",
                  "font-black",
                  "text-background/30",
                  "uppercase",
                  "tracking-widest",
                  "mb-1",
                )}
              >
                Event
              </p>
              <h5
                className={cn(
                  "text-sm",
                  "font-bold",
                  "text-background",
                  "leading-tight",
                  "line-clamp-2",
                )}
              >
                {event.title}
              </h5>
            </div>
            <div className={cn("grid", "grid-cols-2", "gap-4")}>
              <div>
                <p
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "text-background/30",
                    "uppercase",
                    "tracking-widest",
                    "mb-1",
                  )}
                >
                  Date
                </p>
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-1.5",
                    "text-background/80",
                    "text-xs",
                    "font-bold",
                  )}
                >
                  <LuCalendar className={cn("w-3", "h-3", "text-primary")} />{" "}
                  {event.eventDate}
                </div>
              </div>
              <div>
                <p
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "text-background/30",
                    "uppercase",
                    "tracking-widest",
                    "mb-1",
                  )}
                >
                  Location
                </p>
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-1.5",
                    "text-background/80",
                    "text-xs",
                    "font-bold",
                  )}
                >
                  <LuMapPin className={cn("w-3", "h-3", "text-primary")} />
                  <span className="truncate">{locationLine}</span>
                </div>
              </div>
            </div>

            {/* QR placeholder */}
            <div
              className={cn(
                "p-5",
                "bg-background",
                "rounded-[1.5rem]",
                "flex",
                "flex-col",
                "items-center",
                "gap-3",
              )}
            >
              <div
                className={cn(
                  "p-3",
                  "bg-muted",
                  "rounded-xl",
                  "border-2",
                  "border-border",
                  "opacity-25",
                )}
              >
                <LuQrCode className={cn("w-16", "h-16", "text-foreground")} />
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    "text-[9px]",
                    "font-black",
                    "text-muted-foreground",
                    "uppercase",
                    "tracking-[0.15em]",
                  )}
                >
                  Ticket ID: DIU-2026-XXXX
                </p>
                <p
                  className={cn(
                    "text-[8px]",
                    "font-medium",
                    "text-slate-300",
                    "mt-0.5",
                  )}
                >
                  Scan at entrance for validation
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
