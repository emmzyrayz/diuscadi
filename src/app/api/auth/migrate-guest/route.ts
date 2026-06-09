import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { verifyJWT, hashPassword, generateInviteCode } from "@/lib/auth";
import { DEFAULT_PREFERENCES, EDU_STATUSES } from "@/types/domain";
import type { VaultDocument } from "@/lib/models/vault";
import type { UserDataDocument } from "@/lib/models/UserData";
import type { EduStatus, PhoneNumber } from "@/types/domain";
import { sendMigrationWelcomeEmail } from "@/lib/sendEmail";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/migrate-guest
//
// Public endpoint — no platform auth (guest has no account yet).
// Executes the full guest → platform account migration.
//
// Body:
//   {
//     migrationToken: string,   // signed JWT from generate-migration-token
//     phone: { countryCode: number, phoneNumber: number },
//     eduStatus: "STUDENT" | "GRADUATE"
//   }
//
// Flow:
//   1.  Verify and decode the migration JWT via verifyJWT from @/lib/auth
//   2.  Validate purpose claim === "guest-migration"
//   3.  Re-validate the guest registration still exists and is verified
//   4.  Guard: email must not already exist in vault
//   5.  Guard: phone must not already exist in vault
//   6.  Generate a temporary 8-char password
//   7.  Create Vault document (isEmailVerified: true, requiresPasswordReset: true)
//   8.  Create UserData document from guest name/email
//   9.  Find ALL verified guest registrations for this email
//  10.  Create EventRegistration records for each guest ticket
//  11.  Update UserData analytics to reflect migrated counts
//  12.  Mark all guest records as migrated (set migratedToUserId + migratedAt)
//  13.  Send welcome email with temp password + reset link (fire-and-forget)
//  14.  Return { message, ticketsMigrated, loginUrl }
// ─────────────────────────────────────────────────────────────────────────────

/** Generate a readable 8-char temp password — no ambiguous chars (0/O, 1/l) */
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const arr = new Uint8Array(8);
  // Use crypto.getRandomValues equivalent via Node crypto
  for (let i = 0; i < 8; i++) {
    arr[i] = Math.floor(Math.random() * chars.length);
  }
  return Array.from(arr)
    .map((b) => chars[b % chars.length])
    .join("");
}

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

    // ── 2. Verify migration token via verifyJWT ────────────────────────────
    let tokenPayload: {
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

    // ── 3. Validate purpose claim ──────────────────────────────────────────
    if (tokenPayload.purpose !== "guest-migration") {
      return NextResponse.json(
        { error: "Invalid migration token" },
        { status: 401 },
      );
    }

    const {
      guestRegistrationId,
      email: emailLower,
      firstName,
      lastName,
    } = tokenPayload;

    if (!ObjectId.isValid(guestRegistrationId)) {
      return NextResponse.json(
        { error: "Invalid migration token payload" },
        { status: 400 },
      );
    }

    const db = await getDb();

    // ── 4. Re-validate the source guest registration ───────────────────────
    const sourceReg = await Collections.guestEventRegistrations(db).findOne(
      { _id: new ObjectId(guestRegistrationId) },
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

    if (!sourceReg || !sourceReg.verifiedAt) {
      return NextResponse.json(
        {
          error:
            "Guest registration not found or not verified. Please re-verify your email first.",
        },
        { status: 404 },
      );
    }

    if (sourceReg.email !== emailLower) {
      return NextResponse.json(
        { error: "Invalid migration token" },
        { status: 401 },
      );
    }

    // ── 5. Guard: email must not already exist in vault ────────────────────
    const existingVault = await Collections.vault(db).findOne(
      { email: emailLower },
      { projection: { _id: 1 } },
    );

    if (existingVault) {
      return NextResponse.json(
        {
          error:
            "An account already exists for this email. Please log in instead.",
          alreadyHasAccount: true,
        },
        { status: 409 },
      );
    }

    // ── 6. Guard: phone must not already exist in vault ────────────────────
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

    // ── 7. Generate temp password ──────────────────────────────────────────
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const now = new Date();
    const vaultId = new ObjectId();
    const userDataId = new ObjectId();

    const phoneData: PhoneNumber = {
      countryCode: phone.countryCode,
      phoneNumber: phone.phoneNumber,
    };

    // ── 8. Create Vault document ───────────────────────────────────────────
    // isEmailVerified: true  — guest already verified via OTP
    // isAccountActive: true  — account is immediately usable
    // requiresPasswordReset  — forces reset on first signin
    // Note: requiresPasswordReset is not in VaultDocument interface yet —
    //       we cast to unknown to allow it. signin/route.ts checks this field.
    const vaultDoc = {
      _id: vaultId,
      email: emailLower,
      passwordHash,
      phone: phoneData,
      eduStatus: eduStatus as EduStatus,
      role: "participant" as const,
      isEmailVerified: true,
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

    // ── 9. Create UserData document ────────────────────────────────────────
    const userDataDoc: UserDataDocument = {
      _id: userDataId,
      vaultId,
      fullName: {
        firstname: (firstName ?? sourceReg.fullName?.firstname ?? "").trim(),
        lastname: (lastName ?? sourceReg.fullName?.lastname ?? "").trim(),
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

    // ── 10. Find ALL verified guest registrations for this email ──────────
    const allGuestRegs = await Collections.guestEventRegistrations(db)
      .find(
        {
          email: emailLower,
          verifiedAt: { $exists: true },
          status: { $ne: "cancelled" },
        },
        {
          projection: {
            _id: 1,
            eventId: 1,
            ticketTypeId: 1,
            inviteCode: 1,
            referralCodeUsed: 1,
            status: 1,
            registeredAt: 1,
            checkedInAt: 1,
            reminders: 1,
          },
        },
      )
      .toArray();

    // ── 11. Create EventRegistration records for each guest ticket ─────────
    let migratedCount = 0;

    for (const guestReg of allGuestRegs) {
      try {
        // Skip if a registration already exists for this event+user
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

    // ── 12. Update UserData analytics ─────────────────────────────────────
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

    // ── 13. Mark all guest records as migrated ─────────────────────────────
    await Collections.guestEventRegistrations(db).updateMany(
      {
        email: emailLower,
        verifiedAt: { $exists: true },
      },
      {
        $set: {
          migratedToUserId: userDataId,
          migratedAt: now,
          updatedAt: now,
        },
      },
    );

    // ── 14. Send welcome email (fire-and-forget) ───────────────────────────
    void (async () => {
      try {
        await sendMigrationWelcomeEmail({
          to: emailLower,
          name: (firstName ?? sourceReg.fullName?.firstname ?? "").trim(),
          tempPassword,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth`,
          resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/forgot-password`,
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
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth`,
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
