"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuTicket, LuLoader, LuCircleCheck } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface SubmitProps {
  price: string;
  agreed: boolean;
  status: "idle" | "loading" | "success" | "error";
  onSubmit: () => void;
}

export const TicketSubmitSection = ({
  price,
  agreed,
  status,
  onSubmit,
}: SubmitProps) => {
  const isFree = price.toLowerCase() === "free";
  const isDisabled = !agreed || status !== "idle";

  return (
    <div
      className={cn(
        "bg-foreground",
        "rounded-[3rem]",
        "p-8",
        "md:p-12",
        "shadow-2xl",
        "relative",
        "overflow-hidden",
      )}
    >
      <div
        className={cn(
          "absolute",
          "-top-24",
          "-right-24",
          "w-64",
          "h-64",
          "bg-primary/20",
          "rounded-full",
          "blur-[80px]",
        )}
      />
      <div
        className={cn("relative", "z-10", "flex", "flex-col", "items-center")}
      >
        {/* Price summary */}
        <div className={cn("w-full", "max-w-md", "mb-8", "space-y-3")}>
          <div
            className={cn(
              "flex",
              "justify-between",
              "text-muted-foreground",
              "text-sm",
              "font-medium",
              "px-2",
            )}
          >
            <span>Standard Access Pass</span>
            <span>{price}</span>
          </div>
          <div
            className={cn(
              "flex",
              "justify-between",
              "text-muted-foreground",
              "text-sm",
              "font-medium",
              "px-2",
            )}
          >
            <span>Service & Processing Fee</span>
            <span className="text-emerald-500">₦0.00</span>
          </div>
          <div className={cn("h-px", "bg-background/10")} />
          <div
            className={cn("flex", "justify-between", "items-center", "px-2")}
          >
            <span
              className={cn(
                "text-background",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-sm",
              )}
            >
              Total Due
            </span>
            <span
              className={cn(
                "text-3xl font-black",
                isFree ? "text-emerald-400" : "text-background",
              )}
            >
              {price}
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          disabled={isDisabled}
          onClick={onSubmit}
          className={cn(
            "relative w-full max-w-md h-16 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 overflow-hidden",
            status === "success"
              ? "bg-emerald-500 text-background cursor-default"
              : isDisabled
                ? "bg-slate-700 text-muted-foreground cursor-not-allowed"
                : "bg-primary text-background hover:bg-orange-600 active:scale-95 shadow-xl shadow-primary/25 cursor-pointer",
          )}
        >
          <AnimatePresence mode="wait">
            {status === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn("flex", "items-center", "gap-2")}
              >
                Get Ticket <LuTicket className={cn("w-5", "h-5")} />
              </motion.div>
            )}
            {status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn("flex", "items-center", "gap-2")}
              >
                <LuLoader className={cn("w-5", "h-5", "animate-spin")} />{" "}
                Generating...
              </motion.div>
            )}
            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn("flex", "items-center", "gap-2")}
              >
                <LuCircleCheck className={cn("w-5", "h-5")} /> Confirmed!
                Redirecting…
              </motion.div>
            )}
            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn("flex", "items-center", "gap-2")}
              >
                Get Ticket <LuTicket className={cn("w-5", "h-5")} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {!agreed && (
          <p className={cn("mt-4", "text-xs", "text-muted-foreground", "font-bold")}>
            Please agree to the terms above to continue.
          </p>
        )}

        <p
          className={cn(
            "mt-6",
            "text-[10px]",
            "text-muted-foreground",
            "font-black",
            "uppercase",
            "tracking-[0.2em]",
          )}
        >
          Secure checkout powered by DIUSCADI Core
        </p>
      </div>
    </div>
  );
};
