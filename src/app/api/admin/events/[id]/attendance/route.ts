// GET /api/admin/events/[id]/attendance
// Admin + moderator + webmaster only.
// Returns list of checked-in attendees for an event.
// ?format=csv — downloads as CSV with full institutional data

import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

const ALLOWED_ROLES = ["admin", "moderator", "webmaster"];

type Context = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

// ── CSV builder ───────────────────────────────────────────────────────────────

function escapeCSV(val: unknown): string {
  const str = val == null ? "" : String(val);
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "No attendance data";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escapeCSV(row[h])).join(",")),
  ];
  return lines.join("\n");
}

// ── Handler ───────────────────────────────────────────────────────────────────

export const GET = withAuth(
  async (req: AuthenticatedRequest, context?: Context) => {
    try {
      if (!ALLOWED_ROLES.includes(req.auth.role)) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }

      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const id = params.id as string;
      const format = new URL(req.url).searchParams.get("format"); // "csv" or null

      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid event ID" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const event = await Collections.events(db).findOne(
        { _id: new ObjectId(id) },
        { projection: { title: 1, eventDate: 1, capacity: 1 } },
      );
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      // Fetch all checked-in registrations with user data joined
      const pipeline = [
        {
          $match: {
            eventId: new ObjectId(id),
            status: "checked-in",
          },
        },
        {
          $lookup: {
            from: "userData",
            localField: "userId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  fullName: 1,
                  email: 1,
                  phone: 1,
                  Institution: 1,
                  membershipStatus: 1,
                },
              },
            ],
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmpty: true } },
        { $sort: { checkedInAt: 1 } },
      ];

      const registrations = await Collections.eventRegistrations(db)
        .aggregate(pipeline)
        .toArray();

      // ── Total registered count (for live counter) ──────────────────────────
      const totalRegistered = await Collections.eventRegistrations(
        db,
      ).countDocuments({
        eventId: new ObjectId(id),
        status: { $ne: "cancelled" },
      });

      // ── Format response ────────────────────────────────────────────────────

      const attendees = registrations.map((r, index) => {
        const u = r.user as Record<string, unknown> | undefined;
        const fn = u?.fullName as
          | { firstname?: string; secondname?: string; lastname?: string }
          | string
          | undefined;
        const fullName =
          typeof fn === "string"
            ? fn
            : fn
              ? [fn.firstname, fn.secondname, fn.lastname]
                  .filter(Boolean)
                  .join(" ")
              : "Unknown";
        const inst = u?.Institution as Record<string, unknown> | undefined;
        const phone = u?.phone as
          | { countryCode?: number; phoneNumber?: number }
          | undefined;

        return {
          "#": index + 1,
          "Full Name": fullName,
          Email: String(u?.email ?? ""),
          Phone: phone ? `+${phone.countryCode} ${phone.phoneNumber}` : "",
          Membership: String(u?.membershipStatus ?? ""),
          Institution: String(inst?.name ?? ""),
          Faculty: String(inst?.faculty ?? ""),
          Department: String(inst?.department ?? ""),
          Level: String(inst?.level ?? ""),
          "Invite Code": String(r.inviteCode ?? ""),
          "Checked In At": r.checkedInAt
            ? new Date(r.checkedInAt as Date).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
        };
      });

      // ── CSV download ───────────────────────────────────────────────────────
      if (format === "csv") {
        const csv = buildCSV(attendees);
        const filename = `${event.title.replace(/[^a-zA-Z0-9]/g, "-")}-attendance.csv`;
        return new NextResponse(csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      }

      // ── JSON response ──────────────────────────────────────────────────────
      return NextResponse.json({
        eventId: id,
        eventTitle: event.title,
        eventDate: new Date(event.eventDate as Date).toISOString(),
        checkedIn: registrations.length,
        totalRegistered,
        capacity: event.capacity ?? null,
        attendees,
      });
    } catch (err) {
      console.error("[GET /api/admin/events/[id]/attendance]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
