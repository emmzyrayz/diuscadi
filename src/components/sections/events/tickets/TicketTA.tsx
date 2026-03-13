"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuShieldAlert, LuCheck, LuExternalLink, LuInfo } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface TicketTAProps {
  agreed: boolean;
  onAgreeChange: (v: boolean) => void;
}

export const TicketTermsAndAgreement = ({
  agreed,
  onAgreeChange,
}: TicketTAProps) => (
  <div
    className={cn(
      "bg-background rounded-[2.5rem] p-8 md:p-10 border-2 transition-all duration-300",
      agreed
        ? "border-emerald-500 shadow-lg shadow-emerald-500/10"
        : "border-border",
    )}
  >
    <div className={cn("flex", "items-start", "gap-4", "mb-8")}>
      <div className={cn("p-3", "bg-blue-50", "text-blue-600", "rounded-2xl")}>
        <LuInfo className={cn("w-5", "h-5")} />
      </div>
      <div>
        <h3
          className={cn(
            "font-black",
            "text-foreground",
            "uppercase",
            "tracking-tighter",
            "text-lg",
          )}
        >
          Terms of Participation
        </h3>
        <p
          className={cn(
            "text-sm",
            "text-muted-foreground",
            "font-medium",
            "mt-1",
          )}
        >
          Please review our ground rules to ensure a productive experience for
          everyone.
        </p>
      </div>
    </div>
    <div
      className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-4", "mb-8")}
    >
      {[
        "Tickets are non-transferable and tied to your verified identity.",
        "Recording or rebroadcasting of session content is strictly prohibited.",
      ].map((rule, i) => (
        <div
          key={i}
          className={cn(
            "p-4",
            "bg-muted",
            "rounded-2xl",
            "border",
            "border-border",
            "flex",
            "items-start",
            "gap-3",
          )}
        >
          <LuShieldAlert
            className={cn(
              "w-4",
              "h-4",
              "text-muted-foreground",
              "mt-0.5",
              "shrink-0",
            )}
          />
          <p
            className={cn(
              "text-[11px]",
              "font-bold",
              "text-slate-600",
              "leading-relaxed",
            )}
          >
            {rule}
          </p>
        </div>
      ))}
    </div>
    <div
      className={cn(
        "flex",
        "flex-col",
        "md:flex-row",
        "md:items-center",
        "justify-between",
        "gap-6",
        "pt-6",
        "border-t",
        "border-border",
      )}
    >
      <label
        className={cn(
          "flex",
          "items-start",
          "gap-4",
          "cursor-pointer",
          "group",
          "max-w-xl",
        )}
      >
        <div className={cn("relative", "mt-1")}>
          <input
            type="checkbox"
            className={cn("peer", "sr-only")}
            checked={agreed}
            onChange={() => onAgreeChange(!agreed)}
          />
          <div
            className={cn(
              "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
              agreed
                ? "bg-emerald-500 border-emerald-500"
                : "bg-background border-border group-hover:border-primary",
            )}
          >
            {agreed && (
              <LuCheck className={cn("text-background", "w-4", "h-4")} />
            )}
          </div>
        </div>
        <span
          className={cn(
            "text-sm",
            "font-bold",
            "text-slate-700",
            "leading-snug",
          )}
        >
          I have read and agree to the DIUSCADI{" "}
          <a
            href="#"
            className={cn(
              "text-primary",
              "hover:underline",
              "inline-flex",
              "items-center",
              "gap-1",
            )}
          >
            Event Terms <LuExternalLink className={cn("w-3", "h-3")} />
          </a>{" "}
          and{" "}
          <a
            href="#"
            className={cn(
              "text-primary",
              "hover:underline",
              "inline-flex",
              "items-center",
              "gap-1",
            )}
          >
            Privacy Policy <LuExternalLink className={cn("w-3", "h-3")} />
          </a>
          .
        </span>
      </label>
      {!agreed && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "px-4",
            "py-2",
            "bg-orange-50",
            "text-orange-600",
            "text-[10px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "rounded-lg",
            "flex",
            "items-center",
            "gap-2",
            "shrink-0",
          )}
        >
          <div
            className={cn(
              "w-1.5",
              "h-1.5",
              "bg-orange-600",
              "rounded-full",
              "animate-pulse",
            )}
          />
          Required to continue
        </motion.div>
      )}
    </div>
  </div>
);
