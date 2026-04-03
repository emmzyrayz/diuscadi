"use client";
import React, { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  ArrowRight,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import img1 from "@/assets/img/downloads/Diuscadi-2023-Testimonial-Thumbnail-1920x1272.webp";
import img2 from "@/assets/img/downloads/networking-diuscadi.webp";

// Dummy Data for Past Events (Fallback)
const PAST_EVENTS = [
  {
    id: "dummy-lascadss-4",
    slug: "lascadss-4",
    title: "#LASCADSS4: Entrepreneurship & Innovation",
    overview: "Our 4th edition focused on transforming academic skills into viable business ventures. Featuring 5 expert speakers and over 500 attendees.",
    eventDate: "2024-11-12T00:00:00.000Z",
    location: { venue: "Lagos State University" },
    image: img1.src,
    galleryCount: 42,
  },
  {
    id: "dummy-lascadss-3",
    slug: "lascadss-3",
    title: "#LASCADSS3: The Tech Transition",
    overview: "A deep dive into the Nigerian tech ecosystem. Graduates learned how to position themselves for roles in IT, Development, and Product Design.",
    eventDate: "2023-10-05T00:00:00.000Z",
    location: { venue: "Covenant University" },
    image: img2.src,
    galleryCount: 28,
  },
  {
    id: "dummy-lascadss-2",
    slug: "lascadss-2",
    title: "#LASCADSS2: Navigating the Labour Market",
    overview: "Our sophomore event tackling post-graduation anxiety. We brought in HR professionals to conduct live CV reviews and mock interviews.",
    eventDate: "2022-09-18T00:00:00.000Z",
    location: { venue: "Nnamdi Azikiwe University" },
    image: img1.src,
    galleryCount: 35,
  },
];

interface PastEvent {
  id: string;
  slug: string;
  title: string;
  overview: string;
  eventDate: string;
  location: { venue?: string; address?: string } | null;
  image: string;
  galleryCount?: number;
}

export const PastEventsSection = () => {
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch past/concluded events from the API
        const res = await fetch("/api/events/past?limit=3");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load past events");
        }

        // If we have real past events, use them
        if (data.events && data.events.length > 0) {
          setPastEvents(data.events);
        } else {
          // Fallback to dummy data if no past events exist
          setPastEvents(PAST_EVENTS);
        }
      } catch (err) {
        console.error("Error fetching past events:", err);
        setError(err instanceof Error ? err.message : "Failed to load past events");
        // Fallback to dummy data on error
        setPastEvents(PAST_EVENTS);
      } finally {
        setLoading(false);
      }
    };

    fetchPastEvents();
  }, []);

  if (loading) {
    return (
      <section className={cn('w-full rounded-2xl', 'py-24', 'bg-background', 'border-t', 'border-border/50')}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading past events...</p>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('w-full rounded-2xl', 'py-24', 'bg-background', 'border-t', 'border-border/50')}>
      <div className={cn('container', 'mx-auto', 'px-6', 'space-y-16')}>
        {/* HEADER */}
        <div className={cn('flex', 'flex-col', 'md:flex-row', 'md:items-end', 'justify-between', 'gap-6')}>
          <div className={cn('max-w-2xl', 'space-y-4')}>
            <h4 className={cn('text-secondary', 'font-bold', 'tracking-widest', 'uppercase', 'text-sm')}>
              Our Track Record
            </h4>
            <h2 className={cn('text-3xl', 'md:text-5xl', 'font-extrabold', 'text-foreground', 'tracking-tight')}>
              A Legacy of <span className="text-primary">Impact.</span>
            </h2>
            <p className={cn('text-muted-foreground', 'text-lg', 'leading-relaxed')}>
              Don&apos;t just take our word for it. Explore our previous
              seminars and see how we&apos;ve been bridging the gap for
              graduates over the years.
            </p>
          </div>

          <Button
            variant="outline"
            asChild
            className={cn('hidden', 'md:flex', 'items-center', 'gap-2', 'group')}
          >
            <Link href="/events?filter=past">
              View All Past Events
              <ArrowRight className={cn('w-4', 'h-4', 'group-hover:translate-x-1', 'transition-transform')} />
            </Link>
          </Button>
        </div>

        {/* GRID OF EVENTS */}
        <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-8')}>
          {pastEvents.map((event, idx) => {
            const isDummy = event.id.includes("dummy");
            const eventDate = new Date(event.eventDate);
            const locationDisplay = event.location?.venue || event.location?.address || "TBA";
            const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, duration: 0.5 }}
                className={cn('group', 'flex', 'flex-col', 'bg-background', 'rounded-3xl', 'overflow-hidden', 'border', 'border-border', 'shadow-sm', 'hover:shadow-xl', 'hover:border-primary/20', 'transition-all', 'duration-300', 'relative')}
              >
                {/* DEMO BADGE */}
                {isDummy && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-yellow-500/90 text-black px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
                    <AlertCircle className="w-3 h-3" /> DEMO
                  </div>
                )}

                {/* Image Container */}
                <div className={cn('relative', 'w-full', 'aspect-4/3', 'overflow-hidden', 'text-muted')}>
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className={cn('object-cover', 'group-hover:scale-105', 'transition-transform', 'duration-700', 'ease-in-out')}
                  />

                  {/* Floating Glass Date Badge */}
                  <div className={cn('absolute', 'top-4', 'left-4', 'flex', 'items-center', 'gap-2', 'px-3', 'py-1.5', 'rounded-full', 'bg-black/30', 'backdrop-blur-md', 'border', 'border-background/20', 'text-background', 'text-xs', 'font-medium', 'shadow-lg')}>
                    <CalendarDays className={cn('w-3.5', 'h-3.5')} />
                    {formattedDate}
                  </div>

                  {/* Gallery Indicator (Glass Pill) */}
                  {event.galleryCount && (
                    <div className={cn('absolute', 'bottom-4', 'right-4', 'flex', 'items-center', 'gap-1.5', 'px-3', 'py-1', 'rounded-full', 'bg-background/10', 'backdrop-blur-md', 'border', 'border-background/20', 'text-background', 'text-xs', 'font-medium', 'opacity-0', 'group-hover:opacity-100', 'transition-opacity', 'duration-300', 'translate-y-2', 'group-hover:translate-y-0')}>
                      <ImageIcon className={cn('w-3.5', 'h-3.5')} />
                      {event.galleryCount} Photos
                    </div>
                  )}
                </div>

                {/* Content Container */}
                <div className={cn('flex', 'flex-col', 'grow', 'p-6', 'md:p-8')}>
                  {/* Location */}
                  <div className={cn('flex', 'items-center', 'gap-2', 'text-primary', 'text-sm', 'font-semibold', 'mb-3')}>
                    <MapPin className={cn('w-4', 'h-4')} />
                    {locationDisplay}
                  </div>

                  {/* Title */}
                  <h3 className={cn('text-xl', 'font-bold', 'text-foreground', 'mb-3', 'leading-tight', 'group-hover:text-primary', 'transition-colors')}>
                    {event.title}
                  </h3>

                  {/* Description */}
                  <p className={cn('text-muted-foreground', 'text-sm', 'leading-relaxed', 'mb-6', 'grow')}>
                    {event.overview}
                  </p>

                  {/* Action Link */}
                  <div className={cn('mt-auto', 'pt-4', 'border-t', 'border-border', 'flex', 'items-center', 'justify-between')}>
                    <Link 
                      href={`/events/${event.slug}`}
                      className={cn('text-sm', 'font-semibold', 'text-foreground', 'group-hover:text-primary', 'transition-colors', 'flex', 'items-center', 'gap-2')}
                    >
                      Event Log & Gallery
                      <ArrowRight className={cn('w-4', 'h-4', 'text-primary', 'opacity-0', '-translate-x-2', 'group-hover:opacity-100', 'group-hover:translate-x-0', 'transition-all', 'duration-300')} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile-only "View All" Button */}
        <div className={cn('md:hidden', 'flex', 'justify-center', 'mt-8')}>
          <Button
            variant="outline"
            asChild
            className={cn('w-full', 'flex', 'items-center', 'justify-center', 'gap-2')}
          >
            <Link href="/events?filter=past">
              View All Past Events <ArrowRight className={cn('w-4', 'h-4')} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
