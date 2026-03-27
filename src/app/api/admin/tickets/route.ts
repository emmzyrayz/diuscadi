// GET /api/admin/tickets
// Admin/webmaster only. Returns paginated ticket list with stats.
// Tickets are stored in "eventRegistrations" collection.
// Query: ?page= &limit= &search= &status= &eventId=

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
    const skip = (page - 1) * limit;

    const db = await getDb();

    // ── Base match ────────────────────────────────────────────────────────────
    const match: Record<string, unknown> = {};
    if (status) match.status = status;
    if (eventId) {
      try {
        match.eventId = new ObjectId(eventId);
      } catch {
        /* ignore */
      }
    }

    // ── Pipeline with user + event joins ──────────────────────────────────────
    const pipeline: object[] = [
      { $match: match },

      {
        $lookup: {
          from: "userData",
          localField: "userId",
          foreignField: "_id",
          as: "_user",
        },
      },
      { $unwind: { path: "$_user", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "_event",
        },
      },
      { $unwind: { path: "$_event", preserveNullAndEmptyArrays: true } },
    ];

    // Search across invite code, name, email, event title
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { inviteCode: { $regex: search, $options: "i" } },
            { "_user.email": { $regex: search, $options: "i" } },
            { "_user.fullName.firstname": { $regex: search, $options: "i" } },
            { "_user.fullName.lastname": { $regex: search, $options: "i" } },
            { "_event.title": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Count total before pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const [countResult] = await Collections.eventRegistrations(db)
      .aggregate(countPipeline)
      .toArray();
    const total = countResult?.total ?? 0;

    // Sort, paginate, project to the AdminTicket shape
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          id: { $toString: "$_id" },
          inviteCode: 1,
          status: 1,
          userId: { $toString: "$userId" },
          eventId: { $toString: "$eventId" },
          checkedInAt: 1,
          createdAt: 1,
          // Flatten fullName object → plain string for AdminTicket.userName
          userName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$_user.fullName.firstname", ""] },
                  " ",
                  { $ifNull: ["$_user.fullName.lastname", ""] },
                ],
              },
            },
          },
          userEmail: { $ifNull: ["$_user.email", ""] },
          // avatar is stored as string URL on userData
          userAvatar: { $ifNull: ["$_user.avatar", null] },
          eventTitle: { $ifNull: ["$_event.title", "Unknown Event"] },
          eventDate: { $ifNull: ["$_event.eventDate", null] },
        },
      },
    );

    const tickets = await Collections.eventRegistrations(db)
      .aggregate(pipeline)
      .toArray();

    // ── Stats — counts across entire collection, ignoring current filters ─────
    const [statsResult] = await Collections.eventRegistrations(db)
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
              $sum: { $cond: [{ $in: ["$status", ["cancelled"]] }, 1, 0] },
            },
          },
        },
      ])
      .toArray();

    const stats = statsResult
      ? {
          total: statsResult.total,
          active: statsResult.active,
          checkedIn: statsResult.checkedIn,
          invalidated: statsResult.invalidated,
        }
      : { total: 0, active: 0, checkedIn: 0, invalidated: 0 };

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
