import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import {
  normalizeEmail,
  resolveGuestProfileForRegistration,
  mintMigrationToken,
} from "@/lib/guestProfile";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/guest/migrate/resolve-conflicts
//
// Public — no platform auth.
// Called after verify-otp returns { conflicts } and the guest has picked
// the correct name via MigrateDiffModal. Does NOT require re-entering the
// OTP code — relies on migrationOtp.verifiedAt being recent as proof the
// OTP step already passed.
//
// Body: { registrationId: string, email: string, resolvedFirstName: string, resolvedLastName: string }
// ─────────────────────────────────────────────────────────────────────────────

const VERIFICATION_WINDOW_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { registrationId, email, resolvedFirstName, resolvedLastName } =
      body as {
        registrationId?: string;
        email?: string;
        resolvedFirstName?: string;
        resolvedLastName?: string;
      };

    if (
      !registrationId ||
      !email ||
      !resolvedFirstName?.trim() ||
      !resolvedLastName?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "registrationId, email, resolvedFirstName, and resolvedLastName are required",
        },
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

    // ── Proof of OTP verification — checked via timestamp, no re-entry ──────
    const verifiedAt = profile.migrationOtp?.verifiedAt;
    if (
      !verifiedAt ||
      now.getTime() - verifiedAt.getTime() >
        VERIFICATION_WINDOW_MINUTES * 60 * 1000
    ) {
      return NextResponse.json(
        {
          error:
            "Your verification has expired. Please request a new code and verify again.",
          verificationExpired: true,
        },
        { status: 401 },
      );
    }

    // ── Apply resolved canonical name to the profile ─────────────────────────
    await Collections.guestProfiles(db).updateOne(
      { _id: profile._id },
      {
        $set: {
          "fullName.firstname": resolvedFirstName.trim(),
          "fullName.lastname": resolvedLastName.trim(),
          updatedAt: now,
        },
      },
    );

    const { migrationUrl } = mintMigrationToken({
      guestProfileId: profile._id as ObjectId,
      guestRegistrationId: registration._id as ObjectId,
      email: emailLower,
      firstName: resolvedFirstName.trim(),
      lastName: resolvedLastName.trim(),
    });

    return NextResponse.json({ migrationUrl }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/guest/migrate/resolve-conflicts]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
