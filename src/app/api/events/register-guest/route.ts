import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { generateOTP, generateInviteCode, minutesFromNow } from "@/lib/auth";
import { sendGuestVerificationEmail } from "@/lib/sendEmail";
import type { IGuestEventRegistration } from "@/lib/models/GuestEventRegistration";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/events/register-guest
//
// Public endpoint — no auth required.
// Step 1 of the guest checkout pipeline:
//   1. Validate input fields and ObjectIds
//   2. Validate the event (published, not expired, deadline not passed)
//   3. Validate the ticket type (active, within availability window)
//   4. Guard: reject if email already holds an ACCOUNT registration for this event
//   5. Guard: reject if email already holds a GUEST registration for this event
//   6. Check total event capacity (account + guest combined)
//   7. Check ticket-tier capacity (account + guest combined)
//   8. Validate referral code if provided (check both collections)
//   9. Generate unique inviteCode and 6-digit OTP
//  10. Save unverified guest record (TTL clears it in 15 min if never verified)
//  11. Fire-and-forget OTP email
//  12. Return { registrationId, email } for the client to advance to OTP screen
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 0. Parse body ────────────────────────────────────────────────────────
    const body = await req.json();
    const {
      eventId,
      ticketTypeId,
      firstName,
      lastName,
      email,
      phone,
      referralCodeUsed,
      attendanceType,
    } = body as {
      eventId?: string;
      ticketTypeId?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: { countryCode: number; phoneNumber: number };
      referralCodeUsed?: string;
      attendanceType?: "physical" | "virtual";
    };

    // ── 1. Required field validation ─────────────────────────────────────────
    const missing: string[] = [];
    if (!eventId) missing.push("eventId");
    if (!ticketTypeId) missing.push("ticketTypeId");
    if (!firstName?.trim()) missing.push("firstName");
    if (!lastName?.trim()) missing.push("lastName");
    if (!email?.trim()) missing.push("email");

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 },
      );
    }

    // ── 2. ObjectId validation ───────────────────────────────────────────────
    if (!ObjectId.isValid(eventId!) || !ObjectId.isValid(ticketTypeId!)) {
      return NextResponse.json(
        { error: "Invalid eventId or ticketTypeId format" },
        { status: 400 },
      );
    }

    // ── 3. Email validation ──────────────────────────────────────────────────
    const emailLower = email!.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    // ── 4. Phone validation (optional but structured) ────────────────────────
    if (phone !== undefined) {
      if (
        typeof phone.countryCode !== "number" ||
        typeof phone.phoneNumber !== "number" ||
        phone.countryCode <= 0 ||
        phone.phoneNumber <= 0
      ) {
        return NextResponse.json(
          { error: "Invalid phone number format" },
          { status: 400 },
        );
      }
    }

    // ── Connect to DB ────────────────────────────────────────────────────────
    const db = await getDb();
    const eventObjId = new ObjectId(eventId!);
    const ticketObjId = new ObjectId(ticketTypeId!);
    const now = new Date();

    // ── 5. Validate event ────────────────────────────────────────────────────
    const event = await Collections.events(db).findOne({ _id: eventObjId });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.status !== "published") {
      return NextResponse.json(
        { error: "This event is not currently open for registration" },
        { status: 400 },
      );
    }
    if (new Date(event.registrationDeadline) < now) {
      return NextResponse.json(
        { error: "Registration deadline has passed" },
        { status: 400 },
      );
    }
    if (new Date(event.eventDate) < now) {
      return NextResponse.json(
        { error: "This event has already taken place" },
        { status: 400 },
      );
    }

    // ── 6. Validate ticket type ──────────────────────────────────────────────
    const ticketType = await Collections.ticketTypes(db).findOne({
      _id: ticketObjId,
      eventId: eventObjId,
    });

    if (!ticketType) {
      return NextResponse.json(
        { error: "Ticket type not found for this event" },
        { status: 404 },
      );
    }
    if (!ticketType.isActive) {
      return NextResponse.json(
        { error: "This ticket type is not currently available" },
        { status: 400 },
      );
    }
    if (ticketType.availableFrom && new Date(ticketType.availableFrom) > now) {
      return NextResponse.json(
        { error: "This ticket tier is not yet available" },
        { status: 400 },
      );
    }
    if (
      ticketType.availableUntil &&
      new Date(ticketType.availableUntil) < now
    ) {
      return NextResponse.json(
        { error: "This ticket tier is no longer available" },
        { status: 400 },
      );
    }

    // ── 7. Guard: check if email is already an ACCOUNT registrant ────────────
    // Strategy: find all account registrations for this event, then look up
    // their UserData to compare emails. We do a lean projection to keep it fast.
    const accountRegsForEvent = await Collections.eventRegistrations(db)
      .find(
        { eventId: eventObjId, status: { $ne: "cancelled" } },
        { projection: { userId: 1 } },
      )
      .toArray();

    if (accountRegsForEvent.length > 0) {
      const userIds = accountRegsForEvent.map((r) => r.userId);
      const matchingUser = await Collections.userData(db).findOne(
        {
          _id: { $in: userIds },
          email: emailLower,
        },
        { projection: { _id: 1 } },
      );

      if (matchingUser) {
        return NextResponse.json(
          {
            error:
              "This email already has a platform account registration for this event. Please log in to view your ticket.",
          },
          { status: 409 },
        );
      }
    }

    // ── 8. Guard: check if email already has an active GUEST registration ────
    const existingGuest = await Collections.guestEventRegistrations(db).findOne(
      {
        email: emailLower,
        eventId: eventObjId,
        status: { $ne: "cancelled" },
      },
      { projection: { _id: 1, verifiedAt: 1 } },
    );

    if (existingGuest) {
      const message = existingGuest.verifiedAt
        ? "You are already registered for this event. Check your email for your ticket."
        : "A registration is pending verification for this email. Please check your inbox for the OTP.";

      return NextResponse.json({ error: message }, { status: 409 });
    }

    // ── 9. Total event capacity check (account + guest combined) ─────────────
    const [accountCount, guestCount] = await Promise.all([
      Collections.eventRegistrations(db).countDocuments({
        eventId: eventObjId,
        status: { $ne: "cancelled" },
      }),
      Collections.guestEventRegistrations(db).countDocuments({
        eventId: eventObjId,
        status: { $ne: "cancelled" },
      }),
    ]);

    if (accountCount + guestCount >= event.capacity) {
      return NextResponse.json(
        { error: "This event is fully booked" },
        { status: 400 },
      );
    }

    // ── 10. Ticket-tier capacity check (account + guest combined) ─────────────
    const [tierAccountCount, tierGuestCount] = await Promise.all([
      Collections.eventRegistrations(db).countDocuments({
        eventId: eventObjId,
        ticketTypeId: ticketObjId,
        status: { $ne: "cancelled" },
      }),
      Collections.guestEventRegistrations(db).countDocuments({
        eventId: eventObjId,
        ticketTypeId: ticketObjId,
        status: { $ne: "cancelled" },
      }),
    ]);

    if (tierAccountCount + tierGuestCount >= ticketType.maxQuantity) {
      return NextResponse.json(
        { error: "This ticket tier is sold out" },
        { status: 400 },
      );
    }

    // ── 11. Validate referral code (optional) ─────────────────────────────────
    if (referralCodeUsed) {
      const [referrerAccount, referrerGuest] = await Promise.all([
        Collections.eventRegistrations(db).findOne(
          { inviteCode: referralCodeUsed, eventId: eventObjId },
          { projection: { _id: 1 } },
        ),
        Collections.guestEventRegistrations(db).findOne(
          { inviteCode: referralCodeUsed, eventId: eventObjId },
          { projection: { _id: 1 } },
        ),
      ]);

      if (!referrerAccount && !referrerGuest) {
        return NextResponse.json(
          { error: "Referral code is invalid for this event" },
          { status: 400 },
        );
      }
    }

    // ── 12. Generate unique inviteCode (up to 5 attempts) ────────────────────
    let inviteCode = "";

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateInviteCode();

      const [clashAccount, clashGuest] = await Promise.all([
        Collections.eventRegistrations(db).findOne(
          { inviteCode: candidate },
          { projection: { _id: 1 } },
        ),
        Collections.guestEventRegistrations(db).findOne(
          { inviteCode: candidate },
          { projection: { _id: 1 } },
        ),
      ]);

      if (!clashAccount && !clashGuest) {
        inviteCode = candidate;
        break;
      }
    }

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Failed to generate a unique invite code. Please try again." },
        { status: 500 },
      );
    }

    // ── 13. Generate OTP ──────────────────────────────────────────────────────
    const otp = generateOTP();
    const otpExpiry = minutesFromNow(15);

    // ── 14. Save unverified guest record ──────────────────────────────────────
    // TTL index on emailVerificationExpires will auto-delete this document in
    // 15 minutes if the user never completes OTP verification.
    // We type as Omit<IGuestEventRegistration, "_id"> — the plain data interface,
    // not the Mongoose Document — because insertOne takes a raw object, not a
    // Mongoose model instance.
    const guestDoc: Omit<IGuestEventRegistration, "_id"> = {
      fullName: {
        firstname: firstName!.trim(),
        lastname: lastName!.trim(),
      },
      email: emailLower,
      ...(phone && { phone }),
      eventId: eventObjId,
      ticketTypeId: ticketObjId,
      inviteCode,
      referralCodeUsed: referralCodeUsed ?? null,
      emailVerificationCode: otp,
      emailVerificationExpires: otpExpiry,
      verifiedAt: undefined,
      status: "registered" as const,
      registeredAt: now,
      registrationType: "Guest" as const,
      // Only stored for hybrid events — drives venue routing in confirmation email
      ...(attendanceType && event.format === "hybrid" && { attendanceType }),
      createdAt: now,
      updatedAt: now,
    };

    const { insertedId } = await Collections.guestEventRegistrations(
      db,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ).insertOne(guestDoc as any);

    // ── 15. Send OTP email (fire-and-forget — never fails the registration) ───
    void (async () => {
      try {
        await sendGuestVerificationEmail({
          to: emailLower,
          name: firstName!.trim(),
          code: otp,
          eventTitle: String(event.title),
          verifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/event-landing/${event.slug}/verify?email=${encodeURIComponent(emailLower)}&registrationId=${insertedId.toString()}`,
        });
      } catch (emailErr) {
        console.error("[register-guest] OTP email failed silently:", emailErr);
      }
    })();

    // ── 16. Respond — client advances to OTP screen ───────────────────────────
    return NextResponse.json(
      {
        message:
          "A 6-digit verification code has been sent to your email. Please enter it to complete your registration.",
        registrationId: insertedId.toString(),
        email: emailLower,
        // Omit the OTP itself — never sent to client
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    // Handle MongoDB duplicate key (race condition — compound unique index fires)
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        {
          error:
            "This email is already registered for this event. Please check your inbox.",
        },
        { status: 409 },
      );
    }

    console.error("[POST /api/events/register-guest]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
