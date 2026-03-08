// GET  /api/admin/invites — admin + webmaster, list all invite codes
// POST /api/admin/invites — admin + webmaster, generate new invite code(s)
// Body for POST: { count?: number, maxUses?: number, expiresAt?: string, note?: string }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { generateInviteCode } from "@/lib/auth";

const ALLOWED_ROLES = ["admin", "webmaster"];

// ── GET ───────────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!ALLOWED_ROLES.includes(req.auth.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // active | used | expired | revoked
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
    const skip = (page - 1) * limit;

    const db = await getDb();
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    // Auto-expire codes past their expiresAt
    await Collections.invites(db).updateMany(
      { expiresAt: { $lt: new Date() }, status: "active" },
      { $set: { status: "expired", updatedAt: new Date() } },
    );

    const total = await Collections.invites(db).countDocuments(filter);
    const invites = await Collections.invites(db)
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      invites: invites.map((inv) => ({
        id: inv._id!.toString(),
        code: inv.code,
        status: inv.status,
        maxUses: inv.maxUses,
        useCount: inv.useCount,
        note: inv.note ?? null,
        expiresAt: inv.expiresAt?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
      })),
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
    console.error("[GET /api/admin/invites]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// ── POST ──────────────────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!ALLOWED_ROLES.includes(req.auth.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const {
      count = 1,
      maxUses = 1,
      expiresAt,
      note,
    } = await req.json().catch(() => ({}));
    const batchCount = Math.min(50, Math.max(1, parseInt(String(count))));

    const db = await getDb();
    const createdBy = new ObjectId(req.auth.vaultId);
    const now = new Date();
    const created = [];

    for (let i = 0; i < batchCount; i++) {
      // Retry to avoid rare collisions
      let code = "";
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateInviteCode();
        const exists = await Collections.invites(db).findOne({
          code: candidate,
        });
        if (!exists) {
          code = candidate;
          break;
        }
      }
      if (!code) continue;

      const doc = {
        code,
        status: "active" as const,
        createdBy,
        note: note ?? null,
        maxUses: Math.max(1, parseInt(String(maxUses))),
        useCount: 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdAt: now,
        updatedAt: now,
      };

      const { insertedId } = await Collections.invites(db).insertOne(
        doc as never,
      );
      created.push({ id: insertedId.toString(), code, maxUses: doc.maxUses });
    }

    return NextResponse.json(
      {
        message: `${created.length} invite code(s) generated`,
        invites: created,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/invites]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
