import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import {
  hashPassword,
  generateOTP,
  generateSecureToken,
  generateInviteCode,
  minutesFromNow,
} from "@/lib/auth";
import { ObjectId } from "mongodb";
import {
  EduStatus,
  Committee,
  Skill,
  PhoneNumber,
  EDU_STATUSES,
  COMMITTEES,
  SKILLS,
} from "@/types/domain";
import { VaultDocument } from "@/lib/models/vault";
import { UserDataDocument } from "@/lib/models/UserData";
import { sendVerificationEmail } from "@/lib/sendEmail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      eduStatus,
      phone, // { countryCode: number, phoneNumber: number } — required
      avatar,
      schoolEmail, // optional
      committee, // optional
      skills, // optional
    } = body;

    // ── Validate required fields ──────────────────────────────────────────────
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !eduStatus ||
      !phone
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: firstName, lastName, email, password, eduStatus, phone",
        },
        { status: 400 },
      );
    }

    // ── Validate phone shape ──────────────────────────────────────────────────
    if (
      typeof phone.countryCode !== "number" ||
      typeof phone.phoneNumber !== "number" ||
      phone.countryCode < 1 ||
      phone.phoneNumber < 1
    ) {
      return NextResponse.json(
        { error: "phone must be { countryCode: number, phoneNumber: number }" },
        { status: 400 },
      );
    }

    // ── Validate eduStatus ────────────────────────────────────────────────────
    if (!EDU_STATUSES.includes(eduStatus)) {
      return NextResponse.json(
        { error: `eduStatus must be one of: ${EDU_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }

    // ── Validate optional committee ───────────────────────────────────────────
    if (committee != null && !COMMITTEES.includes(committee)) {
      return NextResponse.json(
        { error: `committee must be one of: ${COMMITTEES.join(", ")}` },
        { status: 400 },
      );
    }

    // ── Validate optional skills ──────────────────────────────────────────────
    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return NextResponse.json(
          { error: "skills must be an array" },
          { status: 400 },
        );
      }
      const invalid = (skills as string[]).filter(
        (s) => !SKILLS.includes(s as Skill),
      );
      if (invalid.length > 0) {
        return NextResponse.json(
          {
            error: `Invalid skills: ${invalid.join(", ")}. Must be from: ${SKILLS.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    const emailLower = email.toLowerCase().trim();
    const schoolEmailLower = schoolEmail?.toLowerCase().trim() ?? undefined;
    const db = await getDb();

    // ── Check duplicate email ─────────────────────────────────────────────────
    const existingEmail = await Collections.vault(db).findOne({
      email: emailLower,
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    // ── Check duplicate phone ─────────────────────────────────────────────────
    const existingPhone = await Collections.vault(db).findOne({
      "phone.phoneNumber": phone.phoneNumber,
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: "Phone number already registered" },
        { status: 409 },
      );
    }

    // ── Check duplicate school email ──────────────────────────────────────────
    if (schoolEmailLower) {
      const existingSchoolEmail = await Collections.userData(db).findOne({
        schoolEmail: schoolEmailLower,
      });
      if (existingSchoolEmail) {
        return NextResponse.json(
          { error: "School email already registered" },
          { status: 409 },
        );
      }
    }

    // ── Prepare IDs + tokens ──────────────────────────────────────────────────
    const passwordHash = await hashPassword(password);
    const expiry = minutesFromNow(15);
    const now = new Date();
    const vaultId = new ObjectId();
    const userDataId = new ObjectId();

    // Email OTP + magic link
    const emailOTP = generateOTP();
    const emailToken = generateSecureToken();

    // Phone OTP (SMS — mocked until CAC/provider is set up)
    const phoneOTP = generateOTP();

    const defaultRole = "participant" as const;
    const phoneData: PhoneNumber = {
      countryCode: phone.countryCode,
      phoneNumber: phone.phoneNumber,
    };

    // ── Create Vault document ─────────────────────────────────────────────────
    const vaultDoc: VaultDocument = {
      _id: vaultId,
      email: emailLower,
      passwordHash,
      phone: phoneData,
      eduStatus: eduStatus as EduStatus,
      role: defaultRole,
      isEmailVerified: false,
      isPhoneVerified: false,
      isAccountActive: false,
      emailVerificationCode: emailOTP,
      emailVerificationExpires: expiry,
      emailVerificationToken: emailToken,
      emailVerificationTokenExpires: expiry,
      phoneVerificationCode: phoneOTP,
      phoneVerificationExpires: expiry,
      verificationResendCount: 0,
      tokenVersion: 0,
      userId: userDataId,
      createdAt: now,
      updatedAt: now,
    };

    await Collections.vault(db).insertOne(vaultDoc);

    // ── Create UserData document ──────────────────────────────────────────────
    const userDataDoc: UserDataDocument = {
      _id: userDataId,
      vaultId,
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      email: emailLower,
      phone: phoneData, // mirrored from Vault
      schoolEmail: schoolEmailLower,
      role: defaultRole, // mirrored from Vault
      eduStatus: eduStatus as EduStatus,
      avatar: avatar ?? undefined,
      committee: (committee as Committee) ?? null,
      skills: (skills as Skill[]) ?? [],
      profileCompleted: false,
      membershipStatus: "pending",
      signupInviteCode: generateInviteCode(),
      analytics: {
        eventsRegistered: 0,
        eventsAttended: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    await Collections.userData(db).insertOne(userDataDoc);

    // ── Email OTP ────────────────────────────────────────────────────────
    await sendVerificationEmail({
      to: emailLower,
      name: `${firstName.trim()} ${lastName.trim()}`,
      code: emailOTP,
      token: emailToken,
    });

    // ── Mock SMS OTP ──────────────────────────────────────────────────────────
    // TODO: replace with real SMS provider (Twilio, Termii, etc.) once CAC is ready
    console.log(`[MOCK SMS] To: +${phone.countryCode}${phone.phoneNumber}`);
    console.log(`  Phone OTP: ${phoneOTP}`);

    return NextResponse.json(
      {
        message:
          "Account created. Verification codes sent to your email and phone.",
        // In dev, expose which channels were used — remove in production
        ...(process.env.NODE_ENV === "development" && {
          _dev: { emailOTP, phoneOTP, emailToken },
        }),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
