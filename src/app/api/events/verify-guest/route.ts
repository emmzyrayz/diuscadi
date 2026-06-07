import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { sendGuestConfirmationEmail } from "@/lib/sendEmail";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/events/verify-guest
//
// Public endpoint — no auth required.
// Step 2 of the guest checkout pipeline:
//   1. Validate registrationId (ObjectId) + code (6-digit string)
//   2. Look up the pending guest registration
//   3. Guard: reject if already verified
//   4. Validate OTP code matches AND has not expired
//   5. Mark verifiedAt, unset OTP fields (removes TTL target → record persists)
//   6. Fire-and-forget confirmation email with ticket code
//   7. Return { registration: { id, inviteCode, status, verifiedAt } }
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse body ────────────────────────────────────────────────────────
    const body = await req.json();
    const { registrationId, code } = body as {
      registrationId?: string;
      code?: string;
    };

    // ── 2. Required field validation ─────────────────────────────────────────
    if (!registrationId || !code) {
      return NextResponse.json(
        { error: "registrationId and code are required" },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(registrationId)) {
      return NextResponse.json(
        { error: "Invalid registrationId format" },
        { status: 400 },
      );
    }

    // OTP must be exactly 6 digits
    if (!/^\d{6}$/.test(code.trim())) {
      return NextResponse.json(
        { error: "Verification code must be a 6-digit number" },
        { status: 400 },
      );
    }

    // ── 3. Lookup pending guest registration ─────────────────────────────────
    const db = await getDb();
    const now = new Date();
    const regObjId = new ObjectId(registrationId);

    // We explicitly select emailVerificationCode (it has select:false in Mongoose
    // schema, but we're using the raw MongoDB driver here so it is always returned)
    const guestReg = await Collections.guestEventRegistrations(db).findOne(
      { _id: regObjId },
      {
        projection: {
          _id: 1,
          fullName: 1,
          email: 1,
          eventId: 1,
          ticketTypeId: 1,
          inviteCode: 1,
          status: 1,
          emailVerificationCode: 1,
          emailVerificationExpires: 1,
          verifiedAt: 1,
          registrationType: 1,
        },
      },
    );

    if (!guestReg) {
      return NextResponse.json(
        {
          error:
            "Registration not found. It may have expired — please register again.",
        },
        { status: 404 },
      );
    }

    // ── 4. Guard: already verified ───────────────────────────────────────────
    if (guestReg.verifiedAt) {
      return NextResponse.json(
        {
          message: "Your registration is already verified.",
          registration: {
            id: regObjId.toString(),
            inviteCode: guestReg.inviteCode,
            status: guestReg.status,
            verifiedAt: guestReg.verifiedAt.toISOString(),
          },
        },
        { status: 200 },
      );
    }

    // ── 5. Validate OTP ──────────────────────────────────────────────────────
    const otpMismatch = guestReg.emailVerificationCode !== code.trim();
    const otpExpired =
      !guestReg.emailVerificationExpires ||
      new Date(guestReg.emailVerificationExpires) < now;

    if (otpMismatch || otpExpired) {
      return NextResponse.json(
        {
          error: otpExpired
            ? "Verification code has expired. Please register again to receive a new code."
            : "Incorrect verification code. Please try again.",
        },
        { status: 400 },
      );
    }

    // ── 6. Mark verified + unset OTP fields ──────────────────────────────────
    // IMPORTANT: unsetting emailVerificationExpires removes the TTL index target,
    // so MongoDB will no longer auto-delete this document. The record is now permanent.
    await Collections.guestEventRegistrations(db).updateOne(
      { _id: regObjId },
      {
        $set: {
          verifiedAt: now,
          updatedAt: now,
        },
        $unset: {
          emailVerificationCode: "",
          emailVerificationExpires: "",
        },
      },
    );

    // ── 7. Fetch event + ticket for confirmation email ────────────────────────
    const [event, ticketType] = await Promise.all([
      Collections.events(db).findOne(
        { _id: guestReg.eventId },
        {
          projection: {
            title: 1,
            slug: 1,
            eventDate: 1,
            format: 1,
            location: 1,
            whatsappGroupLink: 1,
          },
        },
      ),
      Collections.ticketTypes(db).findOne(
        { _id: guestReg.ticketTypeId },
        { projection: { price: 1, currency: 1 } },
      ),
    ]);

    // ── 8. Fire-and-forget confirmation email ─────────────────────────────────
    void (async () => {
      try {
        if (!event) return;

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
        const eventLocation = loc
          ? [loc.venue, loc.city].filter(Boolean).join(", ") ||
            String(event.format)
          : String(event.format ?? "See event details");

        const price = ticketType?.price as number | undefined;
        const isFree = !price || price === 0;
        const ticketPrice = isFree
          ? undefined
          : `₦${price.toLocaleString("en-NG")}`;

        await sendGuestConfirmationEmail({
          to: guestReg.email,
          ticketId: regObjId.toString(),
          name: guestReg.fullName.firstname,
          eventTitle: String(event.title),
          eventDate: eventDateFormatted,
          eventLocation,
          ticketCode: guestReg.inviteCode,
          isFree,
          ticketPrice,
          whatsappGroupLink: (event.whatsappGroupLink as string) ?? undefined,
          registrationType: "Guest",
        });
      } catch (emailErr) {
        // Never surface email errors — registration is already complete
        console.error("[verify-guest] Confirmation email failed:", emailErr);
      }
    })();

    // ── 9. Respond ────────────────────────────────────────────────────────────
    return NextResponse.json(
      {
        message:
          "Email verified successfully. Your guest registration is now complete!",
        registration: {
          id: regObjId.toString(),
          inviteCode: guestReg.inviteCode,
          status: guestReg.status,
          verifiedAt: now.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[POST /api/events/verify-guest]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
