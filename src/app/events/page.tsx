// app/events/page.tsx — Server Component
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

import { EventsHeader } from "@/components/sections/events/eventHeader";
import { EventsListingClient } from "@/components/sections/events/EventsListingClient";
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

function resolveEventImage(
  e: {
    hasEventBanner?: boolean;
    eventBanner?: { imageUrl: string } | null;
    hasEventLogo?: boolean;
    eventLogo?: { imageUrl: string } | null;
  },
  fallback = "/images/events/default.jpg",
): string {
  if (e.hasEventBanner && e.eventBanner?.imageUrl)
    return e.eventBanner.imageUrl;
  if (e.hasEventLogo && e.eventLogo?.imageUrl) return e.eventLogo.imageUrl;
  return fallback;
}

// ── Data fetcher ──────────────────────────────────────────────────────────────

async function fetchEvents(): Promise<{
  events: EventItem[];
  spotlight: SpotlightEvent | null;
  counts: TabCount;
  categories: string[];
}> {
  const db = await getDb();
  const now = new Date();

  // Fetch events + cheapest ticket per event in one aggregation
  const docs = await Collections.events(db)
    .aggregate([
      { $match: { status: "published" } },
      { $sort: { eventDate: 1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: "ticketTypes",
          localField: "_id",
          foreignField: "eventId",
          pipeline: [
            { $match: { isActive: true } },
            { $sort: { price: 1 } },
            { $limit: 1 },
          ],
          as: "cheapestTicket",
        },
      },
      {
        $addFields: {
          cheapestTicket: { $arrayElemAt: ["$cheapestTicket", 0] },
        },
      },
    ])
    .toArray();

  // Collect distinct categories from DB results (no hardcoding)
  const categorySet = new Set<string>();
  docs.forEach((e) => {
    if (e.category) categorySet.add(String(e.category));
  });
  const categories = Array.from(categorySet).sort();

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

    // Derive isFree from cheapest ticket — not hardcoded
    const cheapest = e.cheapestTicket as { price?: number } | undefined;
    const isFree = !cheapest || !cheapest.price || cheapest.price === 0;

    return {
      id: e._id!.toString(),
      slug: e.slug,
      title: e.title,
      date: formatDate(d),
      location: locationStr,
      format: e.format,
      tag: eventTag(d, now),
      image: resolveEventImage(e),
      category: e.category,
      isFree,
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
        image: resolveEventImage(spotlightDoc),
        registered: registeredCount,
      }
    : null;

  const counts: TabCount = {
    all: events.length,
    upcoming: events.filter((e) => e.tag !== "Past").length,
    past: events.filter((e) => e.tag === "Past").length,
  };

  return { events, spotlight, counts, categories };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EventPage() {
  const { events, spotlight, counts, categories } = await fetchEvents();

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
      {/* EventsListingClient owns filter state + grid — client component */}
      <EventsListingClient
        events={events}
        spotlight={spotlight}
        counts={counts}
        categories={categories}
      />
      <NewsletterOrCTA />
    </main>
  );
}
