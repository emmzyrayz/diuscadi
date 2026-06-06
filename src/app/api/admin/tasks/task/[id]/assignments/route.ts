// src/app/api/admin/tasks/task/[id]/assignments/route.ts
// ─── GET /api/admin/tasks/task/[id]/assignments ────────────────────────────────────
// Returns all assignments for a specific task, each enriched with
// the member's name and email for display in the admin review sheet.
//
// Query params:
//   status  filter by assignment status (default "all")
//   page    default 1
//   limit   default 50, max 100

import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
  resolveParams,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const GET = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const { id } = await resolveParams(context);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const db = await getDb();
    const { vaultId, role } = req.auth;

    // ── 1. Fetch task (needed for permission scoping) ─────────────────────────

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
          { error: "Insufficient permissions" },
          { status: 403 },
        );
      }
    }

    // ── 3. Query params ───────────────────────────────────────────────────────

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") ?? "all";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      parseInt(searchParams.get("limit") ?? "50", 10),
    );
    const skip = (page - 1) * limit;

    const assignmentQuery: Record<string, unknown> = {
      taskId: new ObjectId(id),
    };
    if (statusFilter !== "all") assignmentQuery.status = statusFilter;

    // ── 4. Fetch assignments + count ──────────────────────────────────────────

    const [assignments, total] = await Promise.all([
      Collections.assignments(db)
        .find(assignmentQuery)
        // Submitted first (action required), then by submission date desc
        .sort({ "submission.submittedAt": -1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      Collections.assignments(db).countDocuments(assignmentQuery),
    ]);

    // ── 5. Enrich with member info (name + email, single round-trip) ──────────

    const userIds = assignments.map((a) => a.userId as ObjectId);

    const users =
      userIds.length > 0
        ? await Collections.userData(db)
            .find(
              { _id: { $in: userIds } },
              { projection: { _id: 1, fullName: 1, email: 1 } },
            )
            .toArray()
        : [];

    const userMap = new Map(users.map((u) => [u._id!.toString(), u]));

    const enriched = assignments.map((a) => {
      const u = userMap.get((a.userId as ObjectId).toString());
      return {
        ...a,
        memberInfo: u
          ? {
              fullName:
                `${u.fullName.firstname} ${u.fullName.lastname ?? ""}`.trim(),
              email: u.email,
            }
          : null,
      };
    });

    return NextResponse.json({
      assignments: enriched,
      task: {
        _id: task._id,
        title: task.title,
        committeeSlug: task.committeeSlug,
        maxScore: task.maxScore,
        evaluationCriteria: task.evaluationCriteria,
        deliverables: task.deliverables,
        autoEvaluate: task.autoEvaluate,
      },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /api/admin/tasks/task/[id]/assignments]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
