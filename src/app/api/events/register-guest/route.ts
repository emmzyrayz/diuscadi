import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { generateInviteCode } from "@/lib/auth";
import { findOrCreateGuestProfile, normalizeEmail } from "@/lib/guestProfile";
import {
  sendGuestConfirmationEmail,
  sendGuestConfirmationWithAccountEmail,
  sendEventRegistrationEmail,
} from "@/lib/sendEmail";
import type { IGuestEventRegistration } from "@/lib/models/GuestEventRegistration";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/events/register-guest
//
// Public endpoint — no auth required.
//
//   1. Validate input fields and ObjectIds
//   2. Validate the event (published, not expired, deadline not passed)
//   3. Validate the ticket type (active, within availability window)
//   4. NEW — Check if email belongs to an existing Vault account:
//        a. No account exists                → proceed as normal guest
//        b. Account exists, ALREADY registered for this event (real ticket)
//             → do NOT create a guest registration. Fire a reminder email
//               to the resolve the registration with their account
//             → return { alreadyRegistered: true } — no ticket data exposed
//               to an unauthenticated form submission
//        c. Account exists, NOT yet registered for this event
//             → proceed as guest registration, but stamp matchedUserId so
//               the warm-migrate flow can fold this in later, and send a
//               combined "ticket + you have an account" email
//   5. Guard: existing GUEST registration for this email+event → return
//      existing data directly (bypasses OTP — unchanged from before)
//   6. Capacity checks (event + ticket tier)
//   7. Referral code validation
//   8. Generate unique inviteCode
//   9. NEW — find-or-create GuestProfile, link via guestProfileId
//  10. Save guest record (verifiedAt set immediately — no OTP)
//  11. NEW — send the appropriate confirmation email (fire-and-forget):
//        - matchedUserId set  → combined ticket + existing-account email
//        - no match           → standard guest confirmation email
//      (Previously NO email fired at all in the bypassed flow — this was a
//      gap inherited from the bypass, fixed here since we're already
//      touching this logic.)
//  12. Respond — client jumps straight to step 3
// ─────────────────────────────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
      selectedSkills,
    } = body as {
      eventId?: string;
      ticketTypeId?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: { countryCode: number; phoneNumber: number };
      referralCodeUsed?: string;
      attendanceType?: "physical" | "virtual";
      selectedSkills?: string[];
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
    const emailLower = normalizeEmail(email!);
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

    // ── 7. NEW — Resolve Vault account match + branch ────────────────────────
    // Step 7a: does ANY account exist for this email at all?
    let matchedUserId: ObjectId | undefined;

    const existingVault = await Collections.vault(db).findOne(
      { email: emailLower },
      { projection: { _id: 1 } },
    );

    if (existingVault) {
      const matchedUserData = await Collections.userData(db).findOne(
        { vaultId: existingVault._id },
        { projection: { _id: 1 } },
      );

      if (matchedUserData) {
        const matchedUserDataId = matchedUserData._id as ObjectId;

        // Step 7b: does that account ALREADY have a real ticket for THIS event?
        const existingAccountReg = await Collections.eventRegistrations(
          db,
        ).findOne(
          {
            userId: matchedUserDataId,
            eventId: eventObjId,
            status: { $ne: "cancelled" },
          },
          { projection: { _id: 1 } },
        );

        if (existingAccountReg) {
          // ── Branch B: already has a real ticket — do NOT create a guest
          // registration, do NOT expose ticket data to this unauthenticated
          // form. Fire a reminder email instead. ──────────────────────────
          void (async () => {
            try {
              const userData = await Collections.userData(db).findOne(
                { _id: matchedUserDataId },
                { projection: { email: 1, fullName: 1 } },
              );
              const ticketTypeForReg = await Collections.ticketTypes(
                db,
              ).findOne(
                { _id: ticketObjId },
                { projection: { price: 1, currency: 1 } },
              );

              if (!userData) return;

              const eventDateFormatted = new Date(
                event.eventDate,
              ).toLocaleDateString("en-NG", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: "Africa/Lagos",
              });

              const loc = event.location as
                | Record<string, string | undefined>
                | undefined;
              const eventLocation =
                event.format === "virtual"
                  ? (event.virtualVenueLink as string) ||
                    "Virtual — meeting link in your dashboard"
                  : [loc?.venue, loc?.city].filter(Boolean).join(", ") ||
                    String(event.format ?? "See event details");

              const price = ticketTypeForReg?.price as number | undefined;
              const isFree = !price || price === 0;

              await sendEventRegistrationEmail({
                to: userData.email,
                ticketId: (existingAccountReg._id as ObjectId).toString(),
                name: userData.fullName?.firstname ?? "there",
                eventTitle: String(event.title),
                eventDate: eventDateFormatted,
                eventLocation,
                ticketCode: "", // not needed — ticketUrl is the source of truth
                isFree,
                ticketPrice: isFree
                  ? undefined
                  : `₦${(price as number).toLocaleString("en-NG")}`,
                whatsappGroupLink: event.whatsappGroupLink as
                  | string
                  | undefined,
              }).catch((err) =>
                console.error("[register-guest] Reminder email failed:", err),
              );
            } catch (err) {
              console.error(
                "[register-guest] Reminder email lookup failed:",
                err,
              );
            }
          })();

          return NextResponse.json(
            {
              alreadyRegistered: true,
              message:
                "Looks like you already have an account and a ticket for this event. We've sent the details to your email.",
            },
            { status: 200 },
          );
        }

        // ── Branch C: account exists, not yet registered for this event —
        // proceed as a guest registration, but flag it for later merge. ────
        matchedUserId = matchedUserDataId;
      }
    }

    // ── 8. Guard: existing GUEST registration (unchanged bypass logic) ───────
    const existingGuest = await Collections.guestEventRegistrations(db).findOne(
      {
        email: emailLower,
        eventId: eventObjId,
        status: { $ne: "cancelled" },
      },
      {
        projection: { _id: 1, verifiedAt: 1, inviteCode: 1, guestProfileId: 1 },
      },
    );

    if (existingGuest) {
      // Defensive backfill — in case this record predates the GuestProfile
      // migration and the backfill script hasn't run yet in this environment.
      if (!existingGuest.guestProfileId) {
        const profile = await findOrCreateGuestProfile(db, {
          email: emailLower,
          firstname: firstName!.trim(),
          lastname: lastName!.trim(),
          ...(phone && { phone }),
        });
        await Collections.guestEventRegistrations(db).updateOne(
          { _id: existingGuest._id },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { $set: { guestProfileId: profile._id as any, updatedAt: now } },
        );
      }

      if (existingGuest.verifiedAt) {
        if (Array.isArray(selectedSkills) && selectedSkills.length > 0) {
          await Collections.guestEventRegistrations(db).updateOne(
            { _id: existingGuest._id },
            { $set: { selectedSkills, updatedAt: now } },
          );
        }
        return NextResponse.json(
          {
            registrationId: existingGuest._id!.toString(),
            inviteCode: String(existingGuest.inviteCode),
          },
          { status: 200 },
        );
      }

      // Stale pending record (legacy, pre-bypass) — verify it in-place
      await Collections.guestEventRegistrations(db).updateOne(
        { _id: existingGuest._id },
        {
          $set: {
            verifiedAt: now,
            updatedAt: now,
            ...(Array.isArray(selectedSkills) &&
              selectedSkills.length > 0 && { selectedSkills }),
          },
          $unset: { emailVerificationCode: "", emailVerificationExpires: "" },
        },
      );

      return NextResponse.json(
        {
          registrationId: existingGuest._id!.toString(),
          inviteCode: String(existingGuest.inviteCode),
        },
        { status: 200 },
      );
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

    // ── 10. Ticket-tier capacity check (account + guest combined) ────────────
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

    // ── 12. Generate unique inviteCode (up to 5 attempts) ─────────────────────
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

    // ── 13. NEW — find-or-create GuestProfile ─────────────────────────────────
    const guestProfile = await findOrCreateGuestProfile(db, {
      email: emailLower,
      firstname: firstName!.trim(),
      lastname: lastName!.trim(),
      ...(phone && { phone }),
    });

    // ── 14. Save guest record — verifiedAt set immediately (no OTP) ───────────
    const guestDoc: Omit<IGuestEventRegistration, "_id"> = {
      fullName: {
        firstname: firstName!.trim(),
        lastname: lastName!.trim(),
      },
      email: emailLower,
      ...(phone && { phone }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      guestProfileId: guestProfile._id as any,
      ...(matchedUserId && { matchedUserId: matchedUserId as any }), // eslint-disable-line @typescript-eslint/no-explicit-any
      eventId: eventObjId,
      ticketTypeId: ticketObjId,
      inviteCode,
      referralCodeUsed: referralCodeUsed ?? null,
      emailVerificationCode: undefined,
      emailVerificationExpires: undefined,
      verifiedAt: now,
      status: "registered" as const,
      registeredAt: now,
      registrationType: "Guest" as const,
      ...(Array.isArray(selectedSkills) &&
        selectedSkills.length > 0 && { selectedSkills }),
      ...(attendanceType && event.format === "hybrid" && { attendanceType }),
      createdAt: now,
      updatedAt: now,
    };

    const { insertedId } = await Collections.guestEventRegistrations(
      db,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ).insertOne(guestDoc as any);

    // ── 15. NEW — send the appropriate confirmation email (fire-and-forget) ──
    // Previously NO email fired here at all (bypass gap) — fixed as part of
    // this rewrite since the matched-account branching needed this logic anyway.
    void (async () => {
      try {
        const eventDateFormatted = new Date(event.eventDate).toLocaleDateString(
          "en-NG",
          {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "Africa/Lagos",
          },
        );

        const loc = event.location as
          | Record<string, string | undefined>
          | undefined;
        const format = String(event.format ?? "");
        const isVirtual =
          format === "virtual" ||
          (format === "hybrid" && attendanceType === "virtual");

        const physicalLocation = loc
          ? [loc.venue, loc.city].filter(Boolean).join(", ") ||
            String(event.format)
          : String(event.format ?? "See event details");

        const eventLocation = isVirtual
          ? (event.virtualVenueLink as string) || "Virtual — meeting link below"
          : physicalLocation;

        const resolvedWhatsApp = (() => {
          if (format === "hybrid") {
            return attendanceType === "virtual"
              ? (event.whatsappGroupLinkVirtual as string) ||
                  (event.whatsappGroupLink as string) ||
                  undefined
              : (event.whatsappGroupLinkPhysical as string) ||
                  (event.whatsappGroupLink as string) ||
                  undefined;
          }
          return (event.whatsappGroupLink as string) || undefined;
        })();

        const price = ticketType.price as number | undefined;
        const isFree = !price || price === 0;
        const ticketPrice = isFree
          ? undefined
          : `₦${price.toLocaleString("en-NG")}`;

        if (matchedUserId) {
          // ── Branch C email: combined ticket + "you have an account" ──────
          await sendGuestConfirmationWithAccountEmail({
            to: emailLower,
            ticketId: insertedId.toString(),
            name: firstName!.trim(),
            eventTitle: String(event.title),
            eventDate: eventDateFormatted,
            eventLocation,
            ticketCode: inviteCode,
            isFree,
            ticketPrice,
            whatsappGroupLink: resolvedWhatsApp,
            registrationType: "Guest",
            forgotPasswordUrl: `${APP_URL}/auth/forgot-password?email=${encodeURIComponent(emailLower)}`,
          });
        } else {
          // ── Standard guest confirmation ───────────────────────────────────
          await sendGuestConfirmationEmail({
            to: emailLower,
            ticketId: insertedId.toString(),
            name: firstName!.trim(),
            eventTitle: String(event.title),
            eventDate: eventDateFormatted,
            eventLocation,
            ticketCode: inviteCode,
            isFree,
            ticketPrice,
            whatsappGroupLink: resolvedWhatsApp,
            registrationType: "Guest",
          });
        }
      } catch (emailErr) {
        console.error(
          "[register-guest] Confirmation email failed silently:",
          emailErr,
        );
      }
    })();

    // ── 16. Respond — client jumps straight to step 3 ─────────────────────────
    return NextResponse.json(
      {
        registrationId: insertedId.toString(),
        inviteCode,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
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
