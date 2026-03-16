// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { sendWelcomeEmail } from "@/lib/sendEmail";
import { ObjectId } from "mongodb";

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper — builds a display name string from the structured fullName.
// ─────────────────────────────────────────────────────────────────────────────
function formatDisplayName(fullName: {
  firstname: string;
  secondname?: string;
  lastname: string;
}): string {
  return [fullName.firstname, fullName.secondname, fullName.lastname]
    .filter(Boolean)
    .join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Temporary shape for Institution while OTP fields are in flight.
// schoolEmailOTP and schoolEmailOTPExpires are transient — they exist only
// between "send OTP" and "verify OTP" and are $unset immediately after.
// They are NOT on InstitutionDocument because they are never persisted long-term.
// ─────────────────────────────────────────────────────────────────────────────
interface InstitutionWithOTP {
  schoolEmail?: string;
  verifiedSchoolEmail: boolean;
  schoolEmailOTP?: string;
  schoolEmailOTPExpires?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify  →  Email OTP verification
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, type } = body;

    if (type === "school") {
      return verifySchoolEmail(body);
    }

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
        name: formatDisplayName(userData.fullName),
        role: vault.role,
      }).catch((err) => console.error("[welcome email]", err));
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/verify?token=  →  Magic link verification
// ─────────────────────────────────────────────────────────────────────────────
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
        name: formatDisplayName(userData.fullName),
        role: vault.role,
      }).catch((err) => console.error("[welcome email]", err));
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

// ─────────────────────────────────────────────────────────────────────────────
// School email OTP verification (internal — called from POST when type==="school")
//
// Body: { type: "school", vaultId: string, code: string }
//
// Security notes:
//   - vaultId comes from the request body but is converted to ObjectId before
//     any DB query — string comparison against an ObjectId field would silently
//     never match, which is a security hole, not a safe fallback.
//   - User is identified by vaultId (from their session JWT on the client),
//     NOT by email — prevents verifying another user's school email.
//   - OTP fields are transient and $unset immediately after verification.
// ─────────────────────────────────────────────────────────────────────────────
async function verifySchoolEmail(body: {
  vaultId?: string;
  code?: string;
}): Promise<NextResponse> {
  try {
    const { vaultId, code } = body;

    if (!vaultId || !code) {
      return NextResponse.json(
        { error: "vaultId and code required for school email verification" },
        { status: 400 },
      );
    }

    // Convert string → ObjectId before querying.
    // ObjectId.isValid() guards against malformed strings that would throw.
    if (!ObjectId.isValid(vaultId)) {
      return NextResponse.json({ error: "Invalid vaultId" }, { status: 400 });
    }
    const vaultObjectId = new ObjectId(vaultId);

    const db = await getDb();
    const userData = await Collections.userData(db).findOne({
      vaultId: vaultObjectId,
    });

    if (!userData) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (!userData.Institution?.schoolEmail) {
      return NextResponse.json(
        { error: "No school email on file to verify" },
        { status: 400 },
      );
    }

    if (userData.Institution.verifiedSchoolEmail) {
      return NextResponse.json({ message: "School email already verified" });
    }

    // Cast Institution to the transient shape that includes OTP fields.
    // These fields are written by the send-school-otp route and are never
    // part of the permanent InstitutionDocument type.
    const institution = userData.Institution as InstitutionWithOTP;
    const storedOTP = institution.schoolEmailOTP;
    const otpExpires = institution.schoolEmailOTPExpires;

    if (!storedOTP || !otpExpires) {
      return NextResponse.json(
        {
          error:
            "No pending school email verification. Request a new code first.",
        },
        { status: 400 },
      );
    }

    if (storedOTP !== code || new Date(otpExpires) < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired school email OTP" },
        { status: 400 },
      );
    }

    // ── Verification passed ───────────────────────────────────────────────────
    await Collections.userData(db).updateOne(
      { vaultId: vaultObjectId },
      {
        $set: {
          "Institution.verifiedSchoolEmail": true,
          updatedAt: new Date(),
        },
        $unset: {
          "Institution.schoolEmailOTP": "",
          "Institution.schoolEmailOTPExpires": "",
        },
      },
    );

    return NextResponse.json({ message: "School email verified successfully" });
  } catch (err) {
    console.error("[verify school email]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
