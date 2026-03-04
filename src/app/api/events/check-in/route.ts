// app/api/events/check-in/route.ts
// POST /api/events/check-in
// Admin/committee route — checks in a user by inviteCode.
// Body: { inviteCode: string }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

const ALLOWED_ROLES = ["admin", "moderator", "committee"];

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    // ── Role guard ────────────────────────────────────────────────────────────
    if (!ALLOWED_ROLES.includes(req.auth.role)) {
      return NextResponse.json(
        {
          error:
            "Only admins, moderators, and committee members can check in attendees.",
        },
        { status: 403 },
      );
    }

    const { inviteCode } = (await req.json()) as { inviteCode: string };
    if (!inviteCode?.trim()) {
      return NextResponse.json(
        { error: "inviteCode is required." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();

    // ── Find registration ─────────────────────────────────────────────────────
    const registration = await Collections.eventRegistrations(db).findOne({
      inviteCode: inviteCode.trim().toUpperCase(),
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Invalid invite code." },
        { status: 404 },
      );
    }
    if (registration.status === "cancelled") {
      return NextResponse.json(
        { error: "This registration has been cancelled." },
        { status: 400 },
      );
    }
    if (registration.status === "checked-in") {
      return NextResponse.json(
        {
          error: "Attendee has already been checked in.",
          alreadyCheckedIn: true,
        },
        { status: 409 },
      );
    }

    // ── Verify event is happening today or in the past (not future check-in) ──
    const event = await Collections.events(db).findOne({
      _id: registration.eventId,
    });
    if (!event) {
      return NextResponse.json(
        { error: "Associated event not found." },
        { status: 404 },
      );
    }

    // Allow check-in from event day onward (not before event date)
    const eventDay = new Date(event.eventDate);
    eventDay.setHours(0, 0, 0, 0);
    if (now < eventDay) {
      return NextResponse.json(
        { error: "Check-in is not open yet. Event has not started." },
        { status: 400 },
      );
    }

    // ── Perform check-in ──────────────────────────────────────────────────────
    await Collections.eventRegistrations(db).updateOne(
      { _id: registration._id },
      {
        $set: {
          status: "checked-in",
          checkedInAt: now,
          updatedAt: now,
        },
      },
    );

    // ── Increment user analytics ──────────────────────────────────────────────
    await Collections.userData(db).updateOne(
      { _id: registration.userId },
      {
        $inc: { "analytics.eventsAttended": 1 },
        $set: { updatedAt: now },
      },
    );

    // ── Return enriched confirmation ──────────────────────────────────────────
    const userData = await Collections.userData(db).findOne(
      { _id: registration.userId },
      { projection: { fullName: 1, email: 1, avatar: 1 } },
    );

    return NextResponse.json({
      message: "Attendee checked in successfully.",
      checkedIn: true,
      checkedInAt: now,
      attendee: {
        fullName: userData?.fullName,
        email: userData?.email,
        avatar: userData?.avatar,
      },
      event: {
        title: event.title,
        slug: event.slug,
      },
    });
  } catch (err) {
    console.error("[POST /api/events/check-in]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

export const POST = withAuth(handler);
