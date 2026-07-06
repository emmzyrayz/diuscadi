// src/app/api/referrals/me/route.ts
// ─── GET /api/referrals/me ────────────────────────────────────────────────────
// Auth required. Returns the authenticated user's referral dashboard data:
//   - Their own invite code (for sharing)
//   - Denormalised tree counters from UserData.referralMeta (O(1) read)
//   - Recent PointsLog entries for referral sources (audit trail)
//   - Direct referrals list (depth-1): name, join date, points earned
//   - Indirect referral counts by depth (for tree UI)
//
// This route intentionally does NOT return the full recursive tree on every
// call — that would be an unbounded query. The tree inspection modal
// (admin or user) calls a separate paginated endpoint when needed.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    // ── 1. Load the authenticated user's UserData ──────────────────────────
    const userData = await Collections.userData(db).findOne(
      { vaultId },
      {
        projection: {
          _id: 1,
          signupInviteCode: 1,
          referralMeta: 1,
          "points.current": 1,
          "points.lifetime": 1,
        },
      },
    );

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userData._id as ObjectId;

    // ── 2. Fetch recent referral PointsLog entries (last 50) ──────────────
    const recentLogs = await db
      .collection("pointsLog")
      .find({
        userId,
        source: { $in: ["referral_signup", "referral_event_reg"] },
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // ── 3. Fetch direct referrals (depth-1) with member info ───────────────
    const directReferrals = await Collections.userData(db)
      .find(
        { referredBy: userData.signupInviteCode },
        {
          projection: {
            _id: 1,
            fullName: 1,
            createdAt: 1,
            "points.lifetime": 1,
            referralMeta: 1,
          },
        },
      )
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const directReferralIds = directReferrals.map((r) => r._id as ObjectId);

    const pointsEarnedPerReferee = await db
      .collection("pointsLog")
      .aggregate([
        {
          $match: {
            userId,
            refereeUserId: { $in: directReferralIds },
            source: { $in: ["referral_signup", "referral_event_reg"] },
          },
        },
        {
          $group: {
            _id: "$refereeUserId",
            totalEarned: { $sum: "$amount" },
          },
        },
      ])
      .toArray();

    const earnedMap = new Map(
      pointsEarnedPerReferee.map((e) => [
        e._id.toString(),
        e.totalEarned as number,
      ]),
    );

    // ── 4. Shape the direct referrals list ────────────────────────────────
    const directList = directReferrals.map((r) => {
      const id = (r._id as ObjectId).toString();
      const fn = r.fullName as
        | { firstname?: string; lastname?: string }
        | undefined;
      return {
        userId: id,
        name:
          [fn?.firstname, fn?.lastname].filter(Boolean).join(" ") || "Member",
        joinedAt: (r.createdAt as Date).toISOString(),
        theirDirectReferrals: r.referralMeta?.directCount ?? 0,
        pointsEarnedFromThem: earnedMap.get(id) ?? 0,
      };
    });

    // ── 5. Shape recent activity feed ─────────────────────────────────────
    const refereeIds = [
      ...new Set(
        recentLogs
          .filter((l) => l.refereeUserId)
          .map((l) => (l.refereeUserId as ObjectId).toString()),
      ),
    ];

    const refereeNames = await Collections.userData(db)
      .find(
        { _id: { $in: refereeIds.map((id) => new ObjectId(id)) } },
        { projection: { _id: 1, fullName: 1 } },
      )
      .toArray();

    const nameMap = new Map(
      refereeNames.map((u) => {
        const fn = u.fullName as
          | { firstname?: string; lastname?: string }
          | undefined;
        return [
          (u._id as ObjectId).toString(),
          [fn?.firstname, fn?.lastname].filter(Boolean).join(" ") || "Member",
        ];
      }),
    );

    const activityFeed = recentLogs.map((log) => ({
      logId: (log._id as ObjectId).toString(),
      source: log.source as string,
      amount: log.amount as number,
      referralDepth: (log.referralDepth as number | undefined) ?? null,
      refereeName: log.refereeUserId
        ? (nameMap.get((log.refereeUserId as ObjectId).toString()) ?? "Member")
        : null,
      createdAt: (log.createdAt as Date).toISOString(),
    }));

    // ── 6. Build response ──────────────────────────────────────────────────
    const meta = userData.referralMeta as
      | {
          directCount?: number;
          indirectCount?: number;
          totalEarned?: number;
          treeDepthReached?: number;
          lastReferralAt?: Date;
        }
      | undefined;

    return NextResponse.json({
      inviteCode: userData.signupInviteCode as string,
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/signup?ref=${userData.signupInviteCode}`,
      stats: {
        directCount: meta?.directCount ?? 0,
        indirectCount: meta?.indirectCount ?? 0,
        totalReferrals: (meta?.directCount ?? 0) + (meta?.indirectCount ?? 0),
        totalEarned: meta?.totalEarned ?? 0,
        treeDepthReached: meta?.treeDepthReached ?? 0,
        lastReferralAt: meta?.lastReferralAt
          ? (meta.lastReferralAt as Date).toISOString()
          : null,
      },
      points: {
        current:
          (userData.points as { current?: number } | undefined)?.current ?? 0,
        lifetime:
          (userData.points as { lifetime?: number } | undefined)?.lifetime ?? 0,
      },
      directReferrals: directList,
      activityFeed,
    });
  } catch (err) {
    console.error("[GET /api/referrals/me]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
