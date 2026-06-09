import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/events/guest-status?email=&eventId=
//
// Public endpoint — no auth required.
// Called by RegistrationForm before/after a submit attempt to determine
// which step to show the user without forcing them through the 409 wall.
//
// Returns one of three states:
//   "verified" — guest has completed OTP verification → show step 3 (ticket)
//   "pending"  — guest record exists but OTP not yet verified → show step 2
//   "none"     — no record found → proceed with fresh registration (step 1)
//
// Response shape:
//   { status: "verified", registrationId, inviteCode, firstName }
//   { status: "pending",  registrationId, firstName }
//   { status: "none" }
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.toLowerCase().trim();
    const eventId = searchParams.get("eventId");

    // ── Validate params ────────────────────────────────────────────────────
    if (!email || !eventId) {
      return NextResponse.json(
        { error: "email and eventId query params are required" },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: "Invalid eventId format" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const eventObjId = new ObjectId(eventId);

    // ── Look up guest record ───────────────────────────────────────────────
    // We query without status filter so we catch both pending and verified.
    // Cancelled records are excluded — a cancelled guest can re-register.
    const guestReg = await Collections.guestEventRegistrations(db).findOne(
      {
        email,
        eventId: eventObjId,
        status: { $ne: "cancelled" },
      },
      {
        projection: {
          _id: 1,
          fullName: 1,
          inviteCode: 1,
          verifiedAt: 1,
          emailVerificationExpires: 1,
          status: 1,
        },
      },
    );

    // ── No record → fresh registration ────────────────────────────────────
    if (!guestReg) {
      return NextResponse.json({ status: "none" }, { status: 200 });
    }

    const registrationId = guestReg._id!.toString();
    const firstName = guestReg.fullName?.firstname ?? "";

    // ── Verified → show ticket ─────────────────────────────────────────────
    if (guestReg.verifiedAt) {
      return NextResponse.json(
        {
          status: "verified",
          registrationId,
          inviteCode: guestReg.inviteCode,
          firstName,
        },
        { status: 200 },
      );
    }

    // ── Pending but OTP has expired → treat as none so they can re-register
    // The TTL index will eventually clean the document, but the user shouldn't
    // be stuck in "pending" indefinitely after expiry.
    const now = new Date();
    if (
      guestReg.emailVerificationExpires &&
      new Date(guestReg.emailVerificationExpires) < now
    ) {
      return NextResponse.json({ status: "none" }, { status: 200 });
    }

    // ── Pending (OTP still valid) → show OTP screen ────────────────────────
    return NextResponse.json(
      {
        status: "pending",
        registrationId,
        firstName,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[GET /api/events/guest-status]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
