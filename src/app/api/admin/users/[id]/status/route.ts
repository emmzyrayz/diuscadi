// PATCH /api/admin/users/[id]/status
// Admin + webmaster. Suspend or reactivate a user account.
// Body: { isActive: boolean, reason?: string }
// Suspending invalidates all active sessions via tokenVersion increment.

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

      const { isActive, reason } = await req.json();
      if (typeof isActive !== "boolean") {
        return NextResponse.json(
          { error: "isActive (boolean) is required" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const now = new Date();

      const userData = await Collections.userData(db).findOne({
        _id: new ObjectId(id),
      });
      if (!userData)
        return NextResponse.json({ error: "User not found" }, { status: 404 });

      if (userData.vaultId.toString() === req.auth.vaultId) {
        return NextResponse.json(
          { error: "You cannot change your own account status" },
          { status: 403 },
        );
      }

      const vaultUpdate: Record<string, unknown> = {
        isAccountActive: isActive,
        updatedAt: now,
      };
      // Suspending — invalidate all active sessions
      if (!isActive) vaultUpdate["$inc"] = { tokenVersion: 1 };

      await Collections.vault(db).updateOne(
        { _id: userData.vaultId },
        !isActive
          ? {
              $set: { isAccountActive: false, updatedAt: now },
              $inc: { tokenVersion: 1 },
            }
          : { $set: { isAccountActive: true, updatedAt: now } },
      );

      // Update membershipStatus on userData
      await Collections.userData(db).updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            membershipStatus: isActive ? "approved" : "suspended",
            updatedAt: now,
          },
        },
      );

      // Delete all sessions on suspend
      if (!isActive) {
        await Collections.sessions(db).deleteMany({
          vaultId: userData.vaultId,
        });
      }

      return NextResponse.json({
        message: isActive
          ? "Account reactivated successfully"
          : "Account suspended successfully",
        userId: id,
        isActive,
        ...(reason ? { reason } : {}),
      });
    } catch (err) {
      console.error("[PATCH /api/admin/users/[id]/status]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
