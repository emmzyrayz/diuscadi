// src/app/api/admin/tasks/task/[id]/route.ts
// ─── PATCH /api/admin/tasks/task/[id] ──────────────────────────────────────────────
// Updates a task's status or visibility flag.
//
// Valid status transitions (enforced server-side):
//   draft             → active | cancelled
//   pending_approval  → cancelled (rejection — any committee staff with
//                       access, or system admin)
//   pending_approval  → active   (APPROVAL — system admin/webmaster ONLY,
//                       routed through this PATCH only as a fallback; the
//                       dedicated /approve route is the primary path and
//                       additionally stamps publishedAt via approveGlobalTask)
//   active            → completed | cancelled | archived
//   completed         → archived
//   cancelled, archived → (terminal — no further transitions)
//
// Activating (draft → active) automatically calls spawnAssignments() and
// stamps publishedAt via activateTask(). Approving (pending_approval →
// active) does the same via approveGlobalTask() — both paths converge on
// the same publishedAt-stamping behavior so time-decay scoring always has
// a valid clock-start regardless of which route triggered activation.

import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
  resolveParams,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import {
  spawnAssignments,
  approveGlobalTask,
} from "@/lib/services/taskService";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["active", "cancelled"],
  pending_approval: ["active", "cancelled"],
  active: ["completed", "cancelled", "archived"],
  completed: ["archived"],
  cancelled: [],
  archived: [],
};

const SYSTEM_ADMIN_ROLES = ["admin", "webmaster"];

export const PATCH = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const { id } = await resolveParams(context);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const db = await getDb();
    const { vaultId, role } = req.auth;
    const isSystemAdmin = SYSTEM_ADMIN_ROLES.includes(role);

    // ── 1. Fetch task ─────────────────────────────────────────────────────────

    const task = await Collections.tasks(db).findOne({ _id: new ObjectId(id) });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // ── 2. Permission check (general edit access) ─────────────────────────────

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

      // ── CRITICAL GATE: pending_approval → active requires system admin ──────
      // A committee HEAD/COORDINATOR can reject (→ cancelled) their own or
      // another committee's global task draft, but only webmaster/admin can
      // approve one. This is enforced here AND duplicated in the dedicated
      // /approve route — defense in depth, since this generic PATCH route
      // technically allows the same transition.
      if (
        task.status === "pending_approval" &&
        body.status === "active" &&
        !isSystemAdmin
      ) {
        return NextResponse.json(
          {
            error:
              "Only a webmaster or head-admin can approve a global task. " +
              "Use POST /api/admin/tasks/task/[id]/approve as the canonical " +
              "approval path, or contact an admin.",
          },
          { status: 403 },
        );
      }

      updateFields.status = body.status;
    }

    if (body.isVisible !== undefined) {
      updateFields.isVisible = body.isVisible;
    }

    // ── 5. Write update ───────────────────────────────────────────────────────

    const isActivation = body.status === "active" && task.status === "draft";
    const isApproval =
      body.status === "active" && task.status === "pending_approval";

    // Stamp publishedAt on either activation path — this PATCH route can
    // technically perform the approval transition (system admin only, per
    // the gate above), so it must stamp publishedAt exactly like
    // approveGlobalTask() does to keep time-decay scoring consistent
    // regardless of which endpoint was used.
    if (isActivation || isApproval) {
      updateFields.publishedAt = now;
    }

    const updatedTask = await Collections.tasks(db).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    // ── 6. Spawn assignments on activation or approval ─────────────────────────

    let spawnResult = null;
    if (isActivation) {
      try {
        spawnResult = await spawnAssignments(db, {
          _id: new ObjectId(id),
          scope: task.scope,
          committeeSlug: task.committeeSlug,
          assignmentTarget: task.assignmentTarget,
        });
      } catch (spawnErr) {
        console.error("[admin/tasks PATCH] spawn failed:", spawnErr);
      }
    } else if (isApproval) {
      try {
        // Reuse approveGlobalTask's spawn logic for consistency, even though
        // the status write already happened above via this route's generic
        // update. spawnAssignments alone (not the full approveGlobalTask
        // status-transition) is what we need here since the status field
        // is already set.
        spawnResult = await spawnAssignments(db, {
          _id: new ObjectId(id),
          scope: task.scope,
          committeeSlug: task.committeeSlug,
          assignmentTarget: task.assignmentTarget,
        });
      } catch (spawnErr) {
        console.error(
          "[admin/tasks PATCH] global approval spawn failed:",
          spawnErr,
        );
      }
    }

    let message = "Task updated successfully.";
    if (isActivation) {
      message = `Task activated. ${spawnResult?.spawned ?? 0} assignment(s) created.`;
    } else if (isApproval) {
      message = `Global task approved. ${spawnResult?.spawned ?? 0} assignment(s) created.`;
    }

    return NextResponse.json({
      message,
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
