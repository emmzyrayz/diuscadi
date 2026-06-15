// import { notFound } from "next/navigation";
// import { Metadata } from "next";
// import { getDb } from "@/lib/mongodb";
// import { Collections } from "@/lib/db/collections";
// import { CloudinaryImage } from "@/types/cloudinary";
// import RegistrationForm from "./registrationForm";
// import Image from "next/image";

// // ─────────────────────────────────────────────────────────────────────────────
// // Types
// // ─────────────────────────────────────────────────────────────────────────────

// interface PageProps {
//   params: Promise<{ slug: string }>;
//   searchParams?: Promise<Record<string, string | string[] | undefined>>;
// }

// interface SerializableTicketType {
//   _id: string;
//   name: string;
//   price: number;
//   currency: "NGN" | "USD" | "GBP";
//   maxQuantity: number;
//   isActive: boolean;
//   availableFrom?: string;
//   availableUntil?: string;
// }

// interface SerializableEvent {
//   _id: string;
//   title: string;
//   shortDescription: string;
//   eventDate: string;
//   registrationDeadline: string;
//   format: string;
//   location?: {
//     venue?: string;
//     city?: string;
//     state?: string;
//   };
//   capacity: number;
//   status: string;
//   slug: string;
//   eventBanner?: Pick<CloudinaryImage, "imageUrl" | "imageAlt"> | null;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Guest status check — runs server-side so the form mounts in the correct step
// // with zero client-side round-trips.
// // ─────────────────────────────────────────────────────────────────────────────

// interface GuestStatusResult {
//   status: "verified" | "pending" | "none";
//   registrationId?: string;
//   inviteCode?: string;
// }

// async function checkGuestStatus(
//   email: string,
//   eventId: string,
// ): Promise<GuestStatusResult> {
//   try {
//     const db = await getDb();
//     const { Collections } = await import("@/lib/db/collections");
//     const { ObjectId } = await import("mongodb");

//     if (!ObjectId.isValid(eventId)) return { status: "none" };

//     const guestReg = await Collections.guestEventRegistrations(db).findOne(
//       {
//         email: email.toLowerCase().trim(),
//         eventId: new ObjectId(eventId),
//         status: { $ne: "cancelled" },
//       },
//       {
//         projection: {
//           _id: 1,
//           inviteCode: 1,
//           verifiedAt: 1,
//           emailVerificationExpires: 1,
//         },
//       },
//     );

//     if (!guestReg) return { status: "none" };

//     const registrationId = guestReg._id!.toString();

//     // Already verified — jump to step 3
//     if (guestReg.verifiedAt) {
//       return {
//         status: "verified",
//         registrationId,
//         inviteCode: String(guestReg.inviteCode),
//       };
//     }

//     // OTP expired — treat as fresh (TTL will clean the record, but user can re-register)
//     if (
//       guestReg.emailVerificationExpires &&
//       new Date(guestReg.emailVerificationExpires as Date) < new Date()
//     ) {
//       return { status: "none" };
//     }

//     // OTP still valid and pending
//     return { status: "pending", registrationId };
//   } catch {
//     return { status: "none" };
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Metadata
// // ─────────────────────────────────────────────────────────────────────────────

// export async function generateMetadata({
//   params,
// }: PageProps): Promise<Metadata> {
//   const { slug } = await params; // ← was id

//   if (!slug) return { title: "Event Not Found | DIUSCADI" };

//   try {
//     const db = await getDb();
//     const event = await Collections.events(db).findOne(
//       { slug }, // ← was { _id: new ObjectId(id) }
//       { projection: { title: 1, shortDescription: 1, eventBanner: 1 } },
//     );

//     if (!event) return { title: "Event Not Found | DIUSCADI" };

//     return {
//       title: `${event.title} | DIUSCADI`,
//       description: String(event.shortDescription ?? ""),
//       openGraph: {
//         title: String(event.title),
//         description: String(event.shortDescription ?? ""),
//         ...(event.eventBanner?.imageUrl && {
//           images: [{ url: event.eventBanner.imageUrl }],
//         }),
//       },
//     };
//   } catch {
//     return { title: "DIUSCADI Event Registration" };
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Page (Server Component)
// // ─────────────────────────────────────────────────────────────────────────────

// export default async function EventLandingPage({
//   params,
//   searchParams,
// }: PageProps) {
//   const { slug } = await params;
//   const resolvedSearch = searchParams ? await searchParams : {};
//   const rawEmail = resolvedSearch.email;
//   const prefilledEmail = typeof rawEmail === "string" ? rawEmail.trim() : "";

//   if (!slug) notFound();

//   const db = await getDb();

//   // ── 1. Fetch event by slug ─────────────────────────────────────────────────
//   const rawEvent = await Collections.events(db).findOne(
//     { slug }, // ← was { _id: new ObjectId(id) }
//     {
//       projection: {
//         title: 1,
//         shortDescription: 1,
//         eventDate: 1,
//         registrationDeadline: 1,
//         format: 1,
//         location: 1,
//         capacity: 1,
//         status: 1,
//         slug: 1,
//         eventBanner: 1,
//       },
//     },
//   );

//   if (!rawEvent) notFound();

//   // Only show published events on the landing page
//   if (rawEvent.status !== "published") notFound();

//   // ── 2. Fetch active ticket types ───────────────────────────────────────────
//   const rawTickets = await Collections.ticketTypes(db)
//     .find(
//       { eventId: rawEvent._id, isActive: true },
//       {
//         projection: {
//           name: 1,
//           price: 1,
//           currency: 1,
//           maxQuantity: 1,
//           isActive: 1,
//           availableFrom: 1,
//           availableUntil: 1,
//         },
//       },
//     )
//     .sort({ price: 1 })
//     .toArray();

//   if (rawTickets.length === 0) {
//     return (
//       <EventClosedPage title={String(rawEvent.title)} reason="no-tickets" />
//     );
//   }

//   // ── 3. Check registration deadline ────────────────────────────────────────
//   const now = new Date();
//   const deadlinePassed = new Date(rawEvent.registrationDeadline) < now;
//   const eventPassed = new Date(rawEvent.eventDate) < now;

//   if (deadlinePassed || eventPassed) {
//     return (
//       <EventClosedPage
//         title={String(rawEvent.title)}
//         reason={eventPassed ? "event-passed" : "deadline-passed"}
//       />
//     );
//   }

//   // ── 4. Serialize ───────────────────────────────────────────────────────────
//   const event: SerializableEvent = {
//     _id: rawEvent._id!.toString(),
//     title: String(rawEvent.title),
//     shortDescription: String(rawEvent.shortDescription ?? ""),
//     eventDate: new Date(rawEvent.eventDate).toISOString(),
//     registrationDeadline: new Date(rawEvent.registrationDeadline).toISOString(),
//     format: String(rawEvent.format),
//     location: rawEvent.location as SerializableEvent["location"],
//     capacity: Number(rawEvent.capacity),
//     status: String(rawEvent.status),
//     slug: String(rawEvent.slug),
//     eventBanner: rawEvent.eventBanner
//       ? {
//           imageUrl: (rawEvent.eventBanner as CloudinaryImage).imageUrl,
//           imageAlt: (rawEvent.eventBanner as CloudinaryImage).imageAlt,
//         }
//       : null,
//   };

//   const ticketTypes: SerializableTicketType[] = rawTickets.map((t) => ({
//     _id: t._id!.toString(),
//     name: String(t.name),
//     price: Number(t.price),
//     currency: t.currency as SerializableTicketType["currency"],
//     maxQuantity: Number(t.maxQuantity),
//     isActive: Boolean(t.isActive),
//     availableFrom: t.availableFrom
//       ? new Date(t.availableFrom).toISOString()
//       : undefined,
//     availableUntil: t.availableUntil
//       ? new Date(t.availableUntil).toISOString()
//       : undefined,
//   }));

//   // ── 5. Format display strings ──────────────────────────────────────────────
//   const formattedDate = new Date(event.eventDate).toLocaleDateString("en-NG", {
//     weekday: "long",
//     month: "long",
//     day: "numeric",
//     year: "numeric",
//     timeZone: "Africa/Lagos",
//   });

//   const loc = event.location;
//   const displayLocation =
//     event.format === "virtual"
//       ? "Virtual / Online"
//       : [loc?.venue, loc?.city, loc?.state].filter(Boolean).join(", ") ||
//         "See event details";

//   // ─────────────────────────────────────────────────────────────────────────
//   // Render
//   // ─────────────────────────────────────────────────────────────────────────
//   return (
//     <div className="landing-root">
//       <style>{`
//         *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

//         .landing-root {
//           --land-bg:      #0a0a0f;
//           --land-surface: #111118;
//           --land-border:  #1e1e2e;
//           --land-accent:  #6366f1;
//           --land-text:    #e2e8f0;
//           --land-muted:   #64748b;
//           --land-font:    'DM Sans', 'Segoe UI', system-ui, sans-serif;

//           min-height: 100vh;
//           background: var(--land-bg);
//           font-family: var(--land-font);
//           color: var(--land-text);
//         }

//         .landing-banner {
//           width: 100%;
//           height: 260px;
//           object-fit: cover;
//           display: block;
//           background: var(--land-surface);
//         }
//         .landing-banner-placeholder {
//           width: 100%;
//           height: 260px;
//           background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 3rem;
//           opacity: .4;
//         }

//         .landing-layout {
//           max-width: 1080px;
//           margin: 0 auto;
//           padding: 2.5rem 1.5rem 4rem;
//           display: grid;
//           grid-template-columns: 1fr 460px;
//           gap: 3rem;
//           align-items: start;
//         }
//         @media (max-width: 800px) {
//           .landing-layout { grid-template-columns: 1fr; gap: 2rem; }
//         }

//         .landing-badge {
//           display: inline-flex;
//           align-items: center;
//           gap: .35rem;
//           padding: .3rem .8rem;
//           border-radius: 99px;
//           background: rgba(99,102,241,.1);
//           border: 1px solid rgba(99,102,241,.2);
//           font-size: .72rem;
//           font-weight: 700;
//           letter-spacing: .08em;
//           text-transform: uppercase;
//           color: #818cf8;
//           margin-bottom: 1rem;
//         }
//         .landing-title {
//           font-size: clamp(1.6rem, 4vw, 2.25rem);
//           font-weight: 900;
//           line-height: 1.15;
//           letter-spacing: -.03em;
//           margin-bottom: 1rem;
//         }
//         .landing-desc {
//           font-size: .95rem;
//           color: var(--land-muted);
//           line-height: 1.7;
//           margin-bottom: 2rem;
//         }

//         .landing-meta { display: flex; flex-direction: column; gap: .75rem; }
//         .landing-meta-item { display: flex; align-items: flex-start; gap: .75rem; }
//         .landing-meta-icon {
//           width: 36px; height: 36px; border-radius: 9px;
//           background: rgba(99,102,241,.1); border: 1px solid rgba(99,102,241,.15);
//           display: flex; align-items: center; justify-content: center;
//           flex-shrink: 0; font-size: 1rem;
//         }
//         .landing-meta-label {
//           font-size: .72rem; font-weight: 700; letter-spacing: .06em;
//           text-transform: uppercase; color: var(--land-muted); margin-bottom: .1rem;
//         }
//         .landing-meta-value { font-size: .9rem; font-weight: 600; color: var(--land-text); }

//         .landing-divider { height: 1px; background: var(--land-border); margin: 2rem 0; }
//         .landing-wordmark {
//           font-size: .75rem; font-weight: 800; letter-spacing: .2em;
//           text-transform: uppercase; color: var(--land-muted); opacity: .6;
//         }

//         .landing-form-col { position: sticky; top: 2rem; }
//         @media (max-width: 800px) { .landing-form-col { position: static; } }
//       `}</style>

//       {event.eventBanner?.imageUrl ? (
//         <Image
//           width={500}
//           height={300}
//           src={event.eventBanner.imageUrl}
//           alt={event.eventBanner.imageAlt || `${event.title} banner`}
//           className="landing-banner"
//         />
//       ) : (
//         <div className="landing-banner-placeholder" aria-hidden>
//           ◈
//         </div>
//       )}

//       <div className="landing-layout">
//         <div className="landing-info">
//           <div className="landing-badge">◈ DIUSCADI Event</div>
//           <h1 className="landing-title">{event.title}</h1>
//           {event.shortDescription && (
//             <p className="landing-desc">{event.shortDescription}</p>
//           )}

//           <div className="landing-meta">
//             <div className="landing-meta-item">
//               <div className="landing-meta-icon">📅</div>
//               <div>
//                 <div className="landing-meta-label">Date</div>
//                 <div className="landing-meta-value">{formattedDate}</div>
//               </div>
//             </div>
//             <div className="landing-meta-item">
//               <div className="landing-meta-icon">
//                 {event.format === "virtual" ? "💻" : "📍"}
//               </div>
//               <div>
//                 <div className="landing-meta-label">Location</div>
//                 <div className="landing-meta-value">{displayLocation}</div>
//               </div>
//             </div>
//             <div className="landing-meta-item">
//               <div className="landing-meta-icon">🎟</div>
//               <div>
//                 <div className="landing-meta-label">Tickets from</div>
//                 <div className="landing-meta-value">
//                   {ticketTypes[0].price === 0
//                     ? "Free"
//                     : `₦${ticketTypes[0].price.toLocaleString()}`}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="landing-divider" />
//           <div className="landing-wordmark">DIUSCADI</div>
//         </div>

//         <div className="landing-form-col">
//           <RegistrationForm
//             eventId={event._id}
//             eventSlug={event.slug}
//             eventTitle={event.title}
//             eventFormat={event.format}
//             ticketTypes={ticketTypes}
//             {...(prefilledEmail
//               ? await checkGuestStatus(prefilledEmail, event._id).then(
//                   (gs) => ({
//                     initialEmail: prefilledEmail,
//                     initialStatus: gs.status === "none" ? undefined : gs.status,
//                     initialRegistrationId: gs.registrationId,
//                     initialInviteCode: gs.inviteCode,
//                   }),
//                 )
//               : {})}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // EventClosedPage
// // ─────────────────────────────────────────────────────────────────────────────

// function EventClosedPage({
//   title,
//   reason,
// }: {
//   title: string;
//   reason: "no-tickets" | "deadline-passed" | "event-passed";
// }) {
//   const messages: Record<
//     typeof reason,
//     { icon: string; heading: string; body: string }
//   > = {
//     "no-tickets": {
//       icon: "🎟",
//       heading: "No Tickets Available",
//       body: "There are currently no active ticket types for this event. Please check back later or contact the organiser.",
//     },
//     "deadline-passed": {
//       icon: "⏰",
//       heading: "Registration Closed",
//       body: "The registration deadline for this event has passed. We hope to see you at a future event!",
//     },
//     "event-passed": {
//       icon: "✓",
//       heading: "Event Has Ended",
//       body: "This event has already taken place. Stay tuned for upcoming DIUSCADI events.",
//     },
//   };

//   const { icon, heading, body } = messages[reason];

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: "#0a0a0f",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         padding: "2rem",
//         fontFamily: "'DM Sans', system-ui, sans-serif",
//         color: "#e2e8f0",
//       }}
//     >
//       <div
//         style={{
//           maxWidth: 420,
//           textAlign: "center",
//           background: "#111118",
//           border: "1px solid #1e1e2e",
//           borderRadius: 20,
//           padding: "2.5rem 2rem",
//         }}
//       >
//         <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{icon}</div>
//         <h1
//           style={{
//             fontSize: "1.4rem",
//             fontWeight: 800,
//             letterSpacing: "-.02em",
//             marginBottom: ".75rem",
//           }}
//         >
//           {heading}
//         </h1>
//         <p
//           style={{
//             fontSize: ".9rem",
//             color: "#64748b",
//             lineHeight: 1.65,
//             marginBottom: "1.5rem",
//           }}
//         >
//           {body}
//         </p>
//         <p
//           style={{
//             fontSize: ".8rem",
//             fontWeight: 800,
//             letterSpacing: ".18em",
//             textTransform: "uppercase",
//             color: "#64748b",
//             opacity: 0.6,
//           }}
//         >
//           {title}
//         </p>
//       </div>
//     </div>
//   );
// }

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { CloudinaryImage } from "@/types/cloudinary";
import RegistrationForm from "./registrationForm";
import Image from "next/image";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

interface SerializableTicketType {
  _id: string;
  name: string;
  price: number;
  currency: "NGN" | "USD" | "GBP";
  maxQuantity: number;
  isActive: boolean;
  availableFrom?: string;
  availableUntil?: string;
}

interface SerializableEvent {
  _id: string;
  title: string;
  shortDescription: string;
  eventDate: string;
  registrationDeadline: string;
  format: string;
  location?: {
    venue?: string;
    city?: string;
    state?: string;
  };
  capacity: number;
  status: string;
  slug: string;
  eventBanner?: Pick<CloudinaryImage, "imageUrl" | "imageAlt"> | null;
  // WhatsApp group links — at least one is always set on published events
  whatsappGroupLink?: string;
  whatsappGroupLinkVirtual?: string;
  whatsappGroupLinkPhysical?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Guest status check — runs server-side so the form mounts in the correct step
// with zero client-side round-trips.
// ─────────────────────────────────────────────────────────────────────────────

interface GuestStatusResult {
  status: "verified" | "pending" | "none";
  registrationId?: string;
  inviteCode?: string;
}

async function checkGuestStatus(
  email: string,
  eventId: string,
): Promise<GuestStatusResult> {
  try {
    const db = await getDb();
    const { Collections } = await import("@/lib/db/collections");
    const { ObjectId } = await import("mongodb");

    if (!ObjectId.isValid(eventId)) return { status: "none" };

    const guestReg = await Collections.guestEventRegistrations(db).findOne(
      {
        email: email.toLowerCase().trim(),
        eventId: new ObjectId(eventId),
        status: { $ne: "cancelled" },
      },
      {
        projection: {
          _id: 1,
          inviteCode: 1,
          verifiedAt: 1,
          emailVerificationExpires: 1,
        },
      },
    );

    if (!guestReg) return { status: "none" };

    const registrationId = guestReg._id!.toString();

    // Already verified — jump to step 3
    if (guestReg.verifiedAt) {
      return {
        status: "verified",
        registrationId,
        inviteCode: String(guestReg.inviteCode),
      };
    }

    // TEMPORARY BYPASS: pending records are treated as "none" so the form lands
    // on step 1 with a clean slate. On submit the API resolves the stale record
    // in-place (sets verifiedAt) and returns the invite code directly.
    // Revert: restore the OTP-still-valid "pending" return below.
    return { status: "none" };
  } catch {
    return { status: "none" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!slug) return { title: "Event Not Found | DIUSCADI" };

  try {
    const db = await getDb();
    const event = await Collections.events(db).findOne(
      { slug },
      { projection: { title: 1, shortDescription: 1, eventBanner: 1 } },
    );

    if (!event) return { title: "Event Not Found | DIUSCADI" };

    return {
      title: `${event.title} | DIUSCADI`,
      description: String(event.shortDescription ?? ""),
      openGraph: {
        title: String(event.title),
        description: String(event.shortDescription ?? ""),
        ...(event.eventBanner?.imageUrl && {
          images: [{ url: event.eventBanner.imageUrl }],
        }),
      },
    };
  } catch {
    return { title: "DIUSCADI Event Registration" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page (Server Component)
// ─────────────────────────────────────────────────────────────────────────────

export default async function EventLandingPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const rawEmail = resolvedSearch.email;
  const prefilledEmail = typeof rawEmail === "string" ? rawEmail.trim() : "";

  if (!slug) notFound();

  const db = await getDb();

  // ── 1. Fetch event by slug ─────────────────────────────────────────────────
  const rawEvent = await Collections.events(db).findOne(
    { slug },
    {
      projection: {
        title: 1,
        shortDescription: 1,
        eventDate: 1,
        registrationDeadline: 1,
        format: 1,
        location: 1,
        capacity: 1,
        status: 1,
        slug: 1,
        eventBanner: 1,
        // WhatsApp group links for step 3
        whatsappGroupLink: 1,
        whatsappGroupLinkVirtual: 1,
        whatsappGroupLinkPhysical: 1,
      },
    },
  );

  if (!rawEvent) notFound();

  if (rawEvent.status !== "published") notFound();

  // ── 2. Fetch active ticket types ───────────────────────────────────────────
  const rawTickets = await Collections.ticketTypes(db)
    .find(
      { eventId: rawEvent._id, isActive: true },
      {
        projection: {
          name: 1,
          price: 1,
          currency: 1,
          maxQuantity: 1,
          isActive: 1,
          availableFrom: 1,
          availableUntil: 1,
        },
      },
    )
    .sort({ price: 1 })
    .toArray();

  if (rawTickets.length === 0) {
    return (
      <EventClosedPage title={String(rawEvent.title)} reason="no-tickets" />
    );
  }

  // ── 3. Check registration deadline ────────────────────────────────────────
  const now = new Date();
  const deadlinePassed = new Date(rawEvent.registrationDeadline) < now;
  const eventPassed = new Date(rawEvent.eventDate) < now;

  if (deadlinePassed || eventPassed) {
    return (
      <EventClosedPage
        title={String(rawEvent.title)}
        reason={eventPassed ? "event-passed" : "deadline-passed"}
      />
    );
  }

  // ── 4. Serialize ───────────────────────────────────────────────────────────
  const event: SerializableEvent = {
    _id: rawEvent._id!.toString(),
    title: String(rawEvent.title),
    shortDescription: String(rawEvent.shortDescription ?? ""),
    eventDate: new Date(rawEvent.eventDate).toISOString(),
    registrationDeadline: new Date(rawEvent.registrationDeadline).toISOString(),
    format: String(rawEvent.format),
    location: rawEvent.location as SerializableEvent["location"],
    capacity: Number(rawEvent.capacity),
    status: String(rawEvent.status),
    slug: String(rawEvent.slug),
    eventBanner: rawEvent.eventBanner
      ? {
          imageUrl: (rawEvent.eventBanner as CloudinaryImage).imageUrl,
          imageAlt: (rawEvent.eventBanner as CloudinaryImage).imageAlt,
        }
      : null,
    // WhatsApp links — serialised as strings (undefined if not set)
    ...(rawEvent.whatsappGroupLink && {
      whatsappGroupLink: String(rawEvent.whatsappGroupLink),
    }),
    ...(rawEvent.whatsappGroupLinkVirtual && {
      whatsappGroupLinkVirtual: String(rawEvent.whatsappGroupLinkVirtual),
    }),
    ...(rawEvent.whatsappGroupLinkPhysical && {
      whatsappGroupLinkPhysical: String(rawEvent.whatsappGroupLinkPhysical),
    }),
  };

  const ticketTypes: SerializableTicketType[] = rawTickets.map((t) => ({
    _id: t._id!.toString(),
    name: String(t.name),
    price: Number(t.price),
    currency: t.currency as SerializableTicketType["currency"],
    maxQuantity: Number(t.maxQuantity),
    isActive: Boolean(t.isActive),
    availableFrom: t.availableFrom
      ? new Date(t.availableFrom).toISOString()
      : undefined,
    availableUntil: t.availableUntil
      ? new Date(t.availableUntil).toISOString()
      : undefined,
  }));

  // ── 5. Format display strings ──────────────────────────────────────────────
  const formattedDate = new Date(event.eventDate).toLocaleDateString("en-NG", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });

  const loc = event.location;
  const displayLocation =
    event.format === "virtual"
      ? "Virtual / Online"
      : [loc?.venue, loc?.city, loc?.state].filter(Boolean).join(", ") ||
        "See event details";

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="landing-root">
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .landing-root {
          --land-bg:      #0a0a0f;
          --land-surface: #111118;
          --land-border:  #1e1e2e;
          --land-accent:  #6366f1;
          --land-text:    #e2e8f0;
          --land-muted:   #64748b;
          --land-font:    'DM Sans', 'Segoe UI', system-ui, sans-serif;

          min-height: 100vh;
          background: var(--land-bg);
          font-family: var(--land-font);
          color: var(--land-text);
        }

        .landing-banner {
          width: 100%;
          height: 260px;
          object-fit: cover;
          display: block;
          background: var(--land-surface);
        }
        .landing-banner-placeholder {
          width: 100%;
          height: 260px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          opacity: .4;
        }

        .landing-layout {
          max-width: 1080px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem 4rem;
          display: grid;
          grid-template-columns: 1fr 460px;
          gap: 3rem;
          align-items: start;
        }
        @media (max-width: 800px) {
          .landing-layout { grid-template-columns: 1fr; gap: 2rem; }
        }

        .landing-badge {
          display: inline-flex;
          align-items: center;
          gap: .35rem;
          padding: .3rem .8rem;
          border-radius: 99px;
          background: rgba(99,102,241,.1);
          border: 1px solid rgba(99,102,241,.2);
          font-size: .72rem;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: #818cf8;
          margin-bottom: 1rem;
        }
        .landing-title {
          font-size: clamp(1.6rem, 4vw, 2.25rem);
          font-weight: 900;
          line-height: 1.15;
          letter-spacing: -.03em;
          margin-bottom: 1rem;
        }
        .landing-desc {
          font-size: .95rem;
          color: var(--land-muted);
          line-height: 1.7;
          margin-bottom: 2rem;
        }

        .landing-meta { display: flex; flex-direction: column; gap: .75rem; }
        .landing-meta-item { display: flex; align-items: flex-start; gap: .75rem; }
        .landing-meta-icon {
          width: 36px; height: 36px; border-radius: 9px;
          background: rgba(99,102,241,.1); border: 1px solid rgba(99,102,241,.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 1rem;
        }
        .landing-meta-label {
          font-size: .72rem; font-weight: 700; letter-spacing: .06em;
          text-transform: uppercase; color: var(--land-muted); margin-bottom: .1rem;
        }
        .landing-meta-value { font-size: .9rem; font-weight: 600; color: var(--land-text); }

        .landing-divider { height: 1px; background: var(--land-border); margin: 2rem 0; }
        .landing-wordmark {
          font-size: .75rem; font-weight: 800; letter-spacing: .2em;
          text-transform: uppercase; color: var(--land-muted); opacity: .6;
        }

        .landing-form-col { position: sticky; top: 2rem; }
        @media (max-width: 800px) { .landing-form-col { position: static; } }
      `}</style>

      {event.eventBanner?.imageUrl ? (
        <Image
          width={500}
          height={300}
          src={event.eventBanner.imageUrl}
          alt={event.eventBanner.imageAlt || `${event.title} banner`}
          className="landing-banner"
        />
      ) : (
        <div className="landing-banner-placeholder" aria-hidden>
          ◈
        </div>
      )}

      <div className="landing-layout">
        <div className="landing-info">
          <div className="landing-badge">◈ DIUSCADI Event</div>
          <h1 className="landing-title">{event.title}</h1>
          {event.shortDescription && (
            <p className="landing-desc">{event.shortDescription}</p>
          )}

          <div className="landing-meta">
            <div className="landing-meta-item">
              <div className="landing-meta-icon">📅</div>
              <div>
                <div className="landing-meta-label">Date</div>
                <div className="landing-meta-value">{formattedDate}</div>
              </div>
            </div>
            <div className="landing-meta-item">
              <div className="landing-meta-icon">
                {event.format === "virtual" ? "💻" : "📍"}
              </div>
              <div>
                <div className="landing-meta-label">Location</div>
                <div className="landing-meta-value">{displayLocation}</div>
              </div>
            </div>
            <div className="landing-meta-item">
              <div className="landing-meta-icon">🎟</div>
              <div>
                <div className="landing-meta-label">Tickets from</div>
                <div className="landing-meta-value">
                  {ticketTypes[0].price === 0
                    ? "Free"
                    : `₦${ticketTypes[0].price.toLocaleString()}`}
                </div>
              </div>
            </div>
          </div>

          <div className="landing-divider" />
          <div className="landing-wordmark">DIUSCADI</div>
        </div>

        <div className="landing-form-col">
          <RegistrationForm
            eventId={event._id}
            eventSlug={event.slug}
            eventTitle={event.title}
            eventFormat={event.format}
            ticketTypes={ticketTypes}
            whatsappGroupLink={event.whatsappGroupLink}
            whatsappGroupLinkVirtual={event.whatsappGroupLinkVirtual}
            whatsappGroupLinkPhysical={event.whatsappGroupLinkPhysical}
            {...(prefilledEmail
              ? await checkGuestStatus(prefilledEmail, event._id).then(
                  (gs) => ({
                    initialEmail: prefilledEmail,
                    initialStatus: gs.status === "none" ? undefined : gs.status,
                    initialRegistrationId: gs.registrationId,
                    initialInviteCode: gs.inviteCode,
                  }),
                )
              : {})}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EventClosedPage
// ─────────────────────────────────────────────────────────────────────────────

function EventClosedPage({
  title,
  reason,
}: {
  title: string;
  reason: "no-tickets" | "deadline-passed" | "event-passed";
}) {
  const messages: Record<
    typeof reason,
    { icon: string; heading: string; body: string }
  > = {
    "no-tickets": {
      icon: "🎟",
      heading: "No Tickets Available",
      body: "There are currently no active ticket types for this event. Please check back later or contact the organiser.",
    },
    "deadline-passed": {
      icon: "⏰",
      heading: "Registration Closed",
      body: "The registration deadline for this event has passed. We hope to see you at a future event!",
    },
    "event-passed": {
      icon: "✓",
      heading: "Event Has Ended",
      body: "This event has already taken place. Stay tuned for upcoming DIUSCADI events.",
    },
  };

  const { icon, heading, body } = messages[reason];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: "#e2e8f0",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          textAlign: "center",
          background: "#111118",
          border: "1px solid #1e1e2e",
          borderRadius: 20,
          padding: "2.5rem 2rem",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{icon}</div>
        <h1
          style={{
            fontSize: "1.4rem",
            fontWeight: 800,
            letterSpacing: "-.02em",
            marginBottom: ".75rem",
          }}
        >
          {heading}
        </h1>
        <p
          style={{
            fontSize: ".9rem",
            color: "#64748b",
            lineHeight: 1.65,
            marginBottom: "1.5rem",
          }}
        >
          {body}
        </p>
        <p
          style={{
            fontSize: ".8rem",
            fontWeight: 800,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "#64748b",
            opacity: 0.6,
          }}
        >
          {title}
        </p>
      </div>
    </div>
  );
}