import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { generateOTP, minutesFromNow } from "@/lib/auth";
import { sendGuestVerificationEmail } from "@/lib/sendEmail";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/events/resend-guest-otp
//
// Public endpoint — no auth required.
// Resends the OTP for a pending (unverified) guest registration.
//
// Body: { registrationId: string, email: string }
//
// Guards:
//   - registrationId must be a valid ObjectId
//   - Record must exist and belong to the provided email (prevents enumeration)
//   - Record must NOT already be verified (verifiedAt absent)
//   - Rate limit: 60 seconds between resends, derived from emailVerificationExpires
//     (a fresh OTP sets expiry to now+15min; if now+15min - current expiry < 14min,
//      that means a code was issued less than 60s ago)
//
// On success:
//   - Generates a new 6-digit OTP
//   - Updates emailVerificationCode + emailVerificationExpires on the record
//   - Sends verification email (fire-and-forget)
//   - Returns { message, cooldownSeconds: 60 }
// ─────────────────────────────────────────────────────────────────────────────

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_VALIDITY_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { registrationId, email } = body as {
      registrationId?: string;
      email?: string;
    };

    // ── Validate input ─────────────────────────────────────────────────────
    if (!registrationId || !email) {
      return NextResponse.json(
        { error: "registrationId and email are required" },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(registrationId)) {
      return NextResponse.json(
        { error: "Invalid registrationId format" },
        { status: 400 },
      );
    }

    const emailLower = email.toLowerCase().trim();
    const db = await getDb();
    const regObjId = new ObjectId(registrationId);
    const now = new Date();

    // ── Look up the pending registration ──────────────────────────────────
    const guestReg = await Collections.guestEventRegistrations(db).findOne(
      { _id: regObjId },
      {
        projection: {
          _id: 1,
          email: 1,
          fullName: 1,
          eventId: 1,
          verifiedAt: 1,
          emailVerificationExpires: 1,
          status: 1,
        },
      },
    );

    // ── Not found ──────────────────────────────────────────────────────────
    if (!guestReg) {
      return NextResponse.json(
        {
          error:
            "Registration not found. It may have expired — please register again.",
        },
        { status: 404 },
      );
    }

    // ── Email mismatch guard (prevents OTP enumeration) ────────────────────
    if (guestReg.email !== emailLower) {
      return NextResponse.json(
        { error: "Registration not found." },
        { status: 404 },
      );
    }

    // ── Already verified ───────────────────────────────────────────────────
    if (guestReg.verifiedAt) {
      return NextResponse.json(
        {
          error:
            "This registration is already verified. Check your email for your ticket confirmation.",
        },
        { status: 409 },
      );
    }

    // ── Cancelled ─────────────────────────────────────────────────────────
    if (guestReg.status === "cancelled") {
      return NextResponse.json(
        { error: "This registration has been cancelled." },
        { status: 409 },
      );
    }

    // ── Rate limit check ───────────────────────────────────────────────────
    // A fresh OTP has expiry = now + 15 min.
    // If the current expiry is still more than (15min - 60s) = 14min away,
    // a code was issued less than 60 seconds ago → enforce cooldown.
    if (guestReg.emailVerificationExpires) {
      const expiresAt = new Date(guestReg.emailVerificationExpires);
      const issuedAt = new Date(
        expiresAt.getTime() - OTP_VALIDITY_MINUTES * 60 * 1000,
      );
      const secondsSinceIssued = (now.getTime() - issuedAt.getTime()) / 1000;

      if (secondsSinceIssued < RESEND_COOLDOWN_SECONDS) {
        const waitSeconds = Math.ceil(
          RESEND_COOLDOWN_SECONDS - secondsSinceIssued,
        );
        return NextResponse.json(
          {
            error: `Please wait ${waitSeconds} second${waitSeconds === 1 ? "" : "s"} before requesting a new code.`,
            cooldownSeconds: waitSeconds,
          },
          { status: 429 },
        );
      }
    }

    // ── Fetch event title for the email ───────────────────────────────────
    const event = await Collections.events(db).findOne(
      { _id: guestReg.eventId },
      { projection: { title: 1, slug: 1 } },
    );

    // ── Generate new OTP ──────────────────────────────────────────────────
    const newOtp = generateOTP();
    const newExpiry = minutesFromNow(OTP_VALIDITY_MINUTES);

    await Collections.guestEventRegistrations(db).updateOne(
      { _id: regObjId },
      {
        $set: {
          emailVerificationCode: newOtp,
          emailVerificationExpires: newExpiry,
          updatedAt: now,
        },
      },
    );

    // ── Send email (fire-and-forget) ───────────────────────────────────────
    void (async () => {
      try {
        await sendGuestVerificationEmail({
          to: emailLower,
          name: guestReg.fullName?.firstname ?? "Guest",
          code: newOtp,
          eventTitle: event ? String(event.title) : "the event",
          verifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/event-landing/${event?.slug ?? ""}/verify?email=${encodeURIComponent(emailLower)}&registrationId=${registrationId}`,
        });
      } catch (emailErr) {
        console.error("[resend-guest-otp] Email failed silently:", emailErr);
      }
    })();

    return NextResponse.json(
      {
        message:
          "A new verification code has been sent to your email. It expires in 15 minutes.",
        cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[POST /api/events/resend-guest-otp]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
