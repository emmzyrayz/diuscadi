// src/app/api/members/points/route.ts
// ─── GET /api/members/points ──────────────────────────────────────────────────
// Auth required. Returns:
//   - The authenticated user's current and lifetime points balance
//   - Paginated PointsLog entries (50 per page) with optional source-group
//     filtering
//
// Query params:
//   group    "all" | "referrals" | "tasks" | "admin"  (default "all")
//   page     number (default 1)
//
// Source group mapping:
//   "referrals" → source IN ["referral_signup", "referral_event_reg"]
//   "tasks"     → source IN ["task_completion", "task_poll", "task_survey",
//                             "task_acknowledgement", "task_learning"]
//   "admin"     → source IN ["admin_grant", "admin_deduct", "redemption"]
//   "all"       → no filter
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import type { PointsLogSource } from "@/lib/models/PointsLog";

const LIMIT = 50;

const SOURCE_GROUPS: Record<string, PointsLogSource[]> = {
  referrals: ["referral_signup", "referral_event_reg"],
  tasks: [
    "task_completion",
    "task_poll",
    "task_survey",
    "task_acknowledgement",
    "task_learning",
  ],
  admin: ["admin_grant", "admin_deduct", "redemption"],
};

// Human-readable labels for the flat history list rows.
const SOURCE_LABELS: Record<PointsLogSource, string> = {
  referral_signup: "Referral — Signup",
  referral_event_reg: "Referral — Event Registration",
  task_completion: "Task Completed",
  task_poll: "Poll Completed",
  task_survey: "Survey Completed",
  task_acknowledgement: "Acknowledgement",
  task_learning: "Learning Task",
  admin_grant: "Admin Grant",
  admin_deduct: "Admin Deduction",
  redemption: "Redemption",
};

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    // ── 1. Load user balance ───────────────────────────────────────────────────

    const userData = await Collections.userData(db).findOne(
      { vaultId },
      {
        projection: {
          _id: 1,
          "points.current": 1,
          "points.lifetime": 1,
          "points.lastCreditedAt": 1,
          "referralMeta.totalEarned": 1,
        },
      },
    );

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userData._id as ObjectId;

    // ── 2. Parse query params ──────────────────────────────────────────────────

    const { searchParams } = new URL(req.url);
    const group = searchParams.get("group") ?? "all";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const skip = (page - 1) * LIMIT;

    // ── 3. Build source filter ────────────────────────────────────────────────

    const sourceFilter =
      group !== "all" && SOURCE_GROUPS[group]
        ? { source: { $in: SOURCE_GROUPS[group] } }
        : {};

    const logQuery = { userId, ...sourceFilter };

    // ── 4. Fetch log entries + total count (parallel) ─────────────────────────

    const [entries, total] = await Promise.all([
      db
        .collection("pointsLog")
        .find(logQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(LIMIT)
        .toArray(),
      db.collection("pointsLog").countDocuments(logQuery),
    ]);

    // ── 5. Enrich entries — resolve referee names and task titles ──────────────
    // We collect the unique refereeUserIds and taskIds from this page's entries,
    // then do two parallel lookups. Better than N+1 queries per row.

    const refereeIds = [
      ...new Set(
        entries
          .filter((e) => e.refereeUserId)
          .map((e) => (e.refereeUserId as ObjectId).toString()),
      ),
    ];

    const taskIds = [
      ...new Set(
        entries
          .filter((e) => e.taskId)
          .map((e) => (e.taskId as ObjectId).toString()),
      ),
    ];

    const [refereeUsers, taskDocs] = await Promise.all([
      refereeIds.length > 0
        ? Collections.userData(db)
            .find(
              { _id: { $in: refereeIds.map((id) => new ObjectId(id)) } },
              { projection: { _id: 1, fullName: 1 } },
            )
            .toArray()
        : Promise.resolve([]),
      taskIds.length > 0
        ? Collections.tasks(db)
            .find(
              { _id: { $in: taskIds.map((id) => new ObjectId(id)) } },
              { projection: { _id: 1, title: 1 } },
            )
            .toArray()
        : Promise.resolve([]),
    ]);

    const refereeMap = new Map(
      refereeUsers.map((u) => {
        const fn = u.fullName as
          | { firstname?: string; lastname?: string }
          | undefined;
        return [
          (u._id as ObjectId).toString(),
          [fn?.firstname, fn?.lastname].filter(Boolean).join(" ") || "Member",
        ];
      }),
    );

    const taskMap = new Map(
      taskDocs.map((t) => [(t._id as ObjectId).toString(), t.title as string]),
    );

    // ── 6. Shape log entries ──────────────────────────────────────────────────

    const history = entries.map((entry) => {
      const source = entry.source as PointsLogSource;
      const refereeId = entry.refereeUserId
        ? (entry.refereeUserId as ObjectId).toString()
        : null;
      const taskId = entry.taskId
        ? (entry.taskId as ObjectId).toString()
        : null;

      // Context line shown below the source label in the history row.
      // Priority: task title > referee name > reason (admin) > nothing.
      let context: string | null = null;
      if (taskId && taskMap.has(taskId)) {
        context = taskMap.get(taskId)!;
      } else if (refereeId && refereeMap.has(refereeId)) {
        const depth = entry.referralDepth as number | undefined;
        const name = refereeMap.get(refereeId)!;
        context =
          depth && depth > 1 ? `${name} (indirect — depth ${depth})` : name;
      } else if (entry.reason) {
        context = entry.reason as string;
      }

      return {
        id: (entry._id as ObjectId).toString(),
        source,
        sourceLabel: SOURCE_LABELS[source] ?? source,
        amount: entry.amount as number,
        lifetimeAfter: entry.lifetimeAfter as number,
        referralDepth: (entry.referralDepth as number | undefined) ?? null,
        context,
        createdAt: (entry.createdAt as Date).toISOString(),
      };
    });

    // ── 7. Aggregate group totals (for the filter chip badges) ────────────────
    // One aggregation pipeline gives us a count per source for this user.
    // Used to show "Referrals (12)" etc. on the filter chips.

    const groupTotals = await db
      .collection("pointsLog")
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$source",
            count: { $sum: 1 },
            earned: {
              $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] },
            },
          },
        },
      ])
      .toArray();

    const byGroup = { referrals: 0, tasks: 0, admin: 0 };
    for (const row of groupTotals) {
      const src = row._id as PointsLogSource;
      if (SOURCE_GROUPS.referrals.includes(src)) byGroup.referrals += row.count;
      else if (SOURCE_GROUPS.tasks.includes(src)) byGroup.tasks += row.count;
      else if (SOURCE_GROUPS.admin.includes(src)) byGroup.admin += row.count;
    }

    // ── 8. Build response ──────────────────────────────────────────────────────

    const points = userData.points as
      | { current?: number; lifetime?: number; lastCreditedAt?: Date }
      | undefined;

    return NextResponse.json({
      balance: {
        current: points?.current ?? 0,
        lifetime: points?.lifetime ?? 0,
        lastCreditedAt: points?.lastCreditedAt
          ? (points.lastCreditedAt as Date).toISOString()
          : null,
        fromReferrals:
          (userData.referralMeta as { totalEarned?: number } | undefined)
            ?.totalEarned ?? 0,
      },
      history,
      pagination: {
        page,
        limit: LIMIT,
        total,
        totalPages: Math.ceil(total / LIMIT),
        hasNext: page * LIMIT < total,
        hasPrev: page > 1,
      },
      groupCounts: {
        all: total,
        ...byGroup,
      },
    });
  } catch (err) {
    console.error("[GET /api/members/points]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
