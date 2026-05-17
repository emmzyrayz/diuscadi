// GET  — list all announcements (admin, all statuses)
// POST — create a new announcement

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Collections } from "@/lib/db/collections";
import type { AnnouncementDocument } from "@/lib/models/Announcement";

const ALLOWED_ROLES = ["admin", "webmaster"];

// ── GET /api/admin/settings/announcements ─────────────────────────────────────

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  if (!ALLOWED_ROLES.includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const db = await getDb();
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20"));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    const audience = url.searchParams.get("audience");
    const published = url.searchParams.get("published");
    if (audience) filter.audience = audience;
    if (published !== null) filter.published = published === "true";

    const [items, total] = await Promise.all([
      Collections.announcements(db)
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      Collections.announcements(db).countDocuments(filter),
    ]);

    return NextResponse.json({
      announcements: items.map(serializeAnnouncement),
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
    console.error("[GET /api/admin/settings/announcements]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// ── POST /api/admin/settings/announcements ────────────────────────────────────

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  if (!ALLOWED_ROLES.includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const {
      title,
      desc,
      type,
      audience,
      targetCommittee,
      published,
      expiresAt,
      ctaLabel,
      ctaHref,
    } = body;

    if (!title?.trim() || !desc?.trim() || !type || !audience) {
      return NextResponse.json(
        { error: "title, desc, type, and audience are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();
    const createdBy = new ObjectId(req.auth.vaultId);

    const doc: AnnouncementDocument = {
      title: title.trim(),
      desc: desc.trim(),
      type,
      audience,
      targetCommittee: audience === "committee" ? targetCommittee : undefined,
      published: Boolean(published),
      publishedAt: published ? now : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      ctaLabel: ctaLabel?.trim() || undefined,
      ctaHref: ctaHref?.trim() || undefined,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    const result = await Collections.announcements(db).insertOne(doc);

    return NextResponse.json({
      announcementId: result.insertedId.toString(),
      ok: true,
    });
  } catch (err) {
    console.error("[POST /api/admin/settings/announcements]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// ── Serializer ────────────────────────────────────────────────────────────────

function serializeAnnouncement(doc: AnnouncementDocument) {
  return {
    id: doc._id!.toString(),
    title: doc.title,
    desc: doc.desc,
    type: doc.type,
    audience: doc.audience,
    targetCommittee: doc.targetCommittee ?? null,
    published: doc.published,
    publishedAt: doc.publishedAt?.toISOString() ?? null,
    expiresAt: doc.expiresAt?.toISOString() ?? null,
    ctaLabel: doc.ctaLabel ?? null,
    ctaHref: doc.ctaHref ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
