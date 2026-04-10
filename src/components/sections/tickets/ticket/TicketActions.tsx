"use client";
import React, { useState } from "react";
import {
  LuDownload,
  LuCalendarPlus,
  LuShare2,
  LuX,
  LuClock,
  LuLoader,
  LuCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useTickets } from "@/context/TicketContext";
import { useShare } from "@/hooks/useShare";
import { toast } from "react-hot-toast";

interface TicketActionsProps {
  ticketId: string;
  registrationId: string;
  eventSlug: string;
  eventTitle: string;
  eventDate: string; // ISO
  eventEndDate?: string; // ISO — optional
  eventLocation: string;
  status: "Upcoming" | "Used" | "Cancelled" | "Past";
}

export const TicketActions = ({
  ticketId,
  registrationId,
  eventSlug,
  eventTitle,
  eventDate,
  eventEndDate,
  eventLocation,
  status,
}: TicketActionsProps) => {
  const { cancelRegistration } = useTickets();
  const { share, download, addToCalendar, copying, downloading } = useShare();
  const [cancelling, setCancelling] = useState(false);

  const isPast = status === "Past" || status === "Used";
  const isCancelled = status === "Cancelled";
  const isActive = status === "Upcoming";

 const handleShare = async () => {
  if (isPast) return;
  await share({
    title: eventTitle,
    url: `${window.location.origin}/events/${eventSlug}`,
    text: `Check out ${eventTitle} on DIUSCADI!`,
  });
};


  const handleCalendar = () => {
    if (isPast) return;
    addToCalendar({
      title: eventTitle,
      startDate: eventDate,
      endDate: eventEndDate,
      location: eventLocation,
      description: `DIUSCADI event — visit diuscadi.org.ng/events/${eventSlug} for details`,
    });
  };

  const handleDownload = () => {
    download({
      type: "ticket",
      id: ticketId,
      filename: `diuscadi-ticket-${ticketId}.pdf`,
    });
  };

  const handleCancel = async () => {
    if (!isActive) return;
    const confirmed = window.confirm(
      "Cancel this registration? This cannot be undone.",
    );
    if (!confirmed) return;
    setCancelling(true);
    const result = await cancelRegistration(registrationId);
    setCancelling(false);
    if (result.success) toast.success("Registration cancelled");
    else toast.error(result.error ?? "Cancellation failed");
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-3">
      {/* PDF — disabled for cancelled only */}
      <button
        onClick={handleDownload}
        disabled={isCancelled || downloading}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
          isCancelled
            ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            : "bg-foreground text-background hover:bg-primary cursor-pointer disabled:opacity-60",
        )}
      >
        {downloading ? (
          <LuLoader className="w-4 h-4 animate-spin" />
        ) : (
          <LuDownload className="w-4 h-4" />
        )}
        {downloading ? "Generating…" : "Download PDF Ticket"}
      </button>

      {/* Calendar + Share — disabled for past/cancelled */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCalendar}
          disabled={isPast || isCancelled}
          title={
            isPast
              ? "Event has already passed"
              : isCancelled
                ? "Ticket cancelled"
                : "Add to calendar"
          }
          className={cn(
            "flex items-center justify-center gap-2 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all",
            isPast || isCancelled
              ? "border-border text-muted-foreground cursor-not-allowed opacity-50 bg-muted"
              : "border-border hover:border-primary hover:text-primary cursor-pointer bg-background",
          )}
        >
          {isPast ? (
            <LuClock className="w-4 h-4" />
          ) : (
            <LuCalendarPlus className="w-4 h-4" />
          )}
          {isPast ? "Expired" : "Add to Cal"}
        </button>

        <button
          onClick={handleShare}
          disabled={isPast || isCancelled}
          title={isPast ? "Event has already passed" : "Share event"}
          className={cn(
            "flex items-center justify-center gap-2 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all",
            isPast || isCancelled
              ? "border-border text-muted-foreground cursor-not-allowed opacity-50 bg-muted"
              : "border-border hover:border-primary hover:text-primary cursor-pointer bg-background",
          )}
        >
          {copying ? (
            <LuCheck className="w-4 h-4 text-emerald-500" />
          ) : (
            <LuShare2 className="w-4 h-4" />
          )}
          {copying ? "Copied!" : "Share"}
        </button>
      </div>

      {/* Cancel — upcoming only */}
      {isActive && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-60"
        >
          {cancelling ? (
            <LuLoader className="w-4 h-4 animate-spin" />
          ) : (
            <LuX className="w-4 h-4" />
          )}
          {cancelling ? "Cancelling…" : "Cancel Registration"}
        </button>
      )}

      {isPast && !isCancelled && (
        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-2">
          This event has ended — ticket actions are unavailable
        </p>
      )}
    </div>
  );
};
