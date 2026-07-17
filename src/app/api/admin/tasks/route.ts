// src/app/api/admin/tasks/route.ts
// ─── GET /api/admin/tasks ─────────────────────────────────────────────────────
// Admin/webmaster: returns all tasks across all committees with rich filters.
// Committee HEAD/COORDINATOR: returns only tasks for their own committee.
//
// Query params:
//   status      "all" | "draft" | "pending_approval" | "active" | "completed"
//               | "cancelled" | "archived"  (default "all")
//   scope       "all" | "committee" | "global"  (default "all")
//   committee   slug — filter by committee (admin only, ignored for staff)
//   page        number (default 1)
//   limit       number (default 20, max 50)

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { canAccessAdminPanel } from "@/lib/roles";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const db = await getDb();
    const { vaultId, role } = req.auth;
    const hasFullTaskVisibility = canAccessAdminPanel(role);

    // ── 1. Parse query params ──────────────────────────────────────────────────

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") ?? "all";
    const scopeFilter = searchParams.get("scope") ?? "all";
    const committeeFilter = searchParams.get("committee") ?? null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      MAX_LIMIT,
      parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10),
    );
    const skip = (page - 1) * limit;

    // ── 2. Resolve caller's committee (for staff) ──────────────────────────────

    let callerCommitteeSlug: string | null = null;
    if (!hasFullTaskVisibility) {
      const userData = await Collections.userData(db).findOne(
        { vaultId: new ObjectId(vaultId) },
        {
          projection: {
            membershipStatus: 1,
            "committeeMembership.committee": 1,
            "committeeMembership.role": 1,
            temporaryAssignment: 1,
          },
        },
      );

      if (!userData || userData.membershipStatus !== "approved") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const now = new Date();
      callerCommitteeSlug =
        userData.temporaryAssignment &&
        new Date(userData.temporaryAssignment.endsAt) > now
          ? userData.temporaryAssignment.committee
          : (userData.committeeMembership?.committee ?? null);

      const callerRole =
        userData.temporaryAssignment &&
        new Date(userData.temporaryAssignment.endsAt) > now
          ? userData.temporaryAssignment.role
          : (userData.committeeMembership?.role ?? null);

      if (!["HEAD", "COORDINATOR"].includes(callerRole ?? "")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ── 3. Build query ─────────────────────────────────────────────────────────

    const query: Record<string, unknown> = {};

    // Status filter
    if (statusFilter !== "all") query.status = statusFilter;

    // Scope filter
    if (scopeFilter !== "all") query.scope = scopeFilter;

    // Committee filter — system admins can filter by any; staff locked to own
    if (!hasFullTaskVisibility) {
      query.committeeSlug = callerCommitteeSlug;
    } else if (committeeFilter) {
      query.committeeSlug = committeeFilter;
    }

    // ── 4. Fetch tasks + count ─────────────────────────────────────────────────

    const [tasks, total] = await Promise.all([
      Collections.tasks(db)
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      Collections.tasks(db).countDocuments(query),
    ]);

    // ── 5. Enrich with assignment stats ────────────────────────────────────────
    // For each task, get a quick summary of assignment statuses (total spawned,
    // how many evaluated, how many pending). Used by the admin task list cards.

    const taskIds = tasks.map((t) => t._id as ObjectId);

    const assignmentStats =
      taskIds.length > 0
        ? await Collections.assignments(db)
            .aggregate([
              { $match: { taskId: { $in: taskIds } } },
              {
                $group: {
                  _id: { taskId: "$taskId", status: "$status" },
                  count: { $sum: 1 },
                },
              },
              {
                $group: {
                  _id: "$_id.taskId",
                  statuses: {
                    $push: { status: "$_id.status", count: "$count" },
                  },
                  total: { $sum: "$count" },
                },
              },
            ])
            .toArray()
        : [];

    const statsMap = new Map(
      assignmentStats.map((s) => {
        const byStatus: Record<string, number> = {};
        for (const entry of s.statuses) {
          byStatus[entry.status as string] = entry.count as number;
        }
        return [
          (s._id as ObjectId).toString(),
          { total: s.total as number, byStatus },
        ];
      }),
    );

    // ── 6. Build response ──────────────────────────────────────────────────────

    const enriched = tasks.map((task) => ({
      ...task,
      assignmentStats: statsMap.get((task._id as ObjectId).toString()) ?? {
        total: 0,
        byStatus: {},
      },
    }));

    return NextResponse.json({
      tasks: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      filters: {
        status: statusFilter,
        scope: scopeFilter,
        committee: committeeFilter,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/tasks]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
