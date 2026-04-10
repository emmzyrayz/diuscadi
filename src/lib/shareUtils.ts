// lib/shareUtils.ts
// Shared utilities for PDF download, URL sharing, and calendar sync.
// Import these functions directly — no context needed.
//
// Usage:
//   import { shareEventUrl, downloadTicketPdf, addToCalendar } from "@/lib/shareUtils";

import { toast } from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  title: string;
  startDate: string; // ISO string
  endDate?: string; // ISO string — defaults to startDate + 4h
  location?: string;
  description?: string;
}

export interface ShareTarget {
  title: string;
  url: string;
  text?: string;
}

// ─── URL Share ────────────────────────────────────────────────────────────────

/**
 * Share a URL using the Web Share API when available,
 * falling back to clipboard copy.
 * Returns true if shared natively, false if fell back to clipboard.
 */
export async function shareUrl(target: ShareTarget): Promise<boolean> {
  if (typeof navigator === "undefined") return false;

  if (navigator.share) {
    try {
      await navigator.share({
        title: target.title,
        url: target.url,
        text: target.text,
      });
      return true;
    } catch (err) {
      // User cancelled — not an error
      if ((err as Error).name === "AbortError") return false;
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(target.url);
    toast.success("Link copied to clipboard!");
    return false;
  } catch {
    toast.error("Could not copy link");
    return false;
  }
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

/**
 * Add an event to the user's calendar.
 * Strategy:
 *   1. Mobile (iOS/Android) — generate an .ics blob and trigger download.
 *      The OS intercepts .ics files and offers to add to native Calendar.
 *   2. Desktop — open Google Calendar pre-filled URL in a new tab.
 *
 * TODO: when Google Calendar OAuth is built, replace the gcal URL with
 *       a POST to /api/calendar/add which calls the Calendar API server-side.
 */
export function addToCalendar(event: CalendarEvent): void {
  const start = new Date(event.startDate);
  const end = event.endDate
    ? new Date(event.endDate)
    : new Date(start.getTime() + 4 * 60 * 60 * 1000); // default +4h

  // Detect mobile
  const isMobile =
    typeof navigator !== "undefined" &&
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  if (isMobile) {
    // Generate .ics for native calendar apps
    _downloadIcs(event, start, end);
  } else {
    // Google Calendar deep link for desktop
    _openGoogleCalendar(event, start, end);
  }
}

function _formatIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function _downloadIcs(event: CalendarEvent, start: Date, end: Date): void {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DIUSCADI//DIUSCADI Events//EN",
    "BEGIN:VEVENT",
    `DTSTART:${_formatIcsDate(start)}`,
    `DTEND:${_formatIcsDate(end)}`,
    `SUMMARY:${event.title}`,
    event.location ? `LOCATION:${event.location}` : "",
    event.description ? `DESCRIPTION:${event.description}` : "",
    `UID:${Date.now()}@diuscadi.org.ng`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/\s+/g, "-")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Calendar file downloaded — open it to add to your calendar");
}

function _openGoogleCalendar(
  event: CalendarEvent,
  start: Date,
  end: Date,
): void {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${_formatIcsDate(start)}/${_formatIcsDate(end)}`,
    ...(event.location ? { location: event.location } : {}),
    ...(event.description ? { details: event.description } : {}),
  });
  window.open(
    `https://calendar.google.com/calendar/render?${params}`,
    "_blank",
  );
}

// ─── PDF Download ─────────────────────────────────────────────────────────────

export interface PdfTarget {
  type: "ticket" | "event-details";
  id: string; // ticketId or eventSlug
  filename?: string;
}

/**
 * Download a PDF from the server.
 * Calls the relevant API route and triggers a browser download.
 *
 * Ticket PDF:       GET /api/tickets/[id]/pdf
 * Event detail PDF: GET /api/events/[slug]/pdf   (TODO: not yet built)
 *
 * TODO: implement server-side PDF generation using @react-pdf/renderer or puppeteer:
 *   - Ticket: render TicketVisualCard to PDF with inviteCode + QR
 *   - Event:  render event details page to PDF
 */
export async function downloadPdf(
  target: PdfTarget,
  token?: string,
): Promise<void> {
  const endpoint =
    target.type === "ticket"
      ? `/api/tickets/${target.id}/pdf`
      : `/api/events/${target.id}/pdf`;

  const filename =
    target.filename ??
    (target.type === "ticket"
      ? `ticket-${target.id}.pdf`
      : `event-${target.id}.pdf`);

  try {
    const res = await fetch(endpoint, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.status === 501 || res.status === 404) {
      // Route not yet implemented
      toast("PDF download coming soon", { icon: "📄" });
      return;
    }

    if (!res.ok) {
      toast.error("Failed to generate PDF");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("PDF downloaded!");
  } catch {
    toast.error("Failed to download PDF");
  }
}
