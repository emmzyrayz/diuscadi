// POST /api/admin/broadcast/send
// Marks broadcast as sent, then fire-and-forgets email dispatch.
// First RESEND_LIMIT recipients → Resend batch API (bulk, free-tier safe)
// Remainder → ZeptoMail individual sends (transactional overflow)

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
import { sendBroadcastEmail, sendBulkBroadcast } from "@/lib/sendEmail";

const ALLOWED_ROLES = ["admin", "webmaster"];
const BATCH_SIZE = 50; // ZeptoMail concurrency window
const BATCH_DELAY_MS = 100; // throttle between ZeptoMail batches
const RESEND_LIMIT = 100; // recipients 0–99 via Resend; bump to 150 if you have headroom

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

// ── Async dispatcher ───────────────────────────────────────────────────────────

async function dispatchBroadcast(
  db: Db,
  broadcast: WithId<BroadcastMessage>,
): Promise<void> {
  const { recipients, accountCount, guestCount } = await resolveRecipients(
    db,
    broadcast.filter,
  );

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

  const resendBatch = recipients.slice(0, RESEND_LIMIT);
  const zeptoBatch = recipients.slice(RESEND_LIMIT);

  // ── Resend bulk (first RESEND_LIMIT recipients, names personalised via {{name}}) ──
  if (resendBatch.length > 0) {
    try {
      const result = await sendBulkBroadcast({
        campaignName: `Broadcast-${broadcast._id}`,
        subject: broadcast.subject,
        htmlContent: broadcast.htmlContent,
        textContent: broadcast.textContent,
        contacts: resendBatch.map((r: ResolvedRecipient) => ({
          email: r.email,
          name: r.fullName || undefined,
        })),
        linkedEvent,
      });
      sent += result.sent;
      failed += result.failed.length;
      result.failed.forEach((f) =>
        console.error(`[broadcast] Resend failed → ${f.email}: ${f.error}`),
      );
    } catch (err) {
      console.error("[broadcast] Resend batch error:", err);
      failed += resendBatch.length;
    }
  }

  // ── ZeptoMail individual sends (overflow beyond RESEND_LIMIT) ─────────────
  for (let i = 0; i < zeptoBatch.length; i += BATCH_SIZE) {
    const batch = zeptoBatch.slice(i, i + BATCH_SIZE);

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
          console.error(`[broadcast] ZeptoMail failed → ${r.email}:`, err);
          failed++;
        }
      }),
    );

    if (i + BATCH_SIZE < zeptoBatch.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

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
    `[broadcast:${broadcast._id}] Complete — ${sent} sent, ${failed} failed | ` +
      `${resendBatch.length} via Resend, ${zeptoBatch.length} via ZeptoMail | ` +
      `${accountCount} accounts, ${guestCount} guests`,
  );
}
