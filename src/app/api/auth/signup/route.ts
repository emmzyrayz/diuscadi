// app/api/auth/signup/route.ts
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
  Skill,
  PhoneNumber,
  EDU_STATUSES,
  SKILLS,
  DEFAULT_PREFERENCES,
} from "@/types/domain";
import { VaultDocument } from "@/lib/models/vault";
import { UserDataDocument } from "@/lib/models/UserData";
import { sendVerificationEmail } from "@/lib/sendEmail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      secondName, // optional middle name
      lastName,
      email,
      password,
      eduStatus,
      phone, // { countryCode: number, phoneNumber: number } — required
      schoolEmail, // optional — stored inside Institution subdoc
      skills, // optional
      inviteCode, // optional — referral code from another member
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

    // ── Validate name strings ─────────────────────────────────────────────────
    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      (secondName !== undefined && typeof secondName !== "string")
    ) {
      return NextResponse.json(
        {
          error:
            "firstName, lastName, and secondName (if provided) must be strings",
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
    if (!(EDU_STATUSES as string[]).includes(eduStatus)) {
      return NextResponse.json(
        { error: `eduStatus must be one of: ${EDU_STATUSES.join(", ")}` },
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
        (s) => !(SKILLS as string[]).includes(s),
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
    // Path is now "Institution.schoolEmail" — schoolEmail moved into subdoc.
    if (schoolEmailLower) {
      const existingSchoolEmail = await Collections.userData(db).findOne({
        "Institution.schoolEmail": schoolEmailLower,
      });
      if (existingSchoolEmail) {
        return NextResponse.json(
          { error: "School email already registered" },
          { status: 409 },
        );
      }
    }

    // ── Resolve referrer from invite code ─────────────────────────────────────
    // If a valid inviteCode was provided, look up the referring member's _id.
    // A bad/expired code is silently ignored — we never block signup over it.
    let referredBy: ObjectId | undefined;
    if (inviteCode && typeof inviteCode === "string") {
      const referrer = await Collections.userData(db).findOne(
        { signupInviteCode: inviteCode.trim() },
        { projection: { _id: 1 } },
      );
      if (referrer) referredBy = referrer._id as ObjectId;
    }

    // ── Prepare IDs + tokens ──────────────────────────────────────────────────
    const passwordHash = await hashPassword(password);
    const expiry = minutesFromNow(15);
    const now = new Date();
    const vaultId = new ObjectId();
    const userDataId = new ObjectId();

    const emailOTP = generateOTP();
    const emailToken = generateSecureToken();
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

      // fullName is now a structured object — not a concatenated string
      fullName: {
        firstname: firstName.trim(),
        lastname: lastName.trim(),
        ...(secondName?.trim() && { secondname: secondName.trim() }),
      },

      email: emailLower,
      phone: phoneData,
      role: defaultRole,
      eduStatus: eduStatus as EduStatus,

      // Avatar: never accepted at signup — no upload pipeline has run yet.
      // Set hasAvatar: false explicitly so profile completion logic doesn't
      // need to null-check the avatar field.
      hasAvatar: false,

      // Institution: initialize a minimal skeleton so the subdoc always exists
      // for users who will later fill in academic details.
      // schoolEmail + verifiedSchoolEmail are set here if provided at signup.
      Institution: {
        ...(schoolEmailLower && {
          schoolEmail: schoolEmailLower,
        }),
        verifiedSchoolEmail: false, // always false at signup — requires OTP later
        gpaRecord: [],
        cgpa: null,
      },

      committeeMembership: null,
      skills: (skills as Skill[]) ?? [],
      profileCompleted: false,

      membershipStatus: "pending",
      signupInviteCode: generateInviteCode(),

      // Store referrer _id if a valid invite code was used
      ...(referredBy && { referredBy }),

      analytics: {
        eventsRegistered: 0,
        eventsAttended: 0,
        lastActiveAt: now, // set on account creation — baseline for dormancy checks
      },

      preferences: DEFAULT_PREFERENCES,
      createdAt: now,
      updatedAt: now,
    };

    await Collections.userData(db).insertOne(userDataDoc);

    // ── Send verification email ───────────────────────────────────────────────
    await sendVerificationEmail({
      to: emailLower,
      name: firstName.trim(),
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
