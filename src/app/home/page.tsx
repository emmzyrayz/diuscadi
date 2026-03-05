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

  // Build user prop for HomeHeader (falls back gracefully if profile missing)
  const user = homeUser
    ? {
        name: homeUser.name,
        avatar: homeUser.avatar,
        status: `${homeUser.eduStatus.charAt(0).toUpperCase()}${homeUser.eduStatus.slice(1)}`,
        skill: homeUser.skills[0] ?? "",
        interest: homeUser.committee ?? "General",
        projectsParticipated: String(homeUser.eventsAttended),
        points: homeUser.eventsRegistered * 50, // placeholder formula
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

  // Build hero props
  const currentTask = {
    title: "Complete Your Profile",
    category: "Getting Started",
    progress: homeUser?.profileCompleted ? 100 : 40,
  };

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
      <HomeHeader user={user} />

      <HomeHero
        // Use a fallback object if featuredEvent is null/undefined
        featuredEvent={
          featuredEvent ?? {
            title: "No Upcoming Featured Events",
            category: "Announcement",
            date: "TBD",
            image: "/default-hero.jpg",
          }
        }
        currentTask={currentTask}
      />

      <QuickActions actions={quickActions} />

      <ContinueSection items={continueItems} />

      <RecommendedSection
        recommendations={recommendations}
        userInterests={homeUser?.skills.join(" & ") ?? "General"}
      />

      <UpcomingEvents events={upcomingEvents} />

      <RecentActivity activities={activities} />

      <Announcements announcements={announcements} />

      <HomeCTAOptional />
    </main>
  );
}