"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Camera,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Grid3X3,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

/* ─── Data ───────────────────────────────────────────────────────────────────── */

const galleryItems = [
  {
    id: "1",
    eventId: "event-abc",
    src: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a",
    alt: "Global Tech Summit",
    description:
      "Keynote session on the future of AI in decentralised platforms.",
    category: "Conferences",
    year: "2024",
    span: "large",
  },
  {
    id: "2",
    eventId: "event-123",
    src: "https://images.unsplash.com/photo-1515187029135-18ee286d815b",
    alt: "Networking Mixer",
    description: "Connect with industry leaders and fellow DIUSCADI members.",
    category: "Community",
    year: "2024",
    span: "small",
  },
  {
    id: "3",
    eventId: "event-456",
    src: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678",
    alt: "Hackathon 2025",
    description: "48 hours of pure building and innovation.",
    category: "Workshops",
    year: "2025",
    span: "tall",
  },
  {
    id: "4",
    eventId: "event-789",
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
    alt: "Workshop: UI/UX",
    description: "Deep dive into glassmorphism and modern design trends.",
    category: "Workshops",
    year: "2024",
    span: "wide",
  },
  {
    id: "5",
    eventId: "event-000",
    src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952",
    alt: "Annual Board Meet",
    description: "Planning the roadmap for the next quarter.",
    category: "Community",
    year: "2024",
    span: "small",
  },
  {
    id: "6",
    eventId: "event-999",
    src: "https://images.unsplash.com/photo-1556761175-b413da4baf72",
    alt: "Product Launch",
    description: "Unveiling the new DIUSCADI member dashboard.",
    category: "Conferences",
    year: "2025",
    span: "small",
  },
  {
    id: "7",
    eventId: "event-aaa",
    src: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2",
    alt: "Policy Forum",
    description: "Roundtable on broadband access policy across West Africa.",
    category: "Conferences",
    year: "2023",
    span: "wide",
  },
  {
    id: "8",
    eventId: "event-bbb",
    src: "https://images.unsplash.com/photo-1531482615713-2afd69097998",
    alt: "Mentorship Programme",
    description:
      "One-on-one pairing of senior practitioners with emerging talent.",
    category: "Community",
    year: "2023",
    span: "small",
  },
];

const CATEGORIES = ["All", "Conferences", "Workshops", "Community"];

const getSpanClass = (span: string) => {
  switch (span) {
    case "large":
      return "md:col-span-2 md:row-span-2 h-[380px] md:h-auto";
    case "tall":
      return "md:col-span-1 md:row-span-2 h-[380px] md:h-auto";
    case "wide":
      return "md:col-span-2 md:row-span-1 h-[260px] md:h-[280px]";
    default:
      return "md:col-span-1 md:row-span-1 h-[260px] md:h-[280px]";
  }
};

/* ─── Lightbox ───────────────────────────────────────────────────────────────── */

function Lightbox({
  items,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  items: typeof galleryItems;
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = items[index];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      key="lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />

      {/* panel */}
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative glass-heavy rounded-[2rem] overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row border border-border/60"
      >
        {/* image */}
        <div className="relative flex-1 min-h-[260px] md:min-h-0 md:h-[70vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            </motion.div>
          </AnimatePresence>

          {/* counter */}
          <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
            {index + 1} / {items.length}
          </div>
        </div>

        {/* info sidebar */}
        <div className="p-7 flex flex-col gap-5 md:w-72 shrink-0 justify-between">
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {item.category} · {item.year}
            </span>
            <h3 className="text-2xl font-black leading-tight">{item.alt}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </div>
          <Link
            href={`/events/${item.eventId}`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-3 rounded-2xl hover:opacity-90 transition-opacity"
          >
            View Event <ExternalLink size={14} />
          </Link>
        </div>

        {/* close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 glass rounded-xl p-2 hover:text-primary transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </motion.div>

      {/* nav arrows */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-4 md:left-8 glass rounded-2xl p-3 hover:text-primary transition-colors z-10"
        aria-label="Previous"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-4 md:right-8 glass rounded-2xl p-3 hover:text-primary transition-colors z-10"
        aria-label="Next"
      >
        <ChevronRight size={22} />
      </button>
    </motion.div>
  );
}

/* ─── Gallery Card ───────────────────────────────────────────────────────────── */

function GalleryCard({
  item,
  index,
  layout,
  onOpen,
}: {
  item: (typeof galleryItems)[0];
  index: number;
  layout: "bento" | "grid";
  onOpen: () => void;
}) {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        delay: index * 0.06,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      onClick={onOpen}
      className={cn(
        "group relative rounded-[2.5rem] overflow-hidden glass p-2 cursor-pointer",
        layout === "bento" ? getSpanClass(item.span) : "h-[260px]",
      )}
    >
      <div className="block w-full h-full relative overflow-hidden rounded-[2rem]">
        {/* Image */}
        <Image
          fill
          src={item.src}
          alt={item.alt}
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Category pill — always visible */}
        <div className="absolute top-3 left-3 z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest glass px-3 py-1 rounded-full border border-white/20">
            {item.category}
          </span>
        </div>

        {/* Zoom hint */}
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-primary/90 p-2 rounded-xl text-white">
            <ZoomIn size={14} />
          </div>
        </div>

        {/* Glass overlay on hover */}
        <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            className="space-y-2"
          >
            <h3 className="text-xl font-black text-white drop-shadow">
              {item.alt}
            </h3>
            <p className="text-white/85 text-xs leading-relaxed line-clamp-2">
              {item.description}
            </p>
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 mt-1">
              {item.year}
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [layout, setLayout] = useState<"bento" | "grid">("bento");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === "All"
      ? galleryItems
      : galleryItems.filter((i) => i.category === activeCategory);

  const openLightbox = useCallback(
    (index: number) => setLightboxIndex(index),
    [],
  );
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevImage = useCallback(
    () =>
      setLightboxIndex((i) =>
        i !== null ? (i - 1 + filtered.length) % filtered.length : null,
      ),
    [filtered.length],
  );
  const nextImage = useCallback(
    () =>
      setLightboxIndex((i) => (i !== null ? (i + 1) % filtered.length : null)),
    [filtered.length],
  );

  // lock body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  return (
    <>
      <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-10">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-border/50"
        >
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
              <span className="w-6 h-px bg-primary/60 rounded-full" />
              Visual Archive
            </span>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none">
              MOMENTS
            </h1>
            <p className="text-muted-foreground text-sm">
              A visual journey through DIUSCADI events and milestones.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* layout toggle */}
            <div className="glass rounded-2xl p-1 flex gap-1">
              <button
                onClick={() => setLayout("bento")}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  layout === "bento"
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Bento layout"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setLayout("grid")}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  layout === "grid"
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Grid layout"
              >
                <Grid3X3 size={16} />
              </button>
            </div>

            {/* capture count */}
            <div className="glass px-5 py-2.5 rounded-2xl flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
              <Camera size={16} />
              {filtered.length} Captures
            </div>
          </div>
        </motion.div>

        {/* ── Filter tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="flex gap-2 flex-wrap"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-5 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-200",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "glass text-muted-foreground hover:text-foreground hover:border-border/80",
              )}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* ── Grid ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + layout}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "grid gap-4 md:gap-5",
              layout === "bento"
                ? "grid-cols-1 md:grid-cols-4 auto-rows-[180px]"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {filtered.map((item, i) => (
              <GalleryCard
                key={item.id}
                item={item}
                index={i}
                layout={layout}
                onOpen={() => openLightbox(i)}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-24 text-muted-foreground text-sm">
            No captures in this category yet.
          </div>
        )}
      </main>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            items={filtered}
            index={lightboxIndex}
            onClose={closeLightbox}
            onPrev={prevImage}
            onNext={nextImage}
          />
        )}
      </AnimatePresence>
    </>
  );
}
