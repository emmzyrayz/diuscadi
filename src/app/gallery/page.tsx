"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, X, Play, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GalleryCategory } from "@/lib/models/Gallery";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photos and highlights from DIUSCADI events, workshops, and LASCADSS seminars.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://diuscadi.org.ng"}/gallery`,
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface GalleryItem {
  id: string;
  mediaType: "image" | "video";
  imageUrl: string | null;
  youtubeId: string | null;
  category: GalleryCategory;
  caption: string | null;
  eventId: string | null;
  featured: boolean;
  createdAt: string;
}

const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  event: "Events",
  meeting: "Meetings",
  outing: "Outings",
  conference: "Conferences",
  workshop: "Workshops",
  celebration: "Celebrations",
};

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
  items,
  activeIndex,
  onClose,
  onPrev,
  onNext,
}: {
  items: GalleryItem[];
  activeIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = items[activeIndex];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!item) return null; // ← now after all hooks

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-bold">
        {activeIndex + 1} / {items.length}
      </div>

      {/* Prev */}
      {activeIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next */}
      {activeIndex < items.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Media */}
      <motion.div
        key={item.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative max-w-5xl max-h-[80vh] w-full mx-16"
        onClick={(e) => e.stopPropagation()}
      >
        {item.mediaType === "image" && item.imageUrl ? (
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden">
            <Image
              src={item.imageUrl}
              alt={item.caption ?? "Gallery photo"}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 80vw"
            />
          </div>
        ) : item.youtubeId ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1`}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        ) : null}

        {/* Caption + event link */}
        {(item.caption || item.eventId) && (
          <div className="mt-4 flex items-center justify-between gap-4">
            {item.caption && (
              <p className="text-white/80 text-sm font-medium">
                {item.caption}
              </p>
            )}
            {item.eventId && (
              <a
                href={`/events/${item.eventId}`}
                className="flex items-center gap-1.5 text-primary text-xs font-bold hover:underline shrink-0"
              >
                View Event <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Gallery card ──────────────────────────────────────────────────────────────

function GalleryCard({
  item,
  onClick,
  className,
}: {
  item: GalleryItem;
  onClick: () => void;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const thumbnailUrl = item.mediaType === "image"
    ? item.imageUrl
    : item.youtubeId
      ? `https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`
      : null;

  if (!thumbnailUrl) return null;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group relative overflow-hidden rounded-[1.25rem] bg-muted cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
    >
      <Image
        src={thumbnailUrl}
        alt={item.caption ?? item.category}
        fill
        sizes="(max-width: 768px) 50vw, 33vw"
        className={cn(
          "object-cover transition-transform duration-700",
          hovered && "scale-105",
        )}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Play button for videos */}
      {item.mediaType === "video" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Featured badge */}
      {item.featured && (
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-amber-500 rounded-full text-[9px] font-black text-white uppercase tracking-widest">
          Featured
        </div>
      )}

      {/* Hover info */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="absolute inset-x-0 bottom-0 p-4 bg-black/50 backdrop-blur-md border-t border-white/10"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
                {CATEGORY_LABELS[item.category]}
              </span>
              {item.eventId && (
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                  · Event
                </span>
              )}
            </div>
            {item.caption && (
              <p className="text-[12px] font-bold text-white line-clamp-2 leading-tight">
                {item.caption}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Masonry-ish grid layout ───────────────────────────────────────────────────

function GalleryGrid({
  items,
  onItemClick,
}: {
  items: GalleryItem[];
  onItemClick: (index: number) => void;
}) {
  // Alternate between 3-col and mixed-width layouts per 6-item group
  const groups: GalleryItem[][] = [];
  for (let i = 0; i < items.length; i += 6) {
    groups.push(items.slice(i, i + 6));
  }

  let globalIndex = 0;

  return (
    <div className="space-y-3">
      {groups.map((group, gi) => {
        const top = group.slice(0, 3);
        const bottom = group.slice(3, 6);
        const topStartIndex = globalIndex;
        globalIndex += top.length;
        const bottomStartIndex = globalIndex;
        globalIndex += bottom.length;

        return (
          <div key={gi} className="space-y-3">
            {/* Top row — 3 equal columns */}
            {top.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {top.map((item, i) => (
                  <GalleryCard
                    key={item.id}
                    item={item}
                    onClick={() => onItemClick(topStartIndex + i)}
                    className="h-[200px] sm:h-[250px]"
                  />
                ))}
              </div>
            )}

            {/* Bottom row — asymmetric widths */}
            {bottom.length > 0 && (
              <div className="grid grid-cols-12 gap-3">
                {bottom[0] && (
                  <GalleryCard
                    item={bottom[0]}
                    onClick={() => onItemClick(bottomStartIndex)}
                    className="col-span-5 h-[200px] sm:h-[250px]"
                  />
                )}
                {bottom[1] && (
                  <GalleryCard
                    item={bottom[1]}
                    onClick={() => onItemClick(bottomStartIndex + 1)}
                    className="col-span-4 h-[200px] sm:h-[250px]"
                  />
                )}
                {bottom[2] && (
                  <GalleryCard
                    item={bottom[2]}
                    onClick={() => onItemClick(bottomStartIndex + 2)}
                    className="col-span-3 h-[200px] sm:h-[250px]"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function GallerySkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-[250px] rounded-[1.25rem] bg-muted animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-5 h-[250px] rounded-[1.25rem] bg-muted animate-pulse" />
        <div className="col-span-4 h-[250px] rounded-[1.25rem] bg-muted animate-pulse" />
        <div className="col-span-3 h-[250px] rounded-[1.25rem] bg-muted animate-pulse" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 24;

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState<GalleryCategory | "all">("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const load = useCallback(async (cat: GalleryCategory | "all", pg: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: String(PAGE_SIZE) });
      if (cat !== "all") params.set("category", cat);
      const res = await fetch(`/api/public/gallery?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(category, page);
  }, [category, page, load]);

  const handleCategory = (cat: GalleryCategory | "all") => {
    setCategory(cat);
    setPage(1);
  };

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const prevItem = useCallback(() => {
    setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const nextItem = useCallback(() => {
    setLightboxIndex((i) => (i !== null && i < items.length - 1 ? i + 1 : i));
  }, [items.length]);

  return (
    <main className="min-h-screen w-full mt-[50px] pt-24 pb-20 px-5 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-black text-foreground tracking-tight mr-2">
            Gallery
          </h1>

          {/* Category filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                "all",
                ...(Object.keys(CATEGORY_LABELS) as GalleryCategory[]),
              ] as const
            ).map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer",
                  category === cat
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                {cat === "all"
                  ? "All"
                  : CATEGORY_LABELS[cat as GalleryCategory]}
              </button>
            ))}
          </div>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mr-1">
              {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer bg-muted border border-border",
                page === 1
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-foreground hover:text-background",
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer bg-foreground text-background border border-foreground",
                page === totalPages
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:opacity-90",
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={category + page}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {loading ? (
            <GallerySkeleton />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                No gallery items yet
              </p>
            </div>
          ) : (
            <GalleryGrid items={items} onItemClick={openLightbox} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            items={items}
            activeIndex={lightboxIndex}
            onClose={closeLightbox}
            onPrev={prevItem}
            onNext={nextItem}
          />
        )}
      </AnimatePresence>
    </main>
  );
}