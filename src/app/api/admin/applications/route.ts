// GET /api/admin/applications
// Admin + webmaster + moderator. List all applications with optional filters.
// Query: ?status=pending|approved|rejected &type=committee|skills &page= &limit=

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

const ALLOWED_ROLES = ["admin", "webmaster", "moderator"];

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!ALLOWED_ROLES.includes(req.auth.role)) {
      return NextResponse.json(
        { error: "Moderator access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "pending";
    const type = searchParams.get("type");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { status };
    if (type) filter.type = type;

    const db = await getDb();
    const col = Collections.applications(db);
    const total = await col.countDocuments(filter);

    const applications = await col
      .find(filter)
      .sort({ createdAt: 1 }) // oldest pending first
      .skip(skip)
      .limit(limit)
      .toArray();

    // Enrich with user names
    const userIds = applications.map((a) => a.userId);
    const users = await Collections.userData(db)
      .find(
        { _id: { $in: userIds } },
        { projection: { fullName: 1, email: 1, avatar: 1 } },
      )
      .toArray();
    const userMap = new Map(users.map((u) => [u._id!.toString(), u]));

    return NextResponse.json({
      applications: applications.map((a) => {
        const user = userMap.get(a.userId.toString());
        return {
          id: a._id!.toString(),
          type: a.type,
          status: a.status,
          requestedCommittee: a.requestedCommittee ?? null,
          requestedSkills: a.requestedSkills ?? null,
          reason: a.reason ?? null,
          reviewNote: a.reviewNote ?? null,
          reviewedAt: a.reviewedAt?.toISOString() ?? null,
          createdAt: a.createdAt.toISOString(),
          user: user
            ? {
                id: user._id!.toString(),
                fullName: user.fullName,
                email: user.email,
                avatar: user.avatar ?? null,
              }
            : null,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/applications]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
