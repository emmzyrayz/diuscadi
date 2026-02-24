"use client";
import React from "react";
import { TicketViewHeader } from "@/components/sections/tickets/ticket/TicketHeader";
import { TicketVisualCard } from "@/components/sections/tickets/ticket/TicketVisualCard";
import { TicketMetaInfo } from "@/components/sections/tickets/ticket/TicketMetaInfo";
import { TicketActions } from "@/components/sections/tickets/ticket/TicketActions";
import { EventSummarySection } from "@/components/sections/tickets/ticket/EventSummary";
import { AttendeeInfoSection } from "@/components/sections/tickets/ticket/AttendeeInfo";
import { HelpSection } from "@/components/sections/tickets/ticket/TicketHelp";
import { cn } from "@/lib/utils";

// Define a proper type for ticket status
type TicketStatus = "Upcoming" | "Used" | "Cancelled";

export default function TicketDetailPage({
  params,
}: {
  params: { ticketId: string };
}) {
  // In a real app, fetch data here via a hook or Server Component
  const ticketData = {
    id: params.ticketId,
    status: "Upcoming" as TicketStatus, // Properly typed
    eventName: "Global Leadership Summit 2026",
    eventDate: "March 12, 2026",
    eventTime: "09:00 AM",
    location: "Eko Convention Center, Lagos",
    type: "VIP Access",
    userName: "Alexander Chidubem",
    userEmail: "a.chidubem@example.com",
    userPhone: "+234 803 123 4567",
    eventImage:
      "https://images.unsplash.com/photo-1540575861501-7ce0e220475d?q=80&w=2070",
    shortDescription:
      "Join 5,000+ leaders for the most influential digital transformation summit in West Africa.",
  };

  const isCancelled = ticketData.status === "Cancelled";

  return (
    <main className={cn('min-h-screen', 'bg-slate-50/50')}>
      {/* 1. Header (Navigation & Status) */}
      <TicketViewHeader status={ticketData.status} />

      <div className={cn('max-w-4xl', 'mx-auto', 'px-4', 'sm:px-6', 'py-10', 'space-y-12')}>
        {/* 2. Main Ticket Container (QR & Primary Info) */}
        <section className={cn('flex', 'flex-col', 'gap-8')}>
          {/* Most Important: The Scannable Card */}
          <TicketVisualCard
            ticket={{
              id: ticketData.id,
              eventName: ticketData.eventName,
              eventImage: ticketData.eventImage,
              userName: ticketData.userName,
              type: ticketData.type,
              status: ticketData.status,
            }}
          />

          {/* Detailed Metadata Grid */}
          <TicketMetaInfo
            ticket={{
              id: ticketData.id,
              eventName: ticketData.eventName,
              eventDate: ticketData.eventDate,
              eventTime: ticketData.eventTime,
              location: ticketData.location,
              type: ticketData.type,
              status: ticketData.status,
            }}
          />

          {/* Action Utilities (Hidden if Cancelled) */}
          {!isCancelled && (
            <TicketActions ticketId={ticketData.id} eventId="event-123" />
          )}
        </section>

        {/* 3. Contextual Sections */}
        <div className="space-y-16">
          <EventSummarySection
            event={{
              id: "event-123",
              title: ticketData.eventName,
              date: ticketData.eventDate,
              location: ticketData.location,
              image: ticketData.eventImage,
              shortDescription: ticketData.shortDescription,
            }}
          />

          <AttendeeInfoSection
            attendee={{
              name: ticketData.userName,
              email: ticketData.userEmail,
              phone: ticketData.userPhone,
            }}
          />

          <HelpSection />
        </div>
      </div>
    </main>
  );
}
