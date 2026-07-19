// src/app/api/auth/migrate-guest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb, getMongoClient } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { verifyJWT, hashPassword, generateInviteCode } from "@/lib/auth";
import { getLinkedRegistrations } from "@/lib/guestProfile";
import { DEFAULT_PREFERENCES, EDU_STATUSES } from "@/types/domain";
import type { VaultDocument } from "@/lib/models/vault";
import type { UserDataDocument } from "@/lib/models/UserData";
import type { EduStatus, PhoneNumber } from "@/types/domain";
import { sendMigrationWelcomeEmail } from "@/lib/sendEmail";
import { processReferralChain } from "@/lib/services/pointsService";

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
// IMPORTANT: steps 9-14 (vault/userData/eventRegistrations creation + the
// migratedToUserId stamping on guestProfiles/guestEventRegistrations) run
// inside a single Mongo transaction. These MUST commit together — a partial
// commit leaves a real seat counted on both the "account" and "guest" sides
// of capacity math (see /api/events/register-guest's capacity check), and
// since step 5 blocks re-migration once the vault exists, a partial failure
// here is otherwise unrecoverable without a manual DB fix.
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

    // ── 3. Re-validate the GuestProfile ─────────────────────────────────────
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

    // ── 7. Resolve referrer from the guest registration ────────────────────
    let referredBy: string | undefined;
    const sourceRegFull = await Collections.guestEventRegistrations(db).findOne(
      { _id: new ObjectId(guestRegistrationId) },
      { projection: { referralCodeUsed: 1 } },
    );
    if (sourceRegFull?.referralCodeUsed) {
      const eventReferrer = await Collections.eventRegistrations(db).findOne(
        { inviteCode: sourceRegFull.referralCodeUsed },
        { projection: { userId: 1 } },
      );
      if (eventReferrer?.userId) {
        const referrerData = await Collections.userData(db).findOne(
          { _id: eventReferrer.userId },
          { projection: { signupInviteCode: 1 } },
        );
        if (referrerData?.signupInviteCode) {
          referredBy = referrerData.signupInviteCode;
        }
      }
    }

    // ── 8. Generate temp password ────────────────────────────────────────────
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const now = new Date();
    const vaultId = new ObjectId();
    const userDataId = new ObjectId();

    const phoneData: PhoneNumber = {
      countryCode: phone.countryCode,
      phoneNumber: phone.phoneNumber,
    };

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

    // ── 9-14. Atomic migration ────────────────────────────────────────────────
    const mongoClient = await getMongoClient();
    const session = mongoClient.startSession();

    let migratedCount = 0;
    let checkedInCount = 0;

    try {
      await session.withTransaction(async () => {
        await Collections.vault(db).insertOne(
          vaultDoc as unknown as VaultDocument,
          { session },
        );

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
          ...(referredBy && { referredBy }),
          points: {
            current: 0,
            lifetime: 0,
          },
          referralMeta: {
            directCount: 0,
            indirectCount: 0,
            totalEarned: 0,
            treeDepthReached: 0,
          },
          analytics: {
            eventsRegistered: 0,
            eventsAttended: 0,
            lastActiveAt: now,
          },
          preferences: DEFAULT_PREFERENCES,
          createdAt: now,
          updatedAt: now,
        };

        await Collections.userData(db).insertOne(userDataDoc, { session });

        // NOTE: getLinkedRegistrations does its own read — if it doesn't
        // accept a session, it reads outside the transaction's snapshot.
        // That's fine here since it's just resolving which docs to touch,
        // not itself a write that needs atomicity with the rest.
        const allGuestRegs = await getLinkedRegistrations(
          db,
          guestProfileObjId,
        );

        for (const guestReg of allGuestRegs) {
          const existing = await Collections.eventRegistrations(db).findOne(
            { userId: userDataId, eventId: guestReg.eventId },
            { projection: { _id: 1 }, session },
          );
          if (existing) continue;

          await Collections.eventRegistrations(db).insertOne(
            {
              userId: userDataId,
              eventId: guestReg.eventId,
              ticketTypeId: guestReg.ticketTypeId,
              inviteCode: guestReg.inviteCode,
              referralCodeUsed: guestReg.referralCodeUsed ?? null,
              status: guestReg.status as
                | "registered"
                | "checked-in"
                | "cancelled",
              registeredAt: guestReg.registeredAt ?? now,
              ...(guestReg.checkedInAt && {
                checkedInAt: guestReg.checkedInAt,
              }),
              ...(guestReg.reminders && { reminders: guestReg.reminders }),
              createdAt: now,
              updatedAt: now,
            },
            { session },
          );

          migratedCount++;
        }

        checkedInCount = allGuestRegs.filter(
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
          { session },
        );

        // Dual-stamp migration status — committed in the SAME transaction
        // as the eventRegistrations inserts above. This pairing is what
        // prevents the double-count bug.
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
          { session },
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
          { session },
        );
      });
    } catch (txErr) {
      console.error(
        "[migrate-guest] Transaction failed, nothing committed:",
        txErr,
      );
      return NextResponse.json(
        {
          error:
            "Migration failed. Please try again — no partial account was created.",
        },
        { status: 500 },
      );
    } finally {
      await session.endSession();
    }

    // ── 15. Fire referral chain (fire-and-forget) ─────────────────────────────
    // Safe outside the transaction — this only affects points, not seat
    // counting, and must never block or roll back the migration itself.
    if (referredBy) {
      void processReferralChain(db, {
        newUserId: userDataId,
        source: "referral_signup",
        eventDate: now,
      });
    }

    // ── 16. Send welcome email (fire-and-forget) ────────────────────────────
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
