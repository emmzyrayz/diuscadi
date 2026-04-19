// GET /api/tickets/[id]/pdf
// Auth required. Generates and streams a PDF ticket for the authenticated user.
// Uses @react-pdf/renderer — pure JS, runs on Vercel serverless without extras.
//
// Design mirrors the TicketVisualCard UI:
//   - DIUSCADI branded header bar
//   - Event title, date, location, format
//   - Ticket code in monospace + QR placeholder note
//   - Ticket type, price, status
//   - Footer with inviteCode and generation timestamp

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

// ── Fonts ─────────────────────────────────────────────────────────────────────
// @react-pdf/renderer requires explicit font registration.
// We use system-safe fonts that don't require file downloads.
// Helvetica is built-in to @react-pdf/renderer and always available.

// ── Styles ────────────────────────────────────────────────────────────────────

const PRIMARY = "#0f172a"; // slate-900 — matches MailTemplate.ts
const ACCENT = "#facc15"; // primary yellow
const MUTED = "#94a3b8"; // slate-400
const BORDER = "#e2e8f0"; // slate-200
const WHITE = "#ffffff";
const EMERALD = "#10b981";
const ROSE = "#f43f5e";
const BLUE = "#3b82f6";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#f8fafc",
    fontFamily: "Helvetica",
    padding: 40,
  },
  // ── Outer ticket card ────────────────────────────────────────────────────
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    overflow: "hidden",
    // @react-pdf/renderer doesn't support box-shadow — use border instead
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
  },
  // ── Header bar ───────────────────────────────────────────────────────────
  header: {
    backgroundColor: PRIMARY,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "column",
  },
  headerBadge: {
    backgroundColor: ACCENT,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  headerBadgeText: {
    color: PRIMARY,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: WHITE,
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.5,
  },
  headerSub: {
    color: MUTED,
    fontSize: 8,
    fontFamily: "Helvetica",
    marginTop: 2,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  // ── Body ──────────────────────────────────────────────────────────────────
  body: {
    padding: 24,
  },
  // ── Ticket code block ─────────────────────────────────────────────────────
  codeBlock: {
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: BORDER,
    borderStyle: "solid",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  codeLabel: {
    color: MUTED,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  codeValue: {
    color: PRIMARY,
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 6,
  },
  codeNote: {
    color: MUTED,
    fontSize: 7,
    fontFamily: "Helvetica",
    marginTop: 8,
    letterSpacing: 0.5,
  },
  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    marginVertical: 16,
  },
  // ── Detail rows ───────────────────────────────────────────────────────────
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
  },
  detailLabel: {
    color: MUTED,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    flex: 1,
  },
  detailValue: {
    color: PRIMARY,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    flex: 2,
    textAlign: "right",
  },
  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    borderTopStyle: "solid",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    color: MUTED,
    fontSize: 7,
    fontFamily: "Helvetica",
    letterSpacing: 0.5,
  },
  footerBold: {
    color: PRIMARY,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  // ── QR placeholder section ────────────────────────────────────────────────
  qrSection: {
    alignItems: "center",
    marginVertical: 16,
  },
  qrBox: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: BORDER,
    borderStyle: "solid",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WHITE,
    marginBottom: 8,
  },
  qrPlaceholderText: {
    color: MUTED,
    fontSize: 7,
    fontFamily: "Helvetica",
    textAlign: "center",
    letterSpacing: 0.5,
  },
});

// ── Status helpers ────────────────────────────────────────────────────────────

function statusColor(status: string): string {
  switch (status) {
    case "checked-in":
      return EMERALD;
    case "cancelled":
      return ROSE;
    case "registered":
      return BLUE;
    default:
      return MUTED;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "checked-in":
      return "Attended";
    case "cancelled":
      return "Cancelled";
    case "registered":
      return "Valid";
    default:
      return status.toUpperCase();
  }
}

function formatDate(iso: string): string {
  try {
    return (
      new Date(iso).toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Africa/Lagos",
      }) +
      " · " +
      new Date(iso).toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Lagos",
      })
    );
  } catch {
    return iso;
  }
}

function formatPrice(price: number, currency: string): string {
  if (!price || price === 0) return "Free Admission";
  const symbol = currency === "NGN" ? "₦" : currency;
  return `${symbol}${price.toLocaleString("en-NG")}`;
}

// ── Ticket PDF Document ───────────────────────────────────────────────────────

interface TicketPdfData {
  inviteCode: string;
  status: string;
  registeredAt: string;
  checkedInAt: string | null;
  event: {
    title: string;
    eventDate: string;
    location: Record<string, string> | null;
    format: string;
    category: string;
  };
  ticketType: {
    name: string;
    price: number;
    currency: string;
  };
  userName: string;
}

function TicketDocument({ data }: { data: TicketPdfData }) {
  const locationStr = data.event.location
    ? [data.event.location.venue, data.event.location.city]
        .filter(Boolean)
        .join(", ") || String(data.event.format)
    : String(data.event.format);

  const color = statusColor(data.status);
  const label = statusLabel(data.status);
  const generatedAt = new Date().toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return React.createElement(
    Document,
    {
      title: `DIUSCADI Ticket — ${data.event.title}`,
      author: "DIUSCADI",
      subject: "Event Ticket",
      creator: "DIUSCADI Platform",
      producer: "DIUSCADI Platform",
    },
    React.createElement(
      Page,
      { size: "A5", style: styles.page },

      React.createElement(
        View,
        { style: styles.card },

        // ── Header ────────────────────────────────────────────────────────
        React.createElement(
          View,
          { style: styles.header },
          React.createElement(
            View,
            { style: styles.headerLeft },
            React.createElement(
              View,
              { style: styles.headerBadge },
              React.createElement(
                Text,
                { style: styles.headerBadgeText },
                "DIUSCADI",
              ),
            ),
            React.createElement(
              Text,
              { style: styles.headerTitle },
              "Event Ticket",
            ),
            React.createElement(
              Text,
              { style: styles.headerSub },
              data.event.category,
            ),
          ),
          React.createElement(
            View,
            { style: { ...styles.statusBadge, backgroundColor: `${color}20` } },
            React.createElement(
              Text,
              { style: { ...styles.statusText, color } },
              label,
            ),
          ),
        ),

        // ── Body ──────────────────────────────────────────────────────────
        React.createElement(
          View,
          { style: styles.body },

          // Ticket code + QR
          React.createElement(
            View,
            { style: styles.codeBlock },
            React.createElement(
              Text,
              { style: styles.codeLabel },
              "Ticket Code",
            ),
            React.createElement(
              Text,
              { style: styles.codeValue },
              data.inviteCode,
            ),
            React.createElement(
              Text,
              { style: styles.codeNote },
              "Present this code at the event entrance for check-in",
            ),
          ),

          // QR placeholder — actual QR is on the in-app ticket page
          React.createElement(
            View,
            { style: styles.qrSection },
            React.createElement(
              View,
              { style: styles.qrBox },
              React.createElement(
                Text,
                {
                  style: {
                    color: MUTED,
                    fontSize: 8,
                    fontFamily: "Helvetica",
                    textAlign: "center",
                  },
                },
                "Scan QR on\nthe DIUSCADI app",
              ),
            ),
            React.createElement(
              Text,
              { style: styles.qrPlaceholderText },
              "Full QR code available in the DIUSCADI platform",
            ),
          ),

          React.createElement(View, { style: styles.divider }),

          // Event details
          ...[
            ["Event", data.event.title],
            ["Date & Time", formatDate(data.event.eventDate)],
            ["Location", locationStr],
            [
              "Format",
              String(data.event.format).charAt(0).toUpperCase() +
                String(data.event.format).slice(1),
            ],
            ["Ticket Type", data.ticketType.name],
            [
              "Ticket Price",
              formatPrice(data.ticketType.price, data.ticketType.currency),
            ],
            ["Attendee", data.userName],
            ["Registered", formatDate(data.registeredAt)],
            ...(data.checkedInAt
              ? [["Checked In", formatDate(data.checkedInAt)]]
              : []),
          ].map(([label, value]) =>
            React.createElement(
              View,
              { style: styles.detailRow, key: label },
              React.createElement(Text, { style: styles.detailLabel }, label),
              React.createElement(Text, { style: styles.detailValue }, value),
            ),
          ),
        ),

        // ── Footer ────────────────────────────────────────────────────────
        React.createElement(
          View,
          { style: styles.footer },
          React.createElement(
            View,
            null,
            React.createElement(
              Text,
              { style: styles.footerBold },
              data.inviteCode,
            ),
            React.createElement(
              Text,
              { style: styles.footerText },
              "diuscadi.org.ng",
            ),
          ),
          React.createElement(
            Text,
            { style: styles.footerText },
            `Generated ${generatedAt} WAT`,
          ),
        ),
      ),
    ),
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export const GET = withAuth(
  async (
    req: AuthenticatedRequest,
    context?: {
      params?: Promise<Record<string, string>> | Record<string, string>;
    },
  ) => {
    try {
      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const id = params.id as string;

      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid ticket ID" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const vaultId = new ObjectId(req.auth.vaultId);

      // Resolve userData (need _id for the registration lookup + fullName for PDF)
      const userData = await Collections.userData(db).findOne(
        { vaultId },
        { projection: { _id: 1, fullName: 1 } },
      );
      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Reuse same pipeline as GET /api/tickets/[id]
      const [registration] = await Collections.eventRegistrations(db)
        .aggregate([
          {
            $match: { _id: new ObjectId(id), userId: userData._id as ObjectId },
          },
          { $limit: 1 },
          {
            $lookup: {
              from: "events",
              localField: "eventId",
              foreignField: "_id",
              as: "event",
            },
          },
          {
            $lookup: {
              from: "ticketTypes",
              localField: "ticketTypeId",
              foreignField: "_id",
              as: "ticketType",
            },
          },
          { $unwind: "$event" },
          { $unwind: "$ticketType" },
        ])
        .toArray();

      if (!registration) {
        return NextResponse.json(
          { error: "Ticket not found" },
          { status: 404 },
        );
      }

      const event = registration.event as Record<string, unknown>;
      const ticketType = registration.ticketType as Record<string, unknown>;

      // Build display name
      const fn = userData.fullName as
        | { firstname?: string; lastname?: string }
        | undefined;
      const userName = fn
        ? [fn.firstname, fn.lastname].filter(Boolean).join(" ") || "Attendee"
        : "Attendee";

      const pdfData: TicketPdfData = {
        inviteCode: String(registration.inviteCode),
        status: String(registration.status),
        registeredAt: (registration.registeredAt as Date).toISOString(),
        checkedInAt: registration.checkedInAt
          ? (registration.checkedInAt as Date).toISOString()
          : null,
        event: {
          title: String(event.title),
          eventDate: (event.eventDate as Date).toISOString(),
          location: (event.location as Record<string, string>) ?? null,
          format: String(event.format),
          category: String(event.category),
        },
        ticketType: {
          name: String(ticketType.name),
          price: (ticketType.price as number) ?? 0,
          currency: String(ticketType.currency ?? "NGN"),
        },
        userName,
      };

      // Generate PDF buffer
      const buffer = await renderToBuffer(TicketDocument({ data: pdfData }));

      const safeTitle = pdfData.event.title
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()
        .slice(0, 40);
      const filename = `diuscadi-ticket-${safeTitle}-${pdfData.inviteCode}.pdf`;

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "private, no-store",
        },
      });
    } catch (err) {
      console.error("[GET /api/tickets/[id]/pdf]", err);
      return NextResponse.json(
        { error: "Failed to generate PDF" },
        { status: 500 },
      );
    }
  },
);
