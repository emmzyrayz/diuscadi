// POST /api/admin/broadcast/send
// Marks broadcast as sent, then fire-and-forgets email dispatch
// in 50-per-batch chunks to both account + guest recipients.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { Db, ObjectId, WithId } from "mongodb";
import { BroadcastMessage } from "@/types/broadcast";
import {
  resolveRecipients,
  ResolvedRecipient,
} from "@/lib/broadcast/recipientResolver";
import { sendBroadcastEmail } from "@/lib/sendEmail";

const ALLOWED_ROLES = ["admin", "webmaster"];
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 100;

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  if (!ALLOWED_ROLES.includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { broadcastId } = body as { broadcastId: string };

    if (!broadcastId || !ObjectId.isValid(broadcastId)) {
      return NextResponse.json(
        { error: "Valid broadcast ID is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const broadcast = await Collections.broadcasts(db).findOne({
      _id: new ObjectId(broadcastId),
    });

    if (!broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 },
      );
    }

    if (broadcast.status === "sent") {
      return NextResponse.json(
        { error: "Broadcast already sent" },
        { status: 409 },
      );
    }

    const now = new Date();
    await Collections.broadcasts(db).updateOne(
      { _id: new ObjectId(broadcastId) },
      { $set: { status: "sent", sentAt: now, updatedAt: now } },
    );

    // Fire-and-forget — response returns immediately
    dispatchBroadcast(db, broadcast).catch((err) =>
      console.error(`[broadcast:${broadcastId}] Dispatch failed:`, err),
    );

    return NextResponse.json({
      message: "Broadcast queued for delivery",
      broadcastId,
    });
  } catch (err) {
    console.error("[POST /api/admin/broadcast/send]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// ── Async dispatcher (runs after response) ────────────────────────────────────

async function dispatchBroadcast(
  db: Db,
  broadcast: WithId<BroadcastMessage>,
): Promise<void> {
  const { recipients, accountCount, guestCount } = await resolveRecipients(
    db,
    broadcast.filter,
  );

  // Prepare linked event display string once (re-used per email)
  const linkedEvent = broadcast.linkedEvent
    ? {
        title: broadcast.linkedEvent.title,
        eventDate: broadcast.linkedEvent.date.toLocaleDateString("en-NG", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      }
    : null;

  let sent = 0;
  let failed = 0;

  // Send in fixed-size batches with a short delay between each
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (r: ResolvedRecipient) => {
        try {
          await sendBroadcastEmail({
            to: r.email,
            subject: broadcast.subject,
            htmlContent: broadcast.htmlContent,
            textContent: broadcast.textContent,
            recipientName: r.fullName || undefined,
            linkedEvent,
          });
          sent++;
        } catch (err) {
          console.error(`[broadcast] Failed → ${r.email}:`, err);
          failed++;
        }
      }),
    );

    // Throttle between batches to avoid overwhelming SMTP
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  // Write final stats back to the broadcast document
  await Collections.broadcasts(db).updateOne(
    { _id: broadcast._id },
    {
      $set: {
        sentCount: sent,
        failedCount: failed,
        totalRecipients: recipients.length,
        updatedAt: new Date(),
      },
    },
  );

  console.log(
    `[broadcast:${broadcast._id}] Complete — ` +
      `${sent} sent, ${failed} failed | ` +
      `${accountCount} accounts, ${guestCount} guests`,
  );
}
