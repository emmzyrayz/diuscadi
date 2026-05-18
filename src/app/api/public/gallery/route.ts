// GET — public gallery feed, no auth required
// Returns published items ordered by: featured first, then order, then createdAt desc

import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import type { GalleryCategory } from "@/lib/models/Gallery";

export const revalidate = 60;

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const url = new URL(req.url);

    const category = url.searchParams.get("category") as GalleryCategory | null;
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
    const limit = Math.min(48, parseInt(url.searchParams.get("limit") ?? "24"));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { published: true };
    if (category) filter.category = category;

    const [items, total] = await Promise.all([
      Collections.gallery(db)
        .find(filter)
        .sort({ featured: -1, order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      Collections.gallery(db).countDocuments(filter),
    ]);

    return NextResponse.json({
      items: items.map((item) => ({
        id: item._id!.toString(),
        mediaType: item.mediaType,
        imageUrl: item.imageUrl ?? null,
        youtubeId: item.youtubeId ?? null,
        youtubeUrl: item.youtubeUrl ?? null,
        category: item.category,
        caption: item.caption ?? null,
        eventId: item.eventId?.toString() ?? null,
        featured: item.featured,
        createdAt: item.createdAt.toISOString(),
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
    console.error("[GET /api/gallery/public]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}