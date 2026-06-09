// POST /api/events/check-in
// Auth required. Role-gated: admin | moderator | webmaster.
// Body: { inviteCode }
// Supports BOTH account (eventRegistrations) and guest (guestEventRegistrations) tickets.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import type { AccountRole } from "@/types/domain";

const ALLOWED_ROLES: AccountRole[] = ["admin", "moderator", "webmaster"];
const CHECK_IN_OPENS_HOURS_BEFORE = 2;

// ── Time window validator ─────────────────────────────────────────────────────
function checkTimeWindow(
  event: { eventDate: Date; endDate?: Date },
  now: Date,
): string | null {
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

  if (now < checkInOpensAt) {
    const minutesUntilOpen = Math.round(
      (checkInOpensAt.getTime() - now.getTime()) / 60000,
    );
    const hoursUntilOpen = Math.round(minutesUntilOpen / 60);
    return minutesUntilOpen < 60
      ? `Check-in opens in ${minutesUntilOpen} minute${minutesUntilOpen !== 1 ? "s" : ""}`
      : `Check-in opens in ${hoursUntilOpen} hour${hoursUntilOpen !== 1 ? "s" : ""}`;
  }
  if (now > eventEnd) return "This event has already ended";
  return null;
}

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
    const normalizedCode = inviteCode.trim().toUpperCase();

    // ── 1. Try account registration ───────────────────────────────────────────
    const accountReg = await Collections.eventRegistrations(db).findOne({
      inviteCode: normalizedCode,
    });

    if (accountReg) {
      if (accountReg.status === "cancelled") {
        return NextResponse.json(
          { error: "This registration has been cancelled" },
          { status: 400 },
        );
      }
      if (accountReg.status === "checked-in") {
        return NextResponse.json(
          { error: "Attendee is already checked in" },
          { status: 409 },
        );
      }

      const event = await Collections.events(db).findOne({
        _id: accountReg.eventId,
      });
      if (!event)
        return NextResponse.json({ error: "Event not found" }, { status: 404 });

      const timeError = checkTimeWindow(event, now);
      if (timeError)
        return NextResponse.json({ error: timeError }, { status: 400 });

      await Collections.eventRegistrations(db).updateOne(
        { _id: accountReg._id as ObjectId },
        { $set: { status: "checked-in", checkedInAt: now, updatedAt: now } },
      );

      // E3: increment eventsAttended
      await Collections.userData(db).updateOne(
        { _id: accountReg.userId },
        { $inc: { "analytics.eventsAttended": 1 }, $set: { updatedAt: now } },
      );

      const attendee = await Collections.userData(db).findOne(
        { _id: accountReg.userId },
        {
          projection: {
            fullName: 1,
            email: 1,
            "avatar.imageUrl": 1,
            membershipStatus: 1,
            Institution: 1,
          },
        },
      );

      const fn = attendee?.fullName;
      const name =
        typeof fn === "string"
          ? fn
          : fn
            ? [fn.firstname, fn.lastname].filter(Boolean).join(" ")
            : "Unknown";

      return NextResponse.json({
        message: "Check-in successful",
        attendee: {
          name,
          email: attendee?.email ?? "",
          avatar:
            (attendee?.avatar as { imageUrl?: string } | null)?.imageUrl ??
            null,
          membershipStatus: attendee?.membershipStatus ?? "pending",
          registrationType: "Account",
          institution: attendee?.Institution?.name ?? null,
          faculty: attendee?.Institution?.faculty ?? null,
          department: attendee?.Institution?.department ?? null,
          level: attendee?.Institution?.level ?? null,
        },
        registration: {
          id: accountReg._id!.toString(),
          inviteCode: accountReg.inviteCode,
          eventId: accountReg.eventId.toString(),
          checkedInAt: now.toISOString(),
        },
      });
    }

    // ── 2. Try guest registration ─────────────────────────────────────────────
    // Only verified guests (verifiedAt exists) can check in.
    const guestReg = await Collections.guestEventRegistrations(db).findOne({
      inviteCode: normalizedCode,
      verifiedAt: { $exists: true },
    });

    if (!guestReg) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 },
      );
    }
    if (guestReg.status === "cancelled") {
      return NextResponse.json(
        { error: "This registration has been cancelled" },
        { status: 400 },
      );
    }
    if (guestReg.status === "checked-in") {
      return NextResponse.json(
        { error: "Attendee is already checked in" },
        { status: 409 },
      );
    }

    const guestEvent = await Collections.events(db).findOne({
      _id: guestReg.eventId,
    });
    if (!guestEvent)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const guestTimeError = checkTimeWindow(guestEvent, now);
    if (guestTimeError)
      return NextResponse.json({ error: guestTimeError }, { status: 400 });

    await Collections.guestEventRegistrations(db).updateOne(
      { _id: guestReg._id as ObjectId },
      { $set: { status: "checked-in", checkedInAt: now, updatedAt: now } },
    );

    const guestName =
      [guestReg.fullName?.firstname, guestReg.fullName?.lastname]
        .filter(Boolean)
        .join(" ") || "Guest";

    return NextResponse.json({
      message: "Check-in successful",
      attendee: {
        name: guestName,
        email: guestReg.email ?? "",
        avatar: null,
        membershipStatus: "guest",
        registrationType: "Guest",
        institution: null,
        faculty: null,
        department: null,
        level: null,
      },
      registration: {
        id: guestReg._id!.toString(),
        inviteCode: guestReg.inviteCode,
        eventId: guestReg.eventId.toString(),
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
