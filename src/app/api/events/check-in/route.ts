// POST /api/events/check-in
// Auth required. Role-gated: admin | moderator | webmaster.
// Body: { inviteCode }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import type { AccountRole } from "@/types/domain";

const ALLOWED_ROLES: AccountRole[] = ["admin", "moderator", "webmaster"];

// How many hours before event start to open check-in
const CHECK_IN_OPENS_HOURS_BEFORE = 2;

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

    const event = await Collections.events(db).findOne({
      _id: registration.eventId,
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check-in opens CHECK_IN_OPENS_HOURS_BEFORE hours before the event
    // and closes when the event ends (or same day if no endDate)
    const eventStart = new Date(event.eventDate);
    const checkInOpensAt = new Date(
      eventStart.getTime() - CHECK_IN_OPENS_HOURS_BEFORE * 60 * 60 * 1000,
    );

    const eventEnd = event.endDate
      ? new Date(event.endDate)
      : new Date(
          eventStart.getFullYear(),
          eventStart.getMonth(),
          eventStart.getDate(),
          23,
          59,
          59,
        );

    // Temporary debug — remove after confirming
    console.log("[check-in] now:", now.toISOString());
    console.log("[check-in] checkInOpensAt:", checkInOpensAt.toISOString());
    console.log("[check-in] eventEnd:", eventEnd.toISOString());
    console.log("[check-in] registration status:", registration.status);

    if (now < checkInOpensAt) {
      const minutesUntilOpen = Math.round(
        (checkInOpensAt.getTime() - now.getTime()) / 60000,
      );
      const hoursUntilOpen = Math.round(minutesUntilOpen / 60);
      return NextResponse.json(
        {
          error:
            minutesUntilOpen < 60
              ? `Check-in opens in ${minutesUntilOpen} minute${minutesUntilOpen !== 1 ? "s" : ""}`
              : `Check-in opens in ${hoursUntilOpen} hour${hoursUntilOpen !== 1 ? "s" : ""}`,
        },
        { status: 400 },
      );
    }

    if (now > eventEnd) {
      return NextResponse.json(
        { error: "This event has already ended" },
        { status: 400 },
      );
    }

    await Collections.eventRegistrations(db).updateOne(
      { _id: registration._id as ObjectId },
      { $set: { status: "checked-in", checkedInAt: now, updatedAt: now } },
    );

    await Collections.userData(db).updateOne(
      { _id: registration.userId },
      { $inc: { "analytics.eventsAttended": 1 }, $set: { updatedAt: now } },
    );

    const attendee = await Collections.userData(db).findOne(
      { _id: registration.userId },
      {
        projection: {
          fullName: 1,
          email: 1,
          "avatar.imageUrl": 1, // ← was just `avatar: 1`
          membershipStatus: 1,
        },
      },
    );

    const fullName = attendee?.fullName;
    const name =
      typeof fullName === "string"
        ? fullName
        : fullName
          ? [fullName.firstname, fullName.lastname].filter(Boolean).join(" ")
          : "Unknown";

    return NextResponse.json({
      message: "Check-in successful",
      attendee: {
        name,
        email: attendee?.email ?? "",
        avatar:
          (attendee?.avatar as { imageUrl?: string } | null)?.imageUrl ?? null,
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
