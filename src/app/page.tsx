// import Image from "next/image";

import { Banner } from "@/components/sections/banner";
import { Hero } from "@/components/sections/hero";
import { cn } from "../lib/utils";
import { TrustBar } from "@/components/sections/trustBar";
import { AboutSection } from "@/components/sections/aboutSect";
import { ProgramsSection } from "@/components/sections/programSect";
import { UpcomingEvent } from "@/components/sections/upcomingEvent";
import { PastEventsSection } from "@/components/sections/pastEvents";
import { Testimonials } from "@/components/sections/testimonial";
import { ImpactSection } from "@/components/sections/impactSection";
import { EventSchedule } from "@/components/sections/eventSchedule";
import { SponsorSection } from "@/components/sections/sponsorSect";
import { FAQSection } from "@/components/sections/faq";
import { CTA } from "@/components/sections/CTA";
import { Newsletter } from "@/components/sections/newsletter";

export default function Home() {
  return (
    <main className={cn('flex', 'flex-col', 'p-5', 'pt-[90px]', 'items-center', 'justify-center', 'w-full', 'h-full')}>
      <Banner />
      <Hero />
      <TrustBar />
      <AboutSection />
      <ProgramsSection />
      <EventSchedule />
      <UpcomingEvent />
      <PastEventsSection />
      <Testimonials />
      <ImpactSection />
      <SponsorSection />
      <FAQSection />
      <CTA />
      <Newsletter />
    </main>
  );
}
