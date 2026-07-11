// GET /api/admin/tickets
// Admin/webmaster only. Returns paginated ticket list (account + guest) with stats.
// Query: ?page= &limit= &search= &status= &eventId= &type=all|account|guest &export=csv

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (req.auth.role !== "admin" && req.auth.role !== "webmaster") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "25"));
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";
    const eventId = searchParams.get("eventId") ?? "";
    const typeFilter = searchParams.get("type") ?? ""; // "account" | "guest" | ""
    const exportCsv = searchParams.get("export") === "csv";
    const skip = (page - 1) * limit;

    const db = await getDb();

    // ── Shared match conditions ───────────────────────────────────────────────
    const accountMatch: Record<string, unknown> = {};
    const guestMatch: Record<string, unknown> = {
      verifiedAt: { $exists: true },
      migratedToUserId: { $exists: false },
    };

    if (status) {
      accountMatch.status = status;
      guestMatch.status = status;
    }
    if (eventId && ObjectId.isValid(eventId)) {
      const eid = new ObjectId(eventId);
      accountMatch.eventId = eid;
      guestMatch.eventId = eid;
    }

    // ── Normalize pipelines ───────────────────────────────────────────────────
    // Both pipelines project to the SAME field names so $unionWith works cleanly.

    const accountNormPipeline: object[] = [
      { $match: accountMatch },
      {
        $lookup: {
          from: "userData",
          localField: "userId",
          foreignField: "_id",
          as: "_u",
        },
      },
      { $unwind: { path: "$_u", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "_e",
        },
      },
      { $unwind: { path: "$_e", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          inviteCode: 1,
          status: 1,
          userId: { $toString: "$userId" },
          eventId: { $toString: "$eventId" },
          checkedInAt: 1,
          createdAt: 1,
          registeredAt: 1,
          registrationType: { $literal: "Account" },
          userName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$_u.fullName.firstname", ""] },
                  " ",
                  { $ifNull: ["$_u.fullName.lastname", ""] },
                ],
              },
            },
          },
          userEmail: { $ifNull: ["$_u.email", ""] },
          userAvatar: { $ifNull: ["$_u.avatar.imageUrl", null] },
          eventTitle: { $ifNull: ["$_e.title", "Unknown Event"] },
          eventDate: { $ifNull: ["$_e.eventDate", null] },
          institution: { $ifNull: ["$_u.Institution.name", ""] },
          institutionAbbr: { $ifNull: ["$_u.Institution.abbreviation", ""] },
          faculty: { $ifNull: ["$_u.Institution.faculty", ""] },
          department: { $ifNull: ["$_u.Institution.department", ""] },
          level: { $ifNull: ["$_u.Institution.level", ""] },
        },
      },
    ];

    const guestNormPipeline: object[] = [
      { $match: guestMatch },
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "_e",
        },
      },
      { $unwind: { path: "$_e", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          inviteCode: 1,
          status: 1,
          userId: { $literal: null },
          eventId: { $toString: "$eventId" },
          checkedInAt: 1,
          createdAt: 1,
          registeredAt: 1,
          registrationType: { $literal: "Guest" },
          userName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$fullName.firstname", ""] },
                  " ",
                  { $ifNull: ["$fullName.lastname", ""] },
                ],
              },
            },
          },
          userEmail: { $ifNull: ["$email", ""] },
          userAvatar: { $literal: null },
          eventTitle: { $ifNull: ["$_e.title", "Unknown Event"] },
          eventDate: { $ifNull: ["$_e.eventDate", null] },
          institution: { $literal: "" },
          institutionAbbr: { $literal: "" },
          faculty: { $literal: "" },
          department: { $literal: "" },
          level: { $literal: "" },
        },
      },
    ];

    // ── Search stage (applied after normalization / union) ────────────────────
    const searchStage = search
      ? [
          {
            $match: {
              $or: [
                { inviteCode: { $regex: search, $options: "i" } },
                { userEmail: { $regex: search, $options: "i" } },
                { userName: { $regex: search, $options: "i" } },
                { eventTitle: { $regex: search, $options: "i" } },
              ],
            },
          },
        ]
      : [];

    // ── Final project ─────────────────────────────────────────────────────────
    const finalProject = {
      $project: {
        _id: 0,
        id: { $toString: "$_id" },
        inviteCode: 1,
        status: 1,
        userId: 1,
        eventId: 1,
        checkedInAt: 1,
        createdAt: 1,
        registeredAt: 1,
        registrationType: 1,
        userName: 1,
        userEmail: 1,
        userAvatar: 1,
        eventTitle: 1,
        eventDate: 1,
        institution: 1,
        institutionAbbr: 1,
        faculty: 1,
        department: 1,
        level: 1,
      },
    };

    // ── Build main pipeline based on type filter ───────────────────────────────
    let basePipeline: object[];
    let baseCollection: ReturnType<
      | typeof Collections.eventRegistrations
      | typeof Collections.guestEventRegistrations
    >;

    if (typeFilter === "guest") {
      baseCollection = Collections.guestEventRegistrations(db);
      basePipeline = [...guestNormPipeline, ...searchStage];
    } else if (typeFilter === "account") {
      baseCollection = Collections.eventRegistrations(db);
      basePipeline = [...accountNormPipeline, ...searchStage];
    } else {
      // "all" — union both collections
      baseCollection = Collections.eventRegistrations(db);
      basePipeline = [
        ...accountNormPipeline,
        {
          $unionWith: {
            coll: "guestEventRegistrations",
            pipeline: guestNormPipeline,
          },
        },
        ...searchStage,
      ];
    }

    // ── CSV export ────────────────────────────────────────────────────────────
    if (exportCsv) {
      const rows = await baseCollection
        .aggregate([
          ...basePipeline,
          { $sort: { createdAt: -1 } },
          { $limit: 10_000 },
          finalProject,
        ])
        .toArray();

      const escape = (v: unknown): string => {
        const s = v == null ? "" : String(v);
        return s.includes(",") || s.includes("\n") || s.includes('"')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };
      const formatDate = (d: unknown): string => {
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
      };

      const headers = [
        "Ticket Code",
        "Registration Type",
        "Status",
        "User Name",
        "User Email",
        "Event",
        "Event Date",
        "Registered At",
        "Checked In At",
        "Institution",
        "Abbreviation",
        "Faculty",
        "Department",
        "Level",
      ];

      const csvLines = [
        headers.join(","),
        ...rows.map((r) =>
          [
            escape(r.inviteCode),
            escape(r.registrationType),
            escape(r.status),
            escape(r.userName),
            escape(r.userEmail),
            escape(r.eventTitle),
            escape(formatDate(r.eventDate)),
            escape(formatDate(r.registeredAt ?? r.createdAt)),
            escape(formatDate(r.checkedInAt)),
            escape(r.institution),
            escape(r.institutionAbbr),
            escape(r.faculty),
            escape(r.department),
            escape(r.level),
          ].join(","),
        ),
      ];

      const csv = csvLines.join("\n");
      const filename = `diuscadi-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // ── Paginated JSON ────────────────────────────────────────────────────────
    const [countResult] = await baseCollection
      .aggregate([...basePipeline, { $count: "total" }])
      .toArray();
    const total = (countResult?.total as number) ?? 0;

    const tickets = await baseCollection
      .aggregate([
        ...basePipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        finalProject,
      ])
      .toArray();

    // ── Stats — always across BOTH collections regardless of type filter ───────
    const [accountStats, guestStats] = await Promise.all([
      Collections.eventRegistrations(db)
        .aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: {
                $sum: { $cond: [{ $eq: ["$status", "registered"] }, 1, 0] },
              },
              checkedIn: {
                $sum: { $cond: [{ $eq: ["$status", "checked-in"] }, 1, 0] },
              },
              invalidated: {
                $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
              },
            },
          },
        ])
        .toArray(),
      Collections.guestEventRegistrations(db)
        .aggregate([
          {
            $match: {
              verifiedAt: { $exists: true },
              migratedToUserId: { $exists: false },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: {
                $sum: { $cond: [{ $eq: ["$status", "registered"] }, 1, 0] },
              },
              checkedIn: {
                $sum: { $cond: [{ $eq: ["$status", "checked-in"] }, 1, 0] },
              },
              invalidated: {
                $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
              },
            },
          },
        ])
        .toArray(),
    ]);

    const a = accountStats[0];
    const g = guestStats[0];

    const stats = {
      total: (a?.total ?? 0) + (g?.total ?? 0),
      active: (a?.active ?? 0) + (g?.active ?? 0),
      checkedIn: (a?.checkedIn ?? 0) + (g?.checkedIn ?? 0),
      invalidated: (a?.invalidated ?? 0) + (g?.invalidated ?? 0),
      accountTotal: a?.total ?? 0,
      guestTotal: g?.total ?? 0,
    };

    return NextResponse.json({
      tickets,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/tickets]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
