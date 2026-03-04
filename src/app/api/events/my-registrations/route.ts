// app/api/events/my-registrations/route.ts
// GET /api/events/my-registrations
// Returns the authenticated user's event registrations,
// enriched with full Event + TicketType via aggregation.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    const userData = await Collections.userData(db).findOne({ vaultId });
    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 },
      );
    }

    // Parse optional status filter
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // "registered" | "checked-in" | "cancelled"

    const matchStage: Record<string, unknown> = { userId: userData._id };
    if (status && ["registered", "checked-in", "cancelled"].includes(status)) {
      matchStage["status"] = status;
    }

    // ── Aggregation: registration → event → ticketType ────────────────────────
    const pipeline = [
      { $match: matchStage },

      // Join Event
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: { path: "$event", preserveNullAndEmptyArrays: true } },

      // Join TicketType
      {
        $lookup: {
          from: "ticketTypes",
          localField: "ticketTypeId",
          foreignField: "_id",
          as: "ticketType",
        },
      },
      { $unwind: { path: "$ticketType", preserveNullAndEmptyArrays: true } },

      // Shape the response — only return what the UI needs
      {
        $project: {
          _id: 1,
          status: 1,
          inviteCode: 1,
          registeredAt: 1,
          checkedInAt: 1,
          referralCodeUsed: 1,

          // Event fields
          "event._id": 1,
          "event.slug": 1,
          "event.title": 1,
          "event.overview": 1,
          "event.image": 1,
          "event.format": 1,
          "event.location": 1,
          "event.eventDate": 1,
          "event.endDate": 1,
          "event.status": 1,
          "event.category": 1,

          // TicketType fields
          "ticketType._id": 1,
          "ticketType.name": 1,
          "ticketType.price": 1,
          "ticketType.currency": 1,
        },
      },

      // Most recent registrations first
      { $sort: { registeredAt: -1 } },
    ];

    const registrations = await Collections.eventRegistrations(db)
      .aggregate(pipeline)
      .toArray();

    return NextResponse.json({ registrations });
  } catch (err) {
    console.error("[GET /api/events/my-registrations]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

export const GET = withAuth(handler);
