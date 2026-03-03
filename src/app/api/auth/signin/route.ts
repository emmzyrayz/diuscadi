import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import {
  verifyPassword,
  signJWT,
  generateSecureToken,
  minutesFromNow,
  generateOTP,
} from "@/lib/auth";
import { ObjectId } from "mongodb";
import { sendVerificationEmail } from "@/lib/sendEmail";

const SESSION_DURATION_MINUTES = 60 * 24 * 7; // 7 days

// attempt 1 → 20s | 2 → 60s | 3 → 5min | 4 → 15min | 5+ → 30min
const COOLDOWN_SECONDS = [20, 60, 300, 900, 1800];

function getCooldownSeconds(attemptCount: number): number {
  return COOLDOWN_SECONDS[Math.min(attemptCount, COOLDOWN_SECONDS.length - 1)];
}

function isPhoneIdentifier(identifier: string): boolean {
  return /^\+?\d+$/.test(identifier.trim());
}

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        {
          error: "identifier (email or phone number) and password are required",
        },
        { status: 400 },
      );
    }

    const db = await getDb();
    const trimmed = identifier.trim();

    // ── Resolve vault by email or phone ───────────────────────────────────────
    let vault;

    if (isPhoneIdentifier(trimmed)) {
      const phoneNumber = parseInt(trimmed.replace(/^\+/, ""), 10);
      vault = await Collections.vault(db).findOne({
        "phone.phoneNumber": phoneNumber,
      });
    } else {
      vault = await Collections.vault(db).findOne({
        email: trimmed.toLowerCase(),
      });
    }

    if (!vault) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // ── Password check ────────────────────────────────────────────────────────
    const valid = await verifyPassword(password, vault.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // ── Unverified account ────────────────────────────────────────────────────
    if (!vault.isEmailVerified && !vault.isPhoneVerified) {
      const now = new Date();
      const attemptCount = vault.verificationResendCount ?? 0;
      const cooldownSecs = getCooldownSeconds(attemptCount);
      const lastAt = vault.verificationResendLastAt;

      // Enforce cooldown window
      if (lastAt) {
        const elapsedMs = now.getTime() - lastAt.getTime();
        const cooldownMs = cooldownSecs * 1000;
        if (elapsedMs < cooldownMs) {
          const waitSecs = Math.ceil((cooldownMs - elapsedMs) / 1000);
          return NextResponse.json(
            {
              error: `Please wait ${waitSecs}s before requesting a new code.`,
              verified: false,
              cooldownSeconds: waitSecs,
            },
            { status: 429 },
          );
        }
      }

      // Generate fresh codes
      const emailOTP = generateOTP();
      const emailToken = generateSecureToken();
      const phoneOTP = generateOTP();
      const expiry = minutesFromNow(15);
      const newAttemptCount = attemptCount + 1;
      const nextCooldown = getCooldownSeconds(newAttemptCount);

      await Collections.vault(db).updateOne(
        { _id: vault._id },
        {
          $set: {
            emailVerificationCode: emailOTP,
            emailVerificationExpires: expiry,
            emailVerificationToken: emailToken,
            emailVerificationTokenExpires: expiry,
            phoneVerificationCode: phoneOTP,
            phoneVerificationExpires: expiry,
            verificationResendCount: newAttemptCount,
            verificationResendLastAt: now,
            updatedAt: now,
          },
        },
      );

      console.log(`[MOCK EMAIL] Resend to: ${vault.email}`);
      console.log(`  OTP: ${emailOTP}`);
      console.log(
        `  Magic link: ${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${emailToken}&email=${encodeURIComponent(vault.email)}`,
      );
      console.log(
        `[MOCK SMS] +${vault.phone.countryCode}${vault.phone.phoneNumber}`,
      );
      console.log(`  OTP: ${phoneOTP}`);

      await sendVerificationEmail({
        to: vault.email,
        name: vault.email, // Vault doesn't store name — use email as fallback until you join UserData
        code: emailOTP,
        token: emailToken,
      });

      const redirectTo = `/auth/verify?email=${encodeURIComponent(vault.email)}&resent=true`;

      return NextResponse.json(
        {
          verified: false,
          redirectTo,
          cooldownSeconds: nextCooldown,
          message: "Verification codes resent. Check your email and phone.",
          ...(process.env.NODE_ENV === "development" && {
            _dev: { emailOTP, phoneOTP, emailToken },
          }),
        },
        { status: 403 },
      );
    }

    // ── Suspended ─────────────────────────────────────────────────────────────
    if (!vault.isAccountActive) {
      return NextResponse.json(
        { error: "Account is suspended." },
        { status: 403 },
      );
    }

    // ── Create session ────────────────────────────────────────────────────────
    const sessionId = new ObjectId();
    const token = generateSecureToken();
    const now = new Date();

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const userAgent = req.headers.get("user-agent") ?? "unknown";

    await Collections.sessions(db).insertOne({
      _id: sessionId,
      userId: vault._id!,
      vaultId: vault._id!,
      token,
      userAgent,
      ip,
      expiresAt: minutesFromNow(SESSION_DURATION_MINUTES),
      createdAt: now,
    });

    await Collections.vault(db).updateOne(
      { _id: vault._id },
      { $set: { lastLoginAt: now, updatedAt: now } },
    );

    const jwtToken = signJWT({
      vaultId: vault._id!.toString(),
      sessionId: sessionId.toString(),
      role: vault.role,
      tokenVersion: vault.tokenVersion,
    });

    return NextResponse.json({ token: jwtToken });
  } catch (err) {
    console.error("[signin]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
