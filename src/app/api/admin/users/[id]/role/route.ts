// PATCH /api/admin/users/[id]/role
// Webmaster only. Changes a user's role.
// Body: { role: "participant" | "moderator" | "admin" | "webmaster" }
// [id] is the UserData._id

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { ACCOUNT_ROLES } from "@/types/domain";

type Context = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

export const PATCH = withAuth(
  async (req: AuthenticatedRequest, context?: Context) => {
    try {
      if (req.auth.role !== "webmaster") {
        return NextResponse.json(
          { error: "Webmaster access required" },
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
      if (!role || !ACCOUNT_ROLES.includes(role)) {
        return NextResponse.json(
          { error: `role must be one of: ${ACCOUNT_ROLES.join(", ")}` },
          { status: 400 },
        );
      }

      const db = await getDb();
      const now = new Date();

      // Get userData to find vaultId
      const userData = await Collections.userData(db).findOne({
        _id: new ObjectId(id),
      });
      if (!userData)
        return NextResponse.json({ error: "User not found" }, { status: 404 });

      // Prevent webmaster from changing their own role
      if (userData.vaultId.toString() === req.auth.vaultId) {
        return NextResponse.json(
          { error: "You cannot change your own role" },
          { status: 403 },
        );
      }

      // Update role on vault + increment tokenVersion to invalidate active sessions
      await Collections.vault(db).updateOne(
        { _id: userData.vaultId },
        { $set: { role, updatedAt: now }, $inc: { tokenVersion: 1 } },
      );

      // Mirror role on userData for quick reads
      await Collections.userData(db).updateOne(
        { _id: new ObjectId(id) },
        { $set: { role, updatedAt: now } },
      );

      return NextResponse.json({
        message: `User role updated to '${role}' successfully`,
        userId: id,
        role,
      });
    } catch (err) {
      console.error("[PATCH /api/admin/users/[id]/role]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
