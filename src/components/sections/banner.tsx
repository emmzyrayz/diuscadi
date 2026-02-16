'use client'

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import banner1 from "@/assets/img/downloads/Diuscadi-2023-Testimonial-Thumbnail-1920x1272.webp"
import banner2 from "@/assets/img/downloads/networking-diuscadi.webp"

// Sample data - replace with your actual data source
const BANNERS = [
  {
    id: 1,
    title: "Upcoming: Career Navigation Summit 2026",
    subtitle: "Registration closes in 5 days.",
    image: banner1, // Replace with banner1
    buttonText: "Register Now",
  },
  {
    id: 2,
    title: "Design Workshop: Mastering Glassmorphism",
    subtitle: "Join us this Friday at 6 PM.",
    image: banner2,
    buttonText: "Learn More",
  },
];

export const Banner = () => {
  const [index, setIndex] = useState(0);

  // Auto-play logic
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % BANNERS.length);
    }, 10000); // Switches every 10 seconds
    return () => clearInterval(timer);
  }, []);

  const activeBanner = BANNERS[index];

  return (
    <div className={cn('relative', 'w-full', 'h-[40vh]', 'md:h-[50vh] lg:h-[70vh]', 'overflow-hidden', 'rounded-xl', 'shadow-xl', 'bg-muted')}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBanner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className={cn('absolute', 'inset-0', 'w-full', 'h-full')}
        >
          {/* BACKGROUND: The Image */}
          <Image
            alt="banner-image"
            src={activeBanner.image}
            fill
            priority
            className="object-cover"
          />

          {/* FOREGROUND: The Glass Info Card */}
          <div className={cn('absolute', 'inset-0', 'flex', 'flex-col', 'justify-end', 'p-4', 'md:p-6')}>
            <div
              className={cn(
                "group w-full max-w-4xl mx-auto",
                "transition-all duration-500 ease-in-out",
                // Glass Effect
                "bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl",
                // Hover: Darken effect for readability
                "hover:bg-black/40 hover:backdrop-blur-lg",
                "p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4",
              )}
            >
              <div className={cn('text-white', 'text-center', 'md:text-left')}>
                <h2 className={cn('text-md', 'md:text-2xl', 'font-semibold md:font-bold', 'tracking-tight')}>
                  {activeBanner.title}
                </h2>
                <p className={cn('text-sm', 'md:text-base', 'text-white/80', 'mt-1')}>
                  {activeBanner.subtitle}
                </p>
              </div>

              <Button
                variant="secondary"
                className={cn('font-semibold', 'px-4 md:px-8', 'hover:scale-105', 'transition-transform')}
              >
                {activeBanner.buttonText}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Optional: Slide Indicators */}
      <div className={cn('absolute', 'bottom-2', 'left-1/2', '-translate-x-1/2', 'flex', 'gap-2', 'z-10')}>
        {BANNERS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 w-8 rounded-full transition-all",
              i === index ? "bg-white" : "bg-white/30",
            )}
          />
        ))}
      </div>
    </div>
  );
};
