// src/app/api/admin/tasks/task/[id]/route.ts
// ─── PATCH /api/admin/tasks/task/[id] ──────────────────────────────────────────────
// Updates a task's status or visibility flag.
//
// Valid status transitions (enforced server-side):
//   draft     → active | cancelled
//   active    → completed | cancelled | archived
//   completed → archived
//   cancelled, archived → (terminal — no further transitions)
//
// Activating (draft → active) automatically calls spawnAssignments().
// All other transitions are pure status writes.

import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
  resolveParams,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { spawnAssignments } from "@/lib/services/taskService";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["active", "cancelled"],
  active: ["completed", "cancelled", "archived"],
  completed: ["archived"],
  cancelled: [],
  archived: [],
};

export const PATCH = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const { id } = await resolveParams(context);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const db = await getDb();
    const { vaultId, role } = req.auth;

    // ── 1. Fetch task ─────────────────────────────────────────────────────────

    const task = await Collections.tasks(db).findOne({ _id: new ObjectId(id) });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // ── 2. Permission check ───────────────────────────────────────────────────

    const isSystemAdmin = role === "admin" || role === "webmaster";

    if (!isSystemAdmin) {
      const userData = await Collections.userData(db).findOne({
        vaultId: new ObjectId(vaultId),
      });

      const isCommitteeStaff =
        userData?.membershipStatus === "approved" &&
        userData?.committeeMembership?.committee === task.committeeSlug &&
        ["HEAD", "COORDINATOR"].includes(
          userData?.committeeMembership?.role ?? "",
        );

      if (!isCommitteeStaff) {
        return NextResponse.json(
          {
            error:
              "Requires admin/webmaster or HEAD/COORDINATOR of this committee",
          },
          { status: 403 },
        );
      }
    }

    // ── 3. Parse body ─────────────────────────────────────────────────────────

    let body: { status?: string; isVisible?: boolean };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const now = new Date();
    const updateFields: Record<string, unknown> = { updatedAt: now };

    // ── 4. Validate + apply status transition ─────────────────────────────────

    if (body.status !== undefined) {
      const allowed = VALID_TRANSITIONS[task.status] ?? [];
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          {
            error: `Cannot transition from "${task.status}" to "${body.status}"`,
            current: task.status,
            allowed,
          },
          { status: 409 },
        );
      }
      updateFields.status = body.status;
    }

    if (body.isVisible !== undefined) {
      updateFields.isVisible = body.isVisible;
    }

    // ── 5. Write update ───────────────────────────────────────────────────────

    const isActivation = body.status === "active" && task.status === "draft";

    const updatedTask = await Collections.tasks(db).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    // ── 6. Spawn assignments on activation ────────────────────────────────────

    let spawnResult = null;
    if (isActivation) {
      try {
        spawnResult = await spawnAssignments(db, {
          _id: new ObjectId(id),
          committeeSlug: task.committeeSlug,
          assignmentTarget: task.assignmentTarget,
        });
      } catch (spawnErr) {
        // Task is already active — spawn failure logged but non-fatal.
        console.error("[admin/tasks PATCH] spawn failed:", spawnErr);
      }
    }

    return NextResponse.json({
      message: isActivation
        ? `Task activated. ${spawnResult?.spawned ?? 0} assignment(s) created.`
        : "Task updated successfully.",
      task: updatedTask,
      assignments: spawnResult,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/tasks/task/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
