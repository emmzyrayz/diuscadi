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
const MAX_SESSIONS_PER_USER = 5; // cap across all devices

const COOLDOWN_SECONDS = [20, 60, 300, 900, 1800];
function getCooldownSeconds(attemptCount: number): number {
  return COOLDOWN_SECONDS[Math.min(attemptCount, COOLDOWN_SECONDS.length - 1)];
}

function isPhoneIdentifier(identifier: string): boolean {
  return /^\+?\d+$/.test(identifier.trim());
}

// ── IP extraction ─────────────────────────────────────────────────────────────
// x-forwarded-for is set by Vercel/Nginx with the real client IP.
// In local dev this will always be ::1 (IPv6 localhost) — that is correct
// and expected. The real IP will appear automatically in production.
function extractIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
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

    // ── Resolve vault ─────────────────────────────────────────────────────────
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

      await sendVerificationEmail({
        to: vault.email,
        name: vault.email,
        code: emailOTP,
        token: emailToken,
      });

      return NextResponse.json(
        {
          verified: false,
          redirectTo: `/auth/verify?email=${encodeURIComponent(vault.email)}&resent=true`,
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

    // ── Session upsert ────────────────────────────────────────────────────────
    // One session per device (userAgent). Same device re-login → update existing
    // session with fresh token + expiry. New device → insert, then prune if over cap.
    const now = new Date();
    const ip = extractIp(req);
    const userAgent = req.headers.get("user-agent") ?? "unknown";
    const expiresAt = minutesFromNow(SESSION_DURATION_MINUTES);
    const token = generateSecureToken();

    const existingSession = await Collections.sessions(db).findOne({
      vaultId: vault._id!,
      userAgent,
    });

    let sessionId: ObjectId;

    if (existingSession) {
      // Same device — refresh the existing session
      sessionId = existingSession._id as ObjectId;
      await Collections.sessions(db).updateOne(
        { _id: sessionId },
        { $set: { token, ip, expiresAt, lastUsedAt: now } },
      );
    } else {
      // New device — create a fresh session
      sessionId = new ObjectId();
      await Collections.sessions(db).insertOne({
        _id: sessionId,
        userId: vault._id!,
        vaultId: vault._id!,
        token,
        userAgent,
        ip,
        expiresAt,
        createdAt: now,
        lastUsedAt: now,
      });

      // Prune oldest sessions if user exceeds cap
      const sessionCount = await Collections.sessions(db).countDocuments({
        vaultId: vault._id!,
      });
      if (sessionCount > MAX_SESSIONS_PER_USER) {
        const oldest = await Collections.sessions(db)
          .find({ vaultId: vault._id! })
          .sort({ createdAt: 1 })
          .limit(sessionCount - MAX_SESSIONS_PER_USER)
          .toArray();
        const oldIds = oldest.map((s) => s._id as ObjectId);
        if (oldIds.length > 0) {
          await Collections.sessions(db).deleteMany({ _id: { $in: oldIds } });
        }
      }
    }

    // ── Update vault last login ───────────────────────────────────────────────
    await Collections.vault(db).updateOne(
      { _id: vault._id },
      { $set: { lastLoginAt: now, updatedAt: now } },
    );

    // ── Sign JWT with sessionId ───────────────────────────────────────────────
    const jwtToken = signJWT({
      vaultId: vault._id!.toString(),
      sessionId: sessionId.toString(),
      role: vault.role,
      tokenVersion: vault.tokenVersion,
    });

    // ── Return token + set httpOnly cookie ────────────────────────────────────
    const response = NextResponse.json({
      success: true,
      token: jwtToken,
      role: vault.role,
    });

    response.cookies.set("diuscadi_token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("[signin]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
