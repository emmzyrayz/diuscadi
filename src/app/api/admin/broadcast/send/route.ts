import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId, Db, WithId } from "mongodb";
import { BroadcastMessage } from "@/types/broadcast";
import {
  buildAudienceQuery,
  buildPostLookupMatch,
} from "@/lib/broadcast/audienceQuery";
import { sendBroadcastEmail } from "@/lib/sendEmail";

const ALLOWED_ROLES = ["admin", "webmaster"];

interface RecipientDoc {
  _id: ObjectId;
  email: string | null;
  fullName: string;
}

// ─── POST /api/admin/broadcast/send ──────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  if (!ALLOWED_ROLES.includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const { broadcastId } = await req.json();

    if (!broadcastId) {
      return NextResponse.json(
        { error: "Broadcast ID is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const broadcast = await Collections.broadcasts(db).findOne({
      _id: new ObjectId(broadcastId as string),
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
      { _id: new ObjectId(broadcastId as string) },
      { $set: { status: "sent", sentAt: now, updatedAt: now } },
    );

    // Fire-and-forget — response returns immediately
    sendBroadcastEmails(db, broadcast).catch((err) =>
      console.error(`[broadcast ${broadcastId}] Send failed:`, err),
    );

    return NextResponse.json({
      message: "Broadcast sent successfully",
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

// ─── Internal sender ──────────────────────────────────────────────────────────
async function sendBroadcastEmails(
  db: Db,
  broadcast: WithId<BroadcastMessage>,
): Promise<void> {
  const preMatch = buildAudienceQuery(broadcast.filter);
  const postMatch = buildPostLookupMatch(broadcast.filter);

  const pipeline = [
    { $match: preMatch },
    {
      $lookup: {
        from: "vault",
        localField: "vaultId",
        foreignField: "_id",
        as: "_vault",
      },
    },
    { $unwind: { path: "$_vault", preserveNullAndEmptyArrays: true } },
    // Post-lookup filter (e.g. by_role checks _vault.role)
    ...(postMatch ? [{ $match: postMatch }] : []),
    {
      $project: {
        _id: 1,
        email: "$_vault.email",
        fullName: 1,
      },
    },
  ];

  const users = await Collections.userData(db)
    .aggregate<RecipientDoc>(pipeline)
    .toArray();

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    if (!user.email) {
      failed++;
      continue;
    }
    try {
      await sendBroadcastEmail({
        to: user.email,
        subject: broadcast.subject,
        htmlContent: broadcast.htmlContent,
        textContent: broadcast.textContent,
        recipientName: user.fullName,
        linkedEvent: broadcast.linkedEvent
          ? {
              title: broadcast.linkedEvent.title,
              eventDate: broadcast.linkedEvent.date.toLocaleDateString(
                "en-NG",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                },
              ),
            }
          : null,
      });
      sent++;
    } catch (err) {
      console.error(`[broadcast] Failed to send to ${user.email}:`, err);
      failed++;
    }
  }

  await Collections.broadcasts(db).updateOne(
    { _id: broadcast._id },
    {
      $set: {
        sentCount: sent,
        failedCount: failed,
        totalRecipients: users.length,
      },
    },
  );
}
