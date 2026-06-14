// GET /api/admin/broadcast/events
// Lightweight event list for the broadcast modal event picker.
// Returns all events (all statuses) with account + guest registration counts.
// Capped at 200 — more than sufficient for any picker dropdown.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

const ALLOWED_ROLES = ["admin", "webmaster"];

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  if (!ALLOWED_ROLES.includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const db = await getDb();

    const events = await Collections.events(db)
      .aggregate([
        { $sort: { eventDate: -1 } },
        { $limit: 200 },
        // Account registrations count
        {
          $lookup: {
            from: "eventRegistrations",
            localField: "_id",
            foreignField: "eventId",
            pipeline: [{ $count: "n" }],
            as: "_acctRegs",
          },
        },
        // Guest registrations count (verified only)
        {
          $lookup: {
            from: "guestEventRegistrations",
            localField: "_id",
            foreignField: "eventId",
            pipeline: [
              { $match: { verifiedAt: { $exists: true, $ne: null } } },
              { $count: "n" },
            ],
            as: "_guestRegs",
          },
        },
        {
          $project: {
            _id: 0,
            id: { $toString: "$_id" },
            title: 1,
            slug: 1,
            status: 1,
            eventDate: 1,
            capacity: 1,
            accountRegistered: {
              $ifNull: [{ $arrayElemAt: ["$_acctRegs.n", 0] }, 0],
            },
            guestRegistered: {
              $ifNull: [{ $arrayElemAt: ["$_guestRegs.n", 0] }, 0],
            },
          },
        },
      ])
      .toArray();

    return NextResponse.json({ events });
  } catch (err) {
    console.error("[GET /api/admin/broadcast/events]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
