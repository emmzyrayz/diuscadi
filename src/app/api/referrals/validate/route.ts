// src/app/api/referrals/validate/route.ts
// ─── POST /api/referrals/validate ────────────────────────────────────────────
// Public — no auth required. Used by the signup form and profile edit page
// to validate an invite code in real-time before form submission.
//
// Returns the referrer's first name on success so the UI can show
// "Referred by: Chidi" as immediate confirmation.
//
// Deliberately returns minimal data — no full name, no userId, no email.
// The referrer's identity is confirmed server-side; the client only needs
// enough to show a friendly confirmation message.
//
// Body: { code: string }
//
// Responses:
//   200 { valid: true,  referrerName: string }
//   200 { valid: false, error: string }   ← always 200, never 404/400
//         (prevents invite code enumeration via status codes)

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!code) {
      return NextResponse.json({ valid: false, error: "No code provided" });
    }

    if (code.length < 4 || code.length > 32) {
      return NextResponse.json({ valid: false, error: "Invalid invite code" });
    }

    const db = await getDb();

    const referrer = await Collections.userData(db).findOne(
      { signupInviteCode: code, membershipStatus: "approved" },
      { projection: { _id: 1, fullName: 1 } },
    );

    if (!referrer) {
      return NextResponse.json({
        valid: false,
        error: "Invite code not found or not yet active",
      });
    }

    const fn = referrer.fullName as
      | { firstname?: string; lastname?: string }
      | undefined;
    const referrerName = fn?.firstname?.trim() || "a member";

    return NextResponse.json({ valid: true, referrerName });
  } catch (err) {
    console.error("[POST /api/referrals/validate]", err);
    // Return invalid rather than 500 — a validation failure should never
    // crash the signup flow from the user's perspective.
    return NextResponse.json({
      valid: false,
      error: "Validation unavailable — please try again",
    });
  }
}
