// DELETE /api/platform/faculties/[id]/departments/[departmentId]
// Webmaster only. Removes a department assignment from a faculty.
// Does NOT delete the department document — just unlinks it.

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
      const departmentId = params.departmentId as string;

      if (!ObjectId.isValid(id) || !ObjectId.isValid(departmentId)) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
      }

      const db = await getDb();
      const faculty = await Collections.faculties(db).findOne({
        _id: new ObjectId(id),
      });
      if (!faculty)
        return NextResponse.json(
          { error: "Faculty not found" },
          { status: 404 },
        );

      const isAssigned = faculty.departments.some(
        (d) => d.toString() === departmentId,
      );
      if (!isAssigned) {
        return NextResponse.json(
          { error: "Department is not assigned to this faculty" },
          { status: 404 },
        );
      }

      await Collections.faculties(db).updateOne(
        { _id: new ObjectId(id) },
        {
          $pull: { departments: new ObjectId(departmentId) } as never,
          $set: { updatedAt: new Date() },
        },
      );

      return NextResponse.json({
        message: "Department unassigned from faculty successfully",
      });
    } catch (err) {
      console.error(
        "[DELETE /api/platform/faculties/[id]/departments/[departmentId]]",
        err,
      );
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
