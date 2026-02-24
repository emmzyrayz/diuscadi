"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuQrCode,
  LuInfo,
  LuFingerprint,
  LuShieldCheck,
  LuDownload,
  LuPrinter,
  LuCalendarPlus,
  LuShare2,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons"; // Import IconType from react-icons

// Define proper TypeScript interfaces
interface TicketDetails {
  id: string;
  eventName: string;
  userName: string;
  eventDate: string;
  location: string;
  type: "Physical" | "Virtual";
  status: "Upcoming" | "Used" | "Cancelled";
}

interface TicketContainerProps {
  ticket: TicketDetails;
}

interface MetaRowProps {
  label: string;
  value: string;
  icon: IconType; // Changed from LucideIcon to IconType
  isSuccess?: boolean;
}

export const TicketContainer = ({ ticket }: TicketContainerProps) => {
  return (
    <section className={cn("w-full", "max-w-6xl", "mx-auto", "px-4", "py-10")}>
      <div
        className={cn(
          "grid",
          "grid-cols-1",
          "lg:grid-cols-12",
          "gap-8",
          "items-start",
        )}
      >
        {/* LEFT: TicketVisualCard (Boarding Pass Style) - 7 Columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("lg:col-span-7", "xl:col-span-8", "group")}
        >
          <div
            className={cn(
              "bg-slate-900",
              "rounded-[3rem]",
              "overflow-hidden",
              "shadow-2xl",
              "shadow-slate-200",
              "relative",
            )}
          >
            {/* Top Brand Strip */}
            <div className={cn("h-2", "bg-primary", "w-full")} />

            <div className={cn("p-8", "md:p-12")}>
              <div
                className={cn(
                  "flex",
                  "justify-between",
                  "items-start",
                  "mb-10",
                )}
              >
                <div className="space-y-1">
                  <p
                    className={cn(
                      "text-[10px]",
                      "font-black",
                      "text-primary",
                      "uppercase",
                      "tracking-[0.3em]",
                    )}
                  >
                    Official Entry Pass
                  </p>
                  <h2
                    className={cn(
                      "text-3xl",
                      "md:text-4xl",
                      "font-black",
                      "text-white",
                      "tracking-tighter",
                      "leading-none",
                    )}
                  >
                    {ticket.eventName}
                  </h2>
                </div>
                <div
                  className={cn(
                    "w-16",
                    "h-16",
                    "bg-white/10",
                    "rounded-2xl",
                    "flex",
                    "items-center",
                    "justify-center",
                    "backdrop-blur-md",
                    "border",
                    "border-white/10",
                  )}
                >
                  <LuShieldCheck className={cn("w-8", "h-8", "text-primary")} />
                </div>
              </div>

              {/* Main Ticket Body */}
              <div
                className={cn(
                  "flex",
                  "flex-col",
                  "md:flex-row",
                  "gap-10",
                  "items-center",
                )}
              >
                {/* QR Code Zone */}
                <div
                  className={cn(
                    "bg-white",
                    "p-5",
                    "rounded-[2rem]",
                    "shadow-xl",
                  )}
                >
                  <div
                    className={cn(
                      "w-44",
                      "h-44",
                      "bg-slate-100",
                      "flex",
                      "items-center",
                      "justify-center",
                      "rounded-xl",
                      "overflow-hidden",
                      "border",
                      "border-slate-100",
                    )}
                  >
                    {/* Placeholder for QR - In production use a QR Component */}
                    <LuQrCode
                      className={cn("w-32", "h-32", "text-slate-900")}
                    />
                  </div>
                  <p
                    className={cn(
                      "text-center",
                      "mt-4",
                      "font-mono",
                      "text-[10px]",
                      "text-slate-400",
                      "font-bold",
                      "tracking-widest",
                    )}
                  >
                    VERIFY: {ticket.id}
                  </p>
                </div>

                {/* Attendee Quick Info */}
                <div
                  className={cn(
                    "flex-1",
                    "space-y-6",
                    "text-center",
                    "md:text-left",
                  )}
                >
                  <div className={cn("grid", "grid-cols-2", "gap-6")}>
                    <div>
                      <p
                        className={cn(
                          "text-[9px]",
                          "font-black",
                          "text-slate-500",
                          "uppercase",
                          "tracking-widest",
                          "mb-1",
                        )}
                      >
                        Access Type
                      </p>
                      <p className={cn("text-white", "font-bold", "text-sm")}>
                        Full Premium
                      </p>
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-[9px]",
                          "font-black",
                          "text-slate-500",
                          "uppercase",
                          "tracking-widest",
                          "mb-1",
                        )}
                      >
                        Zone/Seat
                      </p>
                      <p className={cn("text-white", "font-bold", "text-sm")}>
                        VIP Main Hall
                      </p>
                    </div>
                  </div>
                  <div className={cn("h-px", "bg-white/10", "w-full")} />
                  <div>
                    <p
                      className={cn(
                        "text-[9px]",
                        "font-black",
                        "text-slate-500",
                        "uppercase",
                        "tracking-widest",
                        "mb-1",
                      )}
                    >
                      Pass Holder
                    </p>
                    <p className={cn("text-xl", "font-black", "text-white")}>
                      {ticket.userName}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Perforation (The Cutout) */}
            <div
              className={cn(
                "absolute",
                "bottom-24",
                "-left-4",
                "w-8",
                "h-8",
                "bg-white",
                "rounded-full",
                "hidden",
                "md:block",
              )}
            />
            <div
              className={cn(
                "absolute",
                "bottom-24",
                "-right-4",
                "w-8",
                "h-8",
                "bg-white",
                "rounded-full",
                "hidden",
                "md:block",
              )}
            />
            <div
              className={cn(
                "absolute",
                "bottom-[108px]",
                "left-8",
                "right-8",
                "border-t-2",
                "border-dashed",
                "border-white/10",
                "hidden",
                "md:block",
              )}
            />

            <div
              className={cn(
                "bg-white/5",
                "p-6",
                "border-t",
                "border-white/10",
                "flex",
                "justify-center",
              )}
            >
              <p
                className={cn(
                  "text-[10px]",
                  "font-black",
                  "text-slate-500",
                  "uppercase",
                  "tracking-[0.4em]",
                )}
              >
                Non-Transferable Identity Linked
              </p>
            </div>
          </div>

          {/* Mobile Only: Ticket Actions (Stacked below card) */}
          <div
            className={cn("mt-6", "grid", "grid-cols-2", "gap-3", "lg:hidden")}
          >
            <TicketActionButtons />
          </div>
        </motion.div>

        {/* RIGHT: TicketMetaInfo - 5 Columns */}
        <aside className={cn("lg:col-span-5", "xl:col-span-4", "space-y-6")}>
          <div
            className={cn(
              "bg-white",
              "border-2",
              "border-slate-100",
              "rounded-[2.5rem]",
              "p-8",
              "shadow-sm",
            )}
          >
            <h3
              className={cn(
                "text-sm",
                "font-black",
                "text-slate-900",
                "uppercase",
                "tracking-widest",
                "mb-6",
                "flex",
                "items-center",
                "gap-2",
              )}
            >
              <LuInfo className={cn("w-4", "h-4", "text-primary")} />
              Ticket Metadata
            </h3>

            <div className="space-y-6">
              <MetaRow
                label="Unique Ticket ID"
                value={ticket.id}
                icon={LuFingerprint}
              />
              <MetaRow
                label="Issued On"
                value="Feb 12, 2026"
                icon={LuCalendarPlus}
              />
              <MetaRow
                label="Payment Status"
                value="Confirmed (₦0.00)"
                icon={LuShieldCheck}
                isSuccess
              />

              <div className="pt-4">
                <div
                  className={cn(
                    "p-4",
                    "bg-orange-50",
                    "rounded-2xl",
                    "border",
                    "border-orange-100",
                  )}
                >
                  <p
                    className={cn(
                      "text-[11px]",
                      "font-bold",
                      "text-orange-700",
                      "leading-relaxed",
                    )}
                  >
                    Note: Present a valid government ID matching the name on
                    this ticket at the gate.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Only: Ticket Actions */}
          <div className={cn("hidden", "lg:grid", "grid-cols-1", "gap-3")}>
            <TicketActionButtons />
          </div>
        </aside>
      </div>
    </section>
  );
};

/* Helper: Meta Info Row */
const MetaRow = ({
  label,
  value,
  icon: Icon,
  isSuccess = false,
}: MetaRowProps) => (
  <div className={cn("flex", "items-start", "gap-4")}>
    <div
      className={cn(
        "w-10",
        "h-10",
        "rounded-xl",
        "bg-slate-50",
        "flex",
        "items-center",
        "justify-center",
        "shrink-0",
        "border",
        "border-slate-100",
      )}
    >
      <Icon
        className={cn(
          "w-5 h-5",
          isSuccess ? "text-emerald-500" : "text-slate-400",
        )}
      />
    </div>
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
        {label}
      </p>
      <p className={cn("text-sm", "font-bold", "text-slate-700", "break-all")}>
        {value}
      </p>
    </div>
  </div>
);

/* Helper: Action Buttons Group */
const TicketActionButtons = () => (
  <>
    <button
      className={cn(
        "flex",
        "items-center",
        "justify-center",
        "gap-2",
        "px-6",
        "py-4",
        "bg-slate-900",
        "text-white",
        "rounded-2xl",
        "font-black",
        "text-xs",
        "uppercase",
        "tracking-widest",
        "hover:bg-primary",
        "transition-all",
        "shadow-lg",
        "shadow-slate-900/10",
      )}
    >
      <LuDownload className={cn("w-4", "h-4")} /> Download PDF
    </button>
    <button
      className={cn(
        "flex",
        "items-center",
        "justify-center",
        "gap-2",
        "px-6",
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
        "transition-all",
      )}
    >
      <LuCalendarPlus className={cn("w-4", "h-4")} /> Add to Calendar
    </button>
    <button
      className={cn(
        "flex",
        "items-center",
        "justify-center",
        "gap-2",
        "px-6",
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
        "transition-all",
      )}
    >
      <LuPrinter className={cn("w-4", "h-4")} /> Print Ticket
    </button>
    <button
      className={cn(
        "flex",
        "items-center",
        "justify-center",
        "gap-2",
        "px-6",
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
        "transition-all",
      )}
    >
      <LuShare2 className={cn("w-4", "h-4")} /> Share Access
    </button>
  </>
);

// Export types for reuse
export type { TicketDetails, TicketContainerProps, MetaRowProps };
