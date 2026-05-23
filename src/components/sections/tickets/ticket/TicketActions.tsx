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
  whatsappGroupLink?: string | null;
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
  whatsappGroupLink,
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

      {/* WhatsApp group/channel — upcoming only, only if link exists */}
      {isActive && whatsappGroupLink && (
        <a
          href={whatsappGroupLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {whatsappGroupLink.includes("/channel/") ? "Join WhatsApp Channel" : "Join WhatsApp Group"}
        </a>
      )}

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
