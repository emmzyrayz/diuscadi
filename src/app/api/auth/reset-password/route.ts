import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { resetToken, newPassword } = await req.json();
    if (!resetToken || !newPassword) {
      return NextResponse.json(
        { error: "resetToken and newPassword required" },
        { status: 400 },
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const vault = await Collections.vault(db).findOne({
      resetPasswordToken: resetToken,
    });

    if (
      !vault ||
      !vault.resetPasswordTokenExpires ||
      vault.resetPasswordTokenExpires < new Date()
    ) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await Collections.vault(db).updateOne(
      { _id: vault._id },
      {
        $set: {
          passwordHash,
          tokenVersion: vault.tokenVersion + 1, // invalidate all existing JWTs
          updatedAt: new Date(),
        },
        $unset: {
          resetPasswordCode: "",
          resetPasswordExpires: "",
          resetPasswordToken: "",
          resetPasswordTokenExpires: "",
        },
      },
    );

    // Optionally: delete all sessions for this user to force re-login everywhere
    await Collections.sessions(db).deleteMany({ vaultId: vault._id });

    return NextResponse.json({
      message: "Password reset successfully. Please sign in again.",
    });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
