// app/api/users/profile/route.ts
// GET  — fetch current user's full profile
// PATCH — update fullName, bio, phone
//
// avatar is NOT accepted here — it is set exclusively via
// POST /api/media/confirm after a successful Cloudinary upload.

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
// Allowed fields: fullName, bio, phone
// Body example:
// {
//   "fullName": { "firstname": "John", "lastname": "Doe" },
//   "phone":    { "countryCode": 234, "phoneNumber": 8012345678 },
//   "bio":      "I am a tech enthusiast"
// }
//
// NOT accepted here:
//   avatar — use POST /api/media/confirm (Cloudinary upload pipeline)

async function patchHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    // Guard: reject any attempt to write restricted fields
    const RESTRICTED = [
      "vaultId",
      "avatar", // set via /api/media/confirm only
      "hasAvatar", // managed by confirm/remove routes
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

    const result = await updateUserProfile(db, vaultId, {
      fullName: body.fullName,
      bio: body.bio,
      phone: body.phone,
    });

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
