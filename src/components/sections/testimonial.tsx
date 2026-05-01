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

interface StaticTestimonial {
  id: number;
  name: string;
  role?: string;
  quote: string;
  edition?: string;
  order: number;
  image: StaticImageData;
}

function resolvePhotoUrl(photoUrl: string | undefined): string | null {
  return photoUrl ?? null;
}

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

// Resolves photoUrl to a plain string regardless of whether it's a string,
// CloudinaryImage object, or undefined — safe for <Image src>.

function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com\/(?:watch|embed)|youtu\.be\/)/.test(url);
}

function toYouTubeEmbedUrl(url: string): string {
  if (url.includes("youtube.com/embed/")) return url;
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return url;
}

function VideoPlayer({
  url,
  inline = false,
}: {
  url: string;
  inline?: boolean;
}) {
  const containerCls =
    "w-full rounded-2xl overflow-hidden bg-black aspect-video";
  if (isYouTubeUrl(url)) {
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

function VideoThumbnail({
  videoUrl,
  onClick,
}: {
  videoUrl: string | null;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative aspect-video rounded-[2rem] overflow-hidden border-4 border-background/10 shadow-2xl",
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
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-background fill-background ml-1" />
          </div>
        ) : (
          <div className="w-20 h-20 bg-background/20 rounded-full flex items-center justify-center">
            <Volume2 className="w-8 h-8 text-background/60" />
          </div>
        )}
      </div>
      <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-background/10 backdrop-blur-md border border-background/20">
        <p className="text-sm font-medium">
          {videoUrl ? "Watch the #LASCADSS Highlights" : "Video coming soon"}
        </p>
      </div>
    </div>
  );
}

function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
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
            className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-background/10 backdrop-blur-sm border border-background/20 flex items-center justify-center text-background hover:bg-background/20 transition-colors"
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

export const Testimonials = () => {
  const { config } = useLandingConfig();
  const [videoOpen, setVideoOpen] = useState(false);

  const testimonials: Array<StaticTestimonial | TestimonialEntry> = config
    ?.testimonials?.items?.length
    ? config.testimonials.items
    : STATIC_TESTIMONIALS;

  const videoUrl = config?.testimonials?.videoUrl || null;

  return (
    <section className="py-24 w-full bg-foreground text-background overflow-hidden rounded-2xl">
      {videoOpen && videoUrl && (
        <VideoModal url={videoUrl} onClose={() => setVideoOpen(false)} />
      )}

      <div className={cn("container", "mx-auto", "px-6")}>
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h4 className="text-primary font-bold tracking-widest uppercase text-sm">
            Real Stories from Real Participants
          </h4>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            5,000+ Lives Shaped.{" "}
            <span className="text-secondary">Yours Could Be Next.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            These testimonials come from real LASCADSS participants — graduates
            who attended, learned, and went on to build careers and businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 space-y-6"
          >
            <VideoThumbnail
              videoUrl={videoUrl}
              onClick={() => setVideoOpen(true)}
            />

            <div className="p-6 bg-background/5 rounded-2xl border border-background/10">
              <div className="flex gap-1 text-secondary mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-secondary" />
                ))}
              </div>
              <p className="text-lg italic text-slate-300">
                &quot;We are not just preparing young people for jobs — we are
                preparing them for leadership, innovation, and
                nation-building.&quot;
              </p>
              <p className="text-xs text-primary font-bold mt-3 uppercase tracking-widest">
                — Prof. Ikechukwu I. Umeh, Founder
              </p>
            </div>

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
                  className="p-4 bg-background/5 rounded-2xl border border-background/10"
                >
                  <p className="text-sm italic text-slate-300 leading-relaxed">
                    &quot;{t.quote}&quot;
                  </p>
                  <p className="text-xs text-primary font-bold mt-2">
                    {t.name}{" "}
                    <span className="text-muted-foreground font-normal">
                      — {t.edition}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t, idx) => {
              // ✅ Always string | StaticImageData | null — never CloudinaryImage or undefined
             const imageSrc = (() => {
               if ("image" in t) return t.image as StaticImageData;
               return resolvePhotoUrl(t.photoUrl); // now returns string | null
             })();

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-8 rounded-3xl bg-background/5 border border-background/10 flex flex-col justify-between hover:bg-background/10 transition-colors group"
                >
                  <div>
                    <Quote className="w-8 h-8 text-primary/40 mb-4 group-hover:text-primary transition-colors" />
                    <p className="text-slate-300 text-sm leading-relaxed mb-4">
                      {t.quote}
                    </p>
                    {t.edition && (
                      <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">
                        {t.edition}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 pt-6 border-t border-background/10 mt-4">
                    {imageSrc && (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
                        {/* string | StaticImageData — both accepted by next/image with fill */}
                        <Image
                          src={imageSrc}
                          alt={t.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h5 className="font-bold text-background text-sm">
                        {t.name}
                      </h5>
                      <p className="text-xs text-primary font-medium">
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
