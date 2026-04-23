// GET /api/admin/analytics
// Admin + webmaster. Returns platform-wide stats:
// user counts, event counts, registration counts, top events, recent signups.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

const ALLOWED_ROLES = ["admin", "webmaster"];

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!ALLOWED_ROLES.includes(req.auth.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const db = await getDb();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    

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
      },
      events: {
        total: totalEvents,
        upcoming: upcomingEvents,
        byStatus: Object.fromEntries(
          eventsByStatus.map((r) => [r._id ?? "unknown", r.count]),
        ),
      },
      registrations: {
        total: totalRegistrations,
        thisMonth: registrationsThisMonth,
        checkedIn: checkedInCount,
        attendanceRate:
          totalRegistrations > 0
            ? Math.round((checkedInCount / totalRegistrations) * 100)
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
