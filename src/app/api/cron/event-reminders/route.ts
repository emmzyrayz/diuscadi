// GET /api/cron/event-reminders
// Called by Vercel Cron every hour.
// Finds all published events starting in the next 23–25 hour window,
// then sends a reminder to every registered (non-cancelled) user who
// hasn't already received one — tracked via registration.reminders.sent24h.
//
// Vercel Cron secures this endpoint via the CRON_SECRET env var.
// Set CRON_SECRET in your Vercel project settings and it is automatically
// injected into the Authorization header by Vercel on each cron invocation.

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { sendEventReminderEmail } from "@/lib/sendEmail";
import { ObjectId } from "mongodb";

// ── Auth guard ────────────────────────────────────────────────────────────────
// Vercel sends: Authorization: Bearer <CRON_SECRET>
// We also allow the route in dev without a secret so you can test it via curl.

function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[cron/event-reminders] CRON_SECRET not set — rejecting");
    return false;
  }
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const now = new Date();

  // ── Find events starting in the 23–25h window ─────────────────────────────
  // We use a ±1h band around the 24h mark so that even if the cron fires
  // slightly early or late, no event is missed or double-targeted.
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // now + 23h
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000); // now + 25h

  const upcomingEvents = await Collections.events(db)
    .find(
      {
        status: "published",
        eventDate: { $gte: windowStart, $lte: windowEnd },
      },
      {
        projection: {
          _id: 1,
          title: 1,
          eventDate: 1,
          location: 1,
          format: 1,
        },
      },
    )
    .toArray();

  if (upcomingEvents.length === 0) {
    return NextResponse.json({ sent: 0, message: "No events in window" });
  }

  let totalSent = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (const event of upcomingEvents) {
    const eventId = event._id as ObjectId;

    // Find all non-cancelled registrations for this event that have NOT
    // yet received a 24h reminder.
    const registrations = await Collections.eventRegistrations(db)
      .find(
        {
          eventId,
          status: { $in: ["registered", "checked-in"] },
          "reminders.sent24h": { $exists: false },
        },
        { projection: { _id: 1, userId: 1, inviteCode: 1 } },
      )
      .toArray();

    if (registrations.length === 0) {
      totalSkipped++;
      continue;
    }

    // Format event date in WAT for the email body
    const eventDateObj = new Date(event.eventDate as Date);
    const formattedDate =
      eventDateObj.toLocaleDateString("en-NG", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "Africa/Lagos",
      }) +
      " • " +
      eventDateObj.toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Lagos",
      });

    const loc = event.location as Record<string, string> | undefined;
    const eventLocation = loc
      ? [loc.venue, loc.city].filter(Boolean).join(", ") || String(event.format)
      : String(event.format ?? "See event details");

    for (const reg of registrations) {
      try {
        // Resolve user contact details
        const userData = await Collections.userData(db).findOne(
          { _id: reg.userId as ObjectId },
          { projection: { fullName: 1, vaultId: 1 } },
        );
        if (!userData) continue;

        const vault = await Collections.vault(db).findOne(
          { _id: userData.vaultId as ObjectId },
          { projection: { email: 1 } },
        );
        if (!vault?.email) continue;

        const fn = userData.fullName as
          | { firstname?: string; lastname?: string }
          | undefined;
        const displayName = fn
          ? [fn.firstname, fn.lastname].filter(Boolean).join(" ") || "there"
          : "there";

        await sendEventReminderEmail({
          to: vault.email as string,
          ticketId: (reg._id as ObjectId).toString(),
          name: displayName,
          eventTitle: String(event.title),
          eventDate: formattedDate,
          eventLocation,
          ticketCode: reg.inviteCode as string,
          hoursUntil: 24,
        });

        // Mark reminder as sent — prevents duplicates on subsequent cron runs
        await Collections.eventRegistrations(db).updateOne(
          { _id: reg._id as ObjectId },
          { $set: { "reminders.sent24h": now, updatedAt: now } },
        );

        totalSent++;
      } catch (err) {
        const msg = `reg ${String(reg._id)}: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(msg);
        console.error("[cron/event-reminders]", msg);
      }
    }
  }

  console.log(
    `[cron/event-reminders] Sent: ${totalSent} | Skipped (already sent): ${totalSkipped} | Errors: ${errors.length}`,
  );

  return NextResponse.json({
    sent: totalSent,
    skipped: totalSkipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
