import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

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
    const q = url.searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(20, parseInt(url.searchParams.get("limit") ?? "10"));

    const filter: Record<string, unknown> = {
      status: { $in: ["published", "cancelled"] }, // include past events
    };

    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }

    const events = await Collections.events(db)
      .find(filter, {
        projection: { _id: 1, title: 1, eventDate: 1, status: 1 },
      })
      .sort({ eventDate: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      events: events.map((e) => ({
        id: e._id!.toString(),
        title: e.title,
        eventDate: e.eventDate.toISOString(),
        status: e.status,
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/gallery/events/search]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
