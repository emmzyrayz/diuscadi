// app/events/page.tsx — Server Component
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

import { EventsHeader } from "@/components/sections/events/eventHeader";
import { EventsFilterBar } from "@/components/sections/events/eventFilter";
import { FeaturedEvent } from "@/components/sections/events/featuredEvent";
import { EventsTabs } from "@/components/sections/events/eventTabs";
import { EventsGrid } from "@/components/sections/events/eventGrid";
import { NewsletterOrCTA } from "@/components/sections/events/eventCTA";

// ── Shared types (imported by child components too) ───────────────────────────

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  date: string;
  location: string;
  format: string;
  tag: "Upcoming" | "Ongoing" | "Past";
  image: string;
  category: string;
  isFree: boolean;
}

export interface SpotlightEvent {
  id: string;
  slug: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image: string;
  registered: number;
}

export interface TabCount {
  all: number;
  upcoming: number;
  past: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function eventTag(eventDate: Date, now: Date): EventItem["tag"] {
  if (eventDate < now) return "Past";
  const diff = eventDate.getTime() - now.getTime();
  if (diff < 1000 * 60 * 60 * 24 * 3) return "Ongoing";
  return "Upcoming";
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(d: Date): string {
  return (
    d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }) +
    " • " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
}

// ── Data fetcher ──────────────────────────────────────────────────────────────

async function fetchEvents(): Promise<{
  events: EventItem[];
  spotlight: SpotlightEvent | null;
  counts: TabCount;
}> {
  const db = await getDb();
  const now = new Date();

  const docs = await Collections.events(db)
    .find({ status: "published" })
    .sort({ eventDate: 1 })
    .limit(50)
    .toArray();

  // Pick first upcoming event as spotlight
  const spotlightDoc =
    docs.find((e) => new Date(e.eventDate as Date) > now) ?? docs[0];

  let registeredCount = 0;
  if (spotlightDoc) {
    registeredCount = await Collections.eventRegistrations(db).countDocuments({
      eventId: spotlightDoc._id,
      status: { $ne: "cancelled" },
    });
  }

  const events: EventItem[] = docs.map((e) => {
    const d = new Date(e.eventDate as Date);
    const locationStr = e.location
      ? [e.location.city, e.location.state].filter(Boolean).join(", ") ||
        String(e.format)
      : String(e.format);

    return {
      id: e._id!.toString(),
      slug: e.slug,
      title: e.title,
      date: formatDate(d),
      location: locationStr,
      format: e.format,
      tag: eventTag(d, now),
      image: e.image ?? "/images/events/default.jpg",
      category: e.category,
      isFree: true,
    };
  });

  const spotlight: SpotlightEvent | null = spotlightDoc
    ? {
        id: spotlightDoc._id!.toString(),
        slug: spotlightDoc.slug,
        title: spotlightDoc.title,
        date: formatFullDate(new Date(spotlightDoc.eventDate as Date)),
        location: spotlightDoc.location
          ? [spotlightDoc.location.venue, spotlightDoc.location.city]
              .filter(Boolean)
              .join(", ")
          : String(spotlightDoc.format),
        description:
          spotlightDoc.shortDescription ?? spotlightDoc.overview ?? "",
        image: spotlightDoc.image ?? "/images/events/default.jpg",
        registered: registeredCount,
      }
    : null;

  const counts: TabCount = {
    all: events.length,
    upcoming: events.filter((e) => e.tag !== "Past").length,
    past: events.filter((e) => e.tag === "Past").length,
  };

  return { events, spotlight, counts };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EventPage() {
  const { events, spotlight, counts } = await fetchEvents();

  return (
    <main
      className={cn(
        "flex",
        "flex-col",
        "pt-[90px]",
        "items-center",
        "justify-center",
        "w-full",
        "min-h-screen",
      )}
    >
      <EventsHeader />
      <EventsFilterBar />
      {spotlight && <FeaturedEvent event={spotlight} />}
      <EventsTabs counts={counts} />
      <EventsGrid events={events} />
      <NewsletterOrCTA />
    </main>
  );
}
