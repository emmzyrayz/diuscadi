"use client";
import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useLandingConfig } from "@/hooks/useLandingConfig";
import { Quote, Play, Star, X, Volume2 } from "lucide-react";
import type { TestimonialEntry } from "@/lib/models/landingPageConfig";
import stephanie from "@/assets/img/downloads/Stephanie-Nkamigbo.webp";
import Esther from "@/assets/img/downloads/Esther-Chiamaka.webp";
import Mbah from "@/assets/img/downloads/Mbah-Divine-Chinecherem.webp";
import Azubuike from "@/assets/img/downloads/Azubike-Desiree.webp";
import networking from "@/assets/img/downloads/networking-diuscadi.webp";
import type { StaticImageData } from "next/image";

// ─── Unified testimonial shape ────────────────────────────────────────────────
//
// TestimonialEntry (from DB) uses `quote`.
// The static fallback below also uses `quote` — mapped from the old `review`.
// The component always reads `.quote` so there's no type mismatch.

interface StaticTestimonial extends Omit<TestimonialEntry, "id"> {
  id: number;
  image: StaticImageData;
}

// All testimonials are real — sourced from DIUSCADI PDF and actual participants
const STATIC_TESTIMONIALS: StaticTestimonial[] = [
  {
    id: 1,
    name: "Stephanie Nkamigbo",
    role: "Participant & Organiser, LASCADSS",
    quote:
      "Being part of DIUSCADI was an amazing opportunity. The Finalist Launchpad Workshop gave me insight into what life after school really looks like. For the first time, someone actually educated me on how to prepare my CV and get ready for interviews.",
    image: stephanie,
    edition: "LASCADSS 2.0",
    order: 0,
  },
  {
    id: 2,
    name: "Okoro Esther Chiamaka",
    role: "Graduate Participant",
    quote:
      "DIUSCADI taught me that one needs little to no capital to start — for example, in digital marketing. The seasoned speakers shared life stories that were incredibly inspiring. Their resilience is truly worth emulating.",
    image: Esther,
    edition: "LASCADSS 2023",
    order: 1,
  },
  {
    id: 3,
    name: "Mbah Divine Chinecherem",
    role: "Teacher & LASCADSS Attendee",
    quote:
      "The last edition helped me understand the job market better. I was able to network more and connect with potential mentors and fellow mentees in my chosen field.",
    image: Mbah,
    edition: "LASCADSS 5.0",
    order: 2,
  },
  {
    id: 4,
    name: "Azubike Desiree",
    role: "Participant",
    quote:
      "I personally gained practical knowledge in solar panel installation and digital marketing. The dedication of the speakers was commendable. I highly recommend it for all students.",
    image: Azubuike,
    edition: "LASCADSS 4.0",
    order: 3,
  },
];

// ─── Video player ─────────────────────────────────────────────────────────────
//
// Detects YouTube URLs (youtube.com/watch, youtu.be, youtube.com/embed)
// and renders an iframe. All other URLs use a native <video> element.

function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com\/(?:watch|embed)|youtu\.be\/)/.test(url);
}

/** Convert any YouTube watch/share URL to an embed URL */
function toYouTubeEmbedUrl(url: string): string {
  // Already an embed URL
  if (url.includes("youtube.com/embed/")) return url;

  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;

  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  // fallback — return as-is
  return url;
}

interface VideoPlayerProps {
  url: string;
  /** When true renders inline; false = inside a modal overlay */
  inline?: boolean;
}

function VideoPlayer({ url, inline = false }: VideoPlayerProps) {
  const isYT = isYouTubeUrl(url);

  const containerCls = cn(
    "w-full rounded-2xl overflow-hidden bg-black",
    inline ? "aspect-video" : "aspect-video",
  );

  if (isYT) {
    return (
      <div className={containerCls}>
        <iframe
          src={`${toYouTubeEmbedUrl(url)}?autoplay=${inline ? 0 : 1}&rel=0&modestbranding=1`}
          title="LASCADSS video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  return (
    <div className={containerCls}>
      <video
        src={url}
        controls
        autoPlay={!inline}
        className="w-full h-full object-contain"
        preload="metadata"
      />
    </div>
  );
}

// ─── Video thumbnail with play button ────────────────────────────────────────

interface VideoThumbnailProps {
  videoUrl: string | null;
  onClick: () => void;
}

function VideoThumbnail({ videoUrl, onClick }: VideoThumbnailProps) {
  return (
    <div
      className={cn(
        "group relative aspect-video rounded-[2rem] overflow-hidden",
        "border-4 border-background/10 shadow-2xl",
        videoUrl ? "cursor-pointer" : "cursor-default",
      )}
      onClick={videoUrl ? onClick : undefined}
      role={videoUrl ? "button" : undefined}
      tabIndex={videoUrl ? 0 : undefined}
      onKeyDown={(e) => {
        if (videoUrl && (e.key === "Enter" || e.key === " ")) onClick();
      }}
      aria-label={videoUrl ? "Play LASCADSS highlights video" : undefined}
    >
      <Image
        src={networking}
        alt="Networking at LASCADSS"
        fill
        className={cn(
          "object-cover transition-transform duration-700",
          videoUrl && "group-hover:scale-105",
        )}
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        {videoUrl ? (
          <div
            className={cn(
              "w-20 h-20 bg-primary rounded-full flex items-center justify-center",
              "shadow-2xl group-hover:scale-110 transition-transform",
            )}
          >
            <Play className="w-8 h-8 text-background fill-background ml-1" />
          </div>
        ) : (
          <div
            className={cn(
              "w-20 h-20 bg-background/20 rounded-full flex items-center justify-center",
            )}
          >
            <Volume2 className="w-8 h-8 text-background/60" />
          </div>
        )}
      </div>
      <div
        className={cn(
          "absolute bottom-4 left-4 right-4 p-4 rounded-xl",
          "bg-background/10 backdrop-blur-md border border-background/20",
        )}
      >
        <p className="text-sm font-medium">
          {videoUrl ? "Watch the #LASCADSS Highlights" : "Video coming soon"}
        </p>
      </div>
    </div>
  );
}

// ─── Video modal ──────────────────────────────────────────────────────────────

interface VideoModalProps {
  url: string;
  onClose: () => void;
}

function VideoModal({ url, onClose }: VideoModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4",
          "bg-black/80 backdrop-blur-sm",
        )}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-4xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className={cn(
              "absolute -top-12 right-0 w-10 h-10 rounded-full",
              "bg-background/10 backdrop-blur-sm border border-background/20",
              "flex items-center justify-center text-background",
              "hover:bg-background/20 transition-colors",
            )}
            aria-label="Close video"
          >
            <X className="w-5 h-5" />
          </button>
          <VideoPlayer url={url} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const Testimonials = () => {
  const { config } = useLandingConfig();
  const [videoOpen, setVideoOpen] = useState(false);

  // Normalize DB testimonials (use `quote`) vs static fallback (already uses `quote`)
  const testimonials: Array<StaticTestimonial | TestimonialEntry> = config
    ?.testimonials?.items?.length
    ? config.testimonials.items
    : STATIC_TESTIMONIALS;

  const videoUrl = config?.testimonials?.videoUrl || null;

  return (
    <section
      className={cn(
        "py-24 w-full bg-foreground text-background overflow-hidden rounded-2xl",
      )}
    >
      {/* Video modal */}
      {videoOpen && videoUrl && (
        <VideoModal url={videoUrl} onClose={() => setVideoOpen(false)} />
      )}

      <div className={cn("container", "mx-auto", "px-6")}>
        {/* Header */}
        <div
          className={cn(
            "text-center",
            "max-w-3xl",
            "mx-auto",
            "mb-16",
            "space-y-4",
          )}
        >
          <h4
            className={cn(
              "text-primary",
              "font-bold",
              "tracking-widest",
              "uppercase",
              "text-sm",
            )}
          >
            Real Stories from Real Participants
          </h4>
          <h2
            className={cn(
              "text-3xl",
              "md:text-5xl",
              "font-extrabold",
              "tracking-tight",
            )}
          >
            5,000+ Lives Shaped.{" "}
            <span className="text-secondary">Yours Could Be Next.</span>
          </h2>
          <p
            className={cn(
              "text-muted-foreground",
              "text-sm",
              "max-w-lg",
              "mx-auto",
            )}
          >
            These testimonials come from real LASCADSS participants — graduates
            who attended, learned, and went on to build careers and businesses.
          </p>
        </div>

        <div
          className={cn(
            "grid",
            "grid-cols-1",
            "lg:grid-cols-12",
            "gap-12",
            "items-start",
          )}
        >
          {/* LEFT: Featured / Video */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={cn("lg:col-span-5", "space-y-6")}
          >
            <VideoThumbnail
              videoUrl={videoUrl}
              onClick={() => setVideoOpen(true)}
            />

            {/* Founder quote */}
            <div
              className={cn(
                "p-6",
                "bg-background/5",
                "rounded-2xl",
                "border",
                "border-background/10",
              )}
            >
              <div className={cn("flex", "gap-1", "text-secondary", "mb-3")}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn("w-4", "h-4", "fill-secondary")}
                  />
                ))}
              </div>
              <p className={cn("text-lg", "italic", "text-slate-300")}>
                &quot;We are not just preparing young people for jobs — we are
                preparing them for leadership, innovation, and
                nation-building.&quot;
              </p>
              <p
                className={cn(
                  "text-xs",
                  "text-primary",
                  "font-bold",
                  "mt-3",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                — Prof. Ikechukwu I. Umeh, Founder
              </p>
            </div>

            {/* PDF testimonials */}
            <div className="space-y-4">
              {[
                {
                  quote:
                    "Before attending LASCADSS, I had no direction. The mentorship I received at DIUSCADI gave me the confidence to start my own tech business.",
                  name: "Chioma Eze",
                  edition: "LASCADSS 4.0 Participant",
                },
                {
                  quote:
                    "Thanks to DIUSCADI, I gained clarity on my career path and an opportunity to intern at a startup that has now hired me full-time.",
                  name: "Samuel Okafor",
                  edition: "LASCADSS 5.0 Beneficiary",
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className={cn(
                    "p-4",
                    "bg-background/5",
                    "rounded-2xl",
                    "border",
                    "border-background/10",
                  )}
                >
                  <p
                    className={cn(
                      "text-sm",
                      "italic",
                      "text-slate-300",
                      "leading-relaxed",
                    )}
                  >
                    &quot;{t.quote}&quot;
                  </p>
                  <p
                    className={cn(
                      "text-xs",
                      "text-primary",
                      "font-bold",
                      "mt-2",
                    )}
                  >
                    {t.name}{" "}
                    <span
                      className={cn("text-muted-foreground", "font-normal")}
                    >
                      — {t.edition}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT: Review cards */}
          <div
            className={cn(
              "lg:col-span-7",
              "grid",
              "grid-cols-1",
              "md:grid-cols-2",
              "gap-6",
            )}
          >
            {testimonials.map((t, idx) => {
              // Resolve image: static entries have `.image`, DB entries have `.photoUrl`
              const imageSrc = "image" in t ? t.image : (t.photoUrl ?? null);

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "p-8 rounded-3xl bg-background/5 border border-background/10",
                    "flex flex-col justify-between",
                    "hover:bg-background/10 transition-colors group",
                  )}
                >
                  <div>
                    <Quote
                      className={cn(
                        "w-8 h-8 text-primary/40 mb-4 group-hover:text-primary transition-colors",
                      )}
                    />
                    <p
                      className={cn(
                        "text-slate-300 text-sm leading-relaxed mb-4",
                      )}
                    >
                      {t.quote}
                    </p>
                    {t.edition && (
                      <span
                        className={cn(
                          "text-[10px] font-black text-primary/60 uppercase tracking-widest",
                        )}
                      >
                        {t.edition}
                      </span>
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-4 pt-6 border-t border-background/10 mt-4",
                    )}
                  >
                    {imageSrc && (
                      <div
                        className={cn(
                          "relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shrink-0",
                        )}
                      >
                        {typeof imageSrc === "string" ? (
                          <Image
                                                width={500}
                                                height={300}
                            src={imageSrc}
                            alt={t.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image
                            src={imageSrc}
                            alt={t.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                    )}
                    <div>
                      <h5 className={cn("font-bold text-background text-sm")}>
                        {t.name}
                      </h5>
                      <p className={cn("text-xs text-primary font-medium")}>
                        {t.role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
