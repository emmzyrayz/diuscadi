// PATCH /api/admin/users/[id]/committee-role
// Admin + webmaster only.
// Assigns or updates a user's committee role within their existing membership.
// User must already be in a committee (approved application) before role can be changed.
// Body: { role: string } — validated against live committeeRoles collection

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

const ALLOWED_ROLES = ["admin", "webmaster"];

type Context = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

export const PATCH = withAuth(
  async (req: AuthenticatedRequest, context?: Context) => {
    try {
      if (!ALLOWED_ROLES.includes(req.auth.role)) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }

      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const id = params.id as string;
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
      }

      const { role } = await req.json();
      if (!role || typeof role !== "string") {
        return NextResponse.json(
          { error: "role is required" },
          { status: 400 },
        );
      }

      const db = await getDb();

      // ── Validate role against live committeeRoles collection ──────────────
      const roleDoc = await Collections.committeeRoles(db).findOne({
        slug: role,
        isActive: true,
      });
      if (!roleDoc) {
        const validRoles = await Collections.committeeRoles(db)
          .find({ isActive: true }, { projection: { slug: 1, _id: 0 } })
          .sort({ rank: 1 })
          .toArray();
        return NextResponse.json(
          {
            error: `Invalid role. Must be one of: ${validRoles.map((r) => r.slug).join(", ")}`,
          },
          { status: 400 },
        );
      }

      const now = new Date();
      const userData = await Collections.userData(db).findOne({
        _id: new ObjectId(id),
      });
      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (!userData.committeeMembership) {
        return NextResponse.json(
          {
            error:
              "User is not in any committee. Approve a committee application first.",
          },
          { status: 409 },
        );
      }

      const assignedBy = new ObjectId(req.auth.vaultId);

      await Collections.userData(db).updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            "committeeMembership.role": role,
            "committeeMembership.assignedBy": assignedBy,
            updatedAt: now,
          },
        },
      );

      return NextResponse.json({
        message: `Committee role updated to '${role}' successfully`,
        userId: id,
        committee: userData.committeeMembership.committee,
        role,
      });
    } catch (err) {
      console.error("[PATCH /api/admin/users/[id]/committee-role]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
