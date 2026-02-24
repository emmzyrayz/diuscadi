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
} from "react-icons/lu";
import Link from "next/link";
import { cn } from "../../../../lib/utils";

interface TicketActionsProps {
  eventId: string;
  ticketId: string;
}

export const TicketActions = ({ eventId, ticketId }: TicketActionsProps) => {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleDownload = () => {
    setDownloadStarted(true);
    // Simulate download
    setTimeout(() => setDownloadStarted(false), 2000);
  };

  return (
    <section className={cn("w-full", "space-y-4")}>
      {/* Primary Actions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={cn("grid", "grid-cols-1", "sm:grid-cols-2", "gap-3")}
      >
        {/* 1. Download - The Most Important Action */}
        <motion.button
          onClick={handleDownload}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={cn(
            "relative",
            "overflow-hidden",
            "flex",
            "items-center",
            "justify-center",
            "gap-3",
            "px-8",
            "py-4",
            "bg-slate-900",
            "text-white",
            "rounded-2xl",
            "font-black",
            "text-xs",
            "uppercase",
            "tracking-widest",
            "hover:bg-primary",
            "transition-colors",
            "duration-300",
            "shadow-xl",
            "shadow-slate-900/10",
            "group",
          )}
        >
          <AnimatePresence mode="wait">
            {downloadStarted ? (
              <motion.div
                key="success"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn('flex', 'items-center', 'gap-3')}
              >
                <LuCheck className={cn("w-5", "h-5")} />
                Download Started
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={cn('flex', 'items-center', 'gap-3')}
              >
                <motion.div
                  animate={{ y: [0, 2, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <LuDownload className={cn("w-5", "h-5")} />
                </motion.div>
                Download PDF Pass
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shimmer effect on hover */}
          <motion.div
            className={cn('absolute', 'inset-0', 'bg-linear-to-r', 'from-transparent', 'via-white/10', 'to-transparent')}
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.6 }}
          />
        </motion.button>

        {/* 2. Add to Calendar - Logistics */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={cn(
            "flex",
            "items-center",
            "justify-center",
            "gap-3",
            "px-8",
            "py-4",
            "bg-white",
            "border-2",
            "border-slate-100",
            "text-slate-600",
            "rounded-2xl",
            "font-black",
            "text-xs",
            "uppercase",
            "tracking-widest",
            "hover:border-primary",
            "hover:text-primary",
            "transition-colors",
            "duration-300",
            "group",
          )}
        >
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <LuCalendarPlus className={cn("w-5", "h-5")} />
          </motion.div>
          Add to Calendar
        </motion.button>
      </motion.div>

      {/* Secondary Actions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className={cn("grid", "grid-cols-1", "sm:grid-cols-2", "gap-3")}
      >
        {/* 3. Share - Social/Coordination */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={cn(
            "flex",
            "items-center",
            "justify-center",
            "gap-3",
            "px-8",
            "py-4",
            "bg-white",
            "border-2",
            "border-slate-100",
            "text-slate-600",
            "rounded-2xl",
            "font-black",
            "text-xs",
            "uppercase",
            "tracking-widest",
            "hover:border-slate-900",
            "hover:text-slate-900",
            "transition-colors",
            "duration-300",
            "group",
          )}
        >
          <motion.div
            whileHover={{ rotate: [0, 15, -15, 15, 0] }}
            transition={{ duration: 0.6 }}
          >
            <LuShare2 className={cn("w-5", "h-5")} />
          </motion.div>
          Share Ticket
        </motion.button>

        {/* 4. View Event - The Loop Back */}
        <Link href={`/events/${eventId}`}>
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={cn(
              "flex",
              "items-center",
              "justify-center",
              "gap-3",
              "px-8",
              "py-4",
              "bg-slate-50",
              "text-slate-500",
              "rounded-2xl",
              "font-black",
              "text-xs",
              "uppercase",
              "tracking-widest",
              "hover:bg-slate-100",
              "transition-colors",
              "duration-300",
              "border",
              "border-transparent",
              "hover:border-slate-200",
              "group",
            )}
          >
            <LuExternalLink className={cn("w-5", "h-5")} />
            View Event Details
            <motion.div
              className="absolute"
              initial={{ x: 0, opacity: 0 }}
              whileHover={{ x: 3, opacity: 1 }}
            />
          </motion.div>
        </Link>
      </motion.div>

      {/* Danger Zone: Cancel Ticket */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className={cn("pt-6", "mt-6", "border-t", "border-slate-100")}
      >
        <AnimatePresence mode="wait">
          {!showCancelConfirm ? (
            <motion.button
              key="cancel-button"
              onClick={() => setShowCancelConfirm(true)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
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
                "duration-300",
                "group",
              )}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <LuTriangleAlert
                  className={cn(
                    "w-4",
                    "h-4",
                    "opacity-0",
                    "group-hover:opacity-100",
                    "transition-opacity",
                    "duration-300",
                  )}
                />
              </motion.div>
              Cancel Registration & Refund
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
              <div className={cn('flex', 'items-start', 'gap-3')}>
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                >
                  <LuTriangleAlert
                    className={cn("w-5", "h-5", "text-rose-500", "mt-0.5")}
                  />
                </motion.div>
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
                    cancelled and a refund will be processed within 5-7 business
                    days.
                  </p>
                </div>
              </div>

              <div className={cn('flex', 'gap-2')}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCancelConfirm(false)}
                  className={cn(
                    "flex-1",
                    "py-2.5",
                    "bg-white",
                    "border-2",
                    "border-slate-200",
                    "text-slate-600",
                    "rounded-xl",
                    "font-bold",
                    "text-xs",
                    "uppercase",
                    "tracking-wider",
                    "hover:bg-slate-50",
                    "transition-colors",
                  )}
                >
                  Keep Ticket
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex-1",
                    "py-2.5",
                    "bg-rose-500",
                    "text-white",
                    "rounded-xl",
                    "font-bold",
                    "text-xs",
                    "uppercase",
                    "tracking-wider",
                    "hover:bg-rose-600",
                    "transition-colors",
                  )}
                >
                  Confirm Cancel
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
};
