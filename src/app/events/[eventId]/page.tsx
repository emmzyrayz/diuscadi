import { getEventById, DUMMY_EVENTS } from "@/assets/data/event";
import { notFound } from "next/navigation";
import { EventHero } from "@/components/sections/events/event/eHero";
import { EventMetaBar } from "@/components/sections/events/event/eMetaBar";
import { EventMainContent } from "@/components/sections/events/event/eMain";
import { EventSchedule } from "@/components/sections/events/event/eSchedule";
import { SpeakersSection } from "@/components/sections/events/event/eSpeaker";
import { SponsorsSection } from "@/components/sections/events/event/eSponsors";
import { FAQSection } from "@/components/sections/events/event/eFAQ";
import { RelatedEvents } from "@/components/sections/events/event/eRelated";
import { FinalCTA } from "@/components/sections/events/event/eCTA";
import { cn } from "../../../lib/utils";

// Use this to pre-render paths at build time (optional but recommended)
export async function generateStaticParams() {
  return DUMMY_EVENTS.map((event) => ({
    eventId: event.id,
  }));
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = getEventById(eventId);

  if (!event) {
    notFound(); // Triggers the default 404 page
  }

  return (
    <main className={cn('min-h-screen w-full', 'bg-white')}>
      <EventHero event={event} />
      <EventMetaBar event={event} />

      <div className="space-y-0">
        <EventMainContent event={event} />
        <EventSchedule />
        <SpeakersSection />
        <SponsorsSection eventTitle={event.title} />
        <FAQSection />
        <RelatedEvents />
        <FinalCTA event={event} />
      </div>
    </main>
  );
}
