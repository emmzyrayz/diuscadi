// src/app/api/admin/tasks/route.ts
// ─── GET /api/admin/tasks ─────────────────────────────────────────────────────
// Lists tasks enriched with per-task assignment status counts.
//
// Permission matrix:
//   admin | webmaster   →  all tasks; optional committeeSlug filter
//   HEAD | COORDINATOR  →  their committee only; committeeSlug filter ignored
//
// Query params:
//   status      "active" | "draft" | "completed" | "cancelled" | "archived" | "all"
//   committee   slug filter (admin/webmaster only)
//   priority    "low" | "medium" | "high" | "critical"
//   taskType    "submission" | "poll" | "survey" | "acknowledgement"
//   page        default 1
//   limit       default 20, max 50

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const db = await getDb();
    const { vaultId, role } = req.auth;

    // ── 1. Permission check ───────────────────────────────────────────────────

    const userData = await Collections.userData(db).findOne({
      vaultId: new ObjectId(vaultId),
    });

    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    const isSystemAdmin = role === "admin" || role === "webmaster";
    const isCommitteeStaff =
      userData.membershipStatus === "approved" &&
      ["HEAD", "COORDINATOR"].includes(
        userData.committeeMembership?.role ?? "",
      );

    if (!isSystemAdmin && !isCommitteeStaff) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // ── 2. Query params ───────────────────────────────────────────────────────

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") ?? "all";
    const committeeFilter = searchParams.get("committee") ?? null;
    const priorityFilter = searchParams.get("priority") ?? null;
    const taskTypeFilter = searchParams.get("taskType") ?? null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
    const skip = (page - 1) * limit;

    // ── 3. Build query ────────────────────────────────────────────────────────

    const query: Record<string, unknown> = {};

    // Non-system-admins are locked to their own committee regardless of param
    if (!isSystemAdmin) {
      query.committeeSlug = userData.committeeMembership?.committee;
    } else if (committeeFilter) {
      query.committeeSlug = committeeFilter;
    }

    if (statusFilter !== "all") query.status = statusFilter;
    if (priorityFilter) query.priority = priorityFilter;
    if (taskTypeFilter) query.taskType = taskTypeFilter;

    // ── 4. Fetch tasks + count ────────────────────────────────────────────────

    const [tasks, total] = await Promise.all([
      Collections.tasks(db)
        .find(query)
        .sort({ priorityWeight: -1, deadline: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      Collections.tasks(db).countDocuments(query),
    ]);

    if (tasks.length === 0) {
      return NextResponse.json({
        tasks: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      });
    }

    // ── 5. Aggregate assignment stats per task (single pipeline) ──────────────

    const taskIds = tasks.map((t) => t._id as ObjectId);

    const statsPipeline = await Collections.assignments(db)
      .aggregate([
        { $match: { taskId: { $in: taskIds } } },
        {
          $group: {
            _id: "$taskId",
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            in_progress: {
              $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
            },
            submitted: {
              $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] },
            },
            under_review: {
              $sum: { $cond: [{ $eq: ["$status", "under_review"] }, 1, 0] },
            },
            evaluated: {
              $sum: { $cond: [{ $eq: ["$status", "evaluated"] }, 1, 0] },
            },
            revision_requested: {
              $sum: {
                $cond: [{ $eq: ["$status", "revision_requested"] }, 1, 0],
              },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
            },
          },
        },
      ])
      .toArray();

    const statsMap = new Map(statsPipeline.map((s) => [s._id.toString(), s]));

    const enriched = tasks.map((task) => ({
      ...task,
      assignmentStats: statsMap.get((task._id as ObjectId).toString()) ?? {
        total: 0,
        pending: 0,
        in_progress: 0,
        submitted: 0,
        under_review: 0,
        evaluated: 0,
        revision_requested: 0,
        rejected: 0,
      },
    }));

    return NextResponse.json({
      tasks: enriched,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /api/admin/tasks]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
