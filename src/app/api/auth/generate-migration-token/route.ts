import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { signJWT } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/generate-migration-token
//
// Public endpoint — no platform auth required (guest has no account).
// Called from the RegistrationForm step 3 "Create Account" button.
//
// Body: { registrationId: string, email: string }
//
// Guards:
//   - registrationId must be a valid ObjectId
//   - Record must exist, belong to the email provided, and be verified
//   - Email must NOT already exist in the vault (already has an account)
//
// On success:
//   - Signs a short-lived JWT (24h) using signJWT from @/lib/auth
//     containing: { guestRegistrationId, email, firstName, lastName,
//                   purpose: "guest-migration" }
//   - Returns { migrationToken, expiresAt, migrationUrl }
//
// Security:
//   - Uses the same JWT_SECRET as the platform — no extra env var needed
//   - purpose: "guest-migration" claim prevents token reuse elsewhere
//   - 24h expiry forces timely migration
// ─────────────────────────────────────────────────────────────────────────────

// ── Define Custom Migration Token Payload Type ───────────────────────────
    // This allows you to retain strict autocompletion on your custom guest claims 
    // while keeping TS quiet about the standard JWTPayload structure.
    interface GuestMigrationClaims {
      vaultId: string;
      sessionId: string;
      role: "guest"; // Explicitly allowed here for this special token
      tokenVersion: number;
      guestRegistrationId: string;
      email: string;
      firstName: string;
      lastName: string;
      purpose: "guest-migration";
    }


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

    // ── Look up the guest registration ────────────────────────────────────
    const guestReg = await Collections.guestEventRegistrations(db).findOne(
      { _id: new ObjectId(registrationId) },
      {
        projection: {
          _id: 1,
          email: 1,
          fullName: 1,
          verifiedAt: 1,
          status: 1,
        },
      },
    );

    if (!guestReg) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 },
      );
    }

    // ── Email ownership check ──────────────────────────────────────────────
    if (guestReg.email !== emailLower) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 },
      );
    }

    // ── Must be verified ───────────────────────────────────────────────────
    if (!guestReg.verifiedAt) {
      return NextResponse.json(
        {
          error: "Please verify your email first before creating an account.",
        },
        { status: 400 },
      );
    }

    // ── Must not be cancelled ──────────────────────────────────────────────
    if (guestReg.status === "cancelled") {
      return NextResponse.json(
        { error: "This registration has been cancelled." },
        { status: 409 },
      );
    }

    // ── Check if email already has a platform account ──────────────────────
    const existingVault = await Collections.vault(db).findOne(
      { email: emailLower },
      { projection: { _id: 1 } },
    );

    if (existingVault) {
      return NextResponse.json(
        {
          error:
            "An account already exists for this email. Please log in to link your guest registrations.",
          alreadyHasAccount: true,
        },
        { status: 409 },
      );
    }

    // ── Sign migration token using platform signJWT ────────────────────────
    // We extend the standard JWTPayload shape with migration-specific fields.
    // signJWT uses JWT_SECRET — no extra env var needed.
    // The purpose claim prevents this token being used for auth endpoints.
    const tokenPayload: GuestMigrationClaims = {
      vaultId: "migration",
      sessionId: "migration",
      role: "guest",
      tokenVersion: 0,
      guestRegistrationId: registrationId,
      email: emailLower,
      firstName: guestReg.fullName?.firstname ?? "",
      lastName: guestReg.fullName?.lastname ?? "",
      purpose: "guest-migration",
    };

    // ── Sign migration token using platform signJWT ────────────────────────
    // We double-cast the payload via `unknown` to the target parameter type of signJWT.
    // This cleanly bypasses the 'role: "guest"' vs 'role: AccountRole' mismatch.
    const migrationToken = signJWT(
      tokenPayload as unknown as Parameters<typeof signJWT>[0],
      "24h",
    );

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return NextResponse.json(
      {
        migrationToken,
        expiresAt: expiresAt.toISOString(),
        migrationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/migrate/guest?token=${migrationToken}`,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[POST /api/auth/generate-migration-token]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
