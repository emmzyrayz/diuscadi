// GET /api/admin/analytics
// Admin + webmaster. Returns platform-wide stats:
// user counts, event counts, registration counts, top events, recent signups.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { canAccessAdminPanel } from "@/lib/roles";


export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!canAccessAdminPanel(req.auth.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const db = await getDb();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Extract dynamic filters introduced in the update
    const { searchParams } = new URL(req.url);
    const committeeParam = searchParams.get("committee");
    const committeeFilter = committeeParam
      ? { committeeSlug: committeeParam }
      : {};

    const [
      totalUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      usersByRole,
      usersByEduStatus,
      totalEvents,
      eventsByStatus,
      upcomingEvents,
      totalRegistrations,
      registrationsThisMonth,
      checkedInCount,
      topEvents,
      recentSignups,
      healthSummary,
      hourlyVisitDocs,
      latestPredictionLog,
      funnelEventListingViews,
      funnelEventDetailViews,
      funnelRegisterPageViews,
      dropoffEmailUnverified,
      dropoffProfileIncomplete,
      profileCompleted,
      guestTotalAll, // Total ever (including migrated)
      guestTotalUnmigrated, // Active unmigrated only
      guestThisMonth, // Unmigrated, registered last 30 days
      guestCheckedIn, // Unmigrated, checked-in status

      totalGuestProfiles,
      migratedGuestCount,
      pendingMigrationCount,
      committeeBreakdown,
      skillsData,
      topDirectReferrers,
      referralStats,
      referralPointsDistributed,
      taskTypeBreakdown,
      taskStatusBreakdown,
      flaggedAssignments,
      pendingApprovalTasks,
      totalPointsDistributed,
      pointsBySource,
      topPointsEarners,
      pointsThisMonth,
    ] = await Promise.all([
      // Users
      Collections.userData(db).countDocuments(),
      Collections.userData(db).countDocuments({
        createdAt: { $gte: sevenDaysAgo },
      }),
      Collections.userData(db).countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
      }),
      Collections.vault(db)
        .aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }])
        .toArray(),
      Collections.userData(db)
        .aggregate([{ $group: { _id: "$eduStatus", count: { $sum: 1 } } }])
        .toArray(),

      // Events
      Collections.events(db).countDocuments(),
      Collections.events(db)
        .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
        .toArray(),
      Collections.events(db).countDocuments({
        status: "published",
        eventDate: { $gte: now },
      }),

      // Registrations
      Collections.eventRegistrations(db).countDocuments(),
      Collections.eventRegistrations(db).countDocuments({
        registeredAt: { $gte: thirtyDaysAgo },
      }),
      Collections.eventRegistrations(db).countDocuments({
        status: "checked-in",
      }),

      // Top 5 events by registration count
      Collections.eventRegistrations(db)
        .aggregate([
          { $match: { status: { $in: ["registered", "checked-in"] } } },
          { $group: { _id: "$eventId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "events",
              localField: "_id",
              foreignField: "_id",
              as: "event",
            },
          },
          { $unwind: "$event" },
          {
            $project: {
              eventId: "$_id",
              title: "$event.title",
              slug: "$event.slug",
              eventDate: "$event.eventDate",
              count: 1,
            },
          },
        ])
        .toArray(),

      // 5 most recent signups
      Collections.userData(db)
        .find(
          {},
          {
            projection: {
              fullName: 1,
              email: 1,
              role: 1,
              eduStatus: 1,
              createdAt: 1,
            },
          },
        )
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),

      // Health: browser breakdown (last 30 days)
      Collections.healthReports(db)
        .aggregate([
          { $match: { reportedAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: "$browser.name",
              count: { $sum: 1 },
              avgLcp: { $avg: "$lcp" },
            },
          },
          { $sort: { count: -1 } },
        ])
        .toArray(),

      Collections.pageVisits(db)
        .aggregate([
          // Last 30 days of visits for pattern analysis
          { $match: { timestamp: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: "$hour",
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      Collections.predictionLogs(db).findOne({}, { sort: { appliedAt: -1 } }),

      // Funnel: event listing views (last 30 days)
      Collections.pageVisits(db).countDocuments({
        timestamp: { $gte: thirtyDaysAgo },
        page: "/events",
      }),

      // Funnel: event detail views (last 30 days)
      // Any /events/* page that isn't /events or /events/*/register
      Collections.pageVisits(db).countDocuments({
        timestamp: { $gte: thirtyDaysAgo },
        page: { $regex: "^/events/[^/]+$", $options: "i" },
      }),

      // Funnel: registration page views (last 30 days)
      Collections.pageVisits(db).countDocuments({
        timestamp: { $gte: thirtyDaysAgo },
        page: { $regex: "^/events/.+/register$", $options: "i" },
      }),

      // Drop-off: email verification incomplete (pending verification)
      Collections.vault(db).countDocuments({
        isEmailVerified: false,
        createdAt: { $gte: thirtyDaysAgo },
      }),

      // Drop-off: profile incomplete (no avatar after 3+ days)
      Collections.userData(db).countDocuments({
        hasAvatar: false,
        createdAt: { $lte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      }),

      // Profile completion: total users with avatar
      Collections.userData(db).countDocuments({ hasAvatar: true }),

      Collections.guestEventRegistrations(db).countDocuments({
        verifiedAt: { $exists: true },
        // COUNT ALL (including migrated) for total guest registrations
      }),

      Collections.guestEventRegistrations(db).countDocuments({
        verifiedAt: { $exists: true },
        migratedToUserId: { $exists: false }, // ← EXCLUDE MIGRATED
      }),

      Collections.guestEventRegistrations(db).countDocuments({
        verifiedAt: { $exists: true },
        registeredAt: { $gte: thirtyDaysAgo },
        migratedToUserId: { $exists: false }, // ← EXCLUDE MIGRATED
      }),

      Collections.guestEventRegistrations(db).countDocuments({
        status: "checked-in",
        migratedToUserId: { $exists: false }, // ← EXCLUDE MIGRATED
      }),
      Collections.guestProfiles(db).countDocuments({}),
      Collections.guestProfiles(db).countDocuments({
        migratedToUserId: { $exists: true },
      }),
      Collections.guestProfiles(db).countDocuments({
        migratedToUserId: { $exists: false },
        mergeStatus: { $ne: "migrated" },
      }),

      Collections.userData(db)
        .aggregate([
          {
            $match: {
              "committeeMembership.committee": { $exists: true, $ne: null },
            },
          },
          {
            $group: {
              _id: "$committeeMembership.committee",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ])
        .toArray(),

      Collections.userData(db)
        .aggregate([
          { $unwind: "$skills" },
          { $group: { _id: "$skills", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .toArray(),

      Collections.userData(db)
        .aggregate([
          { $match: { "referralMeta.directCount": { $gt: 0 } } },
          { $sort: { "referralMeta.directCount": -1 } },
          { $limit: 10 },
          {
            $project: {
              _id: 1,
              fullName: 1,
              referralMeta: 1,
              "committeeMembership.committee": 1,
            },
          },
        ])
        .toArray(),

      Collections.userData(db)
        .aggregate([
          {
            $group: {
              _id: null,
              totalWithReferrer: {
                $sum: { $cond: [{ $ifNull: ["$referredBy", false] }, 1, 0] },
              },
              totalDirectReferrals: {
                $sum: { $ifNull: ["$referralMeta.directCount", 0] },
              },
              totalIndirectReferrals: {
                $sum: { $ifNull: ["$referralMeta.indirectCount", 0] },
              },
              maxDepthReached: {
                $max: { $ifNull: ["$referralMeta.treeDepthReached", 0] },
              },
            },
          },
        ])
        .toArray(),

      db
        .collection("pointsLog")
        .aggregate([
          {
            $match: {
              source: { $in: ["referral_signup", "referral_event_reg"] },
            },
          },
          {
            $group: {
              _id: "$source",
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),

      Collections.assignments(db)
        .aggregate([
          { $match: { status: "evaluated", ...committeeFilter } },
          {
            $lookup: {
              from: "tasks",
              localField: "taskId",
              foreignField: "_id",
              as: "task",
            },
          },
          { $unwind: { path: "$task", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: "$task.taskType",
              completions: { $sum: 1 },
              avgScore: { $avg: "$evaluation.percentageScore" },
              totalPoints: {
                $sum: { $ifNull: ["$evaluation.pointsAwarded.totalPoints", 0] },
              },
            },
          },
        ])
        .toArray(),

      Collections.tasks(db)
        .aggregate([
          { $match: committeeFilter },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ])
        .toArray(),

      Collections.assignments(db).countDocuments({
        "evaluation.flaggedForHumanReview": true,
        status: "under_review",
      }),
      Collections.tasks(db).countDocuments({ status: "pending_approval" }),

      db
        .collection("pointsLog")
        .aggregate([
          { $match: { amount: { $gt: 0 } } },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),

      db
        .collection("pointsLog")
        .aggregate([
          { $match: { amount: { $gt: 0 } } },
          {
            $group: {
              _id: "$source",
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
        ])
        .toArray(),

      Collections.userData(db)
        .aggregate([
          { $match: { "points.lifetime": { $gt: 0 } } },
          { $sort: { "points.lifetime": -1 } },
          { $limit: 10 },
          {
            $project: {
              _id: 1,
              fullName: 1,
              points: 1,
              "committeeMembership.committee": 1,
            },
          },
        ])
        .toArray(),

      db
        .collection("pointsLog")
        .aggregate([
          {
            $match: {
              amount: { $gt: 0 },
              createdAt: {
                $gte: new Date(now.getFullYear(), now.getMonth(), 1),
              },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ])
        .toArray(),
    ]);

    const hourlyVisitMap = Object.fromEntries(
      (hourlyVisitDocs as { _id: number; count: number }[]).map((h) => [
        h._id,
        h.count,
      ]),
    );
    const maxVisits = Math.max(1, ...Object.values(hourlyVisitMap));
    const hourlyVisits = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyVisitMap[hour] ?? 0,
      // Normalise to 0–100 for the chart
      volume: Math.round(((hourlyVisitMap[hour] ?? 0) / maxVisits) * 100),
    }));

    const refPointsMap: Record<string, { total: number; count: number }> = {};
    for (const r of referralPointsDistributed)
      refPointsMap[r._id as string] = {
        total: r.total as number,
        count: r.count as number,
      };

    const taskTypeMap: Record<
      string,
      { completions: number; avgScore: number; totalPoints: number }
    > = {};
    for (const t of taskTypeBreakdown)
      taskTypeMap[t._id as string] = {
        completions: t.completions as number,
        avgScore: Math.round((t.avgScore as number) ?? 0),
        totalPoints: t.totalPoints as number,
      };

    const taskStatusMap: Record<string, number> = {};
    for (const t of taskStatusBreakdown)
      taskStatusMap[t._id as string] = t.count as number;

    const pointsSourceMap: Record<string, { total: number; count: number }> =
      {};
    for (const p of pointsBySource)
      pointsSourceMap[p._id as string] = {
        total: p.total as number,
        count: p.count as number,
      };

    const refStats = referralStats[0] ?? {
      totalWithReferrer: 0,
      totalDirectReferrals: 0,
      totalIndirectReferrals: 0,
      maxDepthReached: 0,
    };

    const nameFromDoc = (doc: Record<string, unknown>) => {
      const fn = doc.fullName as
        | { firstname?: string; lastname?: string }
        | undefined;
      return (
        [fn?.firstname, fn?.lastname].filter(Boolean).join(" ").trim() ||
        "Member"
      );
    };

    return NextResponse.json({
      users: {
        total: totalUsers,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
        byRole: Object.fromEntries(
          usersByRole.map((r) => [r._id ?? "unknown", r.count]),
        ),
        byEduStatus: Object.fromEntries(
          usersByEduStatus.map((r) => [r._id ?? "unknown", r.count]),
        ),
        committeeBreakdown: committeeBreakdown.map((c) => ({
          committee: c._id,
          count: c.count,
        })),
        topSkills: skillsData.map((s) => ({ skill: s._id, count: s.count })),
      },
      events: {
        total: totalEvents,
        upcoming: upcomingEvents,
        byStatus: Object.fromEntries(
          eventsByStatus.map((r) => [r._id ?? "unknown", r.count]),
        ),
      },
      registrations: {
        total: totalRegistrations + guestTotalUnmigrated, // Only active guests
        thisMonth: registrationsThisMonth + guestThisMonth,
        checkedIn: checkedInCount + guestCheckedIn,
        attendanceRate:
          totalRegistrations + guestTotalUnmigrated > 0
            ? Math.round(
                ((checkedInCount + guestCheckedIn) /
                  (totalRegistrations + guestTotalUnmigrated)) *
                  100,
              )
            : 0,

        // ── Detailed breakdown ──────────────────────────────────────────────────
        userTotal: totalRegistrations,
        userThisMonth: registrationsThisMonth,
        userCheckedIn: checkedInCount,

        guestTotalAll, // All guests ever (including migrated)
        guestTotalUnmigrated, // Active unmigrated
        guestThisMonth,
        guestCheckedIn,

        // ── Guest profile migration tracking ────────────────────────────────────
        guestProfilesTotal: totalGuestProfiles,
        guestProfilesMigrated: migratedGuestCount, // Now excluded from counts
        guestProfilesPending: pendingMigrationCount,
        // ── Clarity flags for frontend ──────────────────────────────────────────
        hasMigratedGuests: migratedGuestCount > 0,
        migratedGuestPercentage:
          totalGuestProfiles > 0
            ? Math.round((migratedGuestCount / totalGuestProfiles) * 100)
            : 0,
      },
      topEvents: topEvents.map((e) => ({
        eventId: e.eventId.toString(),
        title: e.title,
        slug: e.slug,
        eventDate: (e.eventDate as Date).toISOString(),
        registrations: e.count,
      })),
      recentSignups: recentSignups.map((u) => ({
        id: u._id!.toString(),
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        eduStatus: u.eduStatus,
        createdAt: (u.createdAt as Date).toISOString(),
      })),
      health: {
        browserBreakdown: healthSummary.map((b) => ({
          browser: b._id ?? "Unknown",
          visits: b.count,
          avgLcpMs: b.avgLcp ? Math.round(b.avgLcp) : null,
        })),
      },
      hourlyVisits,
      prediction: {
        biasVector: latestPredictionLog?.biasVector ?? new Array(24).fill(0),
        accuracyPct: latestPredictionLog?.accuracyPct ?? null,
        maeScore: latestPredictionLog?.maeScore ?? null,
        lastValidatedDate: latestPredictionLog?.date ?? null,
        logCount: await Collections.predictionLogs(db).countDocuments(),
      },
      funnel: {
        eventListingViews: funnelEventListingViews,
        eventDetailViews: funnelEventDetailViews,
        registerPageViews: funnelRegisterPageViews,
        completedRegistrations: totalRegistrations, // already fetched
        dropoff: {
          emailUnverified: dropoffEmailUnverified,
          profileIncomplete: dropoffProfileIncomplete,
          profileCompletionRate:
            totalUsers > 0
              ? Math.round((profileCompleted / totalUsers) * 100)
              : 0,
        },
      },

      referrals: {
        platform: {
          usersWithReferrer: refStats.totalWithReferrer,
          totalDirectReferrals: refStats.totalDirectReferrals,
          totalIndirectReferrals: refStats.totalIndirectReferrals,
          maxTreeDepthReached: refStats.maxDepthReached,
          signupReferralPoints: refPointsMap["referral_signup"]?.total ?? 0,
          signupReferralCount: refPointsMap["referral_signup"]?.count ?? 0,
          eventReferralPoints: refPointsMap["referral_event_reg"]?.total ?? 0,
          eventReferralCount: refPointsMap["referral_event_reg"]?.count ?? 0,
        },
        topReferrers: topDirectReferrers.map((u) => ({
          userId: (u._id as ObjectId).toString(),
          name: nameFromDoc(u as Record<string, unknown>),
          committee: u.committeeMembership?.committee ?? null,
          directCount: u.referralMeta?.directCount ?? 0,
          indirectCount: u.referralMeta?.indirectCount ?? 0,
          totalEarned: u.referralMeta?.totalEarned ?? 0,
        })),
      },
      tasks: {
        statusBreakdown: {
          draft: taskStatusMap["draft"] ?? 0,
          pendingApproval: taskStatusMap["pending_approval"] ?? 0,
          active: taskStatusMap["active"] ?? 0,
          completed: taskStatusMap["completed"] ?? 0,
          cancelled: taskStatusMap["cancelled"] ?? 0,
          archived: taskStatusMap["archived"] ?? 0,
        },
        pendingApprovalCount: pendingApprovalTasks,
        flaggedAssignmentsCount: flaggedAssignments,
        byType: {
          submission: taskTypeMap["submission"] ?? {
            completions: 0,
            avgScore: 0,
            totalPoints: 0,
          },
          poll: taskTypeMap["poll"] ?? {
            completions: 0,
            avgScore: 0,
            totalPoints: 0,
          },
          survey: taskTypeMap["survey"] ?? {
            completions: 0,
            avgScore: 0,
            totalPoints: 0,
          },
          acknowledgement: taskTypeMap["acknowledgement"] ?? {
            completions: 0,
            avgScore: 0,
            totalPoints: 0,
          },
          learning: taskTypeMap["learning"] ?? {
            completions: 0,
            avgScore: 0,
            totalPoints: 0,
          },
        },
      },
      points: {
        totalDistributed: (totalPointsDistributed[0]?.total as number) ?? 0,
        totalTransactions: (totalPointsDistributed[0]?.count as number) ?? 0,
        thisMonth: (pointsThisMonth[0]?.total as number) ?? 0,
        bySource: pointsSourceMap,
        leaderboard: topPointsEarners.map((u) => ({
          userId: (u._id as ObjectId).toString(),
          name: nameFromDoc(u as Record<string, unknown>),
          committee: u.committeeMembership?.committee ?? null,
          lifetimePoints: u.points?.lifetime ?? 0,
          currentPoints: u.points?.current ?? 0,
        })),
      },
      generatedAt: now.toISOString(),
    });
  } catch (err) {
    console.error("[GET /api/admin/analytics]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
