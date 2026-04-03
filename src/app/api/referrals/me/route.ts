import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const db = await getDb();
    const ownerVaultId = new ObjectId(req.auth.vaultId);

    const [links, events] = await Promise.all([
      Collections.referralLinks(db)
        .find({ ownerVaultId, isActive: true })
        .sort({ createdAt: -1 })
        .toArray(),
      Collections.referralEvents(db)
        .find({ ownerVaultId })
        .sort({ createdAt: -1 })
        .limit(500)
        .toArray(),
    ]);

    const byType = events.reduce<Record<string, number>>((acc, ev) => {
      acc[ev.eventType] = (acc[ev.eventType] ?? 0) + 1;
      return acc;
    }, {});

    const byCode = events.reduce<Record<string, number>>((acc, ev) => {
      acc[ev.code] = (acc[ev.code] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      stats: {
        linksCount: links.length,
        eventsCount: events.length,
        byType,
      },
      links: links.map((l) => ({
        id: l._id!.toString(),
        code: l.code,
        resourceType: l.resourceType,
        resourceId: l.resourceId,
        path: l.path,
        title: l.title ?? null,
        parentCode: l.parentCode ?? null,
        createdAt: l.createdAt.toISOString(),
        interactions: byCode[l.code] ?? 0,
      })),
      recentEvents: events.slice(0, 30).map((e) => ({
        id: e._id!.toString(),
        code: e.code,
        eventType: e.eventType,
        resourceType: e.resourceType,
        resourceId: e.resourceId,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[GET /api/referrals/me]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

