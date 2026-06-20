import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { verifyJWT, hashPassword, generateInviteCode } from "@/lib/auth";
import { getLinkedRegistrations } from "@/lib/guestProfile";
import { DEFAULT_PREFERENCES, EDU_STATUSES } from "@/types/domain";
import type { VaultDocument } from "@/lib/models/vault";
import type { UserDataDocument } from "@/lib/models/UserData";
import type { EduStatus, PhoneNumber } from "@/types/domain";
import { sendMigrationWelcomeEmail } from "@/lib/sendEmail";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/migrate-guest
//
// Public — no platform auth (guest has no account yet).
// Executes the cold-migrate account creation. Identity was already proven by
// the OTP step (request-otp → verify-otp / resolve-conflicts) that minted
// this token — this route trusts the token and does not re-verify OTP.
//
// Body:
//   {
//     migrationToken: string,
//     phone: { countryCode: number, phoneNumber: number },
//     eduStatus: "STUDENT" | "GRADUATE"
//   }
//
// CHANGED from the pre-GuestProfile version:
//   - Token now carries guestProfileId as the primary reference
//   - Linked tickets resolved via guestProfileId (getLinkedRegistrations),
//     not a raw email scan — correctly scoped even if two different people
//     happen to share an email typo across unrelated registrations
//   - migratedToUserId/migratedAt stamped on BOTH the GuestProfile (canonical
//     check) and every linked registration (audit trail), not just registrations
//   - "email already exists" no longer branches on requiresPasswordReset —
//     single response pointing to forgot-password, which now has its own
//     cooldown and works for both "temp password never arrived" and
//     "genuine separate account" cases
// ─────────────────────────────────────────────────────────────────────────────

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const arr = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    arr[i] = Math.floor(Math.random() * chars.length);
  }
  return Array.from(arr)
    .map((b) => chars[b % chars.length])
    .join("");
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { migrationToken, phone, eduStatus } = body as {
      migrationToken?: string;
      phone?: { countryCode: number; phoneNumber: number };
      eduStatus?: string;
    };

    // ── 1. Validate input ──────────────────────────────────────────────────
    if (!migrationToken) {
      return NextResponse.json(
        { error: "migrationToken is required" },
        { status: 400 },
      );
    }
    if (
      !phone ||
      typeof phone.countryCode !== "number" ||
      typeof phone.phoneNumber !== "number" ||
      phone.countryCode < 1 ||
      phone.phoneNumber < 1
    ) {
      return NextResponse.json(
        { error: "phone must be { countryCode: number, phoneNumber: number }" },
        { status: 400 },
      );
    }
    if (!eduStatus || !(EDU_STATUSES as string[]).includes(eduStatus)) {
      return NextResponse.json(
        { error: `eduStatus must be one of: ${EDU_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }

    // ── 2. Verify migration token ────────────────────────────────────────────
    let tokenPayload: {
      guestProfileId: string;
      guestRegistrationId: string;
      email: string;
      firstName: string;
      lastName: string;
      purpose: string;
      vaultId: string;
      sessionId: string;
      role: string;
      tokenVersion: number;
    };

    try {
      tokenPayload = verifyJWT(migrationToken) as typeof tokenPayload;
    } catch {
      return NextResponse.json(
        {
          error:
            "Migration link has expired or is invalid. Please request a new one from your ticket page.",
        },
        { status: 401 },
      );
    }

    if (tokenPayload.purpose !== "guest-migration") {
      return NextResponse.json(
        { error: "Invalid migration token" },
        { status: 401 },
      );
    }

    const {
      guestProfileId,
      guestRegistrationId,
      email: emailLower,
      firstName,
      lastName,
    } = tokenPayload;

    if (
      !ObjectId.isValid(guestProfileId) ||
      !ObjectId.isValid(guestRegistrationId)
    ) {
      return NextResponse.json(
        { error: "Invalid migration token payload" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const guestProfileObjId = new ObjectId(guestProfileId);

    // ── 3. Re-validate the GuestProfile (canonical identity check) ─────────
    const profile = await Collections.guestProfiles(db).findOne({
      _id: guestProfileObjId,
    });

    if (!profile || profile.email !== emailLower) {
      return NextResponse.json(
        { error: "Invalid migration token" },
        { status: 401 },
      );
    }

    if (profile.migratedToUserId) {
      return NextResponse.json(
        {
          error: "This guest record has already been migrated to an account.",
          alreadyMigrated: true,
        },
        { status: 409 },
      );
    }

    // ── 4. Sanity-check the originating registration still exists ──────────
    const sourceReg = await Collections.guestEventRegistrations(db).findOne(
      { _id: new ObjectId(guestRegistrationId) },
      { projection: { _id: 1, status: 1 } },
    );
    if (!sourceReg || sourceReg.status === "cancelled") {
      return NextResponse.json(
        { error: "The originating registration is no longer valid." },
        { status: 404 },
      );
    }

    // ── 5. Guard: email must not already exist in vault ─────────────────────
    // Single response now (no requiresPasswordReset branching) — forgot-password
    // handles both "temp password never arrived" and "genuine separate
    // account" cases identically, and now has its own cooldown.
    const existingVault = await Collections.vault(db).findOne(
      { email: emailLower },
      { projection: { _id: 1 } },
    );

    if (existingVault) {
      return NextResponse.json(
        {
          error:
            "An account already exists for this email. Please reset your password to access it.",
          existingAccount: true,
          forgotPasswordUrl: `${APP_URL}/auth/forgot-password?email=${encodeURIComponent(emailLower)}`,
        },
        { status: 409 },
      );
    }

    // ── 6. Guard: phone must not already exist in vault ─────────────────────
    const existingPhone = await Collections.vault(db).findOne(
      { "phone.phoneNumber": phone.phoneNumber },
      { projection: { _id: 1 } },
    );
    if (existingPhone) {
      return NextResponse.json(
        { error: "Phone number already registered to another account." },
        { status: 409 },
      );
    }

    // ── 7. Generate temp password ────────────────────────────────────────────
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const now = new Date();
    const vaultId = new ObjectId();
    const userDataId = new ObjectId();

    const phoneData: PhoneNumber = {
      countryCode: phone.countryCode,
      phoneNumber: phone.phoneNumber,
    };

    // ── 8. Create Vault document ─────────────────────────────────────────────
    const vaultDoc = {
      _id: vaultId,
      email: emailLower,
      passwordHash,
      phone: phoneData,
      eduStatus: eduStatus as EduStatus,
      role: "participant" as const,
      isEmailVerified: true, // OTP already proved this at the migrate step
      isPhoneVerified: false,
      isAccountActive: true,
      requiresPasswordReset: true,
      verificationResendCount: 0,
      tokenVersion: 0,
      userId: userDataId,
      createdAt: now,
      updatedAt: now,
    };

    await Collections.vault(db).insertOne(vaultDoc as unknown as VaultDocument);

    // ── 9. Create UserData document ──────────────────────────────────────────
    const userDataDoc: UserDataDocument = {
      _id: userDataId,
      vaultId,
      fullName: {
        firstname: (firstName ?? profile.fullName.firstname).trim(),
        lastname: (lastName ?? profile.fullName.lastname).trim(),
      },
      email: emailLower,
      phone: phoneData,
      role: "participant",
      eduStatus: eduStatus as EduStatus,
      hasAvatar: false,
      Institution: {
        verifiedSchoolEmail: false,
        gpaRecord: [],
        cgpa: null,
      },
      committeeMembership: null,
      skills: [],
      profileCompleted: false,
      membershipStatus: "pending",
      signupInviteCode: generateInviteCode(),
      analytics: {
        eventsRegistered: 0,
        eventsAttended: 0,
        lastActiveAt: now,
      },
      preferences: DEFAULT_PREFERENCES,
      createdAt: now,
      updatedAt: now,
    };

    await Collections.userData(db).insertOne(userDataDoc);

    // ── 10. Resolve all linked registrations via guestProfileId ─────────────
    // CHANGED: was a raw email scan; now scoped to this exact profile.
    const allGuestRegs = await getLinkedRegistrations(db, guestProfileObjId);

    // ── 11. Create EventRegistration records for each guest ticket ──────────
    let migratedCount = 0;

    for (const guestReg of allGuestRegs) {
      try {
        const existing = await Collections.eventRegistrations(db).findOne(
          { userId: userDataId, eventId: guestReg.eventId },
          { projection: { _id: 1 } },
        );
        if (existing) continue;

        await Collections.eventRegistrations(db).insertOne({
          userId: userDataId,
          eventId: guestReg.eventId,
          ticketTypeId: guestReg.ticketTypeId,
          inviteCode: guestReg.inviteCode,
          referralCodeUsed: guestReg.referralCodeUsed ?? null,
          status: guestReg.status as "registered" | "checked-in" | "cancelled",
          registeredAt: guestReg.registeredAt ?? now,
          ...(guestReg.checkedInAt && { checkedInAt: guestReg.checkedInAt }),
          ...(guestReg.reminders && { reminders: guestReg.reminders }),
          createdAt: now,
          updatedAt: now,
        });

        migratedCount++;
      } catch (ticketErr) {
        console.error(
          `[migrate-guest] Failed to migrate ticket ${guestReg._id}:`,
          ticketErr,
        );
      }
    }

    // ── 12. Update UserData analytics ─────────────────────────────────────────
    const checkedInCount = allGuestRegs.filter(
      (r) => r.status === "checked-in",
    ).length;

    await Collections.userData(db).updateOne(
      { _id: userDataId },
      {
        $set: {
          "analytics.eventsRegistered": migratedCount,
          "analytics.eventsAttended": checkedInCount,
          updatedAt: now,
        },
      },
    );

    // ── 13. Dual-stamp migration status ───────────────────────────────────────
    // On the GuestProfile (canonical check — what request-otp/verify-otp/
    // session-merge-check all read) AND on each registration (audit trail,
    // self-contained even if the profile doc is ever touched later).
    await Collections.guestProfiles(db).updateOne(
      { _id: guestProfileObjId },
      {
        $set: {
          migratedToUserId: userDataId,
          migratedAt: now,
          mergeStatus: "migrated",
          updatedAt: now,
        },
      },
    );

    await Collections.guestEventRegistrations(db).updateMany(
      { guestProfileId: guestProfileObjId },
      {
        $set: {
          migratedToUserId: userDataId,
          migratedAt: now,
          updatedAt: now,
        },
      },
    );

    // ── 14. Send welcome email (fire-and-forget) ────────────────────────────
    void (async () => {
      try {
        await sendMigrationWelcomeEmail({
          to: emailLower,
          name: (firstName ?? profile.fullName.firstname).trim(),
          tempPassword,
          loginUrl: `${APP_URL}/auth`,
          resetUrl: `${APP_URL}/auth/forgot-password`,
          eventsCount: migratedCount,
        });
      } catch (emailErr) {
        console.error("[migrate-guest] Welcome email failed:", emailErr);
      }
    })();

    return NextResponse.json(
      {
        message:
          "Account created successfully. Check your email for your temporary password.",
        ticketsMigrated: migratedCount,
        loginUrl: `${APP_URL}/auth`,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/auth/migrate-guest]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
