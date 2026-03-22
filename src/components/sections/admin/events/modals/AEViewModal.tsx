"use client";
// modals/AEViewModal.tsx
// Read-only quick-view of an AdminEvent.
// Shows all key event metadata without leaving the events management page.
// For full editing use the AEEditModal.

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuCalendar,
  LuMapPin,
  LuUsers,
  LuTicket,
  LuClock,
  LuTag,
  LuShieldCheck,
  LuExternalLink,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { AdminEvent } from "@/context/AdminContext";

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: AdminEvent | null;
}

const STATUS_STYLES: Record<string, string> = {
  published: "bg-blue-50 text-blue-600 border-blue-100",
  draft: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-rose-50 text-rose-600 border-rose-100",
  completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
};

export const AdminViewEventModal: React.FC<ViewModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const router = useRouter();

  if (!event) return null;

  const fillPct =
    event.capacity > 0
      ? Math.round((event.registered / event.capacity) * 100)
      : 0;

  const eventDate = new Date(event.eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const eventTime = new Date(event.eventDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const deadline = new Date(event.registrationDeadline).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-foreground/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-background rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-border flex items-start justify-between gap-4 bg-background sticky top-0 z-10">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
                      STATUS_STYLES[event.status] ??
                        "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    {event.status}
                  </span>
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                    {event.category}
                  </span>
                </div>
                <h2 className="text-xl font-black text-foreground tracking-tighter uppercase line-clamp-2">
                  {event.title}
                </h2>
                <p className="text-[10px] font-mono text-muted-foreground">
                  /{event.slug}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-muted rounded-2xl text-muted-foreground transition-colors shrink-0 cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Key stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: "Registered",
                    value: String(event.registered),
                    icon: LuUsers,
                  },
                  {
                    label: "Capacity",
                    value: String(event.capacity),
                    icon: LuUsers,
                  },
                  { label: "Format", value: event.format, icon: LuMapPin },
                  {
                    label: "Target",
                    value: event.targetEduStatus,
                    icon: LuShieldCheck,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="bg-muted rounded-2xl p-4 space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Icon className="w-3 h-3" />
                      <p className="text-[9px] font-black uppercase tracking-widest">
                        {label}
                      </p>
                    </div>
                    <p className="text-sm font-black text-foreground capitalize">
                      {value || "—"}
                    </p>
                  </div>
                ))}
              </div>

              {/* Registration fill */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Registration Fill
                  </p>
                  <p className="text-[10px] font-black text-primary">
                    {fillPct}%
                  </p>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      fillPct >= 100 ? "bg-rose-500" : "bg-primary",
                    )}
                  />
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <LuCalendar className="w-3.5 h-3.5" /> Schedule
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-muted rounded-2xl p-4">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                      Event Date & Time
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {eventDate}
                    </p>
                    <p className="text-xs font-bold text-primary mt-0.5">
                      {eventTime}
                    </p>
                  </div>
                  <div className="bg-muted rounded-2xl p-4">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                      Registration Deadline
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {deadline}
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {event.requiredSkills?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <LuTag className="w-3.5 h-3.5" /> Required Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {event.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <LuClock className="w-3 h-3" /> Created
                  </p>
                  <p className="text-xs font-bold text-foreground">
                    {new Date(event.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <LuClock className="w-3 h-3" /> Last Updated
                  </p>
                  <p className="text-xs font-bold text-foreground">
                    {new Date(event.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-border bg-background sticky bottom-0 flex items-center justify-between gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onClose();
                  router.push(`/events/${event.slug}`);
                }}
                className="flex items-center gap-2 px-8 py-3 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg cursor-pointer"
              >
                <LuExternalLink className="w-4 h-4" /> View Public Page
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
