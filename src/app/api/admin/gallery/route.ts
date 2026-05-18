// GET  — list all gallery items (admin, all published states)
// POST — create a video item (images go through /api/media/confirm)

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Collections } from "@/lib/db/collections";
import type { GalleryCategory } from "@/lib/models/Gallery";
import { extractYoutubeId } from "@/lib/youtube";

const ALLOWED_ROLES = ["admin", "webmaster"];

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
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "24"));
    const skip = (page - 1) * limit;
    const category = url.searchParams.get("category") as GalleryCategory | null;
    const published = url.searchParams.get("published");

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (published !== null) filter.published = published === "true";

    const [items, total] = await Promise.all([
      Collections.gallery(db)
        .find(filter)
        .sort({ featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      Collections.gallery(db).countDocuments(filter),
    ]);

    return NextResponse.json({
      items: items.map(serialize),
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
    console.error("[GET /api/admin/gallery]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// POST — create a video entry (YouTube)
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
      youtubeUrl,
      category,
      caption,
      eventId,
      featured,
      published,
      order,
    } = body;

    if (!youtubeUrl || !category) {
      return NextResponse.json(
        { error: "youtubeUrl and category are required for video items" },
        { status: 400 },
      );
    }

    // Extract YouTube ID from various URL formats
    const youtubeId = extractYoutubeId(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json(
        { error: "Could not extract YouTube video ID from URL" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();

    const result = await Collections.gallery(db).insertOne({
      mediaType: "video",
      youtubeId,
      youtubeUrl,
      category,
      caption: caption?.trim() || undefined,
      eventId: eventId ? new ObjectId(eventId) : undefined,
      featured: Boolean(featured),
      published: Boolean(published),
      order: order ?? 0,
      createdBy: new ObjectId(req.auth.vaultId),
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: result.insertedId.toString(), ok: true });
  } catch (err) {
    console.error("[POST /api/admin/gallery]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// ── Serializer ────────────────────────────────────────────────────────────────

function serialize(item: import("@/lib/models/Gallery").GalleryDocument) {
  return {
    id: item._id!.toString(),
    mediaType: item.mediaType,
    imageUrl: item.imageUrl ?? null,
    imagePublicId: item.imagePublicId ?? null,
    youtubeId: item.youtubeId ?? null,
    youtubeUrl: item.youtubeUrl ?? null,
    category: item.category,
    caption: item.caption ?? null,
    eventId: item.eventId?.toString() ?? null,
    featured: item.featured,
    published: item.published,
    order: item.order,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
