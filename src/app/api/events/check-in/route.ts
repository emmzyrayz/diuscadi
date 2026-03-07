// POST /api/events/check-in
// Auth required. Role-gated: admin | moderator | committee members only.
// Body: { inviteCode }
// Marks the registration as checked-in and records the timestamp.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import type { AccountRole } from "@/types/domain";

const ALLOWED_ROLES: AccountRole[] = ["admin", "moderator", "webmaster"];

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const role = req.auth.role as AccountRole;
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        {
          error:
            "Only admins, moderators, and webmasters can check in attendees",
        },
        { status: 403 },
      );
    }

    const { inviteCode } = await req.json();
    if (!inviteCode || typeof inviteCode !== "string") {
      return NextResponse.json(
        { error: "inviteCode is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();

    const registration = await Collections.eventRegistrations(db).findOne({
      inviteCode: inviteCode.trim().toUpperCase(),
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 },
      );
    }
    if (registration.status === "cancelled") {
      return NextResponse.json(
        { error: "This registration has been cancelled" },
        { status: 400 },
      );
    }
    if (registration.status === "checked-in") {
      return NextResponse.json(
        { error: "Attendee is already checked in" },
        { status: 409 },
      );
    }

    // Confirm event day has arrived
    const event = await Collections.events(db).findOne({
      _id: registration.eventId,
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventDay = new Date(event.eventDate);
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const eventStart = new Date(
      eventDay.getFullYear(),
      eventDay.getMonth(),
      eventDay.getDate(),
    );

    if (eventStart > todayStart) {
      return NextResponse.json(
        { error: "Check-in is not yet open. Event has not started." },
        { status: 400 },
      );
    }

    await Collections.eventRegistrations(db).updateOne(
      { _id: registration._id as ObjectId },
      { $set: { status: "checked-in", checkedInAt: now, updatedAt: now } },
    );

    // Increment eventsAttended
    await Collections.userData(db).updateOne(
      { _id: registration.userId },
      { $inc: { "analytics.eventsAttended": 1 }, $set: { updatedAt: now } },
    );

    // Return attendee info for the check-in screen
    const attendee = await Collections.userData(db).findOne(
      { _id: registration.userId },
      { projection: { fullName: 1, email: 1, avatar: 1, membershipStatus: 1 } },
    );

    return NextResponse.json({
      message: "Check-in successful",
      attendee: {
        name: attendee?.fullName ?? "Unknown",
        email: attendee?.email ?? "",
        avatar: attendee?.avatar ?? null,
        membershipStatus: attendee?.membershipStatus ?? "pending",
      },
      registration: {
        id: registration._id!.toString(),
        inviteCode: registration.inviteCode,
        eventId: registration.eventId.toString(),
        checkedInAt: now.toISOString(),
      },
    });
  } catch (err) {
    console.error("[POST /api/events/check-in]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
