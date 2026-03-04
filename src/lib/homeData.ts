// lib/homeData.ts
// Server-side data fetchers for the homepage.
// All functions run on the server — never imported by client components.

import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import { TargetEduStatus } from "./models/Events";

// ─── Auth helper ──────────────────────────────────────────────────────────────
// Reads the JWT from the cookie store (server-side).
// Returns null if unauthenticated.

async function getServerAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("diuscadi_token")?.value;
  if (!token) return null;
  try {
    const payload = verifyJWT(token);
    return payload;
  } catch {
    return null;
  }
}

// ─── Types (serialisable — no ObjectId, no Date) ──────────────────────────────

export interface HomeUser {
  name: string;
  avatar: string;
  role: string;
  eduStatus: TargetEduStatus;
  skills: string[];
  committee: string | null;
  profileCompleted: boolean;
  membershipStatus: string;
  eventsRegistered: number;
  eventsAttended: number;
  signupInviteCode: string;
}

export interface HomeFeaturedEvent {
  id: string;
  slug: string;
  title: string;
  date: string; // ISO string
  daysLeft: number;
  image: string;
  location: string;
  format: string;
  slotsRemaining: number;
  ticketTypeId: string;
}

export interface HomeScheduledEvent {
  id: string;
  date: string; // day number e.g. "18"
  month: string; // e.g. "FEB"
  title: string;
  time: string;
  location: string;
  status: "registered" | "checked-in" | "cancelled";
  type: string;
  inviteCode: string;
  slug: string;
}

export interface HomeRecommendation {
  type: string;
  title: string;
  meta: string;
  tag: string;
  slug: string;
  image: string;
}

// ─── Fetch user data ──────────────────────────────────────────────────────────

export async function fetchHomeUser(): Promise<HomeUser | null> {
  const auth = await getServerAuth();
  if (!auth) return null;

  const db = await getDb();
  const vaultId = new ObjectId(auth.vaultId);

  const [vault, userData] = await Promise.all([
    Collections.vault(db).findOne(
      { _id: vaultId },
      { projection: { role: 1, isAccountActive: 1 } },
    ),
    Collections.userData(db).findOne(
      { vaultId },
      {
        projection: {
          fullName: 1,
          avatar: 1,
          eduStatus: 1,
          skills: 1,
          committee: 1,
          profileCompleted: 1,
          membershipStatus: 1,
          analytics: 1,
          signupInviteCode: 1,
        },
      },
    ),
  ]);

  if (!vault || !userData) return null;

  return {
    name: userData.fullName,
    avatar: userData.avatar ?? "",
    role: vault.role,
    eduStatus: userData.eduStatus,
    skills: userData.skills ?? [],
    committee: userData.committee ?? null,
    profileCompleted: userData.profileCompleted,
    membershipStatus: userData.membershipStatus,
    eventsRegistered: userData.analytics?.eventsRegistered ?? 0,
    eventsAttended: userData.analytics?.eventsAttended ?? 0,
    signupInviteCode: userData.signupInviteCode ?? "",
  };
}

// ─── Fetch featured event (next upcoming published event) ─────────────────────

export async function fetchFeaturedEvent(): Promise<HomeFeaturedEvent | null> {
  const db = await getDb();
  const now = new Date();

  const pipeline = [
    {
      $match: {
        status: "published",
        eventDate: { $gt: now },
        registrationDeadline: { $gt: now },
      },
    },
    { $sort: { eventDate: 1 } },
    { $limit: 1 },

    // Get slot count
    {
      $lookup: {
        from: "eventRegistrations",
        let: { eid: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$eventId", "$$eid"] },
                  { $ne: ["$status", "cancelled"] },
                ],
              },
            },
          },
          { $count: "total" },
        ],
        as: "regCount",
      },
    },

    // Get first active ticket type
    {
      $lookup: {
        from: "ticketTypes",
        localField: "_id",
        foreignField: "eventId",
        pipeline: [{ $match: { isActive: true } }, { $limit: 1 }],
        as: "ticket",
      },
    },

    {
      $addFields: {
        registered: { $ifNull: [{ $arrayElemAt: ["$regCount.total", 0] }, 0] },
        ticketTypeDoc: { $arrayElemAt: ["$ticket", 0] },
      },
    },
  ];

  const [event] = await Collections.events(db).aggregate(pipeline).toArray();
  if (!event) return null;

  const daysLeft = Math.ceil(
    (new Date(event.eventDate).getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const locationStr = event.location
    ? [event.location.city, event.location.state].filter(Boolean).join(", ")
    : "";

  return {
    id: event._id.toString(),
    slug: event.slug,
    title: event.title,
    date: event.eventDate.toISOString(),
    daysLeft,
    image: event.image,
    location: locationStr,
    format: event.format,
    slotsRemaining: Math.max(0, event.capacity - event.registered),
    ticketTypeId: event.ticketTypeDoc?._id?.toString() ?? "",
  };
}

// ─── Fetch user's upcoming registered events ──────────────────────────────────

export async function fetchUpcomingEvents(
  vaultId: ObjectId,
): Promise<HomeScheduledEvent[]> {
  const db = await getDb();
  const now = new Date();

  const userData = await Collections.userData(db).findOne(
    { vaultId },
    { projection: { _id: 1 } },
  );
  if (!userData) return [];

  const pipeline = [
    {
      $match: {
        userId: userData._id,
        status: { $ne: "cancelled" },
      },
    },

    // Join event
    {
      $lookup: {
        from: "events",
        localField: "eventId",
        foreignField: "_id",
        as: "event",
      },
    },
    { $unwind: "$event" },

    // Only future events
    { $match: { "event.eventDate": { $gt: now } } },
    { $sort: { "event.eventDate": 1 } },
    { $limit: 5 },
  ];

  const regs = await Collections.eventRegistrations(db)
    .aggregate(pipeline)
    .toArray();

  return regs.map((r) => {
    const d = new Date(r.event.eventDate);
    const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const day = d.getDate().toString().padStart(2, "0");
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
    const loc = r.event.location
      ? [r.event.location.venue, r.event.location.city]
          .filter(Boolean)
          .join(" · ")
      : r.event.format;

    return {
      id: r._id.toString(),
      date: day,
      month,
      title: r.event.title,
      time,
      location: loc,
      status: r.status as HomeScheduledEvent["status"],
      type: r.event.format,
      inviteCode: r.inviteCode,
      slug: r.event.slug,
    };
  });
}

// ─── Fetch recommendations (events matching user profile) ─────────────────────

export async function fetchRecommendations(
  userData: { skills: string[]; eduStatus: TargetEduStatus },
  limit = 3,
): Promise<HomeRecommendation[]> {
  const db = await getDb();
  const now = new Date();

  const events = await Collections.events(db)
    .find({
      status: "published",
      eventDate: { $gt: now },
      registrationDeadline: { $gt: now },
      $or: [
        { targetEduStatus: "ALL" },
        { targetEduStatus: userData.eduStatus },
        { requiredSkills: { $in: userData.skills } },
      ],
    })
    .sort({ eventDate: 1 })
    .limit(limit)
    .toArray();

  return events.map((e) => {
    const metaParts: string[] = [];
    if (e.format)
      metaParts.push(e.format.charAt(0).toUpperCase() + e.format.slice(1));
    if (e.eventDate) {
      metaParts.push(
        new Date(e.eventDate).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      );
    }

    const tag = e.requiredSkills?.some((s: string) =>
      userData.skills.includes(s),
    )
      ? "Matches your Skills"
      : e.targetEduStatus === userData.eduStatus
        ? `For ${e.targetEduStatus}s`
        : "Recommended for You";

    return {
      type: e.category ?? "Event",
      title: e.title,
      meta: metaParts.join(" · "),
      tag,
      slug: e.slug,
      image: e.image,
    };
  });
}

// ─── Dummy data stubs (for systems not yet built) ─────────────────────────────
// These return static data until their own context/system is built.
// Replace each with a real DB call when ready.

export function getStaticQuickActions() {
  return [
    { title: "Browse Programs", desc: "Career workshops", link: "/programs" },
    { title: "View Events", desc: "Upcoming seminars", link: "/events" },
    { title: "My Tickets", desc: "Access your passes", link: "/tickets" },
    { title: "My Profile", desc: "Account settings", link: "/profile" },
  ];
}

export function getStaticAnnouncements() {
  return [
    {
      id: 1,
      title: "DevFest Lagos 2026 Schedule Released!",
      desc: "The full lineup of speakers and workshop tracks is now live.",
      type: "Update" as const,
    },
    {
      id: 2,
      title: "New Career Mentorship Program",
      desc: "Applications are now open for the Q2 Senior Executive Mentorship cohort.",
      type: "New" as const,
    },
    {
      id: 3,
      title: "Platform Maintenance Notice",
      desc: "The portal will be offline for 2 hours this Sunday for security upgrades.",
      type: "Alert" as const,
    },
  ];
}

export function getStaticActivities() {
  return [
    {
      id: 1,
      content: "Registered for",
      target: "Lagos Career Summit 2026",
      time: "2 hours ago",
    },
    {
      id: 2,
      content: "Completed workshop",
      target: "Intro to UI Design",
      time: "Yesterday",
    },
    {
      id: 3,
      content: "Earned",
      target: "50 Career Points",
      time: "2 days ago",
    },
    {
      id: 4,
      content: "Updated",
      target: "Professional Bio",
      time: "3 days ago",
    },
  ];
}

export function getStaticContinueItems() {
  return [
    {
      type: "Learning",
      title: "Resume: Effective Networking for Introverts",
      status: "65% Complete",
      link: "/learning/module-4",
      action: "Resume Video",
    },
    {
      type: "Application",
      title: "Pending: Mentor Match Request",
      status: "Awaiting your input",
      link: "/mentorship/apply",
      action: "Continue App",
    },
  ];
}
