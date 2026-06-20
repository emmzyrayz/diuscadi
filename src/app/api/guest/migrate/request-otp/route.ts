import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { generateOTP, minutesFromNow } from "@/lib/auth";
import {
  normalizeEmail,
  resolveGuestProfileForRegistration,
} from "@/lib/guestProfile";
import { sendGuestMigrationOtpEmail } from "@/lib/sendEmail";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/guest/migrate/request-otp
//
// Public — no platform auth (guest has no account yet, by definition).
// Sends (or resends) the OTP that proves email ownership before a guest's
// registrations can be migrated into a new account. This is the ONLY place
// OTP exists in the guest system — registration itself is fully OTP-free.
//
// Body: { registrationId: string, email: string }
//
// Backoff: 1st send is always free. Each subsequent send requires waiting
// 10s, then 20s, 40s, 80s, 160s (doubling, capped at 300s/5min) since the
// last send. After 6 total sends (1 initial + 5 resends), locked out for
// 30 minutes, after which the counter resets and they can start again.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_COOLDOWN_SECONDS = 10;
const MAX_COOLDOWN_SECONDS = 300; // 5 min
const MAX_SENDS_BEFORE_LOCKOUT = 6; // 1 initial + 5 resends
const LOCKOUT_SECONDS = 1800; // 30 min
const OTP_VALIDITY_MINUTES = 15;

function requiredCooldownSeconds(resendCount: number): number {
  if (resendCount <= 0) return 0;
  return Math.min(
    BASE_COOLDOWN_SECONDS * 2 ** (resendCount - 1),
    MAX_COOLDOWN_SECONDS,
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { registrationId, email } = body as {
      registrationId?: string;
      email?: string;
    };

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

    const emailLower = normalizeEmail(email);
    const db = await getDb();
    const now = new Date();

    const resolved = await resolveGuestProfileForRegistration(
      db,
      new ObjectId(registrationId),
      emailLower,
    );

    if (!resolved.ok) {
      return NextResponse.json(
        { error: "Registration not found." },
        { status: 404 },
      );
    }

    const { profile } = resolved;

    // ── Already migrated — graceful, not a dead-end error ──────────────────
    if (profile.migratedToUserId) {
      return NextResponse.json(
        {
          error:
            "This guest record has already been migrated to an account. Try logging in instead.",
          alreadyMigrated: true,
        },
        { status: 409 },
      );
    }

    // ── Already has a matched real account — wrong flow entirely ───────────
    // (Cold-migrate is only for guests with NO existing account. If matched,
    // the warm-migrate login flow handles this automatically, or they can
    // reset their password directly.)
    if (profile.matchedUserId) {
      return NextResponse.json(
        {
          error:
            "An account already exists for this email. Please log in, or reset your password if you've forgotten it.",
          hasExistingAccount: true,
        },
        { status: 409 },
      );
    }

    // ── Defensive: re-check vault doesn't exist (race with some other path) ─
    const existingVault = await Collections.vault(db).findOne(
      { email: emailLower },
      { projection: { _id: 1 } },
    );
    if (existingVault) {
      return NextResponse.json(
        {
          error:
            "An account already exists for this email. Please log in, or reset your password if you've forgotten it.",
          hasExistingAccount: true,
        },
        { status: 409 },
      );
    }

    const otpState = profile.migrationOtp ?? { resendCount: 0, attempts: 0 };

    // ── Lockout check (hard cap reached) ────────────────────────────────────
    if (otpState.resendCount >= MAX_SENDS_BEFORE_LOCKOUT) {
      const lastSentAt = otpState.lastSentAt;
      if (
        lastSentAt &&
        now.getTime() - lastSentAt.getTime() < LOCKOUT_SECONDS * 1000
      ) {
        const waitSeconds = Math.ceil(
          LOCKOUT_SECONDS - (now.getTime() - lastSentAt.getTime()) / 1000,
        );
        return NextResponse.json(
          {
            error: `Too many attempts. Please try again in ${Math.ceil(waitSeconds / 60)} minutes.`,
            cooldownSeconds: waitSeconds,
            lockedOut: true,
          },
          { status: 429 },
        );
      }
      // Lockout window passed — reset and allow a fresh sequence
      otpState.resendCount = 0;
    }

    // ── Normal doubling-backoff check ───────────────────────────────────────
    const cooldown = requiredCooldownSeconds(otpState.resendCount);
    if (cooldown > 0 && otpState.lastSentAt) {
      const elapsed = (now.getTime() - otpState.lastSentAt.getTime()) / 1000;
      if (elapsed < cooldown) {
        const waitSeconds = Math.ceil(cooldown - elapsed);
        return NextResponse.json(
          {
            error: `Please wait ${waitSeconds}s before requesting a new code.`,
            cooldownSeconds: waitSeconds,
          },
          { status: 429 },
        );
      }
    }

    // ── Generate + store new OTP ────────────────────────────────────────────
    const code = generateOTP();
    const expiresAt = minutesFromNow(OTP_VALIDITY_MINUTES);
    const newResendCount = otpState.resendCount + 1;

    await Collections.guestProfiles(db).updateOne(
      { _id: profile._id },
      {
        $set: {
          "migrationOtp.code": code,
          "migrationOtp.expiresAt": expiresAt,
          "migrationOtp.resendCount": newResendCount,
          "migrationOtp.lastSentAt": now,
          "migrationOtp.attempts": 0, // reset wrong-attempt counter on new code
          updatedAt: now,
        },
      },
    );

    // ── Send email (fire-and-forget) ────────────────────────────────────────
    void sendGuestMigrationOtpEmail({
      to: emailLower,
      name: profile.fullName.firstname,
      code,
    }).catch((err) =>
      console.error("[guest/migrate/request-otp] Email failed:", err),
    );

    return NextResponse.json(
      {
        message: "A verification code has been sent to your email.",
        nextResendCooldownSeconds: requiredCooldownSeconds(newResendCount),
        expiresInSeconds: OTP_VALIDITY_MINUTES * 60,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[POST /api/guest/migrate/request-otp]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
