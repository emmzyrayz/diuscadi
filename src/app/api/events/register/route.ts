// app/api/events/register/route.ts
// POST /api/events/register
// Registers the authenticated user to an event.
// Body: { eventId: string, ticketTypeId: string, referralCodeUsed?: string }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { generateInviteCode } from "@/lib/auth";
import { EventRegistrationDocument } from "@/lib/models/EventRegistration";

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const { eventId, ticketTypeId, referralCodeUsed } = (await req.json()) as {
      eventId: string;
      ticketTypeId: string;
      referralCodeUsed?: string;
    };

    // ── Input validation ──────────────────────────────────────────────────────
    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: "Valid eventId is required." },
        { status: 400 },
      );
    }
    if (!ticketTypeId || !ObjectId.isValid(ticketTypeId)) {
      return NextResponse.json(
        { error: "Valid ticketTypeId is required." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);
    const eventObjId = new ObjectId(eventId);
    const ticketObjId = new ObjectId(ticketTypeId);
    const now = new Date();

    // ── Fetch user ────────────────────────────────────────────────────────────
    const userData = await Collections.userData(db).findOne({ vaultId });
    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 },
      );
    }

    // ── Fetch + validate event ────────────────────────────────────────────────
    const event = await Collections.events(db).findOne({ _id: eventObjId });
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }
    if (event.status !== "published") {
      return NextResponse.json(
        { error: "Event is not open for registration." },
        { status: 400 },
      );
    }
    if (event.registrationDeadline < now) {
      return NextResponse.json(
        { error: "Registration deadline has passed." },
        { status: 400 },
      );
    }
    if (event.eventDate < now) {
      return NextResponse.json(
        { error: "Event has already taken place." },
        { status: 400 },
      );
    }

    // ── Fetch + validate ticket type ──────────────────────────────────────────
    const ticketType = await Collections.ticketTypes(db).findOne({
      _id: ticketObjId,
      eventId: eventObjId,
      isActive: true,
    });
    if (!ticketType) {
      return NextResponse.json(
        { error: "Ticket type not found or inactive." },
        { status: 404 },
      );
    }

    // ── Check capacity ────────────────────────────────────────────────────────
    // Count active registrations for this ticket type
    const ticketCount = await Collections.eventRegistrations(db).countDocuments(
      {
        eventId: eventObjId,
        ticketTypeId: ticketObjId,
        status: { $ne: "cancelled" },
      },
    );
    if (ticketCount >= ticketType.maxQuantity) {
      return NextResponse.json(
        { error: "This ticket tier is sold out." },
        { status: 409 },
      );
    }

    // Also check overall event capacity
    const totalRegistered = await Collections.eventRegistrations(
      db,
    ).countDocuments({
      eventId: eventObjId,
      status: { $ne: "cancelled" },
    });
    if (totalRegistered >= event.capacity) {
      return NextResponse.json(
        { error: "Event is at full capacity." },
        { status: 409 },
      );
    }

    // ── Check for duplicate registration ──────────────────────────────────────
    const existing = await Collections.eventRegistrations(db).findOne({
      userId: userData._id!,
      eventId: eventObjId,
      status: { $ne: "cancelled" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You are already registered for this event." },
        { status: 409 },
      );
    }

    // ── Validate referral code (optional) ─────────────────────────────────────
    if (referralCodeUsed) {
      const referrer = await Collections.userData(db).findOne({
        signupInviteCode: referralCodeUsed,
      });
      if (!referrer) {
        return NextResponse.json(
          { error: "Invalid referral code." },
          { status: 400 },
        );
      }
    }

    // ── Generate unique invite code ───────────────────────────────────────────
    // Retry up to 5 times on collision (extremely unlikely with 8-char hex)
    let inviteCode = "";
    for (let i = 0; i < 5; i++) {
      const candidate = generateInviteCode() + generateInviteCode(); // 12-char
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
        { error: "Failed to generate invite code. Please retry." },
        { status: 500 },
      );
    }

    // ── Create registration ───────────────────────────────────────────────────
    const registration: EventRegistrationDocument = {
      userId: userData._id!,
      eventId: eventObjId,
      ticketTypeId: ticketObjId,
      inviteCode,
      referralCodeUsed: referralCodeUsed?.trim() || undefined,
      status: "registered",
      registeredAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const result =
      await Collections.eventRegistrations(db).insertOne(registration);

    // ── Increment user analytics ──────────────────────────────────────────────
    await Collections.userData(db).updateOne(
      { _id: userData._id },
      {
        $inc: { "analytics.eventsRegistered": 1 },
        $set: {
          "analytics.lastEventRegisteredAt": now,
          updatedAt: now,
        },
      },
    );

    return NextResponse.json(
      {
        message: "Successfully registered for the event.",
        registrationId: result.insertedId,
        inviteCode,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/events/register]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

export const POST = withAuth(handler);
