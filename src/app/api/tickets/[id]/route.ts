// GET /api/tickets/[id]
// Auth required. Returns a single ticket with full event and ticket type details.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

const FALLBACK_IMAGE = "/images/events/default.jpg";

function resolveEventImage(event: Record<string, unknown>): string {
  if (
    event.hasEventBanner &&
    (event.eventBanner as Record<string, unknown>)?.imageUrl
  ) {
    return (event.eventBanner as Record<string, unknown>).imageUrl as string;
  }
  if (
    event.hasEventLogo &&
    (event.eventLogo as Record<string, unknown>)?.imageUrl
  ) {
    return (event.eventLogo as Record<string, unknown>).imageUrl as string;
  }
  return FALLBACK_IMAGE;
}

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

      const userData = await Collections.userData(db).findOne(
        { vaultId },
        { projection: { _id: 1 } },
      );
      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const pipeline = [
        { $match: { _id: new ObjectId(id), userId: userData._id as ObjectId } },
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
      ];

      const [registration] = await Collections.eventRegistrations(db)
        .aggregate(pipeline)
        .toArray();

      if (!registration) {
        return NextResponse.json(
          { error: "Ticket not found" },
          { status: 404 },
        );
      }

      const event = registration.event as Record<string, unknown>;
      const ticketType = registration.ticketType as Record<string, unknown>;

      return NextResponse.json({
        ticket: {
          id: (registration._id as ObjectId).toString(),
          inviteCode: registration.inviteCode,
          status: registration.status,
          registeredAt: (registration.registeredAt as Date).toISOString(),
          checkedInAt: registration.checkedInAt
            ? (registration.checkedInAt as Date).toISOString()
            : null,
          referralCodeUsed: registration.referralCodeUsed ?? null,
          event: {
            id: (event._id as ObjectId).toString(),
            slug: event.slug,
            title: event.title,
            overview: event.overview,
            format: event.format,
            location: event.location ?? null,
            eventDate: (event.eventDate as Date).toISOString(),
            endDate: event.endDate
              ? (event.endDate as Date).toISOString()
              : null,
            registrationDeadline: (
              event.registrationDeadline as Date
            ).toISOString(),
            duration: event.duration ?? null,
            // Resolve CloudinaryImage → plain URL string
            image: resolveEventImage(event),
            category: event.category,
            instructor: event.instructor ?? null,
            status: event.status,
          },
          ticketType: {
            id: (ticketType._id as ObjectId).toString(),
            name: ticketType.name,
            price: ticketType.price,
            currency: ticketType.currency,
          },
        },
      });
    } catch (err) {
      console.error("[GET /api/tickets/[id]]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
