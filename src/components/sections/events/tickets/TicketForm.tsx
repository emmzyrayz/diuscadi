"use client";
import React from "react";
import {
  LuUser,
  LuMail,
  LuPhone,
  LuMapPin,
  LuLaptop,
  LuMessageSquare,
  LuTicket,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import type {
  RegisterEventData,
  RegisterUserData,
} from "@/app/events/[slug]/register/page";

interface TicketFormProps {
  user: RegisterUserData;
  ticketTypes: RegisterEventData["ticketTypes"];
  selectedTicketId: string;
  onTicketSelect: (id: string) => void;
  attendanceType: "physical" | "virtual";
  onAttendanceChange: (type: "physical" | "virtual") => void;
  format: string;
}

const inputCls =
  "w-full bg-muted border-2 border-border rounded-2xl px-5 py-4 text-foreground font-bold focus:border-primary focus:bg-background outline-none transition-all placeholder:text-slate-300 placeholder:font-medium";
const labelCls =
  "block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1";
const groupCls =
  "bg-background p-6 md:p-8 rounded-[2.5rem] border border-border space-y-6";

export const TicketFormSection = ({
  user,
  ticketTypes,
  selectedTicketId,
  onTicketSelect,
  attendanceType,
  onAttendanceChange,
  format,
}: TicketFormProps) => {
  const showAttendanceToggle = format === "hybrid";

  return (
    <section className={cn("w-full", "space-y-6")}>
      {/* 1. Personal Info */}
      <div className={groupCls}>
        <div className={cn("flex", "items-center", "gap-3", "mb-2")}>
          <div
            className={cn("p-2", "bg-primary/10", "text-primary", "rounded-xl")}
          >
            <LuUser className={cn("w-5", "h-5")} />
          </div>
          <h3
            className={cn(
              "font-black",
              "text-foreground",
              "uppercase",
              "tracking-tighter",
              "text-lg",
            )}
          >
            Personal Details
          </h3>
        </div>
        <div className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-6")}>
          <div>
            <label className={labelCls}>Full Name (Auto-filled)</label>
            <div
              className={cn(
                inputCls,
                "text-muted/50 text-muted-foreground cursor-not-allowed border-dashed flex items-center gap-3",
              )}
            >
              <LuUser className={cn("w-4", "h-4")} /> {user.name}
            </div>
          </div>
          <div>
            <label className={labelCls}>Email Address (Auto-filled)</label>
            <div
              className={cn(
                inputCls,
                "text-muted/50 text-muted-foreground cursor-not-allowed border-dashed flex items-center gap-3",
              )}
            >
              <LuMail className={cn("w-4", "h-4")} /> {user.email}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>WhatsApp / Phone Number</label>
            <div className="relative">
              <LuPhone
                className={cn(
                  "absolute",
                  "left-5",
                  "top-1/2",
                  "-translate-y-1/2",
                  "text-muted-foreground",
                  "w-4",
                  "h-4",
                )}
              />
              <input
                type="tel"
                placeholder="+234 000 000 0000"
                className={cn(inputCls, "pl-12")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ticket Type (only shown if more than one tier exists) */}
      {ticketTypes.length > 1 && (
        <div className={groupCls}>
          <div className={cn("flex", "items-center", "gap-3", "mb-2")}>
            <div
              className={cn(
                "p-2",
                "bg-primary/10",
                "text-primary",
                "rounded-xl",
              )}
            >
              <LuTicket className={cn("w-5", "h-5")} />
            </div>
            <h3
              className={cn(
                "font-black",
                "text-foreground",
                "uppercase",
                "tracking-tighter",
                "text-lg",
              )}
            >
              Select Ticket Tier
            </h3>
          </div>
          <div className="space-y-3">
            {ticketTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => onTicketSelect(t.id)}
                className={cn(
                  "w-full flex items-center justify-between px-6 py-4 rounded-2xl border-2 transition-all text-left cursor-pointer",
                  selectedTicketId === t.id
                    ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                    : "border-border hover:border-border",
                )}
              >
                <span
                  className={cn(
                    "font-black",
                    "text-foreground",
                    selectedTicketId === t.id ? "text-primary" : "",
                  )}
                >
                  {t.name}
                </span>
                <span
                  className={cn(
                    "text-lg",
                    "font-black",
                    selectedTicketId === t.id
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Attendance Mode (hybrid only) */}
      {showAttendanceToggle && (
        <div className={groupCls}>
          <div className={cn("flex", "items-center", "gap-3", "mb-2")}>
            <div
              className={cn(
                "p-2",
                "bg-primary/10",
                "text-primary",
                "rounded-xl",
              )}
            >
              <LuMapPin className={cn("w-5", "h-5")} />
            </div>
            <h3
              className={cn(
                "font-black",
                "text-foreground",
                "uppercase",
                "tracking-tighter",
                "text-lg",
              )}
            >
              Attendance Mode
            </h3>
          </div>
          <div className={cn("grid", "grid-cols-2", "gap-4")}>
            {(["physical", "virtual"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onAttendanceChange(mode)}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all cursor-pointer",
                  attendanceType === mode
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border hover:border-border",
                )}
              >
                {mode === "physical" ? (
                  <LuMapPin
                    className={cn(
                      "w-6",
                      "h-6",
                      attendanceType === mode
                        ? "text-primary"
                        : "text-slate-300",
                    )}
                  />
                ) : (
                  <LuLaptop
                    className={cn(
                      "w-6",
                      "h-6",
                      attendanceType === mode
                        ? "text-primary"
                        : "text-slate-300",
                    )}
                  />
                )}
                <span
                  className={cn(
                    "font-bold",
                    "text-sm",
                    "capitalize",
                    attendanceType === mode
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {mode}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Special Requests */}
      <div className={groupCls}>
        <div className={cn("flex", "items-center", "gap-3", "mb-2")}>
          <div
            className={cn(
              "p-2",
              "text-muted",
              "text-muted-foreground",
              "rounded-xl",
            )}
          >
            <LuMessageSquare className={cn("w-5", "h-5")} />
          </div>
          <h3
            className={cn(
              "font-black",
              "text-foreground",
              "uppercase",
              "tracking-tighter",
              "text-lg",
            )}
          >
            Special Requests
          </h3>
        </div>
        <div className="relative">
          <LuMessageSquare
            className={cn(
              "absolute",
              "left-5",
              "top-5",
              "text-muted-foreground",
              "w-4",
              "h-4",
            )}
          />
          <textarea
            rows={3}
            placeholder="E.g. Wheelchair access, dietary requirements, etc. (Optional)"
            className={cn(inputCls, "pl-12 pt-4 resize-none")}
          />
        </div>
      </div>
    </section>
  );
};
