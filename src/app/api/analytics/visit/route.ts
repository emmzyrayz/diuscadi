// POST /api/analytics/visit
// Fire-and-forget. Records a page visit bucketed to a 3hr window.
// Deduplication: one document per (userId|fingerprint + page + 3hr bucket).
// Uses upsert so duplicate calls within the window are silently ignored.
// No auth required — unauthenticated visits are tracked too (userId: null).

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import crypto from "crypto";

// WAT = UTC+1
function getWATHour(): number {
  return (new Date().getUTCHours() + 1) % 24;
}

function getDayOfWeek(): number {
  // Adjust for WAT
  const now = new Date();
  const watMs = now.getTime() + 60 * 60 * 1000;
  return new Date(watMs).getUTCDay();
}

// Bucket the current time into 3hr slots: 0,3,6,9,12,15,18,21
function get3hrBucket(): number {
  return Math.floor(getWATHour() / 3) * 3;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const page =
      typeof body.page === "string"
        ? body.page.slice(0, 100) // cap length
        : "/unknown";
    const userId = typeof body.userId === "string" ? body.userId : null;

    // Build a session key: hash of (userId or IP fallback) + page + 3hr bucket
    // This is the dedup key — same user visiting same page within 3hrs = one doc
    const forwarded = req.headers.get("x-forwarded-for") ?? "anon";
    const ip = forwarded.split(",")[0].trim();
    const identity = userId ?? ip;
    const bucket = get3hrBucket();
    const day = getDayOfWeek();
    const hour = getWATHour();
    const sessionKey = crypto
      .createHash("sha256")
      .update(`${identity}:${page}:${bucket}:${day}`)
      .digest("hex");

    const now = new Date();
    // TTL: keep visits for 90 days so we build a solid 3-month pattern dataset
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const db = await getDb();

    // Upsert — if sessionKey already exists this is a no-op (no bloat)
    await Collections.pageVisits(db).updateOne(
      { sessionKey },
      {
        $setOnInsert: {
          page,
          hour,
          dayOfWeek: day,
          userId,
          sessionKey,
          timestamp: now,
          expiresAt,
        },
      },
      { upsert: true },
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    // Never let this break the page — swallow all errors
    console.error("[POST /api/analytics/visit]", err);
    return NextResponse.json({ ok: false }, { status: 200 }); // 200 intentional
  }
}
