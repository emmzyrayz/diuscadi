// app/api/users/profile/route.ts
// GET  — fetch current user's full profile
// PATCH — update fullName, bio, phone, location, socials
//
// avatar is NOT accepted here — set exclusively via POST /api/media/confirm.
// To lock a field (e.g. phone after verification), pass locks into updateUserProfile.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  getUserProfile,
  updateUserProfile,
  sanitizeProfile,
} from "@/lib/services/userService";

// ─── GET /api/users/profile ───────────────────────────────────────────────────

async function getHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    const profile = await getUserProfile(db, vaultId);
    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ profile: sanitizeProfile(profile) });
  } catch (err) {
    console.error("[GET /api/users/profile]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── PATCH /api/users/profile ─────────────────────────────────────────────────
// Accepted fields: fullName, bio, phone, location, socials
//
// NOT accepted:
//   avatar      — use POST /api/media/confirm (Cloudinary upload pipeline)
//   hasAvatar   — managed by confirm/remove routes
//   analytics, signupInviteCode, membershipStatus, role, _id, vaultId

async function patchHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    // Guard: reject restricted fields
    const RESTRICTED = [
      "vaultId",
      "avatar",
      "hasAvatar",
      "analytics",
      "signupInviteCode",
      "membershipStatus",
      "role",
      "_id",
    ];
    const attempted = RESTRICTED.filter((f) => f in body);
    if (attempted.length > 0) {
      return NextResponse.json(
        { error: `Cannot update restricted fields: ${attempted.join(", ")}` },
        { status: 400 },
      );
    }

    // ── Field locks ────────────────────────────────────────────────────────
    // TODO: when your verification system is live, load per-user lock flags here:
    //   const userFlags = await getUserVerificationFlags(db, vaultId);
    //   const locks = { phone: userFlags.phoneVerified, fullName: userFlags.kycCompleted };
    // For now all fields are unlocked:
    const locks = {};

    const result = await updateUserProfile(
      db,
      vaultId,
      {
        fullName: body.fullName,
        bio: body.bio,
        phone: body.phone,
        location: body.location, // ← the fix
        socials: body.socials,
      },
      locks,
    );

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: sanitizeProfile(result.updated!),
    });
  } catch (err) {
    console.error("[PATCH /api/users/profile]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
