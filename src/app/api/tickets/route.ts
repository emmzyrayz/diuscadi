// GET /api/tickets
// Auth required. Returns all of the authenticated user's registrations
// enriched with full event and ticket type data.
// Query params: ?status=registered|checked-in|cancelled (optional)

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import type { RegistrationStatus } from "@/lib/models/EventRegistration";

const VALID_STATUSES: RegistrationStatus[] = [
  "registered",
  "checked-in",
  "cancelled",
];

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") as RegistrationStatus | null;

    if (statusParam && !VALID_STATUSES.includes(statusParam)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    const userData = await Collections.userData(db).findOne(
      { vaultId },
      { projection: { _id: 1 } },
    );
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const matchStage: Record<string, unknown> = {
      userId: userData._id as ObjectId,
    };
    if (statusParam) matchStage.status = statusParam;

    const pipeline = [
      { $match: matchStage },
      { $sort: { registeredAt: -1 as const } },

      // Join event
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: "$event" },

      // Join ticket type
      {
        $lookup: {
          from: "ticketTypes",
          localField: "ticketTypeId",
          foreignField: "_id",
          as: "ticketType",
        },
      },
      { $unwind: "$ticketType" },
    ];

    const registrations = await Collections.eventRegistrations(db)
      .aggregate(pipeline)
      .toArray();

    const tickets = registrations.map((r) => {
      const event = r.event as Record<string, unknown>;
      const ticketType = r.ticketType as Record<string, unknown>;
      return {
        id: r._id!.toString(),
        inviteCode: r.inviteCode,
        status: r.status,
        registeredAt: (r.registeredAt as Date).toISOString(),
        checkedInAt: r.checkedInAt
          ? (r.checkedInAt as Date).toISOString()
          : null,
        referralCodeUsed: r.referralCodeUsed ?? null,
        event: {
          id: event._id!.toString(),
          slug: event.slug,
          title: event.title,
          format: event.format,
          location: event.location ?? null,
          eventDate: (event.eventDate as Date).toISOString(),
          endDate: event.endDate ? (event.endDate as Date).toISOString() : null,
          image: event.image,
          category: event.category,
          status: event.status,
        },
        ticketType: {
          id: ticketType._id!.toString(),
          name: ticketType.name,
          price: ticketType.price,
          currency: ticketType.currency,
        },
      };
    });

    return NextResponse.json({ tickets, total: tickets.length });
  } catch (err) {
    console.error("[GET /api/tickets]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
