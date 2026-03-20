"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuDownload,
  LuCalendarPlus,
  LuShare2,
  LuExternalLink,
  LuTriangleAlert,
  LuCheck,
  LuLoader,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEvents } from "@/context/EventContext";
import { cn } from "@/lib/utils";

interface TicketActionsProps {
  ticketId: string;
  registrationId: string;
  eventSlug: string;
  status: "Upcoming" | "Used" | "Cancelled";
}

export const TicketActions = ({
  ticketId: _ticketId,
  registrationId,
  eventSlug,
  status,
}: TicketActionsProps) => {
  const router = useRouter();
  const { cancelRegistration } = useEvents();

  const [downloadStarted, setDownloadStarted] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const handleDownload = () => {
    setDownloadStarted(true);
    setTimeout(() => setDownloadStarted(false), 2000);
  };

  const handleConfirmCancel = async () => {
    setCancelLoading(true);
    setCancelError("");
    const result = await cancelRegistration(registrationId);
    if (result.success) {
      router.push("/tickets");
    } else {
      setCancelError(result.error ?? "Cancellation failed. Please try again.");
      setCancelLoading(false);
    }
  };

  const isUsed = status === "Used";
  const btnBase = cn(
    "flex",
    "items-center",
    "justify-center",
    "gap-3",
    "px-8",
    "py-4",
    "rounded-2xl",
    "font-black",
    "text-xs",
    "uppercase",
    "tracking-widest",
    "transition-all",
    "duration-300",
    "cursor-pointer",
  );

  return (
    <section className={cn("w-full", "space-y-4")}>
      {/* Primary actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("grid", "grid-cols-1", "sm:grid-cols-2", "gap-3")}
      >
        <motion.button
          onClick={handleDownload}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            btnBase,
            "relative",
            "overflow-hidden",
            "bg-foreground",
            "text-background",
            "hover:bg-primary",
            "shadow-xl",
            "shadow-foreground/10",
          )}
        >
          <AnimatePresence mode="wait">
            {downloadStarted ? (
              <motion.span
                key="ok"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={cn("flex", "items-center", "gap-2")}
              >
                <LuCheck className={cn("w-5", "h-5")} /> Download Started
              </motion.span>
            ) : (
              <motion.span
                key="dl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={cn("flex", "items-center", "gap-2")}
              >
                <LuDownload className={cn("w-5", "h-5")} /> Download PDF Pass
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {!isUsed ? (
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              btnBase,
              "bg-background",
              "border-2",
              "border-border",
              "text-slate-600",
              "hover:border-primary",
              "hover:text-primary",
            )}
          >
            <LuCalendarPlus className={cn("w-5", "h-5")} /> Add to Calendar
          </motion.button>
        ) : (
          <div
            className={cn(
              btnBase,
              "bg-muted",
              "border-2",
              "border-border",
              "text-slate-300",
              "cursor-not-allowed",
            )}
          >
            <LuCalendarPlus className={cn("w-5", "h-5")} /> Event Passed
          </div>
        )}
      </motion.div>

      {/* Secondary actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn("grid", "grid-cols-1", "sm:grid-cols-2", "gap-3")}
      >
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            btnBase,
            "bg-background",
            "border-2",
            "border-border",
            "text-slate-600",
            "hover:border-foreground",
            "hover:text-foreground",
          )}
        >
          <LuShare2 className={cn("w-5", "h-5")} /> Share Ticket
        </motion.button>

        <Link href={`/events/${eventSlug}`} className="w-full">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              btnBase,
              "w-full",
              "bg-muted",
              "text-muted-foreground",
              "hover:text-muted",
              "border",
              "border-transparent",
              "hover:border-border",
            )}
          >
            <LuExternalLink className={cn("w-5", "h-5")} /> View Event Details
          </motion.div>
        </Link>
      </motion.div>

      {/* Cancel zone */}
      {!isUsed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn("pt-6", "mt-2", "border-t", "border-border")}
        >
          {cancelError && (
            <p
              className={cn(
                "mb-3",
                "text-xs",
                "font-bold",
                "text-rose-600",
                "bg-rose-50",
                "px-4",
                "py-2",
                "rounded-xl",
                "border",
                "border-rose-100",
              )}
            >
              {cancelError}
            </p>
          )}
          <AnimatePresence mode="wait">
            {!showCancelConfirm ? (
              <motion.button
                key="cancel-btn"
                onClick={() => setShowCancelConfirm(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "w-full",
                  "flex",
                  "items-center",
                  "justify-center",
                  "gap-2",
                  "py-3",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-[0.2em]",
                  "text-slate-300",
                  "hover:text-rose-500",
                  "transition-colors",
                  "cursor-pointer",
                )}
              >
                <LuTriangleAlert className={cn("w-4", "h-4")} /> Cancel
                Registration
              </motion.button>
            ) : (
              <motion.div
                key="cancel-confirm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "bg-rose-50",
                  "border-2",
                  "border-rose-200",
                  "rounded-2xl",
                  "p-4",
                  "space-y-3",
                )}
              >
                <div className={cn("flex", "items-start", "gap-3")}>
                  <LuTriangleAlert
                    className={cn(
                      "w-5",
                      "h-5",
                      "text-rose-500",
                      "mt-0.5",
                      "shrink-0",
                    )}
                  />
                  <div>
                    <p
                      className={cn(
                        "text-sm",
                        "font-bold",
                        "text-rose-900",
                        "mb-1",
                      )}
                    >
                      Are you sure?
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        "text-rose-700",
                        "leading-relaxed",
                      )}
                    >
                      This action cannot be undone. Your registration will be
                      cancelled and a refund processed within 5–7 business days.
                    </p>
                  </div>
                </div>
                <div className={cn("flex", "gap-2")}>
                  <button
                    disabled={cancelLoading}
                    onClick={() => setShowCancelConfirm(false)}
                    className={cn(
                      "flex-1",
                      "py-2.5",
                      "bg-background",
                      "border-2",
                      "border-border",
                      "text-slate-600",
                      "rounded-xl",
                      "font-bold",
                      "text-xs",
                      "uppercase",
                      "tracking-wider",
                      "hover:bg-muted",
                      "transition-colors",
                      "cursor-pointer",
                      "disabled:opacity-50",
                    )}
                  >
                    Keep Ticket
                  </button>
                  <button
                    disabled={cancelLoading}
                    onClick={handleConfirmCancel}
                    className={cn(
                      "flex-1",
                      "py-2.5",
                      "bg-rose-500",
                      "text-background",
                      "rounded-xl",
                      "font-bold",
                      "text-xs",
                      "uppercase",
                      "tracking-wider",
                      "hover:bg-rose-600",
                      "transition-colors",
                      "flex",
                      "items-center",
                      "justify-center",
                      "gap-2",
                      "cursor-pointer",
                      "disabled:opacity-70",
                    )}
                  >
                    {cancelLoading ? (
                      <>
                        <LuLoader
                          className={cn("w-3", "h-3", "animate-spin")}
                        />{" "}
                        Cancelling…
                      </>
                    ) : (
                      "Confirm Cancel"
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
};
