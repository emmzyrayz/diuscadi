import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId, Filter } from "mongodb";
import { IGuestEventRegistrationDocument } from "@/lib/models/GuestEventRegistration";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/guests
//
// Protected — admin, webmaster, moderator.
// Returns a paginated list of verified guest registrations across all events,
// or filtered to a specific event via ?eventId=
//
// Query params:
//   ?page=1          — 1-based (default: 1)
//   ?limit=25        — max 100 (default: 25)
//   ?search=         — matches fullName or email (case-insensitive)
//   ?status=         — "registered" | "checked-in" | "cancelled" (default: all)
//   ?eventId=        — filter to a specific event
//   ?export=csv      — download full result as CSV (no pagination, max 10 000)
//
// Each record includes:
//   registrationType: "Guest" (always)
//   eventTitle, eventSlug (joined from events collection)
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_ROLES = ["admin", "webmaster", "moderator"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

// ── CSV helpers ───────────────────────────────────────────────────────────────

function escapeCSV(val: unknown): string {
  const str = val == null ? "" : String(val);
  return str.includes(",") || str.includes('"') || str.includes("\n")
    ? `"${str.replace(/"/g, '""')}"`
    : str;
}

function buildCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "No guest registration data";
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escapeCSV(r[h])).join(",")),
  ].join("\n");
}

function formatDate(d: unknown): string {
  if (!d) return "";
  try {
    return new Date(d as string).toLocaleString("en-NG", {
      timeZone: "Africa/Lagos",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(d);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // ── 1. Role guard ────────────────────────────────────────────────────────
    if (!ALLOWED_ROLES.includes(req.auth.role as AllowedRole)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // ── 2. Parse query params ────────────────────────────────────────────────
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10)),
    );
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") ?? "";
    const statusParam = searchParams.get("status") ?? "";
    const eventIdParam = searchParams.get("eventId") ?? "";
    const exportCsv = searchParams.get("export") === "csv";

    const db = await getDb();

    // ── 3. Build filter ──────────────────────────────────────────────────────
    // Only show verified guests (verifiedAt exists) in the admin view.
    // Unverified (pending OTP) records are not admin-actionable.
    const filter: Filter<IGuestEventRegistrationDocument> = {
      verifiedAt: { $exists: true },
      migratedToUserId: { $exists: false },
    };

    if (
      statusParam &&
      ["registered", "checked-in", "cancelled"].includes(statusParam)
    ) {
      filter.status = statusParam as "registered" | "checked-in" | "cancelled";
    }

    if (eventIdParam && ObjectId.isValid(eventIdParam)) {
      filter.eventId = new ObjectId(eventIdParam);
    }

    // ── 4. Build aggregation pipeline ────────────────────────────────────────
    // Joins events collection for title + slug.
    // Search is applied after the join so we can match on computed fields.
    const basePipeline: object[] = [
      { $match: filter },
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          pipeline: [
            { $project: { title: 1, slug: 1, eventDate: 1, format: 1 } },
          ],
          as: "_event",
        },
      },
      {
        $unwind: { path: "$_event", preserveNullAndEmptyArrays: true },
      },
      // Apply search after join
      ...(search
        ? [
            {
              $match: {
                $or: [
                  {
                    "fullName.firstname": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "fullName.lastname": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  { email: { $regex: search, $options: "i" } },
                  {
                    "_event.title": { $regex: search, $options: "i" },
                  },
                  { inviteCode: { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),
    ];

    // Shared $project shape
    const projectStage = {
      $project: {
        _id: 0,
        id: { $toString: "$_id" },
        registrationType: { $literal: "Guest" },
        firstName: "$fullName.firstname",
        lastName: "$fullName.lastname",
        email: 1,
        phone: 1,
        inviteCode: 1,
        status: 1,
        registeredAt: 1,
        checkedInAt: 1,
        verifiedAt: 1,
        eventId: { $toString: "$eventId" },
        eventTitle: { $ifNull: ["$_event.title", "Unknown Event"] },
        eventSlug: { $ifNull: ["$_event.slug", ""] },
        eventDate: { $ifNull: ["$_event.eventDate", null] },
        eventFormat: { $ifNull: ["$_event.format", ""] },
      },
    };

    // ── 5. CSV export ────────────────────────────────────────────────────────
    if (exportCsv) {
      const exportPipeline = [
        ...basePipeline,
        { $sort: { registeredAt: -1 } },
        { $limit: 10_000 },
        projectStage,
      ];

      const rows = await db
        .collection("guestEventRegistrations")
        .aggregate(exportPipeline)
        .toArray();

      const csvRows = rows.map((r) => ({
        "First Name": r.firstName,
        "Last Name": r.lastName,
        Email: r.email,
        Phone: r.phone ? `+${r.phone.countryCode}${r.phone.phoneNumber}` : "",
        "Ticket Code": r.inviteCode,
        Status: r.status,
        "Registration Type": "Guest",
        Event: r.eventTitle,
        "Event Date": formatDate(r.eventDate),
        "Registered At": formatDate(r.registeredAt),
        "Verified At": formatDate(r.verifiedAt),
        "Checked In At": formatDate(r.checkedInAt),
      }));

      const csv = buildCSV(csvRows);
      const filename = `diuscadi-guests-${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // ── 6. Paginated JSON response ────────────────────────────────────────────
    // Count total before pagination
    const countPipeline = [...basePipeline, { $count: "total" }];
    const [countResult] = await db
      .collection("guestEventRegistrations")
      .aggregate(countPipeline)
      .toArray();
    const total = (countResult?.total as number) ?? 0;

    const dataPipeline = [
      ...basePipeline,
      { $sort: { registeredAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      projectStage,
    ];

    const guests = await db
      .collection("guestEventRegistrations")
      .aggregate(dataPipeline)
      .toArray();

    // ── 7. Summary stats (unaffected by current filters) ─────────────────────
    const [statsResult] = await db
      .collection("guestEventRegistrations")
      .aggregate([
        {
          $match: {
            verifiedAt: { $exists: true },
            migratedToUserId: { $exists: false }, // ← ADDED: exclude migrated
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            registered: {
              $sum: {
                $cond: [{ $eq: ["$status", "registered"] }, 1, 0],
              },
            },
            checkedIn: {
              $sum: {
                $cond: [{ $eq: ["$status", "checked-in"] }, 1, 0],
              },
            },
            cancelled: {
              $sum: {
                $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
              },
            },
          },
        },
      ])
      .toArray();

    const stats = statsResult
      ? {
          total: statsResult.total as number,
          registered: statsResult.registered as number,
          checkedIn: statsResult.checkedIn as number,
          cancelled: statsResult.cancelled as number,
        }
      : { total: 0, registered: 0, checkedIn: 0, cancelled: 0 };

    return NextResponse.json(
      {
        guests,
        stats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[GET /api/admin/guests]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
