// app/api/auth/send-school-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { generateOTP, minutesFromNow } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { sendSchoolVerificationEmail } from "@/lib/sendEmail";

// ─────────────────────────────────────────────────────────────────────────────
// Rate limit: a user may only request a new school OTP once every 2 minutes.
// Enforced by checking schoolEmailOTPExpires — if the existing expiry is still
// more than 13 minutes away (i.e. issued less than 2 minutes ago), reject.
// No external rate-limit store needed — the DB field is the source of truth.
// ─────────────────────────────────────────────────────────────────────────────
const OTP_VALIDITY_MINUTES = 15;
const RESEND_COOLDOWN_MINUTES = 2;

// ─────────────────────────────────────────────────────────────────────────────
// Basic school email domain heuristic.
// Rejects obviously non-institutional addresses (gmail, yahoo, outlook, etc.).
// Not exhaustive — the verifiedSchoolEmail flag is the real trust signal.
// ─────────────────────────────────────────────────────────────────────────────
const BLOCKED_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "protonmail.com",
  "zoho.com",
]);

function isLikelyInstitutionalEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return !BLOCKED_DOMAINS.has(domain);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/send-school-otp
//
// Body: { vaultId: string, schoolEmail: string }
//
// What this does:
//   1. Validates vaultId + schoolEmail shape
//   2. Rejects consumer email domains (gmail, yahoo, etc.)
//   3. Checks the school email isn't already taken by another user
//   4. Enforces a 2-minute resend cooldown
//   5. Generates OTP, writes it to Institution.schoolEmailOTP +
//      Institution.schoolEmailOTPExpires on the UserData doc
//   6. Sends the OTP to the school email address
//
// Security notes:
//   - vaultId must be converted to ObjectId before any query (string ≠ ObjectId)
//   - We write OTP fields to the *existing* Institution subdoc via dot-notation
//     $set — we never overwrite the whole Institution object, which would wipe
//     gpaRecord, verifiedSchoolEmail, and other existing fields.
//   - The OTP is sent to the *new* school email address being verified, not the
//     account's primary email — that is the verification mechanism.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vaultId, schoolEmail } = body;

    // ── Validate presence ─────────────────────────────────────────────────────
    if (!vaultId || !schoolEmail) {
      return NextResponse.json(
        { error: "vaultId and schoolEmail are required" },
        { status: 400 },
      );
    }

    if (typeof vaultId !== "string" || typeof schoolEmail !== "string") {
      return NextResponse.json(
        { error: "vaultId and schoolEmail must be strings" },
        { status: 400 },
      );
    }

    // ── Validate vaultId is a well-formed ObjectId ────────────────────────────
    if (!ObjectId.isValid(vaultId)) {
      return NextResponse.json({ error: "Invalid vaultId" }, { status: 400 });
    }
    const vaultObjectId = new ObjectId(vaultId);

    // ── Validate + normalise school email ─────────────────────────────────────
    const schoolEmailLower = schoolEmail.toLowerCase().trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(schoolEmailLower)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    if (!isLikelyInstitutionalEmail(schoolEmailLower)) {
      return NextResponse.json(
        {
          error:
            "Please use your institutional email address, not a personal email provider",
        },
        { status: 400 },
      );
    }

    const db = await getDb();

    // ── Look up the requesting user ───────────────────────────────────────────
    const userData = await Collections.userData(db).findOne({
      vaultId: vaultObjectId,
    });

    if (!userData) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // ── Guard: already verified with a school email ───────────────────────────
    // Once verified, a school email can only be changed via a dedicated
    // change-school-email flow (not yet built) — not by re-requesting an OTP.
    if (userData.Institution?.verifiedSchoolEmail) {
      return NextResponse.json(
        {
          error:
            "A school email is already verified on this account. " +
            "Use the change school email flow to update it.",
        },
        { status: 409 },
      );
    }

    // ── Guard: school email already taken by another user ─────────────────────
    const existingOwner = await Collections.userData(db).findOne(
      { "Institution.schoolEmail": schoolEmailLower },
      { projection: { _id: 1, vaultId: 1 } },
    );

    if (existingOwner && existingOwner.vaultId.toString() !== vaultId) {
      return NextResponse.json(
        { error: "This school email is already registered to another account" },
        { status: 409 },
      );
    }

    // ── Rate limit: enforce 2-minute resend cooldown ──────────────────────────
    // If an OTP was issued less than 2 minutes ago, its expiry will be more
    // than (OTP_VALIDITY_MINUTES - RESEND_COOLDOWN_MINUTES) minutes from now.
    const institution = userData.Institution as
      | (typeof userData.Institution & {
          schoolEmailOTPExpires?: string;
        })
      | undefined;

    if (institution?.schoolEmailOTPExpires) {
      const existingExpiry = new Date(institution.schoolEmailOTPExpires);
      const cooldownThreshold = minutesFromNow(
        OTP_VALIDITY_MINUTES - RESEND_COOLDOWN_MINUTES,
      );
      if (existingExpiry > cooldownThreshold) {
        return NextResponse.json(
          {
            error: `Please wait ${RESEND_COOLDOWN_MINUTES} minutes before requesting a new code`,
          },
          { status: 429 },
        );
      }
    }

    // ── Generate OTP ──────────────────────────────────────────────────────────
    const otp = generateOTP();
    const expires = minutesFromNow(OTP_VALIDITY_MINUTES);

    // ── Persist OTP + new school email via dot-notation $set ─────────────────
    // Dot-notation is critical here — using { Institution: { ... } } in $set
    // would overwrite the entire Institution subdoc, wiping gpaRecord, cgpa, etc.
    await Collections.userData(db).updateOne(
      { vaultId: vaultObjectId },
      {
        $set: {
          "Institution.schoolEmail": schoolEmailLower,
          "Institution.verifiedSchoolEmail": false,
          "Institution.schoolEmailOTP": otp,
          "Institution.schoolEmailOTPExpires": expires.toISOString(),
          updatedAt: new Date(),
        },
      },
    );

    // ── Send OTP to the school email address ──────────────────────────────────
    await sendSchoolVerificationEmail({
      to: schoolEmailLower,
      name: [userData.fullName.firstname, userData.fullName.lastname]
        .filter(Boolean)
        .join(" "),
      code: otp,
    });

    return NextResponse.json(
      {
        message: `Verification code sent to ${schoolEmailLower}. It expires in ${OTP_VALIDITY_MINUTES} minutes.`,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[send-school-otp]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}