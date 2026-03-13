// app/events/[slug]/page.tsx — Server Component
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";

import { EventHero } from "@/components/sections/events/event/eHero";
import { EventMetaBar } from "@/components/sections/events/event/eMetaBar";
import { EventMainContent } from "@/components/sections/events/event/eMain";
import { EventSchedule } from "@/components/sections/events/event/eSchedule";
import { SpeakersSection } from "@/components/sections/events/event/eSpeaker";
import { SponsorsSection } from "@/components/sections/events/event/eSponsors";
import { FAQSection } from "@/components/sections/events/event/eFAQ";
import { RelatedEvents } from "@/components/sections/events/event/eRelated";
import { FinalCTA } from "@/components/sections/events/event/eCTA";

// ── Shared detail type (exported for child components) ────────────────────────

export interface EventDetail {
  id: string;
  slug: string;
  title: string;
  overview: string;
  description: string;
  shortDescription: string;
  learningOutcomes: string[];
  category: string;
  tags: string[];
  level: string;
  requiredSkills: string[];
  targetEduStatus: string;
  instructor: string;
  format: string;
  location: {
    venue: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };
  // Dates — ISO strings (safe to pass through server→client boundary)
  eventDate: string;
  endDate: string;
  registrationDeadline: string;
  duration: string;
  // Capacity
  capacity: number;
  registered: number;
  slotsRemaining: number;
  // Price — derived from cheapest active TicketType
  price: string;
  isFree: boolean;
  // Display
  image: string;
  status: string;
  locationScope: string;
}

export interface RelatedEventItem {
  id: string;
  slug: string;
  title: string;
  date: string;
  location: string;
  image: string;
  tag: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPrice(price: number, currency: string): string {
  if (price === 0) return "Free";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 0,
  }).format(price);
}

// ── Data fetcher ──────────────────────────────────────────────────────────────

async function fetchEventDetail(
  slug: string,
): Promise<{ detail: EventDetail; related: RelatedEventItem[] } | null> {
  const db = await getDb();

  const doc = await Collections.events(db).findOne({
    slug,
    status: "published",
  });
  if (!doc) return null;

  // Parallel: registration count + cheapest ticket + related events
  const [registered, tickets, relatedDocs] = await Promise.all([
    Collections.eventRegistrations(db).countDocuments({
      eventId: doc._id,
      status: { $ne: "cancelled" },
    }),
    Collections.ticketTypes(db)
      .find({ eventId: doc._id, isActive: true })
      .sort({ price: 1 })
      .limit(5)
      .toArray(),
    Collections.events(db)
      .find({
        status: "published",
        _id: { $ne: doc._id },
        category: doc.category,
      })
      .sort({ eventDate: 1 })
      .limit(3)
      .toArray(),
  ]);

  const cheapest = tickets[0];
  const isFree = !cheapest || cheapest.price === 0;
  const priceStr = cheapest
    ? formatPrice(cheapest.price, cheapest.currency)
    : "Free";
  const now = new Date();

  const detail: EventDetail = {
    id: doc._id!.toString(),
    slug: doc.slug,
    title: doc.title,
    overview: doc.overview ?? "",
    description: doc.description ?? doc.overview ?? "",
    shortDescription: doc.shortDescription ?? doc.overview ?? "",
    learningOutcomes: doc.learningOutcomes ?? [],
    category: doc.category,
    tags: doc.tags ?? [],
    level: doc.level ?? "All Levels",
    requiredSkills: doc.requiredSkills ?? [],
    targetEduStatus: doc.targetEduStatus ?? "ALL",
    instructor: doc.instructor ?? "",
    format: doc.format,
    location: {
      venue: doc.location?.venue ?? "",
      address: doc.location?.address ?? "",
      city: doc.location?.city ?? "",
      state: doc.location?.state ?? "",
      country: doc.location?.country ?? "Nigeria",
    },
    eventDate: fmt(new Date(doc.eventDate as Date)),
    endDate: doc.endDate ? fmt(new Date(doc.endDate as Date)) : "",
    registrationDeadline: new Date(
      doc.registrationDeadline as Date,
    ).toISOString(),
    duration: doc.duration ?? "",
    capacity: doc.capacity,
    registered,
    slotsRemaining: Math.max(0, doc.capacity - registered),
    price: priceStr,
    isFree,
    image: doc.image ?? "/images/events/default.jpg",
    status: doc.status,
    locationScope: doc.locationScope ?? "local",
  };

  const related: RelatedEventItem[] = relatedDocs.map((e) => {
    const d = new Date(e.eventDate as Date);
    const tag = d > now ? "Upcoming" : "Past";
    return {
      id: e._id!.toString(),
      slug: e.slug,
      title: e.title,
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      location: e.location?.city ?? String(e.format),
      image: e.image ?? "/images/events/default.jpg",
      tag,
    };
  });

  return { detail, related };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const result = await fetchEventDetail(eventId);

  if (!result) notFound();

  const { detail, related } = result;

  return (
    <main className={cn("min-h-screen", "w-full", "bg-background")}>
      <EventHero event={detail} />
      <EventMetaBar event={detail} />
      <div className="space-y-0">
        <EventMainContent event={detail} />
        <EventSchedule event={detail} />
        <SpeakersSection event={detail} />
        <SponsorsSection event={detail} />
        <FAQSection event={detail} />
        <RelatedEvents events={related} currentSlug={detail.slug} />
        <FinalCTA event={detail} />
      </div>
    </main>
  );
}
