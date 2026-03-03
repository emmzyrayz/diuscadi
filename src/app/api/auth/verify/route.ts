import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { sendWelcomeEmail } from "@/lib/sendEmail";

// ─── POST /api/auth/verify  →  OTP ───────────────────────────────────────────
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

    if (!vault) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (vault.isEmailVerified) {
      return NextResponse.json({ message: "Already verified" });
    }
    if (
      vault.emailVerificationCode !== code ||
      !vault.emailVerificationExpires ||
      vault.emailVerificationExpires < new Date()
    ) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 },
      );
    }

    await Collections.vault(db).updateOne(
      { _id: vault._id },
      {
        $set: {
          isEmailVerified: true,
          isAccountActive: true,
          updatedAt: new Date(),
        },
        $unset: {
          emailVerificationCode: "",
          emailVerificationExpires: "",
          emailVerificationToken: "",
          emailVerificationTokenExpires: "",
        },
      },
    );

    const userData = await Collections.userData(db).findOne({
      vaultId: vault._id,
    });
    if (userData) {
      await sendWelcomeEmail({
        to: vault.email,
        name: userData.fullName,
        role: vault.role,
      }).catch((err) => console.error("[welcome email]", err)); // non-blocking
    }

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("[verify POST]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── GET /api/auth/verify?token=  →  Magic link ───────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "token required" }, { status: 400 });
    }

    const db = await getDb();
    const vault = await Collections.vault(db).findOne({
      emailVerificationToken: token,
    });

    if (!vault) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    if (vault.isEmailVerified) {
      return NextResponse.json({ message: "Already verified" });
    }
    if (
      !vault.emailVerificationTokenExpires ||
      vault.emailVerificationTokenExpires < new Date()
    ) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    await Collections.vault(db).updateOne(
      { _id: vault._id },
      {
        $set: {
          isEmailVerified: true,
          isAccountActive: true,
          updatedAt: new Date(),
        },
        $unset: {
          emailVerificationCode: "",
          emailVerificationExpires: "",
          emailVerificationToken: "",
          emailVerificationTokenExpires: "",
        },
      },
    );

    const userData = await Collections.userData(db).findOne({
      vaultId: vault._id,
    });
    if (userData) {
      await sendWelcomeEmail({
        to: vault.email,
        name: userData.fullName,
        role: vault.role,
      }).catch((err) => console.error("[welcome email]", err)); // non-blocking
    }

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("[verify GET]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
