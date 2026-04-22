// app/events/[slug]/page.tsx — Server Component
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import type {
  EventSpeaker,
  EventScheduleItem,
  EventSponsor,
  EventFAQ,
} from "@/lib/models/Events";

import { EventHero } from "@/components/sections/events/event/eHero";
import { EventMetaBar } from "@/components/sections/events/event/eMetaBar";
import { EventMainContent } from "@/components/sections/events/event/eMain";
import { EventSchedule } from "@/components/sections/events/event/eSchedule";
import { SpeakersSection } from "@/components/sections/events/event/eSpeaker";
import { SponsorsSection } from "@/components/sections/events/event/eSponsors";
import { FAQSection } from "@/components/sections/events/event/eFAQ";
import { EventReviewsSection } from "@/components/sections/events/event/eReviews";
import { RelatedEvents } from "@/components/sections/events/event/eRelated";
import { FinalCTA } from "@/components/sections/events/event/eCTA";
import { ObjectId } from "mongodb";

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
  speakers: EventSpeaker[];
  schedule: EventScheduleItem[];
  sponsors: EventSponsor[];
  faqs: EventFAQ[];
  eventDate: string;
  // Raw ISO dates — needed by EventReviewsSection for window calculation
  eventDateIso: string;
  endDate: string;
  endDateIso: string | null;
  registrationDeadline: string;
  duration: string;
  capacity: number;
  registered: number;
  slotsRemaining: number;
  price: string;
  isFree: boolean;
  image: string;
  logoImage: string;
  hasGallery: boolean;
  galleryUrls: string[];
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

const FALLBACK_IMAGE = "/images/events/default.jpg";

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

  const bannerUrl = doc.hasEventBanner ? (doc.eventBanner?.imageUrl ?? "") : "";
  const logoUrl = doc.hasEventLogo ? (doc.eventLogo?.imageUrl ?? "") : "";
  const heroImage = bannerUrl || logoUrl || FALLBACK_IMAGE;
  const logoImage = logoUrl || FALLBACK_IMAGE;
  const galleryUrls = doc.hasEventGallery
    ? (doc.eventGallery ?? []).slice(0, 6).map((g) => g.imageUrl)
    : [];

  const eventDateObj = new Date(doc.eventDate as Date);
  const endDateObj = doc.endDate ? new Date(doc.endDate as Date) : null;

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
    speakers: doc.speakers ?? [],
    schedule: doc.schedule ?? [],
    sponsors: doc.sponsors ?? [],
    faqs: doc.faqs ?? [],
    eventDate: fmt(eventDateObj),
    eventDateIso: eventDateObj.toISOString(),
    endDate: endDateObj ? fmt(endDateObj) : "",
    endDateIso: endDateObj?.toISOString() ?? null,
    registrationDeadline: new Date(doc.registrationDeadline as Date).toISOString(),
    duration: doc.duration ?? "",
    capacity: doc.capacity,
    registered,
    slotsRemaining: Math.max(0, doc.capacity - registered),
    price: priceStr,
    isFree,
    image: heroImage,
    logoImage,
    hasGallery: doc.hasEventGallery ?? false,
    galleryUrls,
    status: doc.status,
    locationScope: doc.locationScope ?? "local",
  };

  const related: RelatedEventItem[] = relatedDocs.map((e) => {
    const d = new Date(e.eventDate as Date);
    const tag = d > now ? "Upcoming" : "Past";
    const img = e.hasEventBanner
      ? (e.eventBanner?.imageUrl ?? FALLBACK_IMAGE)
      : e.hasEventLogo
        ? (e.eventLogo?.imageUrl ?? FALLBACK_IMAGE)
        : FALLBACK_IMAGE;
    return {
      id: e._id!.toString(),
      slug: e.slug,
      title: e.title,
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      location: e.location?.city ?? String(e.format),
      image: img,
      tag,
    };
  });

  return { detail, related };
}

// ── Resolve membership from server-side session cookie ────────────────────────
// Used to determine whether to show the reviews gate on the server.
// We use the HTTP-only session cookie here — no client JS needed.

async function resolveIsMember(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("diuscadi_token")?.value;
    if (!token) return false;

    const payload = verifyJWT(token);
    if (!payload?.vaultId) return false;

    // ✅ Convert string vaultId from JWT to ObjectId for MongoDB query
    let vaultObjectId: ObjectId;
    try {
      vaultObjectId = new ObjectId(payload.vaultId);
    } catch {
      return false;
    }

    const db = await getDb();
   const userData = await Collections.userData(db).findOne(
     { vaultId: vaultObjectId },
     { projection: { membershipStatus: 1 } },
   );
    return userData?.membershipStatus === "approved";
  } catch {
    return false;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [result, isMember] = await Promise.all([
    fetchEventDetail(slug),
    resolveIsMember(),
  ]);

  if (!result) notFound();

  const { detail, related } = result;

  return (
    <main
      className={cn(
        "min-h-screen",
        "w-full md:mt-[120px] mt-[60px]",
        "bg-background",
      )}
    >
      <EventHero event={detail} />
      <EventMetaBar event={detail} />
      <div className="space-y-0">
        <EventMainContent event={detail} />
        <EventSchedule event={detail} />
        <SpeakersSection event={detail} />
        <SponsorsSection event={detail} />
        <FAQSection event={detail} />
        {/* E1 — Reviews & Ratings: appears after event ends, members only */}
        <EventReviewsSection
          eventSlug={detail.slug}
          eventId={detail.id}
          endDateIso={detail.endDateIso}
          eventDateIso={detail.eventDateIso}
          isMember={isMember}
        />
        <RelatedEvents events={related} currentSlug={detail.slug} />
        <FinalCTA event={detail} />
      </div>
    </main>
  );
}