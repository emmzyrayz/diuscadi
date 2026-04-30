"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useLandingConfig } from "@/hooks/useLandingConfig";
import banner1 from "@/assets/img/downloads/Diuscadi-2023-Testimonial-Thumbnail-1920x1272.webp";
import banner2 from "@/assets/img/downloads/networking-diuscadi.webp";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlideShape {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaHref?: string; // optional — DB slides may not have this set
  hidden?: boolean;
}

// ─── Static fallback slides ───────────────────────────────────────────────────

const FALLBACK_SLIDES: SlideShape[] = [
  {
    id: "1",
    title: "LASCADSS 7.0 — Coming 2026",
    subtitle: "Life After School Career Development Seminar Series",
    imageUrl: banner1.src,
    ctaLabel: "Register Now",
    ctaHref: "/auth",
  },
  {
    id: "2",
    title: "Design Workshop: Mastering Glassmorphism",
    subtitle: "Join us this Friday at 6 PM.",
    imageUrl: banner2.src,
    ctaLabel: "Learn More",
    ctaHref: "",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const Banner = () => {
  const [index, setIndex] = useState(0);
  const { config } = useLandingConfig();

  const slides: SlideShape[] = config?.banner?.slides?.length
    ? config.banner.slides.filter((s) => !s.hidden) // don't show hidden slides
    : FALLBACK_SLIDES;

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Clamp index during render — no effect needed, avoids cascading setState
  const safeIndex = slides.length > 0 ? index % slides.length : 0;
  const activeBanner = slides[safeIndex] ?? FALLBACK_SLIDES[0];

  // Normalise ctaHref: undefined | "" → "#" so <Link href> always gets a valid Url
  const ctaHref: string = activeBanner.ctaHref || "#";
  const ctaLabel: string = activeBanner.ctaLabel || "Learn More";

  return (
    <div
      className={cn(
        "relative",
        "w-full",
        "h-[40vh]",
        "md:h-[50vh] lg:h-[70vh]",
        "overflow-hidden",
        "rounded-xl",
        "shadow-xl",
        "bg-muted",
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={safeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className={cn("absolute", "inset-0", "w-full", "h-full")}
        >
          {/* Background image */}
          <Image
            alt="banner-image"
            src={activeBanner.imageUrl}
            fill
            priority
            className="object-cover"
          />

          {/* Glass info card */}
          <div
            className={cn(
              "absolute",
              "inset-0",
              "flex",
              "flex-col",
              "justify-end",
              "p-4",
              "md:p-6",
            )}
          >
            <div
              className={cn(
                "group w-full max-w-4xl mx-auto",
                "transition-all duration-500 ease-in-out",
                "bg-foreground/30 backdrop-blur-md border border-background/20 shadow-2xl rounded-2xl",
                "hover:bg-background/40 hover:backdrop-blur-lg",
                "p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4",
              )}
            >
              <div
                className={cn(
                  "text-background group-hover:text-foreground group",
                  "text-center",
                  "md:text-left",
                )}
              >
                <h2
                  className={cn(
                    "text-md",
                    "md:text-2xl",
                    "font-semibold md:font-bold",
                    "tracking-tight",
                  )}
                >
                  {activeBanner.title}
                </h2>
                {activeBanner.subtitle && (
                  <p
                    className={cn(
                      "text-sm",
                      "md:text-base",
                      "text-background/80 group-hover:text-foreground/60",
                      "mt-1",
                    )}
                  >
                    {activeBanner.subtitle}
                  </p>
                )}
              </div>

              {/* Only render the CTA when there's a meaningful href */}
              {ctaHref !== "#" && (
                <Link href={ctaHref}>
                  <Button
                    variant="secondary"
                    className={cn(
                      "font-semibold bg-background hover:bg-foreground hover:text-background cursor-pointer",
                      "px-4 md:px-8",
                      "hover:scale-105",
                      "transition-transform",
                    )}
                  >
                    {ctaLabel}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide indicators */}
      {slides.length > 1 && (
        <div
          className={cn(
            "absolute",
            "bottom-2",
            "left-1/2",
            "-translate-x-1/2",
            "flex",
            "gap-2",
            "z-10",
          )}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-1 w-8 rounded-full transition-all",
                i === safeIndex ? "bg-background" : "bg-background/30",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
