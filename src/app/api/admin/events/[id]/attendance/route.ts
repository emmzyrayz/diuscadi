// GET /api/admin/events/event/[id]/attendance
// Admin + moderator + webmaster only.
// Returns checked-in attendees for an event — account users AND verified guests merged.
// ?format=csv — downloads as CSV with full institutional data + Registration Type column

import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

const ALLOWED_ROLES = ["admin", "moderator", "webmaster"];

type Context = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

function escapeCSV(val: unknown): string {
  const str = val == null ? "" : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "No attendance data";
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escapeCSV(row[h])).join(",")),
  ].join("\n");
}

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
      const format = new URL(req.url).searchParams.get("format");

      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid event ID" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const eventObjId = new ObjectId(id);

      const event = await Collections.events(db).findOne(
        { _id: eventObjId },
        { projection: { title: 1, eventDate: 1, capacity: 1 } },
      );
      if (!event)
        return NextResponse.json({ error: "Event not found" }, { status: 404 });

      // ── Fetch account check-ins ───────────────────────────────────────────
      const accountRegs = await Collections.eventRegistrations(db)
        .aggregate([
          { $match: { eventId: eventObjId, status: "checked-in" } },
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
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
          { $sort: { checkedInAt: 1 } },
        ])
        .toArray();

      // ── Fetch guest check-ins ─────────────────────────────────────────────
      const guestRegs = await Collections.guestEventRegistrations(db)
        .find(
          {
            eventId: eventObjId,
            status: "checked-in",
            verifiedAt: { $exists: true },
          },
          {
            projection: {
              fullName: 1,
              email: 1,
              phone: 1,
              inviteCode: 1,
              checkedInAt: 1,
            },
          },
        )
        .sort({ checkedInAt: 1 })
        .toArray();

      // ── Normalise account attendees ───────────────────────────────────────
      const accountAttendees = accountRegs.map((r) => {
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
          registrationType: "Account" as const,
          fullName,
          email: String(u?.email ?? ""),
          phone: phone ? `+${phone.countryCode} ${phone.phoneNumber}` : "",
          membership: String(u?.membershipStatus ?? ""),
          institution: String(inst?.name ?? ""),
          faculty: String(inst?.faculty ?? ""),
          department: String(inst?.department ?? ""),
          level: String(inst?.level ?? ""),
          inviteCode: String(r.inviteCode ?? ""),
          checkedInAt: r.checkedInAt as Date | undefined,
        };
      });

      // ── Normalise guest attendees ─────────────────────────────────────────
      const guestAttendees = guestRegs.map((r) => {
        const phone = r.phone as
          | { countryCode?: number; phoneNumber?: number }
          | undefined;
        const fullName =
          [r.fullName?.firstname, r.fullName?.lastname]
            .filter(Boolean)
            .join(" ") || "Guest";
        return {
          registrationType: "Guest" as const,
          fullName,
          email: String(r.email ?? ""),
          phone: phone ? `+${phone.countryCode} ${phone.phoneNumber}` : "",
          membership: "guest",
          institution: "",
          faculty: "",
          department: "",
          level: "",
          inviteCode: String(r.inviteCode ?? ""),
          checkedInAt: r.checkedInAt as Date | undefined,
        };
      });

      // ── Merge + sort by checkedInAt ───────────────────────────────────────
      const merged = [...accountAttendees, ...guestAttendees].sort(
        (a, b) =>
          (a.checkedInAt?.getTime() ?? 0) - (b.checkedInAt?.getTime() ?? 0),
      );

      // ── Total registered count ────────────────────────────────────────────
      const [accountRegistered, guestRegistered] = await Promise.all([
        Collections.eventRegistrations(db).countDocuments({
          eventId: eventObjId,
          status: { $ne: "cancelled" },
        }),
        Collections.guestEventRegistrations(db).countDocuments({
          eventId: eventObjId,
          status: { $ne: "cancelled" },
          verifiedAt: { $exists: true },
        }),
      ]);
      const totalRegistered = accountRegistered + guestRegistered;

      // ── Format rows ───────────────────────────────────────────────────────
      const formatCheckedIn = (d: Date | undefined): string => {
        if (!d) return "";
        return new Date(d).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      const rows = merged.map((a, index) => ({
        "#": index + 1,
        "Registration Type": a.registrationType,
        "Full Name": a.fullName,
        Email: a.email,
        Phone: a.phone,
        Membership: a.membership,
        Institution: a.institution,
        Faculty: a.faculty,
        Department: a.department,
        Level: a.level,
        "Invite Code": a.inviteCode,
        "Checked In At": formatCheckedIn(a.checkedInAt),
      }));

      // ── CSV download ──────────────────────────────────────────────────────
      if (format === "csv") {
        const csv = buildCSV(rows);
        const filename = `${String(event.title).replace(/[^a-zA-Z0-9]/g, "-")}-attendance.csv`;
        return new NextResponse(csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      }

      // ── JSON response ─────────────────────────────────────────────────────
      return NextResponse.json({
        eventId: id,
        eventTitle: event.title,
        eventDate: new Date(event.eventDate as Date).toISOString(),
        checkedIn: merged.length,
        accountCheckedIn: accountAttendees.length,
        guestCheckedIn: guestAttendees.length,
        totalRegistered,
        capacity: event.capacity ?? null,
        attendees: rows,
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
