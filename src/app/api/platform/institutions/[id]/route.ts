// PATCH /api/platform/institutions/[id] — webmaster only, update institution

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const PATCH = withAuth(
  async (
    req: AuthenticatedRequest,
    context?: {
      params?: Promise<Record<string, string>> | Record<string, string>;
    },
  ) => {
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
          { error: "Invalid institution ID" },
          { status: 400 },
        );
      }

      const body = await req.json();
      const allowed = ["name", "type", "state", "country", "isActive"];
      const updates: Record<string, unknown> = {};

      for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key];
      }

      if (
        updates.type &&
        !["University", "Polytechnic"].includes(updates.type as string)
      ) {
        return NextResponse.json(
          { error: "type must be 'University' or 'Polytechnic'" },
          { status: 400 },
        );
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json(
          { error: "No valid fields to update" },
          { status: 400 },
        );
      }

      updates.updatedAt = new Date();
      const db = await getDb();

      const result = await Collections.institutions(db).findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updates },
        { returnDocument: "after" },
      );

      if (!result) {
        return NextResponse.json(
          { error: "Institution not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        message: "Institution updated successfully",
        institution: {
          id: result._id!.toString(),
          name: result.name,
          type: result.type,
          state: result.state,
          country: result.country,
          isActive: result.isActive,
          faculties: result.faculties.map((f) => f.toString()),
          updatedAt: (result.updatedAt as Date).toISOString(),
        },
      });
    } catch (err) {
      console.error("[PATCH /api/platform/institutions/[id]]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
