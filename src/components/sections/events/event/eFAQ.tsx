"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuCircleHelp, LuChevronDown } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { EventDetail } from "@/app/events/[eventId]/page";

// Static FAQ items that apply to all events — replace with per-event FAQ
// when an faq[] field is added to EventDocument.
const DEFAULT_FAQS = [
  {
    q: "Is this event free to attend?",
    a: "Check the entry fee displayed in the sticky bar above. Many DIUSCADI events are free for registered members.",
  },
  {
    q: "What happens after I register?",
    a: "You will receive a confirmation email with your unique invite code. Bring it (or the QR code) for check-in on the event day.",
  },
  {
    q: "Can I cancel my registration?",
    a: "Yes — open your Tickets page and cancel before the registration deadline. Refunds (if applicable) are processed within 5 business days.",
  },
  {
    q: "Will this event be recorded?",
    a: "Select sessions may be recorded and shared with attendees afterward. Check back on the event page for updates.",
  },
  {
    q: "Who can attend?",
    a: "The event details specify the target audience. Most events are open to all DIUSCADI members.",
  },
];

export const FAQSection = ({ event: _event }: { event: EventDetail }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className={cn("w-full", "py-16")}>
      <div className={cn("max-w-3xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8")}>
        <div className={cn("flex", "items-center", "gap-3", "mb-10")}>
          <div className={cn("p-2", "bg-primary/10", "rounded-xl")}>
            <LuCircleHelp className={cn("w-5", "h-5", "text-primary")} />
          </div>
          <h2
            className={cn(
              "text-2xl",
              "font-black",
              "text-foreground",
              "tracking-tight",
            )}
          >
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {DEFAULT_FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "border",
                  "border-border",
                  "rounded-2xl",
                  "overflow-hidden",
                  "bg-background",
                )}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className={cn(
                    "w-full",
                    "flex",
                    "items-center",
                    "justify-between",
                    "px-6",
                    "py-4",
                    "text-left",
                    "cursor-pointer",
                  )}
                >
                  <span
                    className={cn("text-sm", "font-black", "text-foreground")}
                  >
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LuChevronDown
                      className={cn("w-4", "h-4", "text-muted-foreground", "shrink-0")}
                    />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p
                        className={cn(
                          "px-6",
                          "pb-5",
                          "text-sm",
                          "text-muted-foreground",
                          "leading-relaxed",
                          "font-medium",
                        )}
                      >
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
