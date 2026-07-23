// src/app/api/events/register/route.ts
// POST /api/events/register
// Auth required. Registers the authenticated user for an event.
// Body: { eventId, ticketTypeId, referralCodeUsed? }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { generateInviteCode } from "@/lib/auth";
import { sendEventRegistrationEmail } from "@/lib/sendEmail";
import { getRegisteredCount } from "@/lib/services/capacityService";
import { processReferralChain } from "@/lib/services/pointsService";

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const {
      eventId,
      ticketTypeId,
      referralCodeUsed,
      attendanceType,
      selectedSkills,
    } = body;
    const resolvedAttendanceType = attendanceType as
      | "physical"
      | "virtual"
      | undefined;

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

    // Resolve userData
    const userData = await Collections.userData(db).findOne(
      { vaultId },
      { projection: { _id: 1, fullName: 1 } },
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
     if (event.registrationClosed === true) {
       return NextResponse.json(
         {
           error:
             "Registration for this event has been closed. Please contact " +
             (process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "info@diuscadi.org.ng") +
             " for assistance.",
           registrationClosed: true,
         },
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
    const totalRegistered = await getRegisteredCount(db, eventObjId);
    if (totalRegistered >= event.capacity) {
      return NextResponse.json(
        { error: "Event is fully booked" },
        { status: 400 },
      );
    }

    // Check ticket tier capacity
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

    // ── Validate referral code + resolve referrer ──────────────────────────
    // The referral code is another attendee's inviteCode for this specific
    // event. We validate it exists and resolve the referrer's userData so we
    // can credit their points after successful registration.
    let referrerUserDataId: ObjectId | null = null;

    if (referralCodeUsed) {
      const referrerReg = await Collections.eventRegistrations(db).findOne(
        { inviteCode: referralCodeUsed, eventId: eventObjId },
        { projection: { userId: 1 } },
      );
      if (!referrerReg) {
        return NextResponse.json(
          { error: "Invalid referral code" },
          { status: 400 },
        );
      }
      referrerUserDataId = referrerReg.userId as ObjectId;
    }

    // ── Resolve referral discount ──────────────────────────────────────────
    // If a valid referral code was supplied and the ticket has a price,
    // apply referralDiscountPercent from platformConfig to the ticket price.
    // The discounted price is stored on the registration for audit purposes.
    // NOTE: actual payment processing is out of scope for this route —
    // this field is used by the payment/checkout layer when it's built.
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
      // Store the discounted price if a referral was used — audit trail.
      ...(discountedPrice !== undefined && { discountedPrice }),
      status: "registered" as const,
      registeredAt: now,
      createdAt: now,
      updatedAt: now,
      ...(Array.isArray(selectedSkills) &&
        selectedSkills.length > 0 && {
          selectedSkills,
        }),
      ...(resolvedAttendanceType &&
        event.format === "hybrid" && {
          attendanceType: resolvedAttendanceType,
        }),
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

    // ── Fire referral event reward (fire-and-forget) ───────────────────────
    // If this registration used a referral code, credit the referrer's
    // points chain for "referral_event_reg". We use processReferralChain
    // with the registering user's ID — the chain walks from this user's
    // referredBy field upward, NOT from the event referrer, because event
    // referrals and signup referrals are tracked separately.
    //
    // Additionally, if the referrer exists (referrerUserDataId), we credit
    // them directly as a depth-1 event referral reward.
    if (referralCodeUsed && referrerUserDataId) {
      void (async () => {
        try {
          const { creditReferralPoints } =
            await import("@/lib/services/pointsService");

          // Read the depth-1 event referral bonus from config.
          // Reuses referralBonusPoints (same pool as signup rewards).
          const bonusConfig = await Collections.platformConfig(db).findOne(
            { key: "referralBonusPoints" },
            { projection: { value: 1 } },
          );
          const bonusAmount = (bonusConfig?.value as number | undefined) ?? 50;

          await creditReferralPoints({
            db,
            recipientUserId: referrerUserDataId,
            refereeUserId: userDataId,
            depth: 1,
            amount: bonusAmount,
            source: "referral_event_reg",
            eventDate: now,
          });
        } catch (err) {
          console.error(
            "[register] Referral event reward failed (non-fatal):",
            err,
          );
        }
      })();
    }

    // ── Send confirmation email (fire-and-forget) ────────────────────────────
    void (async () => {
      try {
        const vault = await Collections.vault(db).findOne(
          { _id: vaultId },
          { projection: { email: 1 } },
        );
        if (!vault?.email) return;

        const fn = userData.fullName as
          | { firstname?: string; secondname?: string; lastname?: string }
          | undefined;
        const displayName = fn
          ? [fn.firstname, fn.lastname].filter(Boolean).join(" ") || "there"
          : "there";

        const eventDateObj = new Date(event.eventDate as Date);
        const formattedDate =
          eventDateObj.toLocaleDateString("en-NG", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "Africa/Lagos",
          }) +
          " • " +
          eventDateObj.toLocaleTimeString("en-NG", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Africa/Lagos",
          });

        const loc = event.location as Record<string, string> | undefined;
        const format = String(event.format ?? "");
        const isVirtual =
          format === "virtual" ||
          (format === "hybrid" && resolvedAttendanceType === "virtual");

        const physicalLocation = loc
          ? [loc.venue, loc.city].filter(Boolean).join(", ") ||
            String(event.format)
          : String(event.format ?? "See event details");

        const eventLocation = isVirtual
          ? (event.virtualVenueLink as string) || "Virtual — meeting link below"
          : physicalLocation;

        const resolvedWhatsApp = (() => {
          if (format === "hybrid") {
            return resolvedAttendanceType === "virtual"
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

        await sendEventRegistrationEmail({
          to: vault.email as string,
          ticketId: insertedId.toString(),
          name: displayName,
          eventTitle: String(event.title),
          eventDate: formattedDate,
          eventLocation,
          ticketCode: inviteCode,
          isFree,
          ticketPrice,
          whatsappGroupLink: resolvedWhatsApp,
        });
      } catch (emailErr) {
        console.error("[register] Confirmation email failed:", emailErr);
      }
    })();

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
          ...(discountedPrice !== undefined && { discountedPrice }),
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
