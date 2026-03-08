// PATCH /api/platform/faculties/[id] — webmaster only

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

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
        return NextResponse.json(
          { error: "Invalid faculty ID" },
          { status: 400 },
        );
      }

      const body = await req.json();
      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates.name = String(body.name).trim();
      if (body.isActive !== undefined)
        updates.isActive = Boolean(body.isActive);

      if (Object.keys(updates).length === 0) {
        return NextResponse.json(
          { error: "No valid fields to update" },
          { status: 400 },
        );
      }

      updates.updatedAt = new Date();
      const db = await getDb();

      const result = await Collections.faculties(db).findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updates },
        { returnDocument: "after" },
      );

      if (!result)
        return NextResponse.json(
          { error: "Faculty not found" },
          { status: 404 },
        );

      return NextResponse.json({
        message: "Faculty updated successfully",
        faculty: {
          id: result._id!.toString(),
          name: result.name,
          isActive: result.isActive,
          departments: result.departments.map((d) => d.toString()),
          updatedAt: (result.updatedAt as Date).toISOString(),
        },
      });
    } catch (err) {
      console.error("[PATCH /api/platform/faculties/[id]]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
