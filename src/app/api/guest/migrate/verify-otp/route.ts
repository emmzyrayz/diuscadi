import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import {
  normalizeEmail,
  resolveGuestProfileForRegistration,
  getLinkedRegistrations,
  detectNameConflicts,
  mintMigrationToken,
} from "@/lib/guestProfile";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/guest/migrate/verify-otp
//
// Public — no platform auth.
// Verifies the OTP sent by request-otp. On success:
//   - No name conflicts across linked registrations → mint the migration
//     JWT immediately, return { migrationUrl }
//   - Conflicts found → mark the profile as "OTP-verified" (timestamp) and
//     return { conflicts } WITHOUT minting a token. Frontend shows
//     MigrateDiffModal, then calls /api/guest/migrate/resolve-conflicts,
//     which re-uses the verified timestamp instead of asking for the code again.
//
// Body: { registrationId: string, email: string, code: string }
// ─────────────────────────────────────────────────────────────────────────────

const MAX_WRONG_ATTEMPTS = 5;
/** How long an OTP-verified-but-unresolved-conflict state stays valid */
const CONFLICT_RESOLUTION_WINDOW_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { registrationId, email, code } = body as {
      registrationId?: string;
      email?: string;
      code?: string;
    };

    if (!registrationId || !email || !code) {
      return NextResponse.json(
        { error: "registrationId, email, and code are required" },
        { status: 400 },
      );
    }
    if (!ObjectId.isValid(registrationId)) {
      return NextResponse.json(
        { error: "Invalid registrationId format" },
        { status: 400 },
      );
    }
    if (!/^\d{6}$/.test(code.trim())) {
      return NextResponse.json(
        { error: "Verification code must be a 6-digit number" },
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

    const { registration, profile } = resolved;

    if (profile.migratedToUserId) {
      return NextResponse.json(
        {
          error: "This guest record has already been migrated to an account.",
          alreadyMigrated: true,
        },
        { status: 409 },
      );
    }

    const otpState = profile.migrationOtp;

    if (!otpState?.code || !otpState.expiresAt) {
      return NextResponse.json(
        { error: "No verification code is pending. Please request a new one." },
        { status: 400 },
      );
    }

    if (otpState.attempts >= MAX_WRONG_ATTEMPTS) {
      return NextResponse.json(
        {
          error: "Too many incorrect attempts. Please request a new code.",
          tooManyAttempts: true,
        },
        { status: 429 },
      );
    }

    const expired = otpState.expiresAt < now;
    const mismatch = otpState.code !== code.trim();

    if (expired || mismatch) {
      if (mismatch && !expired) {
        await Collections.guestProfiles(db).updateOne(
          { _id: profile._id },
          { $inc: { "migrationOtp.attempts": 1 }, $set: { updatedAt: now } },
        );
      }
      return NextResponse.json(
        {
          error: expired
            ? "Verification code has expired. Please request a new one."
            : "Incorrect verification code. Please try again.",
        },
        { status: 400 },
      );
    }

    // ── Defensive: re-check vault doesn't exist (race condition window) ─────
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

    // ── Code is correct — clear OTP, check for name conflicts ───────────────
    const verifiedAt = now;
    await Collections.guestProfiles(db).updateOne(
      { _id: profile._id },
      {
        $set: {
          "migrationOtp.attempts": 0,
          "migrationOtp.verifiedAt": verifiedAt,
          updatedAt: now,
        },
        $unset: { "migrationOtp.code": "", "migrationOtp.expiresAt": "" },
      },
    );

    const linkedRegistrations = await getLinkedRegistrations(
      db,
      profile._id as ObjectId,
    );
    const conflicts = detectNameConflicts(linkedRegistrations);

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          conflicts,
          registrationId,
          email: emailLower,
          message:
            "We found differing details across your registrations. Please confirm which is correct.",
        },
        { status: 200 },
      );
    }

    // ── No conflicts — mint the migration token immediately ─────────────────
    const { migrationUrl } = mintMigrationToken({
      guestProfileId: profile._id as ObjectId,
      guestRegistrationId: registration._id as ObjectId,
      email: emailLower,
      firstName: profile.fullName.firstname,
      lastName: profile.fullName.lastname,
    });

    return NextResponse.json({ migrationUrl }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/guest/migrate/verify-otp]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
