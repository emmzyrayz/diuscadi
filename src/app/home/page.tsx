// app/home/page.tsx — Server Component
// Fetches all real data server-side, passes as serialisable props
// to client section components. No ObjectId or Date objects cross
// the server→client boundary.

// import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { ObjectId } from "mongodb";
import {
  fetchHomeUser,
  fetchFeaturedEvent,
  fetchUpcomingEvents,
  fetchRecommendations,
  getStaticQuickActions,
  getStaticAnnouncements,
  getStaticActivities,
  getStaticContinueItems,
} from "@/lib/homeData";
import { cn } from "@/lib/utils";

// Section components (client components that accept serialised props)
import { HomeHeader } from "@/components/sections/homepage/HomeHeader";
import { HomeHero } from "@/components/sections/homepage/homeHero";
import { QuickActions } from "@/components/sections/homepage/quickActions";
import { ContinueSection } from "@/components/sections/homepage/continueSection";
import { RecommendedSection } from "@/components/sections/homepage/recommendationSection";
import { UpcomingEvents } from "@/components/sections/homepage/upcomingEvents";
import { RecentActivity } from "@/components/sections/homepage/recentActivity";
import { Announcements } from "@/components/sections/homepage/announcement";
import { HomeCTAOptional } from "@/components/sections/homepage/CTA";

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function getAuthPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get("diuscadi_token")?.value;
  if (!token) return null;
  try {
    return verifyJWT(token); // Returns { vaultId, role, etc }
  } catch {
    return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const auth = await getAuthPayload();

  // If no auth, RouteGuard will eventually kick them out.
  // We return null or an empty fragment to prevent the server from
  // crashing while attempting to fetch data with a missing ID.
  if (!auth) return null;

  const vaultId = new ObjectId(auth.vaultId);

  // Fetch all data in parallel
  const [homeUser, featuredEvent, upcomingEvents] = await Promise.all([
    fetchHomeUser(),
    fetchFeaturedEvent(),
    fetchUpcomingEvents(vaultId),
  ]);

  // Recommendations need user profile — run after homeUser resolves
  const recommendations = homeUser
    ? await fetchRecommendations({
        skills: homeUser.skills,
        eduStatus: homeUser.eduStatus,
      })
    : [];

  // Static stubs for systems not yet built
  const quickActions = getStaticQuickActions();
  const announcements = getStaticAnnouncements();
  const activities = getStaticActivities();
  const continueItems = getStaticContinueItems();

  // ── HomeHeader props ────────────────────────────────────────────────────────
  const headerUser = homeUser
    ? {
        name: homeUser.name,
        avatar: homeUser.avatar,
        status:
          homeUser.eduStatus.charAt(0).toUpperCase() +
          homeUser.eduStatus.slice(1).toLowerCase(),
        skill: homeUser.skills[0] ?? "",
        interest: homeUser.committeeMembership?.committee ?? "General",
        projectsParticipated: String(homeUser.eventsAttended),
        points: homeUser.eventsRegistered * 50,
      }
    : {
        name: "Member",
        avatar: "",
        status: "",
        skill: "",
        interest: "",
        projectsParticipated: "0",
        points: 0,
      };

  // ── HomeHero props ──────────────────────────────────────────────────────────
  const heroEvent = featuredEvent
    ? {
        image: featuredEvent.image,
        title: featuredEvent.title,
        daysLeft: featuredEvent.daysLeft,
        date: featuredEvent.date,
        category: "Upcoming Event", // static label — not stored on event doc
        slug: featuredEvent.slug,
      }
    : {
        image: "/default-hero.jpg",
        title: "No Upcoming Featured Events",
        category: "Announcement",
        date: "TBD",
      };

  const currentTask = {
    title: "Complete Your Profile",
    category: "Getting Started",
    progress: homeUser?.profileCompleted ? 100 : 40,
  };

  // ── RecommendedSection props ────────────────────────────────────────────────
  // homeData returns { type, title, meta, tag, slug, image }
  // RecommendedSection expects  { id?, title, type, meta, tag, href? }
  const mappedRecommendations = recommendations.map((r, i) => ({
    id: i,
    type: r.type,
    title: r.title,
    meta: r.meta,
    tag: r.tag,
    href: `/events/${r.slug}`,
  }));

  // ── UpcomingEvents props ────────────────────────────────────────────────────
  // homeData returns HomeScheduledEvent with status "registered"|"cancelled"|"checked-in"
  // UpcomingEvents EventStatus also includes "Confirmed"|"On Waitlist"|"Completed"
  // Map DB statuses → display statuses
  const mappedEvents = upcomingEvents.map((e) => ({
    id: e.id,
    date: e.date,
    month: e.month,
    type: e.type,
    title: e.title,
    time: e.time,
    location: e.location,
    status: (e.status === "checked-in"
      ? "Confirmed"
      : e.status === "cancelled"
        ? "Completed"
        : "Confirmed") as "Confirmed" | "On Waitlist" | "Completed",
    link: `/events/${e.slug}`,
  }));

  // ── Announcements props ─────────────────────────────────────────────────────
  // StaticAnnouncement id is number — Announcements expects string | number — fine as-is
  const mappedAnnouncements = announcements.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    desc: a.desc,
  }));

  // ── RecentActivity props ────────────────────────────────────────────────────
  const mappedActivities = activities.map((a) => ({
    id: a.id,
    content: a.content,
    target: a.target,
    time: a.time,
  }));

  return (
    <main
      className={cn(
        "flex",
        "flex-col",
        "p-5",
        "pt-[90px]",
        "items-center",
        "justify-center",
        "w-full",
        "h-full",
      )}
    >
      <HomeHeader user={headerUser} />

      <HomeHero featuredEvent={heroEvent} currentTask={currentTask} />

      <QuickActions actions={quickActions} />

      <ContinueSection items={continueItems} />

      <RecommendedSection
        recommendations={mappedRecommendations}
        userInterests={homeUser?.skills.join(" & ") ?? "General"}
      />

      <UpcomingEvents events={mappedEvents} />

      <RecentActivity activities={mappedActivities} />

      <Announcements announcements={mappedAnnouncements} />

      <HomeCTAOptional />
    </main>
  );
}