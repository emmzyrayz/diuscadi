"use client";
// app/gallery/page.tsx
// Shows concluded (past) events as gallery items.
// Strategy:
//   1. Call loadPublicEvents(50) on mount
//   2. Filter publicEvents to events where eventDate < today
//   3. If zero past events found → fall back to MOCK_EVENTS
//   4. In dev, EventContext already falls back to DUMMY_EVENTS on API failure,
//      so the gallery will always have something to show

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvents } from "@/context/EventContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GalleryEvent {
  id: string;
  slug: string;
  title: string;
  overview: string;
  category: string;
  image: string;
  eventDate: string;
}



// ─── Mock fallback ────────────────────────────────────────────────────────────

const MOCK_EVENTS: GalleryEvent[] = [
  {
    id: "1",
    slug: "global-tech-summit-2024",
    title: "Global Tech Summit",
    overview: "Keynote sessions on AI, Web3, and decentralised platforms.",
    category: "Conferences",
    image:
      "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?w=900&q=80",
    eventDate: "2024-11-15",
  },
  {
    id: "2",
    slug: "networking-mixer-2024",
    title: "Networking Mixer",
    overview: "Connect with industry leaders and fellow DIUSCADI members.",
    category: "Community",
    image:
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=900&q=80",
    eventDate: "2024-09-22",
  },
  {
    id: "3",
    slug: "hackathon-2025",
    title: "Hackathon 2025",
    overview: "48 hours of pure building, innovation, and collaboration.",
    category: "Workshops",
    image:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=900&q=80",
    eventDate: "2024-01-18",
  },
  {
    id: "4",
    slug: "ux-design-workshop",
    title: "UI/UX Deep Dive",
    overview: "Glassmorphism, modern design trends, and prototyping tools.",
    category: "Workshops",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=80",
    eventDate: "2024-10-05",
  },
  {
    id: "5",
    slug: "annual-board-meet-2024",
    title: "Annual Board Meet",
    overview: "Planning the roadmap and strategy for the next quarter.",
    category: "Community",
    image:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=900&q=80",
    eventDate: "2024-08-30",
  },
  {
    id: "6",
    slug: "product-launch-2024",
    title: "Product Launch",
    overview: "Unveiling the new DIUSCADI member dashboard and mobile app.",
    category: "Conferences",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900&q=80",
    eventDate: "2024-02-10",
  },
];

const PAGE_SIZE = 6;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPast(eventDate: string): boolean {
  return new Date(eventDate) < new Date();
}

// ─── Gallery card ─────────────────────────────────────────────────────────────

function GalleryCard({
  event,
  className,
}: {
  event: GalleryEvent;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-[1.25rem] bg-muted cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Image
        src={event.image}
        alt={event.title}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className={cn(
          "object-cover transition-transform duration-700 ease-out",
          hovered ? "scale-105" : "scale-100",
        )}
      />

      <div className={cn('absolute', 'inset-0', 'bg-gradient-to-t', 'from-black/40', 'via-transparent', 'to-transparent', 'pointer-events-none')} />

      <AnimatePresence>
        {hovered && (
          <motion.div
            key="overlay"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className={cn('absolute', 'inset-x-0', 'bottom-0', 'p-5', 'bg-black/50', 'backdrop-blur-md', 'border-t', 'border-white/10')}
          >
            <div className={cn('flex', 'items-center', 'gap-3', 'mb-2')}>
              <span className={cn('flex', 'items-center', 'gap-1', 'text-[9px]', 'font-black', 'uppercase', 'tracking-widest', 'text-white/60')}>
                <Tag className={cn('w-2.5', 'h-2.5')} />
                {event.category}
              </span>
              <span className={cn('flex', 'items-center', 'gap-1', 'text-[9px]', 'font-black', 'uppercase', 'tracking-widest', 'text-white/60')}>
                <Calendar className={cn('w-2.5', 'h-2.5')} />
                {new Date(event.eventDate).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <p className={cn('text-[13px]', 'font-black', 'text-white', 'tracking-tight', 'leading-tight', 'mb-1')}>
              {event.title}
            </p>
            <p className={cn('text-[10px]', 'text-white/70', 'font-medium', 'leading-relaxed', 'line-clamp-2')}>
              {event.overview}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn('absolute', 'top-3', 'left-3', 'z-10')}>
        <span className={cn('text-[9px]', 'font-black', 'uppercase', 'tracking-widest', 'px-2.5', 'py-1', 'rounded-full', 'bg-black/30', 'backdrop-blur-md', 'text-white/90', 'border', 'border-white/15')}>
          {event.category}
        </span>
      </div>
    </Link>
  );
}

// ─── Gallery grid ─────────────────────────────────────────────────────────────

function GalleryGrid({ events }: { events: GalleryEvent[] }) {
  const top = events.slice(0, 3);
  const bottom = events.slice(3, 6);

  return (
    <div className="space-y-3">
      <div className={cn('grid', 'grid-cols-3', 'gap-3')}>
        {top.map((event) => (
          <GalleryCard
            key={event.id}
            event={event}
            className={cn('h-[220px]', 'sm:h-[260px]')}
          />
        ))}
      </div>
      {bottom.length > 0 && (
        <div className={cn('grid', 'grid-cols-12', 'gap-3')}>
          {bottom[0] && (
            <GalleryCard
              event={bottom[0]}
              className={cn('col-span-5', 'h-[220px]', 'sm:h-[260px]')}
            />
          )}
          {bottom[1] && (
            <GalleryCard
              event={bottom[1]}
              className={cn('col-span-4', 'h-[220px]', 'sm:h-[260px]')}
            />
          )}
          {bottom[2] && (
            <GalleryCard
              event={bottom[2]}
              className={cn('col-span-3', 'h-[220px]', 'sm:h-[260px]')}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function GallerySkeleton() {
  return (
    <div className="space-y-3">
      <div className={cn('grid', 'grid-cols-3', 'gap-3')}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn('h-[260px]', 'rounded-[1.25rem]', 'bg-muted', 'animate-pulse')}
          />
        ))}
      </div>
      <div className={cn('grid', 'grid-cols-12', 'gap-3')}>
        <div className={cn('col-span-5', 'h-[260px]', 'rounded-[1.25rem]', 'bg-muted', 'animate-pulse')} />
        <div className={cn('col-span-4', 'h-[260px]', 'rounded-[1.25rem]', 'bg-muted', 'animate-pulse')} />
        <div className={cn('col-span-3', 'h-[260px]', 'rounded-[1.25rem]', 'bg-muted', 'animate-pulse')} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GalleryPage() {
  const { publicEvents, publicEventsLoading, loadPublicEvents } = useEvents();

  const [activeCategory, setActiveCategory] = useState("All Projects");
  const [page, setPage] = useState(1);

  // Load a large batch on mount so we have plenty of events to filter
  useEffect(() => {
    loadPublicEvents(50, undefined);
  }, [loadPublicEvents]);

  // ── Derive source ─────────────────────────────────────────────────────────
  // Filter real events to only past ones.
  // Fall back to MOCK_EVENTS when:
  //   - publicEvents is still loading (show skeleton instead)
  //   - publicEvents loaded but zero are in the past
  const pastEvents: GalleryEvent[] = publicEvents
    .filter((e) => isPast(e.eventDate))
    .map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      overview: e.overview ?? "",
      category: e.category,
      image: e.image ?? "",
      eventDate: e.eventDate,
    }));

  // Condition: use real past events if any exist, otherwise use mock fallback
  const usingMock = !publicEventsLoading && pastEvents.length === 0;
  const allEvents = usingMock ? MOCK_EVENTS : pastEvents;

  // ── Dynamic categories from actual data ───────────────────────────────────
  const categories = [
    "All Projects",
    ...Array.from(new Set(allEvents.map((e) => e.category))),
  ];

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered =
    activeCategory === "All Projects"
      ? allEvents
      : allEvents.filter((e) => e.category === activeCategory);

  // ── Paginate ──────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCategory = useCallback((cat: string) => {
    setActiveCategory(cat);
    setPage(1);
  }, []);

  return (
    <main className={cn('min-h-screen', 'w-full', 'mt-[50px]', 'pt-24', 'pb-20', 'px-5', 'sm:px-8', 'max-w-7xl', 'mx-auto')}>
      {/* Mock data notice */}
      {usingMock && (
        <div className={cn('mb-6', 'px-4', 'py-2.5', 'bg-amber-50', 'border', 'border-amber-100', 'rounded-2xl', 'flex', 'items-center', 'gap-3')}>
          <div className={cn('w-1.5', 'h-1.5', 'rounded-full', 'bg-amber-500', 'shrink-0')} />
          <p className={cn('text-[10px]', 'font-black', 'text-amber-700', 'uppercase', 'tracking-widest')}>
            Showing sample data — no concluded events found yet
          </p>
        </div>
      )}

      {/* ── Header bar ── */}
      <div className={cn('flex', 'flex-wrap', 'items-center', 'justify-between', 'gap-4', 'mb-8')}>
        <div className={cn('flex', 'flex-wrap', 'items-center', 'gap-3')}>
          <h1 className={cn('text-2xl', 'font-black', 'text-foreground', 'tracking-tight', 'mr-2')}>
            Gallery
          </h1>
          <div className={cn('flex', 'items-center', 'gap-1.5', 'flex-wrap')}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer",
                  activeCategory === cat
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className={cn('flex', 'items-center', 'gap-2')}>
          <span className={cn('text-[11px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mr-1')}>
            {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer bg-muted border border-border",
              page === 1
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-foreground hover:text-background hover:border-foreground",
            )}
          >
            <ChevronLeft className={cn('w-4', 'h-4')} />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer bg-foreground text-background border border-foreground",
              page === totalPages
                ? "opacity-40 cursor-not-allowed"
                : "hover:opacity-90",
            )}
          >
            <ChevronRight className={cn('w-4', 'h-4')} />
          </button>
        </div>
      </div>

      {/* ── Grid ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory + page}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {publicEventsLoading && pastEvents.length === 0 ? (
            <GallerySkeleton />
          ) : paginated.length > 0 ? (
            <GalleryGrid events={paginated} />
          ) : (
            <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-28', 'text-center')}>
              <p className={cn('text-[11px]', 'font-black', 'uppercase', 'tracking-widest', 'text-muted-foreground')}>
                No events in this category yet
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
