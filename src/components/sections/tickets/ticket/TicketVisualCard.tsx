"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuQrCode, LuMaximize, LuShieldCheck, LuInfo } from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface TicketVisualCardProps {
  ticket: {
    id: string;
    eventName: string;
    eventImage: string;
    userName: string;
    type: string;
    status: string; // Added status property
  };
}

export const TicketVisualCard = ({ ticket }: TicketVisualCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative",
        "w-full",
        "max-w-sm",
        "mx-auto",
        "filter",
        "drop-shadow-2xl",
      )}
    >
      {/* 1. Main Ticket Body */}
      <div
        className={cn(
          "bg-white",
          "rounded-[2.5rem]",
          "overflow-hidden",
          "flex",
          "flex-col",
        )}
      >
        {/* --- TOP SECTION: Brand & Image --- */}
        <div className={cn("relative", "h-48", "w-full", "overflow-hidden")}>
          <Image
            height={300}
            width={500}
            src={ticket.eventImage}
            alt={ticket.eventName}
            className={cn("w-full", "h-full", "object-cover")}
          />
          {/* Dark Overlay for Text Legibility */}
          <div
            className={cn(
              "absolute",
              "inset-0",
              "bg-linear-to-t",
              "from-slate-900",
              "via-slate-900/40",
              "to-transparent",
            )}
          />

          <div className={cn("absolute", "bottom-6", "left-6", "right-6")}>
            <div className={cn("flex", "items-center", "gap-2", "mb-2")}>
              <span
                className={cn(
                  "px-2",
                  "py-0.5",
                  "bg-primary",
                  "text-white",
                  "text-[9px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "rounded-sm",
                )}
              >
                Official Pass
              </span>
            </div>
            <h3
              className={cn(
                "text-xl",
                "font-black",
                "text-white",
                "tracking-tight",
                "uppercase",
                "leading-tight",
              )}
            >
              {ticket.eventName}
            </h3>
          </div>

          {/* Hologram Effect (Top Right) */}
          <div
            className={cn(
              "absolute",
              "top-4",
              "right-4",
              "w-10",
              "h-10",
              "bg-linear-to-br",
              "from-white/20",
              "to-white/5",
              "backdrop-blur-md",
              "rounded-full",
              "border",
              "border-white/20",
              "flex",
              "items-center",
              "justify-center",
            )}
          >
            <LuShieldCheck className={cn("w-5", "h-5", "text-primary/80")} />
          </div>
        </div>

        {/* --- MIDDLE SECTION: User Details --- */}
        <div className={cn("p-6", "bg-white", "space-y-4")}>
          <div className={cn("flex", "justify-between", "items-center")}>
            <div>
              <p
                className={cn(
                  "text-[9px]",
                  "font-black",
                  "text-slate-400",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                Attendee
              </p>
              <p className={cn("text-sm", "font-bold", "text-slate-900")}>
                {ticket.userName}
              </p>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "text-[9px]",
                  "font-black",
                  "text-slate-400",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                Tier
              </p>
              <p className={cn("text-sm", "font-bold", "text-primary")}>
                {ticket.type}
              </p>
            </div>
          </div>
        </div>

        {/* --- THE PERFORATION (The "Ticket Stub" Break) --- */}
        <div
          className={cn(
            "relative",
            "flex",
            "items-center",
            "justify-between",
            "h-8",
            "bg-white",
          )}
        >
          {/* Left Bite */}
          <div
            className={cn(
              "absolute",
              "-left-4",
              "w-8",
              "h-8",
              "bg-slate-50",
              "rounded-full",
              "border",
              "border-slate-100",
            )}
          />

          {/* The Dashed Line */}
          <div
            className={cn(
              "flex-1",
              "border-t-2",
              "border-dashed",
              "border-slate-100",
              "mx-6",
            )}
          />

          {/* Right Bite */}
          <div
            className={cn(
              "absolute",
              "-right-4",
              "w-8",
              "h-8",
              "bg-slate-50",
              "rounded-full",
              "border",
              "border-slate-100",
            )}
          />
        </div>

        {/* --- BOTTOM SECTION: The QR Scanning Zone --- */}
        <div
          className={cn(
            "p-8",
            "bg-white",
            "flex",
            "flex-col",
            "items-center",
            "text-center",
          )}
        >
          <div
            className={cn(
              "relative",
              "group",
              "p-4",
              "bg-slate-50",
              "rounded-3xl",
              "border",
              "border-slate-100",
              "mb-4",
            )}
          >
            <div
              className={cn(
                "w-32",
                "h-32",
                "bg-white",
                "flex",
                "items-center",
                "justify-center",
                "rounded-xl",
                "overflow-hidden",
              )}
            >
              {/* QR Component would go here */}
              <LuQrCode className={cn("w-24", "h-24", "text-slate-900")} />
            </div>

            {/* Corner Brackets for "Scanner View" feel */}
            <div
              className={cn(
                "absolute",
                "top-2",
                "left-2",
                "w-4",
                "h-4",
                "border-t-2",
                "border-l-2",
                "border-primary/30",
              )}
            />
            <div
              className={cn(
                "absolute",
                "bottom-2",
                "right-2",
                "w-4",
                "h-4",
                "border-b-2",
                "border-r-2",
                "border-primary/30",
              )}
            />
          </div>

          <div className="space-y-1">
            <p
              className={cn(
                "text-[10px]",
                "font-black",
                "text-slate-900",
                "uppercase",
                "tracking-widest",
                "flex",
                "items-center",
                "justify-center",
                "gap-2",
              )}
            >
              <LuMaximize className={cn("w-3", "h-3", "text-primary")} />
              Scan at Entrance
            </p>
            <p
              className={cn(
                "font-mono",
                "text-[10px]",
                "text-slate-400",
                "tracking-[0.2em]",
                "font-bold",
              )}
            >
              ID: {ticket.id}
            </p>
          </div>
        </div>

        {/* Security Footer */}
        <div
          className={cn(
            "bg-slate-900",
            "py-3",
            "px-6",
            "flex",
            "items-center",
            "justify-center",
            "gap-2",
          )}
        >
          <LuInfo className={cn("w-3", "h-3", "text-slate-500")} />
          <p
            className={cn(
              "text-[8px]",
              "font-black",
              "text-slate-500",
              "uppercase",
              "tracking-[0.3em]",
            )}
          >
            Valid for single entry only
          </p>
        </div>
      </div>
    </motion.div>
  );
};
