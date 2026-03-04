// app/home/page.tsx  —  Server Component (data layer)
import { Announcements } from "@/components/sections/homepage/announcement";
import { ContinueSection } from "@/components/sections/homepage/continueSection";
import { HomeCTAOptional } from "@/components/sections/homepage/CTA";
import { HomeHeader } from "@/components/sections/homepage/HomeHeader";
import { HomeHero } from "@/components/sections/homepage/homeHero";
import { QuickActions } from "@/components/sections/homepage/quickActions";
import { RecentActivity } from "@/components/sections/homepage/recentActivity";
import { RecommendedSection } from "@/components/sections/homepage/recommendationSection";
import { UpcomingEvents } from "@/components/sections/homepage/upcomingEvents";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = {
  name: string;
  avatar: string;
  status: string;
  skill: string;
  interest: string;
  projectsParticipated: string;
  points: number;
};

export type FeaturedEvent = {
  title: string;
  date: string;
  daysLeft: number;
  image: string; // URL string for server-safe passing
};

export type CurrentTask = {
  title: string;
  category: string;
  progress: number;
};

export type QuickAction = {
  title: string;
  desc: string;
  link: string;
};

export type ContinueItem = {
  type: string;
  title: string;
  status: string;
  link: string;
  action: string;
};

export type Recommendation = {
  type: string;
  title: string;
  meta: string;
  tag: string;
};

export type ScheduledEvent = {
  date: string;
  month: string;
  title: string;
  time: string;
  location: string;
  status: "Registered" | "Confirmed" | "On Waitlist";
  type: string;
};

export type Activity = {
  id: number;
  content: string;
  target: string;
  time: string;
};

export type Announcement = {
  id: number;
  title: string;
  desc: string;
  type: "Update" | "New" | "Alert";
};

// ─── Page-level data (replace with async fetch / DB calls) ────────────────────

const user: User = {
  name: "Nnamdi",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nnamdi",
  status: "Final Year Student",
  skill: "Web Dev",
  interest: "Tech",
  projectsParticipated: "6",
  points: 450,
};

const featuredEvent: FeaturedEvent = {
  title: "Graduate Career Series: Lagos 2026",
  date: "March 15, 2026",
  daysLeft: 3,
  image:
    "/assets/img/downloads/Diuscadi-2023-Testimonial-Thumbnail-1920x1272.webp",
};

const currentTask: CurrentTask = {
  title: "CV & Cover Letter Mastery",
  category: "Professional Branding",
  progress: 65,
};

const quickActions: QuickAction[] = [
  { title: "Browse Programs", desc: "Career workshops", link: "/programs" },
  { title: "View Events", desc: "Upcoming seminars", link: "/events" },
  { title: "My Tickets", desc: "Access your passes", link: "/tickets" },
  { title: "My Profile", desc: "Account settings", link: "/profile" },
];

const continueItems: ContinueItem[] = [
  {
    type: "Learning",
    title: "Resume: Effective Networking for introverts",
    status: "65% Complete",
    link: "/learning/module-4",
    action: "Resume Video",
  },
  {
    type: "Registration",
    title: "Finish: Abuja Career Summit 2026",
    status: "Step 2 of 3",
    link: "/events/abuja-summit/register",
    action: "Complete Registration",
  },
  {
    type: "Application",
    title: "Pending: Mentor Match Request",
    status: "Awaiting your input",
    link: "/mentorship/apply",
    action: "Continue App",
  },
];

const recommendations: Recommendation[] = [
  {
    type: "Program",
    title: "Advanced React Patterns for Enterprise",
    meta: "8 Modules • 12 hours",
    tag: "Matches your Skill",
  },
  {
    type: "Event",
    title: "Tech Career Fair: Hybrid Edition",
    meta: "Virtual • March 20, 2026",
    tag: "Popular in Tech",
  },
  {
    type: "Resource",
    title: "2026 Salary Guide: Nigeria Tech",
    meta: "PDF Guide • 15 Pages",
    tag: "New Resource",
  },
];

const scheduledEvents: ScheduledEvent[] = [
  {
    date: "18",
    month: "FEB",
    title: "DIUSCADI Orientation: New Members",
    time: "10:00 AM WAT",
    location: "Virtual (Zoom)",
    status: "Registered",
    type: "Webinar",
  },
  {
    date: "24",
    month: "FEB",
    title: "CV Clinic & Portfolio Review",
    time: "02:00 PM WAT",
    location: "Lagos Hub / Hybrid",
    status: "Confirmed",
    type: "Workshop",
  },
  {
    date: "02",
    month: "MAR",
    title: "Networking Dinner: Tech Founders",
    time: "06:00 PM WAT",
    location: "Victoria Island, Lagos",
    status: "On Waitlist",
    type: "Physical",
  },
];

const activities: Activity[] = [
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
  { id: 3, content: "Earned", target: "50 Career Points", time: "2 days ago" },
  { id: 4, content: "Updated", target: "Professional Bio", time: "3 days ago" },
];

const announcements: Announcement[] = [
  {
    id: 1,
    title: "DevFest Lagos 2026 Schedule Released!",
    desc: "The full lineup of speakers and workshop tracks is now live. Check your track.",
    type: "Update",
  },
  {
    id: 2,
    title: "New Career Mentorship Program",
    desc: "Applications are now open for the Q2 Senior Executive Mentorship cohort.",
    type: "New",
  },
  {
    id: 3,
    title: "Platform Maintenance Notice",
    desc: "The portal will be offline for 2 hours this Sunday for security upgrades.",
    type: "Alert",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
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
      <HomeHero featuredEvent={featuredEvent} currentTask={currentTask} />
      <QuickActions actions={quickActions} />
      <ContinueSection items={continueItems} />
      <RecommendedSection
        recommendations={recommendations}
        userInterests="Web Dev & Tech"
      />
      <UpcomingEvents events={scheduledEvents} />
      <RecentActivity activities={activities} />
      <Announcements announcements={announcements} />
      <HomeCTAOptional />
    </main>
  );
}
