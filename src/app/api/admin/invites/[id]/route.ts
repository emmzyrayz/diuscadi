// PATCH /api/admin/invites/[id]
// Admin/webmaster only. Revoke an active invite code.
// Body: { action: "revoke" }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!["admin", "webmaster"].includes(req.auth.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const segments = req.nextUrl?.pathname.split("/") ?? req.url.split("/");
    const rawId = segments[segments.length - 1];

    let inviteId: ObjectId;
    try {
      inviteId = new ObjectId(rawId);
    } catch {
      return NextResponse.json({ error: "Invalid invite ID" }, { status: 400 });
    }

    const { action } = await req.json();
    if (action !== "revoke") {
      return NextResponse.json(
        { error: "Only 'revoke' action is supported" },
        { status: 400 },
      );
    }

    const db = await getDb();

    const result = await Collections.invites(db).updateOne(
      { _id: inviteId, status: "active" },
      { $set: { status: "revoked", updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Invite not found or already inactive" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Invite code revoked" });
  } catch (err) {
    console.error("[PATCH /api/admin/invites/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
