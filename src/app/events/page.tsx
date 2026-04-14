// app/events/page.tsx — Server Component
// Bug 3 fix:
//  - Added `export const dynamic = "force-dynamic"` so Next.js never serves
//    a stale cached render after an event is cancelled by admin.
//  - $match now explicitly filters { status: { $in: ["published"] } } which
//    is functionally equivalent but makes the intent explicit; cancelled events
//    that slipped in via any other path will also be excluded.

export const dynamic = "force-dynamic";

import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

import { EventsHeader } from "@/components/sections/events/eventHeader";
import { EventsListingClient } from "@/components/sections/events/EventsListingClient";
import { NewsletterOrCTA } from "@/components/sections/events/eventCTA";

// ── Shared types ──────────────────────────────────────────────────────────────

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  date: string; // display string e.g. "Nov 15"
  location: string;
  format: string;
  tag: "Upcoming" | "Ongoing" | "Past";
  image: string;
  category: string;
  isFree: boolean;

  // ── Fields required by getEventState() ──────────────────────────────────
  eventDate: string; // ISO — for state calculation
  endDate: string | null;
  registrationDeadline: string; // ISO
  slotsRemaining: number;
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

  // ── Fields required by getEventState() ──────────────────────────────────
  eventDate: string;
  endDate: string | null;
  registrationDeadline: string;
  slotsRemaining: number;
  isFree: boolean;
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

  const docs = await Collections.events(db)
    .aggregate([
      // Explicitly only include published events — cancelled/draft are excluded.
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
      // Count non-cancelled registrations per event
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
        $addFields: {
          cheapestTicket: { $arrayElemAt: ["$cheapestTicket", 0] },
          registeredCount: {
            $ifNull: [{ $arrayElemAt: ["$regCount.total", 0] }, 0],
          },
        },
      },
    ])
    .toArray();

  // Distinct categories
  const categorySet = new Set<string>();
  docs.forEach((e) => {
    if (e.category) categorySet.add(String(e.category));
  });
  const categories = Array.from(categorySet).sort();

  // Map to EventItem — include all fields getEventState() needs
  const events: EventItem[] = docs.map((e) => {
    const eventDateObj = new Date(e.eventDate as Date);
    const deadlineObj = e.registrationDeadline
      ? new Date(e.registrationDeadline as Date)
      : eventDateObj;
    const endDateObj = e.endDate ? new Date(e.endDate as Date) : null;

    const locationStr = e.location
      ? [e.location.city, e.location.state].filter(Boolean).join(", ") ||
        String(e.format)
      : String(e.format);

    const cheapest = e.cheapestTicket as { price?: number } | undefined;
    const isFree = !cheapest || !cheapest.price || cheapest.price === 0;

    const capacity = (e.capacity as number) ?? 0;
    const registeredCount = (e.registeredCount as number) ?? 0;
    const slotsRemaining = Math.max(0, capacity - registeredCount);

    return {
      id: e._id!.toString(),
      slug: String(e.slug),
      title: String(e.title),
      date: formatDate(eventDateObj),
      location: locationStr,
      format: String(e.format),
      tag: eventTag(eventDateObj, now),
      image: resolveEventImage(e),
      category: String(e.category),
      isFree,
      eventDate: eventDateObj.toISOString(),
      endDate: endDateObj?.toISOString() ?? null,
      registrationDeadline: deadlineObj.toISOString(),
      slotsRemaining,
    };
  });

  // Spotlight: prefer first upcoming event; fall back to most recent past event
  const upcomingDoc = docs.find((e) => new Date(e.eventDate as Date) > now);
  const pastDoc = [...docs]
    .reverse()
    .find((e) => new Date(e.eventDate as Date) <= now);
  const spotlightDoc = upcomingDoc ?? pastDoc ?? null;

  const spotlight: SpotlightEvent | null = spotlightDoc
    ? (() => {
        const eventDateObj = new Date(spotlightDoc.eventDate as Date);
        const deadlineObj = spotlightDoc.registrationDeadline
          ? new Date(spotlightDoc.registrationDeadline as Date)
          : eventDateObj;
        const endDateObj = spotlightDoc.endDate
          ? new Date(spotlightDoc.endDate as Date)
          : null;
        const cheapest = spotlightDoc.cheapestTicket as
          | { price?: number }
          | undefined;
        const isFree = !cheapest || !cheapest.price || cheapest.price === 0;
        const capacity = (spotlightDoc.capacity as number) ?? 0;
        const regCount = (spotlightDoc.registeredCount as number) ?? 0;

        return {
          id: spotlightDoc._id!.toString(),
          slug: String(spotlightDoc.slug),
          title: String(spotlightDoc.title),
          date: formatFullDate(eventDateObj),
          location: spotlightDoc.location
            ? [spotlightDoc.location.venue, spotlightDoc.location.city]
                .filter(Boolean)
                .join(", ")
            : String(spotlightDoc.format),
          description: String(
            spotlightDoc.shortDescription ?? spotlightDoc.overview ?? "",
          ),
          image: resolveEventImage(spotlightDoc),
          registered: regCount,
          eventDate: eventDateObj.toISOString(),
          endDate: endDateObj?.toISOString() ?? null,
          registrationDeadline: deadlineObj.toISOString(),
          slotsRemaining: Math.max(0, capacity - regCount),
          isFree,
        };
      })()
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
