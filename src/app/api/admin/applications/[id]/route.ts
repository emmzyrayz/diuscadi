// PATCH /api/admin/users/[id]/committee-role
// Admin + webmaster only.
// Assigns or updates a user's committee role within their existing membership.
// User must already be in a committee (approved application) before role can be changed.
// Body: { role: "MEMBER" | "COORDINATOR" | "HEAD" | "ADMIN" }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { COMMITTEE_ROLES } from "@/types/domain";

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
      if (!role || !(COMMITTEE_ROLES as string[]).includes(role)) {
        return NextResponse.json(
          { error: `role must be one of: ${COMMITTEE_ROLES.join(", ")}` },
          { status: 400 },
        );
      }

      const db = await getDb();
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
