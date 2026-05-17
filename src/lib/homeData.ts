// lib/homeData.ts — updated fetchHomeUser to return real completion data

import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import type { EduStatus, CommitteeMembership } from "@/types/domain";
import { calculateCompletionFromRaw } from "@/lib/profileCompletion";

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getServerAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("diuscadi_token")?.value;
  if (!token) return null;
  try {
    return verifyJWT(token);
  } catch {
    return null;
  }
}

// ─── Serialisable return types ────────────────────────────────────────────────

export interface HomeUser {
  name: string;
  avatar: string;
  role: string;
  eduStatus: EduStatus;
  skills: string[];
  committeeMembership: CommitteeMembership | null;
  profileCompleted: boolean;
  membershipStatus: string;
  eventsRegistered: number;
  eventsAttended: number;
  signupInviteCode: string;
  // ── NEW: real completion data from shared utility ──────────────────────────
  completionPct: number; // 0-100 — calculated from actual fields
  completionNextStep: string | null; // label of first missing field
  completionMissing: string[]; // all missing field labels
}

export interface HomeFeaturedEvent {
  id: string;
  slug: string;
  title: string;
  date: string;
  daysLeft: number;
  image: string;
  location: string;
  format: string;
  slotsRemaining: number;
  ticketTypeId: string;
}

export interface HomeScheduledEvent {
  id: string;
  date: string;
  month: string;
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

export interface QuickAction {
  title: string;
  desc: string;
  link: string;
}
export interface StaticAnnouncement {
  id: number;
  title: string;
  desc: string;
  type: "Update" | "New" | "Alert";
}
export interface StaticActivity {
  id: number;
  content: string;
  target: string;
  time: string;
}
export interface ContinueItem {
  type: "Learning" | "Registration" | "Application";
  title: string;
  status: string;
  link: string;
  action: string;
}

// ─── Image resolver ───────────────────────────────────────────────────────────

const FALLBACK_EVENT_IMAGE = "/images/events/default.jpg";

function resolveEventImage(e: {
  hasEventBanner?: boolean;
  eventBanner?: { imageUrl: string } | null;
  hasEventLogo?: boolean;
  eventLogo?: { imageUrl: string } | null;
}): string {
  if (e.hasEventBanner && e.eventBanner?.imageUrl)
    return e.eventBanner.imageUrl;
  if (e.hasEventLogo && e.eventLogo?.imageUrl) return e.eventLogo.imageUrl;
  return FALLBACK_EVENT_IMAGE;
}

// ─── fetchHomeUser ────────────────────────────────────────────────────────────

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
          hasAvatar: 1,
          avatar: 1,
          phone: 1,
          eduStatus: 1,
          skills: 1,
          committeeMembership: 1,
          profileCompleted: 1,
          membershipStatus: 1,
          analytics: 1,
          signupInviteCode: 1,
          profile: 1,
          Institution: 1,
          socials: 1,
        },
      },
    ),
  ]);

  if (!vault || !userData) return null;

  const fn = userData.fullName;
  const name = fn
    ? [fn.firstname, fn.secondname, fn.lastname].filter(Boolean).join(" ")
    : "";

  const avatarUrl = userData.hasAvatar ? (userData.avatar?.imageUrl ?? "") : "";

  // ── Calculate real completion using shared utility ─────────────────────────
  const completion = calculateCompletionFromRaw({
    hasAvatar: userData.hasAvatar,
    phone: userData.phone,
    fullName: userData.fullName,
    profile: userData.profile,
    Institution: userData.Institution,
    skills: userData.skills,
    socials: userData.socials,
  });

  return {
    name,
    avatar: avatarUrl,
    role: vault.role,
    eduStatus: userData.eduStatus as EduStatus,
    skills: userData.skills ?? [],
    committeeMembership: userData.committeeMembership ?? null,
    profileCompleted: userData.profileCompleted ?? false,
    membershipStatus: userData.membershipStatus,
    eventsRegistered: userData.analytics?.eventsRegistered ?? 0,
    eventsAttended: userData.analytics?.eventsAttended ?? 0,
    signupInviteCode: userData.signupInviteCode ?? "",
    // Real completion
    completionPct: completion.pct,
    completionNextStep: completion.nextStep,
    completionMissing: completion.missing,
  };
}

// ─── fetchFeaturedEvent ───────────────────────────────────────────────────────

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
    (new Date(event.eventDate).getTime() - now.getTime()) / 86400000,
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
    image: resolveEventImage(event),
    location: locationStr,
    format: event.format,
    slotsRemaining: Math.max(0, event.capacity - (event.registered as number)),
    ticketTypeId: event.ticketTypeDoc?._id?.toString() ?? "",
  };
}

// ─── fetchUpcomingEvents ──────────────────────────────────────────────────────

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

  const regs = await Collections.eventRegistrations(db)
    .aggregate([
      { $match: { userId: userData._id, status: { $ne: "cancelled" } } },
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: "$event" },
      { $match: { "event.eventDate": { $gt: now } } },
      { $sort: { "event.eventDate": 1 } },
      { $limit: 5 },
    ])
    .toArray();

  return regs.map((r) => {
    const d = new Date(r.event.eventDate as Date);
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
      : String(r.event.format);
    return {
      id: r._id.toString(),
      date: day,
      month,
      title: String(r.event.title),
      time,
      location: loc,
      status: r.status as HomeScheduledEvent["status"],
      type: String(r.event.format),
      inviteCode: String(r.inviteCode),
      slug: String(r.event.slug),
    };
  });
}

// ─── fetchRecommendations ─────────────────────────────────────────────────────

export async function fetchRecommendations(
  userData: { skills: string[]; eduStatus: EduStatus },
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
        { targetEduStatus: "ALL" as const },
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
    if (e.eventDate)
      metaParts.push(
        new Date(e.eventDate as Date).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      );
    const skillMatch = (e.requiredSkills as string[] | undefined)?.some((s) =>
      userData.skills.includes(s),
    );
    const statusLabel =
      userData.eduStatus === "STUDENT" ? "Students" : "Graduates";
    const tag = skillMatch
      ? "Matches your Skills"
      : e.targetEduStatus === userData.eduStatus
        ? `For ${statusLabel}`
        : "Recommended for You";
    return {
      type: String(e.category ?? "Event"),
      title: String(e.title),
      meta: metaParts.join(" · "),
      tag,
      slug: String(e.slug),
      image: resolveEventImage(e),
    };
  });
}

// ─── Static stubs ─────────────────────────────────────────────────────────────

export function getStaticQuickActions(): QuickAction[] {
  return [
    { title: "Browse Programs", desc: "Career workshops", link: "/programs" },
    { title: "View Events", desc: "Upcoming seminars", link: "/events" },
    { title: "My Tickets", desc: "Access your passes", link: "/tickets" },
    { title: "My Profile", desc: "Account settings", link: "/profile" },
  ];
}

export function getStaticAnnouncements(): StaticAnnouncement[] {
  return [
    {
      id: 1,
      type: "Update",
      title: "DevFest Lagos 2026 Schedule Released!",
      desc: "The full lineup of speakers and workshop tracks is now live.",
    },
    {
      id: 2,
      type: "New",
      title: "New Career Mentorship Program",
      desc: "Applications now open for the Q2 Senior Executive Mentorship cohort.",
    },
    {
      id: 3,
      type: "Alert",
      title: "Platform Maintenance Notice",
      desc: "The portal will be offline for 2 hours this Sunday for security upgrades.",
    },
  ];
}

export function getStaticActivities(): StaticActivity[] {
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

export function getStaticContinueItems(): ContinueItem[] {
  return [
    {
      type: "Learning",
      link: "/learning/module-4",
      action: "Resume Video",
      title: "Resume: Effective Networking for Introverts",
      status: "65% Complete",
    },
    {
      type: "Application",
      link: "/mentorship/apply",
      action: "Continue App",
      title: "Pending: Mentor Match Request",
      status: "Awaiting your input",
    },
  ];
}

// Add to your existing homeData.ts

export interface HomeActivity {
  id: string;
  type: "registration" | "check-in" | "application" | "points" | "blog" | "learning";
  content: string;
  target: string;
  targetHref?: string;
  meta?: string;
  time: string; // ISO string
}

export async function fetchUserActivity(
  vaultId: ObjectId,
  limit = 8,
): Promise<HomeActivity[]> {
  try {
    const db = await getDb();

    // Mirror the route logic directly — no HTTP round-trip needed server-side
    const userData = await Collections.userData(db).findOne(
      { vaultId },
      { projection: { _id: 1 } },
    );
    if (!userData) return [];

    const userId = userData._id!;
    const activities: (HomeActivity & { timestamp: Date })[] = [];

    // Event registrations
    const registrations = await Collections.eventRegistrations(db)
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    if (registrations.length > 0) {
      const eventIds = [...new Set(registrations.map((r) => r.eventId))];
      const events = await Collections.events(db)
        .find({ _id: { $in: eventIds } }, { projection: { _id: 1, title: 1, slug: 1 } })
        .toArray();
      const eventMap = new Map(events.map((e) => [e._id!.toString(), e]));

      for (const reg of registrations) {
        const event = eventMap.get(reg.eventId.toString());
        const eventTitle = event?.title ?? "an event";
        const eventSlug = event?.slug;

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

    // Applications
    const applications = await Collections.applications(db)
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const typeLabel: Record<string, string> = {
      membership: "Membership Application",
      committee: "Committee Application",
      skills: "Skills Verification",
      program: "Program Application",
      writer: "Blog Contributor Application",
      sponsorship: "Sponsorship Application",
    };

    for (const app of applications) {
      activities.push({
        id: `app-${app._id!.toString()}`,
        type: "application",
        content: "You submitted a",
        target: typeLabel[app.type] ?? "Application",
        targetHref: "/profile/applications",
        meta: app.status === "pending"
          ? "Pending review"
          : app.status === "approved"
            ? "Approved"
            : "Not approved",
        time: app.createdAt.toISOString(),
        timestamp: app.createdAt,
      });
    }

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return activities.slice(0, limit).map(({ timestamp: _ts, ...rest }) => rest);
  } catch {
    return [];
  }
}

// Add to homeData.ts

export interface HomeAnnouncement {
  id: string;
  title: string;
  desc: string;
  type: string;
  audience: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  isRead: boolean;
}

export async function fetchUserAnnouncements(
  vaultId: ObjectId,
): Promise<{ announcements: HomeAnnouncement[]; unreadCount: number }> {
  try {
    const db = await getDb();
    const now = new Date();

    const userData = await Collections.userData(db).findOne(
      { vaultId },
      { projection: { _id: 1, eduStatus: 1, membershipStatus: 1, committeeMembership: 1 } },
    );
    if (!userData) return { announcements: [], unreadCount: 0 };

    const userId = userData._id!;
    const orClauses: Record<string, unknown>[] = [{ audience: "global" }];
    if (userData.eduStatus === "STUDENT") orClauses.push({ audience: "students" });
    if (userData.eduStatus === "GRADUATE") orClauses.push({ audience: "graduates" });
    if (userData.membershipStatus === "approved") orClauses.push({ audience: "members" });
    const committee = userData.committeeMembership?.committee;
    if (committee) orClauses.push({ audience: "committee", targetCommittee: committee });

    const filter = {
      published: true,
      $or: orClauses,
      $and: [
        { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }] },
      ],
    };

    const announcements = await Collections.announcements(db)
      .find(filter)
      .sort({ publishedAt: -1 })
      .limit(20)
      .toArray();

    if (announcements.length === 0) return { announcements: [], unreadCount: 0 };

    const ids = announcements.map((a) => a._id!);
    const reads = await Collections.announcementReads(db)
      .find({ userId, announcementId: { $in: ids } })
      .project({ announcementId: 1 })
      .toArray();

    const readIds = new Set(reads.map((r) => r.announcementId.toString()));

    const result = announcements.map((a) => ({
      id: a._id!.toString(),
      title: a.title,
      desc: a.desc,
      type: a.type,
      audience: a.audience,
      ctaLabel: a.ctaLabel ?? null,
      ctaHref: a.ctaHref ?? null,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      expiresAt: a.expiresAt?.toISOString() ?? null,
      isRead: readIds.has(a._id!.toString()),
    }));

    return {
      announcements: result,
      unreadCount: result.filter((a) => !a.isRead).length,
    };
  } catch {
    return { announcements: [], unreadCount: 0 };
  }
}