// DELETE /api/platform/institutions/[id]/faculties/[facultyId]
// Webmaster only. Removes a faculty assignment from an institution.
// Does NOT delete the faculty document itself — just unlinks it.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

type Context = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

export const DELETE = withAuth(
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
      const facultyId = params.facultyId as string;

      if (!ObjectId.isValid(id) || !ObjectId.isValid(facultyId)) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
      }

      const db = await getDb();

      const institution = await Collections.institutions(db).findOne({
        _id: new ObjectId(id),
      });
      if (!institution) {
        return NextResponse.json(
          { error: "Institution not found" },
          { status: 404 },
        );
      }

      const isAssigned = institution.faculties.some(
        (f) => f.toString() === facultyId,
      );
      if (!isAssigned) {
        return NextResponse.json(
          { error: "Faculty is not assigned to this institution" },
          { status: 404 },
        );
      }

      await Collections.institutions(db).updateOne(
        { _id: new ObjectId(id) },
        {
          $pull: { faculties: new ObjectId(facultyId) } as never,
          $set: { updatedAt: new Date() },
        },
      );

      return NextResponse.json({
        message: "Faculty unassigned from institution successfully",
      });
    } catch (err) {
      console.error(
        "[DELETE /api/platform/institutions/[id]/faculties/[facultyId]]",
        err,
      );
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
