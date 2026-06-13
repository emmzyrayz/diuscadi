import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { BroadcastMessage, BroadcastFilter } from "@/types/broadcast";

const ALLOWED_ROLES = ["admin", "webmaster"];

type BroadcastStatus = BroadcastMessage["status"];
const VALID_STATUSES: BroadcastStatus[] = [
  "draft",
  "scheduled",
  "sent",
  "failed",
];

// ─── GET /api/admin/broadcast ────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  if (!ALLOWED_ROLES.includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);

    // Validate status against the union — fall back to "draft" for unknown values
    const rawStatus = searchParams.get("status") ?? "draft";
    const status: BroadcastStatus = VALID_STATUSES.includes(
      rawStatus as BroadcastStatus,
    )
      ? (rawStatus as BroadcastStatus)
      : "draft";

    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const skip = (page - 1) * limit;

    const broadcasts = await Collections.broadcasts(db)
      .find({ status })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await Collections.broadcasts(db).countDocuments({ status });

    return NextResponse.json({ broadcasts, total, page, pageSize: limit });
  } catch (err) {
    console.error("[GET /api/admin/broadcast]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// ─── POST /api/admin/broadcast ───────────────────────────────────────────────
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
      id,
      subject,
      htmlContent,
      filter,
      linkedEventId,
      sendImmediately,
      scheduledFor,
    } = body;

    const db = await getDb();
    const now = new Date();
    const createdBy = new ObjectId(req.auth.vaultId);

    if (!subject?.trim() || !htmlContent?.trim()) {
      return NextResponse.json(
        { error: "Subject and content are required" },
        { status: 400 },
      );
    }
    if (!filter || !filter.audience) {
      return NextResponse.json(
        { error: "Audience filter is required" },
        { status: 400 },
      );
    }
    if (!sendImmediately && (!scheduledFor || new Date(scheduledFor) <= now)) {
      return NextResponse.json(
        { error: "Schedule must be in the future" },
        { status: 400 },
      );
    }

    // Resolve linked event
    let linkedEvent: BroadcastMessage["linkedEvent"] = null;
    if (linkedEventId) {
      const event = await Collections.events(db).findOne({
        _id: new ObjectId(linkedEventId),
      });
      if (event) {
        linkedEvent = {
          _id: event._id,
          title: event.title,
          date: event.eventDate, // ← was event.date (doesn't exist on EventDocument)
        };
      }
    }

    const broadcast: BroadcastMessage = {
      subject,
      htmlContent,
      textContent: htmlContent.replace(/<[^>]*>/g, ""),
      filter: filter as BroadcastFilter,
      linkedEvent,
      sendImmediately,
      scheduledFor: !sendImmediately ? new Date(scheduledFor) : undefined,
      status: sendImmediately ? "sent" : "scheduled",
      createdBy,
      createdAt: now,
      sentAt: sendImmediately ? now : undefined,
      updatedAt: now,
    };

    if (id) {
      await Collections.broadcasts(db).updateOne(
        { _id: new ObjectId(id as string) },
        { $set: broadcast },
      );
      return NextResponse.json({ message: "Broadcast updated", id });
    } else {
      const result = await Collections.broadcasts(db).insertOne(broadcast);
      return NextResponse.json({
        message: "Broadcast created",
        id: result.insertedId.toString(),
      });
    }
  } catch (err) {
    console.error("[POST /api/admin/broadcast]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
