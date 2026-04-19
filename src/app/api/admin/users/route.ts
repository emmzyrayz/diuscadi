// GET /api/admin/users
// Admin + webmaster only. Lists all users with optional filters.
// Query params: ?role= ?status= ?search= ?page= ?limit= ?export=csv

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
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const exportCsv = searchParams.get("export") === "csv";
    const skip = (page - 1) * limit;

    const db = await getDb();

    // ── Filters ───────────────────────────────────────────────────────────────
    const vaultFilter: Record<string, unknown> = {};
    if (role) vaultFilter.role = role;
    if (status === "active") vaultFilter.isAccountActive = true;
    if (status === "suspended") vaultFilter.isAccountActive = false;

    const userFilter: Record<string, unknown> = {};
    if (search) {
      userFilter.$or = [
        { "fullName.firstname": { $regex: search, $options: "i" } },
        { "fullName.lastname": { $regex: search, $options: "i" } },
      ];
    }

    // ── Shared pipeline base ──────────────────────────────────────────────────
    const basePipeline: object[] = [
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
    ];

    // ── CSV export branch ─────────────────────────────────────────────────────
    if (exportCsv) {
      const exportPipeline = [
        ...basePipeline,
        { $sort: { createdAt: -1 as const } },
        { $limit: 10000 },
        {
          $project: {
            _id: 0,
            firstname: { $ifNull: ["$fullName.firstname", ""] },
            lastname: { $ifNull: ["$fullName.lastname", ""] },
            email: { $ifNull: ["$vault.email", ""] },
            role: { $ifNull: ["$vault.role", "participant"] },
            membershipStatus: { $ifNull: ["$membershipStatus", ""] },
            eduStatus: { $ifNull: ["$eduStatus", ""] },
            committee: {
              $ifNull: ["$committeeMembership.committee", ""],
            },
            committeeRole: {
              $ifNull: ["$committeeMembership.role", ""],
            },
            institution: { $ifNull: ["$Institution.name", ""] },
            institutionAbbr: {
              $ifNull: ["$Institution.abbreviation", ""],
            },
            faculty: { $ifNull: ["$Institution.faculty", ""] },
            department: { $ifNull: ["$Institution.department", ""] },
            level: { $ifNull: ["$Institution.level", ""] },
            isAccountActive: {
              $ifNull: ["$vault.isAccountActive", true],
            },
            isEmailVerified: {
              $ifNull: ["$vault.isEmailVerified", false],
            },
            eventsRegistered: {
              $ifNull: ["$analytics.eventsRegistered", 0],
            },
            eventsAttended: {
              $ifNull: ["$analytics.eventsAttended", 0],
            },
            createdAt: 1,
            lastLoginAt: { $ifNull: ["$vault.lastLoginAt", null] },
          },
        },
      ];

      const rows = await Collections.userData(db)
        .aggregate(exportPipeline)
        .toArray();

      const headers = [
        "First Name",
        "Last Name",
        "Email",
        "Role",
        "Membership Status",
        "Edu Status",
        "Committee",
        "Committee Role",
        "Institution",
        "Abbreviation",
        "Faculty",
        "Department",
        "Level",
        "Account Active",
        "Email Verified",
        "Events Registered",
        "Events Attended",
        "Joined At",
        "Last Login",
      ];

      const escape = (v: unknown): string => {
        const s = v == null ? "" : String(v);
        return s.includes(",") || s.includes("\n") || s.includes('"')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };

      const formatDate = (d: unknown): string => {
        if (!d) return "";
        try {
          return new Date(d as string).toLocaleString("en-NG", {
            timeZone: "Africa/Lagos",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
        } catch {
          return String(d);
        }
      };

      const csvLines = [
        headers.join(","),
        ...rows.map((r) =>
          [
            escape(r.firstname),
            escape(r.lastname),
            escape(r.email),
            escape(r.role),
            escape(r.membershipStatus),
            escape(r.eduStatus),
            escape(r.committee),
            escape(r.committeeRole),
            escape(r.institution),
            escape(r.institutionAbbr),
            escape(r.faculty),
            escape(r.department),
            escape(r.level),
            escape(r.isAccountActive ? "Yes" : "No"),
            escape(r.isEmailVerified ? "Yes" : "No"),
            escape(r.eventsRegistered),
            escape(r.eventsAttended),
            escape(formatDate(r.createdAt)),
            escape(formatDate(r.lastLoginAt)),
          ].join(","),
        ),
      ];

      const csv = csvLines.join("\n");
      const filename = `diuscadi-users-${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // ── JSON response (paginated) ─────────────────────────────────────────────
    const pipeline = [
      ...basePipeline,
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
          email: vault.email,
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
