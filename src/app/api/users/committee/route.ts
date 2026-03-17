// PATCH /api/users/committee
// Authenticated user requests to join or leave a committee.
// Joining requires an approved application — direct assignment is blocked.
// Leaving (setting null) is always allowed.
// Body: { "committee": "media" }   ← request to join (redirects to application flow)
//       { "committee": null }       ← leave current committee

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { committee } = await req.json();
    const db = await getDb();

    // ── null = leave committee ────────────────────────────────────────────────
    if (committee === null) {
      const vaultId = new ObjectId(req.auth.vaultId);

      // $inc memberCount on the committee they're leaving
      const userData = await Collections.userData(db).findOne(
        { vaultId },
        { projection: { committeeMembership: 1 } },
      );
      if (userData?.committeeMembership?.committee) {
        await Collections.committees(db).updateOne(
          { slug: userData.committeeMembership.committee },
          { $inc: { memberCount: -1 } },
        );
      }

      await Collections.userData(db).updateOne(
        { vaultId },
        { $set: { committeeMembership: null, updatedAt: new Date() } },
      );
      return NextResponse.json({ message: "Left committee successfully" });
    }

    // ── Validate committee against live DB ────────────────────────────────────
    if (typeof committee !== "string") {
      return NextResponse.json(
        { error: "committee must be a string slug or null" },
        { status: 400 },
      );
    }

    const committeeDoc = await Collections.committees(db).findOne({
      slug: committee,
      isActive: true,
    });
    if (!committeeDoc) {
      const valid = await Collections.committees(db)
        .find({ isActive: true }, { projection: { slug: 1, _id: 0 } })
        .toArray();
      return NextResponse.json(
        {
          error: `Invalid committee. Must be one of: ${valid.map((c) => c.slug).join(", ")}`,
        },
        { status: 400 },
      );
    }

    // ── Block direct join — must go through application flow ──────────────────
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
