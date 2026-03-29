// GET /api/tickets/verify/[code]
// Auth required.
// Returns ticket details by inviteCode.
// Accessible by:
//   - The ticket owner (to view their own QR page)
//   - Admin / moderator / webmaster (to verify attendee at the door)

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

const STAFF_ROLES = ["admin", "moderator", "webmaster"];

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
  return "/images/events/default.jpg";
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
      const code = (params.code as string)?.trim().toUpperCase();

      if (!code) {
        return NextResponse.json(
          { error: "Code is required" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const isStaff = STAFF_ROLES.includes(req.auth.role);

      // Look up registration by inviteCode
      const pipeline = [
        { $match: { inviteCode: code } },
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
        {
          $lookup: {
            from: "userData",
            localField: "userId",
            foreignField: "_id",
            as: "owner",
          },
        },
        { $unwind: "$event" },
        { $unwind: "$ticketType" },
        { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
      ];

      const [reg] = await Collections.eventRegistrations(db)
        .aggregate(pipeline)
        .toArray();

      if (!reg) {
        return NextResponse.json(
          { error: "Ticket not found" },
          { status: 404 },
        );
      }

      // Non-staff can only see their own ticket
      if (!isStaff) {
        const vaultId = new ObjectId(req.auth.vaultId);
        const userData = await Collections.userData(db).findOne(
          { vaultId },
          { projection: { _id: 1 } },
        );
        if (!userData || !userData._id.equals(reg.userId)) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }

      const event = reg.event as Record<string, unknown>;
      const ticketType = reg.ticketType as Record<string, unknown>;
      const owner = reg.owner as Record<string, unknown> | undefined;

      return NextResponse.json({
        ticket: {
          id: (reg._id as ObjectId).toString(),
          inviteCode: reg.inviteCode,
          status: reg.status,
          registeredAt: (reg.registeredAt as Date).toISOString(),
          checkedInAt: reg.checkedInAt
            ? (reg.checkedInAt as Date).toISOString()
            : null,
          referralCodeUsed: reg.referralCodeUsed ?? null,
          event: {
            id: (event._id as ObjectId).toString(),
            slug: event.slug,
            title: event.title,
            overview: event.overview ?? null,
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
          // Owner info only exposed to staff
          owner:
            isStaff && owner
              ? {
                  name: [
                    (owner.fullName as Record<string, string>)?.firstname,
                    (owner.fullName as Record<string, string>)?.lastname,
                  ]
                    .filter(Boolean)
                    .join(" "),
                  email: owner.email,
                  avatar: owner.avatar ?? null,
                  membershipStatus: owner.membershipStatus,
                }
              : null,
          // Staff flag so the UI knows to show the check-in button
          canCheckIn: isStaff,
        },
      });
    } catch (err) {
      console.error("[GET /api/tickets/verify/[code]]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
