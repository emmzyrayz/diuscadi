// src/app/api/events/register-guest/route.ts
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
import { creditReferralPoints } from "@/lib/services/pointsService";
import type { IGuestEventRegistration } from "@/lib/models/GuestEventRegistration";
import { getRegisteredCount } from "@/lib/services/capacityService";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
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

    // ── 7. Resolve Vault account match + branch ──────────────────────────────
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
                ticketCode: "",
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

        matchedUserId = matchedUserDataId;
      }
    }

    // ── 8. Guard: existing GUEST registration ─────────────────────────────────
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

    // ── 9. Total event capacity check ─────────────────────────────────────────
    const totalRegistered = await getRegisteredCount(db, eventObjId);

    if (totalRegistered >= event.capacity) {
      return NextResponse.json(
        { error: "This event is fully booked" },
        { status: 400 },
      );
    }

    // ── 10. Ticket-tier capacity check ────────────────────────────────────────
    const tierRegistered = await getRegisteredCount(
      db,
      eventObjId,
      ticketObjId,
    );

    if (tierRegistered >= ticketType.maxQuantity) {
      return NextResponse.json(
        { error: "This ticket tier is sold out" },
        { status: 400 },
      );
    }

    // ── 11. Validate referral code + resolve referrer ─────────────────────────
    let referrerUserDataId: ObjectId | null = null;

    if (referralCodeUsed) {
      const [referrerAccount, referrerGuest] = await Promise.all([
        Collections.eventRegistrations(db).findOne(
          { inviteCode: referralCodeUsed, eventId: eventObjId },
          { projection: { _id: 1, userId: 1 } },
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

      // Only credit a registered account referrer (guests earn on migration).
      if (referrerAccount?.userId) {
        referrerUserDataId = referrerAccount.userId as ObjectId;
      }
    }

    // ── 12. Resolve referral discount ─────────────────────────────────────────
    let discountedPrice: number | undefined;

    if (referralCodeUsed && referrerUserDataId) {
      const basePrice = ticketType.price as number | undefined;
      if (basePrice && basePrice > 0) {
        const discountConfig = await Collections.platformConfig(db).findOne(
          { key: "referralDiscountPercent" },
          { projection: { value: 1 } },
        );
        const discountPct = (discountConfig?.value as number | undefined) ?? 10;
        discountedPrice = Math.round(basePrice * (1 - discountPct / 100));
      }
    }

    // ── 13. Generate unique inviteCode ────────────────────────────────────────
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

    // ── 14. Find-or-create GuestProfile ──────────────────────────────────────
    const guestProfile = await findOrCreateGuestProfile(db, {
      email: emailLower,
      firstname: firstName!.trim(),
      lastname: lastName!.trim(),
      ...(phone && { phone }),
    });

    // ── 15. Save guest record ─────────────────────────────────────────────────
    const guestDoc: Omit<IGuestEventRegistration, "_id"> = {
      fullName: {
        firstname: firstName!.trim(),
        lastname: lastName!.trim(),
      },
      email: emailLower,
      ...(phone && { phone }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      guestProfileId: guestProfile._id as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(matchedUserId && { matchedUserId: matchedUserId as any }),
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

    // ── 16. Fire referral event reward (fire-and-forget) ──────────────────────
    // Credit the referrer if a valid account referrer was found.
    if (referralCodeUsed && referrerUserDataId) {
      void (async () => {
        try {
          const bonusConfig = await Collections.platformConfig(db).findOne(
            { key: "referralBonusPoints" },
            { projection: { value: 1 } },
          );
          const bonusAmount = (bonusConfig?.value as number | undefined) ?? 50;

          // For guest registrations we credit the direct event referrer only
          // (depth 1). Full chain credits happen on account creation/migration.
          await creditReferralPoints({
            db,
            recipientUserId: referrerUserDataId,
            // Use the insertedId as a proxy for the referee — guest has no
            // userData._id yet; we store the guestEventRegistration _id here
            // and the idempotency guard still works correctly.
            refereeUserId: insertedId,
            depth: 1,
            amount: bonusAmount,
            source: "referral_event_reg",
            eventDate: now,
          });
        } catch (err) {
          console.error(
            "[register-guest] Referral event reward failed (non-fatal):",
            err,
          );
        }
      })();
    }

    // ── 17. Send confirmation email (fire-and-forget) ─────────────────────────
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
        const effectivePrice = discountedPrice ?? price;
        const isFree = !effectivePrice || effectivePrice === 0;
        const ticketPrice = isFree
          ? undefined
          : `₦${effectivePrice!.toLocaleString("en-NG")}`;

        if (matchedUserId) {
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

    return NextResponse.json(
      {
        registrationId: insertedId.toString(),
        inviteCode,
        ...(discountedPrice !== undefined && { discountedPrice }),
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
