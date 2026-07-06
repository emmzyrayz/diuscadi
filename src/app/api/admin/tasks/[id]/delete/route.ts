// src/app/api/admin/tasks/task/[id]/delete/route.ts
// ─── DELETE /api/admin/tasks/task/[id]/delete ─────────────────────────────────
// Hard deletes a task and all its assignments.
// Admin/webmaster only — committee staff have no delete access.
// Cannot delete an "active" task directly — it must be cancelled or archived
// first (forces intentional workflow before data destruction).

import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
  resolveParams,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

const SYSTEM_ADMIN_ROLES = ["admin", "webmaster"];

export const DELETE = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const { id } = await resolveParams(context);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const { role } = req.auth;

    if (!SYSTEM_ADMIN_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Only admins and webmasters can delete tasks" },
        { status: 403 },
      );
    }

    const db = await getDb();
    const taskObjId = new ObjectId(id);

    // ── Fetch task ─────────────────────────────────────────────────────────────

    const task = await Collections.tasks(db).findOne({ _id: taskObjId });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // ── Block deletion of active tasks ─────────────────────────────────────────
    // Active tasks have live assignments members may have already worked on.
    // Require cancellation or archiving first to make the action intentional.

    if (task.status === "active") {
      return NextResponse.json(
        {
          error:
            "Cannot delete an active task. Cancel or archive it first, then delete.",
          currentStatus: task.status,
        },
        { status: 409 },
      );
    }

    // ── Delete assignments first (referential cleanup) ─────────────────────────

    const assignmentDeleteResult = await Collections.assignments(db).deleteMany(
      { taskId: taskObjId },
    );

    // ── Delete the task ────────────────────────────────────────────────────────

    await Collections.tasks(db).deleteOne({ _id: taskObjId });

    return NextResponse.json({
      message: "Task and all associated assignments deleted successfully.",
      deleted: {
        taskId: id,
        assignmentsDeleted: assignmentDeleteResult.deletedCount,
      },
    });
  } catch (err) {
    console.error("[DELETE /api/admin/tasks/task/[id]/delete]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
