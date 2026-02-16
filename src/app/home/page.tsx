// import Image from "next/image";
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


export default function HomePage() {
  return (
    <main className={cn('flex', 'flex-col', 'p-5', 'pt-[90px]', 'items-center', 'justify-center', 'w-full', 'h-full')}>
      <HomeHeader />
      <HomeHero />
      <QuickActions />
      <ContinueSection />
      <RecommendedSection />
      <UpcomingEvents />
      <RecentActivity />
      <Announcements />
      <HomeCTAOptional />
    </main>
  );
}
