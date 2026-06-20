import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { generateOTP, generateSecureToken, minutesFromNow } from "@/lib/auth";
import { sendResetPasswordEmail } from "@/lib/sendEmail";

// Same backoff array as signin/route.ts's unverified-account branch —
// shared cooldown fields, see note below on the trade-off this implies.
const COOLDOWN_SECONDS = [20, 60, 300, 900, 1800];
function getCooldownSeconds(attemptCount: number): number {
  return COOLDOWN_SECONDS[Math.min(attemptCount, COOLDOWN_SECONDS.length - 1)];
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date();
    const vault = await Collections.vault(db).findOne({
      email: email.toLowerCase().trim(),
    });

    // Always return success to prevent email enumeration on NON-EXISTENT
    // emails. NOTE: existing emails that are currently rate-limited will
    // return a distinct 429 below — this is the same trade-off signin/route.ts
    // already accepts for its unverified-account cooldown, so this isn't a
    // new exposure, just a consistent one.
    if (!vault) {
      return NextResponse.json({
        message: "If that email exists, a reset code was sent.",
      });
    }

    // ── Cooldown check ────────────────────────────────────────────────────
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
            error: `Please wait ${waitSecs}s before requesting a new reset code.`,
            cooldownSeconds: waitSecs,
          },
          { status: 429 },
        );
      }
    }

    const resetCode = generateOTP();
    const resetToken = generateSecureToken();
    const expiry = minutesFromNow(15);
    const newAttemptCount = attemptCount + 1;

    await Collections.vault(db).updateOne(
      { _id: vault._id },
      {
        $set: {
          resetPasswordCode: resetCode,
          resetPasswordExpires: expiry,
          resetPasswordToken: resetToken,
          resetPasswordTokenExpires: expiry,
          verificationResendCount: newAttemptCount,
          verificationResendLastAt: now,
          updatedAt: now,
        },
      },
    );

    await sendResetPasswordEmail({
      to: email,
      name: vault?.email ?? vault.phone,
      code: resetCode,
      token: resetToken,
    });

    return NextResponse.json({
      message: "If that email exists, a reset code was sent.",
      cooldownSeconds: getCooldownSeconds(newAttemptCount),
    });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
