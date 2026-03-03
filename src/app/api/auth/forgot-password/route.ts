import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { generateOTP, generateSecureToken, minutesFromNow } from "@/lib/auth";
import { sendResetPasswordEmail } from "@/lib/sendEmail";

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

    // Always return success to prevent email enumeration
    if (!vault) {
      return NextResponse.json({
        message: "If that email exists, a reset code was sent.",
      });
    }

    const resetCode = generateOTP();
    const resetToken = generateSecureToken();
    const expiry = minutesFromNow(15);

    await Collections.vault(db).updateOne(
      { _id: vault._id },
      {
        $set: {
          resetPasswordCode: resetCode,
          resetPasswordExpires: expiry,
          resetPasswordToken: resetToken,
          resetPasswordTokenExpires: expiry,
          updatedAt: new Date(),
        },
      },
    );

    console.log(`[MOCK EMAIL] Password reset for: ${email}`);
    console.log(`  OTP: ${resetCode}`);
    console.log(`  Token: ${resetToken}`);

    await sendResetPasswordEmail({
      to: email,
      name: vault?.email ?? vault.phone,
      code: resetCode,
      token: resetToken,
    });

    return NextResponse.json({
      message: "If that email exists, a reset code was sent.",
    });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
