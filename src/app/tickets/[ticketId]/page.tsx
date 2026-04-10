"use client";
// app/tickets/[ticketId]/page.tsx

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTickets } from "@/context/TicketContext";
import { cn } from "@/lib/utils";

import { TicketViewHeader } from "@/components/sections/tickets/ticket/TicketHeader";
import { TicketVisualCard } from "@/components/sections/tickets/ticket/TicketVisualCard";
import { TicketMetaInfo } from "@/components/sections/tickets/ticket/TicketMetaInfo";
import { TicketActions } from "@/components/sections/tickets/ticket/TicketActions";
import { EventSummarySection } from "@/components/sections/tickets/ticket/EventSummary";
import { AttendeeInfoSection } from "@/components/sections/tickets/ticket/AttendeeInfo";
import { TicketHelpSection } from "@/components/sections/tickets/ticket/TicketHelp";
import { TicketDetailSkeleton } from "@/components/sections/tickets/ticket/TicketDetailSkeleton";
import type { TicketDetail } from "@/context/TicketContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDisplayStatus(
  t: TicketDetail,
): "Upcoming" | "Used" | "Cancelled" | "Past" {
  if (t.status === "cancelled") return "Cancelled";
  if (t.checkedInAt) return "Used";
  if (new Date(t.event.eventDate) < new Date()) return "Past";
  return "Upcoming";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function getLocation(t: TicketDetail): string {
  if (t.event.format === "virtual") return "Online / Zoom";
  const loc = t.event.location;
  if (!loc) return t.event.format;
  return (
    [loc.venue, loc.city, loc.state].filter(Boolean).join(", ") ||
    t.event.format
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const params = useParams<{ ticketId: string }>();
  const router = useRouter();
  const {
    currentTicket,
    currentTicketLoading,
    currentTicketError,
    loadTicket,
    clearCurrentTicket,
  } = useTickets();

  useEffect(() => {
    if (params.ticketId) loadTicket(params.ticketId);
    return () => {
      clearCurrentTicket();
    };
  }, [clearCurrentTicket, loadTicket, params.ticketId]);

  if (currentTicketLoading) return <TicketDetailSkeleton />;

  if (currentTicketError || !currentTicket) {
    return (
      <main className="min-h-screen bg-muted/50 pt-[72px] flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <p className="text-xl font-black text-foreground">Ticket not found</p>
          <p className="text-muted-foreground font-medium">
            {currentTicketError ??
              "This ticket doesn't exist or you don't have access."}
          </p>
          <button
            onClick={() => router.push("/tickets")}
            className="mt-4 px-6 py-3 bg-foreground text-background rounded-2xl font-black text-sm hover:bg-primary transition-colors cursor-pointer"
          >
            Back to My Tickets
          </button>
        </div>
      </main>
    );
  }

  const t = currentTicket;
  const displayStatus = getDisplayStatus(t);
  const isCancelled = displayStatus === "Cancelled";
  const isPast = displayStatus === "Past" || displayStatus === "Used";
  const eventDate = fmtDate(t.event.eventDate);
  const eventTime = fmtTime(t.event.eventDate);
  const location = getLocation(t);
  const registeredDate = fmtDate(t.registeredAt);

  return (
    <main className="min-h-screen w-full px-5 mt-10 bg-muted/50 pt-[72px]">
      <TicketViewHeader status={displayStatus} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        <section className="flex flex-col gap-8">
          <TicketVisualCard
            ticket={{
              inviteCode: t.inviteCode,
              eventName: t.event.title,
              eventImage: t.event.image,
              ticketType: t.ticketType.name,
              status: displayStatus,
            }}
          />

          <TicketMetaInfo
            ticket={{
              inviteCode: t.inviteCode,
              eventName: t.event.title,
              eventDate,
              eventTime,
              location,
              ticketType: t.ticketType.name,
              status: displayStatus,
              registeredAt: registeredDate,
              price:
                t.ticketType.price === 0
                  ? "Free"
                  : new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: t.ticketType.currency,
                      maximumFractionDigits: 0,
                    }).format(t.ticketType.price),
            }}
          />

          {/* Actions — show for all statuses, actions disable themselves based on status */}
          <TicketActions
            ticketId={t.id}
            registrationId={t.id}
            eventSlug={t.event.slug}
            eventTitle={t.event.title}
            eventDate={t.event.eventDate} // raw ISO for calendar
            eventLocation={location}
            status={displayStatus}
          />
        </section>

        <div className="space-y-0">
          <EventSummarySection
            event={{
              slug: t.event.slug,
              title: t.event.title,
              date: eventDate,
              location,
              image: t.event.image,
              overview: t.event.overview,
            }}
          />
          <AttendeeInfoSection
            ticket={{
              inviteCode: t.inviteCode,
              registeredAt: registeredDate,
              ticketType: t.ticketType.name,
              checkedInAt: t.checkedInAt ? fmtDate(t.checkedInAt) : null,
            }}
          />
          <TicketHelpSection />
        </div>
      </div>
    </main>
  );
}
