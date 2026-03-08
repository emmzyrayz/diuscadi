// PATCH /api/users/committee
// Authenticated user requests to join or leave a committee.
// Joining requires an approved application — direct assignment is blocked.
// Leaving (setting null) is always allowed.
// Body: { "committee": "media" }   ← request to join (creates application)
//       { "committee": null }       ← leave current committee

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { COMMITTEES } from "@/types/domain";

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { committee } = await req.json();

    // null = leave committee
    if (committee === null) {
      const db = await getDb();
      const vaultId = new ObjectId(req.auth.vaultId);
      await Collections.userData(db).updateOne(
        { vaultId },
        { $set: { committeeMembership: null, updatedAt: new Date() } },
      );
      return NextResponse.json({ message: "Left committee successfully" });
    }

    // Validate committee value
    if (!(COMMITTEES as string[]).includes(committee)) {
      return NextResponse.json(
        { error: `committee must be one of: ${COMMITTEES.join(", ")}` },
        { status: 400 },
      );
    }

    // Block direct join — must go through application flow
    return NextResponse.json(
      {
        error:
          "To join a committee, submit an application via POST /api/applications",
        hint: { type: "committee", requestedCommittee: committee },
      },
      { status: 403 },
    );
  } catch (err) {
    console.error("[PATCH /api/users/committee]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
