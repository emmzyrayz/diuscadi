// app/api/users/activity/route.ts
// GET — fetch current user's recent activity feed
//
// Sources (chronological merge):
//   1. eventRegistrations — registered + checked-in events
//   2. applications       — membership, committee, skills, etc.
//
// Future sources to add here when features ship:
//   3. pointsLedger       — points earned/spent (when points system is built)
//   4. blogPosts          — published posts (when blog is built)
//   5. learningProgress   — module completions (when learning is built)
//
// Query params:
//   limit — number of items to return (default 10, max 50)

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Collections } from "@/lib/db/collections";

// ── Activity item shape returned to client ────────────────────────────────────

export interface ActivityItem {
  id: string;
  type:
    | "registration"
    | "check-in"
    | "application"
    | "points" // future
    | "blog" // future
    | "learning"; // future
  content: string; // e.g. "You registered for"
  target: string; // e.g. "LASCADSS 6.0"
  targetHref?: string; // e.g. "/events/lascadss-6"
  meta?: string; // e.g. "Pending review" for applications
  time: string; // ISO string — formatted on client
  timestamp: Date; // raw for sorting
}

async function getHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const db = await getDb();
    const url = new URL(req.url);

    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "10"), 50);

    // ── Step 1: resolve vaultId → userData._id ────────────────────────────
    const vaultId = new ObjectId(req.auth.vaultId);
    const userData = await Collections.userData(db).findOne(
      { vaultId },
      { projection: { _id: 1 } },
    );

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userData._id!;
    const activities: ActivityItem[] = [];

    // ── Step 2: event registrations ───────────────────────────────────────
    // Fetch last 20 registrations and join with event titles/slugs
    const registrations = await Collections.eventRegistrations(db)
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    if (registrations.length > 0) {
      // Batch-fetch all referenced events in one query
      const eventIds = [...new Set(registrations.map((r) => r.eventId))];
      const events = await Collections.events(db)
        .find(
          { _id: { $in: eventIds } },
          { projection: { _id: 1, title: 1, slug: 1, eventDate: 1 } },
        )
        .toArray();

      const eventMap = new Map(events.map((e) => [e._id!.toString(), e]));

      for (const reg of registrations) {
        const event = eventMap.get(reg.eventId.toString());
        const eventTitle = event?.title ?? "an event";
        const eventSlug = event?.slug;

        // Registration activity
        activities.push({
          id: `reg-${reg._id!.toString()}`,
          type: "registration",
          content: "You registered for",
          target: eventTitle,
          targetHref: eventSlug ? `/events/${eventSlug}` : undefined,
          meta: reg.status === "cancelled" ? "Cancelled" : "Confirmed",
          time: reg.registeredAt.toISOString(),
          timestamp: reg.registeredAt,
        });

        // Check-in activity (separate entry if checked in)
        if (reg.status === "checked-in" && reg.checkedInAt) {
          activities.push({
            id: `checkin-${reg._id!.toString()}`,
            type: "check-in",
            content: "You attended",
            target: eventTitle,
            targetHref: eventSlug ? `/events/${eventSlug}` : undefined,
            time: reg.checkedInAt.toISOString(),
            timestamp: reg.checkedInAt,
          });
        }
      }
    }

    // ── Step 3: applications ──────────────────────────────────────────────
    const applications = await Collections.applications(db)
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    for (const app of applications) {
      // Human-readable label per application type
      const typeLabel: Record<string, string> = {
        membership: "Membership Application",
        committee: app.requestedCommittee
          ? `Committee Application — ${app.requestedCommittee}`
          : "Committee Application",
        skills: "Skills Verification",
        program: app.requestedProgram
          ? `Program Application — ${app.requestedProgram}`
          : "Program Application",
        writer: "Blog Contributor Application",
        sponsorship: "Sponsorship Application",
      };

      const statusLabel: Record<string, string> = {
        pending: "Pending review",
        approved: "Approved",
        rejected: "Not approved",
      };

      activities.push({
        id: `app-${app._id!.toString()}`,
        type: "application",
        content: "You submitted a",
        target: typeLabel[app.type] ?? "Application",
        targetHref: "/profile/applications",
        meta: statusLabel[app.status] ?? app.status,
        time: app.createdAt.toISOString(),
        timestamp: app.createdAt,
      });

      // Approved/rejected review event — shows when admin acted on it
      if (app.status !== "pending" && app.reviewedAt) {
        activities.push({
          id: `app-review-${app._id!.toString()}`,
          type: "application",
          content:
            app.status === "approved"
              ? "Your application was approved:"
              : "Your application was not approved:",
          target: typeLabel[app.type] ?? "Application",
          targetHref: "/profile/applications",
          meta: app.reviewNote ?? undefined,
          time: app.reviewedAt.toISOString(),
          timestamp: app.reviewedAt,
        });
      }
    }

    // ── Step 4: sort all sources chronologically and cap ──────────────────
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const trimmed = activities.slice(0, limit);

    // Strip timestamp (internal sorting field) before sending to client
    const response = trimmed.map(({ timestamp: _ts, ...rest }) => rest);

    return NextResponse.json({
      activities: response,
      total: response.length,
    });
  } catch (err) {
    console.error("[GET /api/users/activity]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getHandler);
