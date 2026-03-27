// app/events/[slug]/register/page.tsx — Server Component
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { cn } from "@/lib/utils";

import { AuthRequiredCard } from "@/components/sections/events/tickets/AuthReqCard";
import { CompleteProfilePrompt } from "@/components/sections/events/tickets/CompleteProfile";
import { RegistrationShell } from "@/components/sections/events/tickets/RegistrationShell";

// ── Types exported for child components ──────────────────────────────────────

export interface RegisterEventData {
  id: string;
  slug: string;
  title: string;
  category: string;
  format: string;
  eventDate: string;
  location: string;
  image: string;
  price: string;
  isFree: boolean;
  capacity: number;
  registered: number;
  slotsRemaining: number;
  registrationDeadline: string;
  ticketTypes: TicketTypeOption[];
}

export interface TicketTypeOption {
  id: string;
  name: string;
  price: number;
  currency: string;
  label: string;
}

export interface RegisterUserData {
  id: string;
  name: string;
  email: string;
  avatar: string; // imageUrl string — never a CloudinaryImage object
  role: string;
  hasAvatar: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(price: number, currency: string) {
  if (price === 0) return "Free";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 0,
  }).format(price);
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const FALLBACK_IMAGE = "/images/events/default.jpg";

// ── Data fetcher ──────────────────────────────────────────────────────────────

async function fetchRegisterData(
  slug: string,
): Promise<RegisterEventData | null> {
  const db = await getDb();
  const now = new Date();

  const doc = await Collections.events(db).findOne({
    slug,
    status: "published",
  });
  if (!doc) return null;

  const deadline = new Date(doc.registrationDeadline as Date);
  if (deadline < now) return null;

  const [registered, tickets] = await Promise.all([
    Collections.eventRegistrations(db).countDocuments({
      eventId: doc._id,
      status: { $ne: "cancelled" },
    }),
    Collections.ticketTypes(db)
      .find({ eventId: doc._id, isActive: true })
      .sort({ price: 1 })
      .toArray(),
  ]);

  const locationStr = doc.location
    ? [doc.location.venue, doc.location.city].filter(Boolean).join(", ")
    : String(doc.format);

  const cheapest = tickets[0];
  const isFree = !cheapest || cheapest.price === 0;
  const priceStr = cheapest
    ? fmtPrice(cheapest.price, cheapest.currency)
    : "Free";

  // Resolve image: banner → logo → fallback
  const image = doc.hasEventBanner
    ? (doc.eventBanner?.imageUrl ?? FALLBACK_IMAGE)
    : doc.hasEventLogo
      ? (doc.eventLogo?.imageUrl ?? FALLBACK_IMAGE)
      : FALLBACK_IMAGE;

  return {
    id: doc._id!.toString(),
    slug: doc.slug,
    title: doc.title,
    category: doc.category,
    format: doc.format,
    eventDate: fmtDate(new Date(doc.eventDate as Date)),
    location: locationStr,
    image,
    price: priceStr,
    isFree,
    capacity: doc.capacity,
    registered,
    slotsRemaining: Math.max(0, doc.capacity - registered),
    registrationDeadline: deadline.toISOString(),
    ticketTypes: tickets.map((t) => ({
      id: t._id!.toString(),
      name: t.name,
      price: t.price,
      currency: t.currency,
      label: fmtPrice(t.price, t.currency),
    })),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const event = await fetchRegisterData(slug);
  if (!event) notFound();
  if (event.slotsRemaining === 0) notFound();

  let authUser: RegisterUserData | null = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("diuscadi_token")?.value;
    if (token) {
      const payload = await verifyJWT(token);
      if (payload?.vaultId) {
        const db = await getDb();
        const userData = await Collections.userData(db).findOne({
          vaultId: new ObjectId(payload.vaultId),
        });
        if (userData) {
          const vault = await Collections.vault(db).findOne({
            _id: new ObjectId(payload.vaultId),
          });

          // fullName is now a structured object — build display string
          const fn = userData.fullName;
          const name = fn
            ? [fn.firstname, fn.secondname, fn.lastname]
                .filter(Boolean)
                .join(" ")
            : "";

          // avatar is now a CloudinaryImage — extract URL for the client
          const avatarUrl = userData.hasAvatar
            ? (userData.avatar?.imageUrl ?? "")
            : "";

          authUser = {
            id: userData._id!.toString(),
            name,
            email: vault?.email ?? "",
            avatar: avatarUrl,
            role: userData.role ?? "participant",
            hasAvatar: userData.hasAvatar,
          };
        }
      }
    }
  } catch {
    // unauthenticated — authUser stays null
  }

  const isUnauthenticated = !authUser;
  const isIncomplete = authUser && !authUser.hasAvatar;
  const isVerified = authUser && authUser.hasAvatar;

  // ── Breadcrumb (shared across all auth states) ────────────────────────────
  const Breadcrumb = (
    <div
      className={cn(
        "w-full",
        "bg-background",
        "border-b",
        "border-border",
        "py-6",
      )}
    >
      <div className={cn("max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8")}>
        <div
          className={cn(
            "flex",
            "items-center",
            "gap-2",
            "text-xs",
            "font-bold",
            "text-muted-foreground",
            "uppercase",
            "tracking-widest",
          )}
        >
          <span>Events</span>
          <span className="text-slate-200">/</span>
          <span className={cn("text-slate-600", "truncate", "max-w-xs")}>
            {event.title}
          </span>
          <span className="text-slate-200">/</span>
          <span className="text-primary">Registration</span>
        </div>
      </div>
    </div>
  );

  return (
    <main className={cn("min-h-screen w-full", "bg-muted/50", "pb-20", "pt-[122px]")}>
      {isUnauthenticated && (
        <>
          {Breadcrumb}
          <AuthRequiredCard eventSlug={event.slug} />
        </>
      )}

      {isIncomplete && (
        <>
          {Breadcrumb}
          <CompleteProfilePrompt />
        </>
      )}

      {isVerified && authUser && (
        <RegistrationShell event={event} user={authUser} />
      )}
    </main>
  );
}
