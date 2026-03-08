// GET /api/admin/users
// Admin + webmaster only. Lists all users with optional filters.
// Query params: ?role= ?status= ?search= ?page= ?limit=

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

const ALLOWED_ROLES = ["admin", "webmaster"];

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!ALLOWED_ROLES.includes(req.auth.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status"); // "active" | "suspended"
    const search = searchParams.get("search"); // name or email
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const skip = (page - 1) * limit;

    const db = await getDb();

    // Build vault filter
    const vaultFilter: Record<string, unknown> = {};
    if (role) vaultFilter.role = role;
    if (status === "active") vaultFilter.isAccountActive = true;
    if (status === "suspended") vaultFilter.isAccountActive = false;

    // Build userData filter
    const userFilter: Record<string, unknown> = {};
    if (search) {
      userFilter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Aggregate: join vault + userData
    const pipeline = [
      { $match: userFilter },
      {
        $lookup: {
          from: "vault",
          localField: "vaultId",
          foreignField: "_id",
          as: "vault",
        },
      },
      { $unwind: "$vault" },
      ...(Object.keys(vaultFilter).length > 0
        ? [
            {
              $match: Object.fromEntries(
                Object.entries(vaultFilter).map(([k, v]) => [`vault.${k}`, v]),
              ),
            },
          ]
        : []),
      {
        $facet: {
          total: [{ $count: "count" }],
          users: [
            { $sort: { createdAt: -1 as const } },
            { $skip: skip },
            { $limit: limit },
          ],
        },
      },
    ];

    const [result] = await Collections.userData(db)
      .aggregate(pipeline)
      .toArray();
    const total = (result.total[0]?.count ?? 0) as number;
    const users = result.users as Array<Record<string, unknown>>;

    return NextResponse.json({
      users: users.map((u) => {
        const vault = u.vault as Record<string, unknown>;
        return {
          id: u._id!.toString(),
          vaultId: (u.vaultId as ObjectId).toString(),
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          avatar: u.avatar ?? null,
          role: vault.role,
          eduStatus: u.eduStatus,
          committee: u.committee ?? null,
          skills: u.skills ?? [],
          profileCompleted: u.profileCompleted,
          membershipStatus: u.membershipStatus,
          isAccountActive: vault.isAccountActive,
          isEmailVerified: vault.isEmailVerified,
          analytics: u.analytics,
          createdAt: (u.createdAt as Date).toISOString(),
          lastLoginAt: vault.lastLoginAt
            ? (vault.lastLoginAt as Date).toISOString()
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
    console.error("[GET /api/admin/users]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
