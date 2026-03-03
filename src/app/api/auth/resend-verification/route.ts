import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { generateOTP, generateSecureToken, minutesFromNow } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/sendEmail";

const RESEND_COOLDOWN_MS = 60_000; // 1 minute between resends

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const db = await getDb();
    const vault = await Collections.vault(db).findOne({
      email: email.toLowerCase().trim(),
    });

    if (!vault) {
      // Don't leak whether email exists
      return NextResponse.json({
        message: "If that email exists, a code was sent.",
      });
    }
    if (vault.isEmailVerified) {
      return NextResponse.json({ message: "Already verified" });
    }

    // Rate limit: block if last expiry was set recently (within cooldown)
    if (
      vault.emailVerificationExpires &&
      vault.emailVerificationExpires.getTime() - 15 * 60 * 1000 >
        Date.now() - RESEND_COOLDOWN_MS
    ) {
      return NextResponse.json(
        { error: "Please wait before requesting another code" },
        { status: 429 },
      );
    }

    const code = generateOTP();
    const token = generateSecureToken();
    const expiry = minutesFromNow(15);

    await Collections.vault(db).updateOne(
      { _id: vault._id },
      {
        $set: {
          emailVerificationCode: code,
          emailVerificationExpires: expiry,
          emailVerificationToken: token,
          emailVerificationTokenExpires: expiry,
          updatedAt: new Date(),
        },
      },
    );

    console.log(`[MOCK EMAIL] Resend to: ${email}`);
    console.log(`  OTP: ${code}`);
    console.log(`  Token: ${token}`);

    await sendVerificationEmail({
      to: email,
      name: vault.email ?? vault.phone, // use fullName from UserData if you join, else fallback
      code: code,
      token: token,
    });

    return NextResponse.json({ message: "Verification code resent." });
  } catch (err) {
    console.error("[resend-verification]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
