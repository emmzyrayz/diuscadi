// POST /api/events/register
// Auth required. Registers the authenticated user for an event.
// Body: { eventId, ticketTypeId, referralCodeUsed? }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { generateInviteCode } from "@/lib/auth";

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { eventId, ticketTypeId, referralCodeUsed } = body;

    if (!eventId || !ticketTypeId) {
      return NextResponse.json(
        { error: "eventId and ticketTypeId are required" },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(eventId) || !ObjectId.isValid(ticketTypeId)) {
      return NextResponse.json(
        { error: "Invalid eventId or ticketTypeId" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);
    const now = new Date();

    // Resolve userDataId
    const userData = await Collections.userData(db).findOne(
      { vaultId },
      { projection: { _id: 1 } },
    );
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userDataId = userData._id as ObjectId;
    const eventObjId = new ObjectId(eventId);
    const ticketObjId = new ObjectId(ticketTypeId);

    // Validate event
    const event = await Collections.events(db).findOne({ _id: eventObjId });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.status !== "published") {
      return NextResponse.json(
        { error: "Event is not available for registration" },
        { status: 400 },
      );
    }
    if (event.registrationDeadline < now) {
      return NextResponse.json(
        { error: "Registration deadline has passed" },
        { status: 400 },
      );
    }
    if (event.eventDate < now) {
      return NextResponse.json(
        { error: "Event has already passed" },
        { status: 400 },
      );
    }

    // Validate ticket type
    const ticketType = await Collections.ticketTypes(db).findOne({
      _id: ticketObjId,
      eventId: eventObjId,
    });
    if (!ticketType || !ticketType.isActive) {
      return NextResponse.json(
        { error: "Ticket type not found or unavailable" },
        { status: 400 },
      );
    }
    if (ticketType.availableFrom && ticketType.availableFrom > now) {
      return NextResponse.json(
        { error: "This ticket tier is not yet available" },
        { status: 400 },
      );
    }
    if (ticketType.availableUntil && ticketType.availableUntil < now) {
      return NextResponse.json(
        { error: "This ticket tier has expired" },
        { status: 400 },
      );
    }

    // Check duplicate registration
    const existing = await Collections.eventRegistrations(db).findOne({
      userId: userDataId,
      eventId: eventObjId,
      status: { $ne: "cancelled" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 409 },
      );
    }

    // Check overall event capacity
    const totalRegistered = await Collections.eventRegistrations(
      db,
    ).countDocuments({
      eventId: eventObjId,
      status: { $ne: "cancelled" },
    });
    if (totalRegistered >= event.capacity) {
      return NextResponse.json(
        { error: "Event is fully booked" },
        { status: 400 },
      );
    }

    // Check ticket tier capacity
    const tierRegistered = await Collections.eventRegistrations(
      db,
    ).countDocuments({
      eventId: eventObjId,
      ticketTypeId: ticketObjId,
      status: { $ne: "cancelled" },
    });
    if (tierRegistered >= ticketType.maxQuantity) {
      return NextResponse.json(
        { error: "This ticket tier is sold out" },
        { status: 400 },
      );
    }

    // Validate referral code if provided
    if (referralCodeUsed) {
      const referrer = await Collections.eventRegistrations(db).findOne({
        inviteCode: referralCodeUsed,
        eventId: eventObjId,
      });
      if (!referrer) {
        return NextResponse.json(
          { error: "Invalid referral code" },
          { status: 400 },
        );
      }
    }

    // Generate unique invite code (retry up to 5 times)
    let inviteCode = "";
    for (let i = 0; i < 5; i++) {
      const candidate = generateInviteCode();
      const clash = await Collections.eventRegistrations(db).findOne({
        inviteCode: candidate,
      });
      if (!clash) {
        inviteCode = candidate;
        break;
      }
    }
    if (!inviteCode) {
      return NextResponse.json(
        { error: "Could not generate invite code. Please try again." },
        { status: 500 },
      );
    }

    // Create registration
    const registration = {
      userId: userDataId,
      eventId: eventObjId,
      ticketTypeId: ticketObjId,
      inviteCode,
      referralCodeUsed: referralCodeUsed ?? null,
      status: "registered" as const,
      registeredAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const { insertedId } =
      await Collections.eventRegistrations(db).insertOne(registration);

    // Increment analytics
    await Collections.userData(db).updateOne(
      { _id: userDataId },
      {
        $inc: { "analytics.eventsRegistered": 1 },
        $set: { "analytics.lastEventRegisteredAt": now, updatedAt: now },
      },
    );

    return NextResponse.json(
      {
        message: "Registration successful",
        registration: {
          id: insertedId.toString(),
          inviteCode,
          status: "registered",
          eventId,
          ticketTypeId,
          registeredAt: now.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/events/register]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
