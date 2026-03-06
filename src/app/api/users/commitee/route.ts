// app/api/users/committee/route.ts
// PATCH — assign or clear committee membership
// Body example:
// { "committee": "INNOVATION" }
// { "committee": null }          ← clears assignment

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  updateUserCommittee,
  sanitizeProfile,
} from "@/lib/services/userService";

async function patchHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    if (!("committee" in body)) {
      return NextResponse.json(
        { error: 'Body must include a "committee" field (string or null)' },
        { status: 400 },
      );
    }

    const result = await updateUserCommittee(db, vaultId, body.committee);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }

    return NextResponse.json({
      message: "Committee updated successfully",
      profile: sanitizeProfile(result.updated!),
    });
  } catch (err) {
    console.error("[PATCH /api/users/committee]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const PATCH = withAuth(patchHandler);
