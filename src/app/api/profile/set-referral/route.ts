// src/app/api/profile/set-referral/route.ts
// ─── POST /api/profile/set-referral ──────────────────────────────────────────
// Auth required. Allows a user who signed up without a referral code to
// retroactively set one. This is a ONE-TIME action — once referredBy is set
// it cannot be changed, preventing referrer-switching to game the points system.
//
// After setting referredBy, fires the full depth reward chain via
// processReferralChain() — same function used at signup. This credits
// depth-1, depth-2, and depth-3 ancestors retroactively.
//
// Body: { code: string }
//
// Guards:
//   - User must have no existing referredBy value
//   - Code must belong to a real approved member
//   - User cannot refer themselves
//   - Circular referral prevention (code owner cannot be in the
//     user's own referral tree)

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { processReferralChain } from "@/lib/services/pointsService";

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!code) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    // ── 1. Load current user's UserData ───────────────────────────────────────

    const currentUser = await Collections.userData(db).findOne(
      { vaultId },
      {
        projection: {
          _id: 1,
          referredBy: 1,
          signupInviteCode: 1,
          membershipStatus: 1,
        },
      },
    );

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── 2. One-time guard ─────────────────────────────────────────────────────
    // referredBy is immutable once set — cannot be changed or overridden.

    if (currentUser.referredBy) {
      return NextResponse.json(
        {
          error:
            "A referral code has already been applied to your account. This cannot be changed.",
          alreadySet: true,
        },
        { status: 409 },
      );
    }

    // ── 3. Validate the invite code ───────────────────────────────────────────

    const referrer = await Collections.userData(db).findOne(
      { signupInviteCode: code, membershipStatus: "approved" },
      {
        projection: { _id: 1, signupInviteCode: 1, referredBy: 1, fullName: 1 },
      },
    );

    if (!referrer) {
      return NextResponse.json(
        { error: "Invite code not found or not yet active" },
        { status: 400 },
      );
    }

    // ── 4. Self-referral guard ─────────────────────────────────────────────────

    if (
      (referrer._id as ObjectId).toString() ===
      (currentUser._id as ObjectId).toString()
    ) {
      return NextResponse.json(
        { error: "You cannot use your own invite code" },
        { status: 400 },
      );
    }

    // ── 5. Circular referral guard ────────────────────────────────────────────
    // Walk the referrer's referredBy chain upward. If we encounter the
    // current user's signupInviteCode anywhere in the chain, this would
    // create a loop (A referred B, B tries to mark A as their referrer).

    let cursor = referrer.referredBy as string | null | undefined;
    let depth = 0;
    const MAX_WALK = 10; // safety cap — prevents infinite loop on corrupt data

    while (cursor && depth < MAX_WALK) {
      if (cursor === currentUser.signupInviteCode) {
        return NextResponse.json(
          {
            error:
              "This invite code would create a circular referral chain, which is not allowed.",
          },
          { status: 400 },
        );
      }
      const ancestor = await Collections.userData(db).findOne(
        { signupInviteCode: cursor },
        { projection: { referredBy: 1 } },
      );
      cursor = ancestor?.referredBy as string | null | undefined;
      depth++;
    }

    // ── 6. Set referredBy ─────────────────────────────────────────────────────

    const now = new Date();
    await Collections.userData(db).updateOne(
      { _id: currentUser._id as ObjectId },
      { $set: { referredBy: code, updatedAt: now } },
    );

    // ── 7. Fire full depth reward chain (fire-and-forget) ─────────────────────
    // Credits referrer + depth-2 + depth-3 ancestors retroactively.
    // Never throws — reward failure must not surface to the user.

    void processReferralChain(db, {
      newUserId: currentUser._id as ObjectId,
      source: "referral_signup",
      eventDate: now,
    });

    const fn = referrer.fullName as
      | { firstname?: string; lastname?: string }
      | undefined;
    const referrerName = fn?.firstname?.trim() || "your referrer";

    return NextResponse.json({
      success: true,
      message: `Referral code applied. ${referrerName} will receive their reward points.`,
      referrerName,
    });
  } catch (err) {
    console.error("[POST /api/profile/set-referral]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
