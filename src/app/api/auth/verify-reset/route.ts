import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { generateSecureToken, minutesFromNow } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json(
        { error: "email and code required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const vault = await Collections.vault(db).findOne({
      email: email.toLowerCase().trim(),
    });

    if (
      !vault ||
      vault.resetPasswordCode !== code ||
      !vault.resetPasswordExpires ||
      vault.resetPasswordExpires < new Date()
    ) {
      return NextResponse.json(
        { error: "Invalid or expired reset code" },
        { status: 400 },
      );
    }

    // Issue a short-lived reset token (10 min) — the OTP has been consumed
    const shortToken = generateSecureToken();
    const expiry = minutesFromNow(10);

    await Collections.vault(db).updateOne(
      { _id: vault._id },
      {
        $set: {
          resetPasswordToken: shortToken,
          resetPasswordTokenExpires: expiry,
          updatedAt: new Date(),
        },
        $unset: { resetPasswordCode: "", resetPasswordExpires: "" },
      },
    );

    return NextResponse.json({ resetToken: shortToken });
  } catch (err) {
    console.error("[verify-reset]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
