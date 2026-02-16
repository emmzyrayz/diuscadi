'use client'
import React from "react";
// import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  CalendarDays,
  MapPin,
  ArrowRight,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import img1 from "@/assets/img/downloads/Diuscadi-2023-Testimonial-Thumbnail-1920x1272.webp";
import img2 from "@/assets/img/downloads/networking-diuscadi.webp";

// Dummy Data for Past Events
const PAST_EVENTS = [
  {
    id: "lascadss-4",
    title: "#LASCADSS4: Entrepreneurship & Innovation",
    date: "November 12, 2024",
    location: "Lagos State University",
    image: img1, // Replace with actual event photo
    description:
      "Our 4th edition focused on transforming academic skills into viable business ventures. Featuring 5 expert speakers and over 500 attendees.",
    galleryCount: 42,
  },
  {
    id: "lascadss-3",
    title: "#LASCADSS3: The Tech Transition",
    date: "October 05, 2023",
    location: "Covenant University",
    image: img2,
    description:
      "A deep dive into the Nigerian tech ecosystem. Graduates learned how to position themselves for roles in IT, Development, and Product Design.",
    galleryCount: 28,
  },
  {
    id: "lascadss-2",
    title: "#LASCADSS2: Navigating the Labour Market",
    date: "September 18, 2022",
    location: "Nnamdi Azikiwe University",
    image: img1,
    description:
      "Our sophomore event tackling post-graduation anxiety. We brought in HR professionals to conduct live CV reviews and mock interviews.",
    galleryCount: 35,
  },
];

export const PastEventsSection = () => {
  return (
    <section className="py-24 bg-background border-t border-border/50">
      <div className="container mx-auto px-6 space-y-16">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <h4 className="text-secondary font-bold tracking-widest uppercase text-sm">
              Our Track Record
            </h4>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">
              A Legacy of <span className="text-primary">Impact.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Don&apos;t just take our word for it. Explore our previous seminars and
              see how we&apos;ve been bridging the gap for graduates over the years.
            </p>
          </div>

          <Button
            variant="outline"
            className="hidden md:flex items-center gap-2 group"
          >
            View All Past Events
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* GRID OF EVENTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PAST_EVENTS.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300"
            >
              {/* Image Container */}
              <div className="relative w-full aspect-4/3 overflow-hidden bg-slate-100">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                />

                {/* Floating Glass Date Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white text-xs font-medium shadow-lg">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {event.date}
                </div>

                {/* Gallery Indicator (Glass Pill) */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                  <ImageIcon className="w-3.5 h-3.5" />
                  {event.galleryCount} Photos
                </div>
              </div>

              {/* Content Container */}
              <div className="flex flex-col grow p-6 md:p-8">
                {/* Location */}
                <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-3">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-foreground mb-3 leading-tight group-hover:text-primary transition-colors">
                  {event.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 grow">
                  {event.description}
                </p>

                {/* Action Link */}
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                    Event Log & Gallery
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile-only "View All" Button */}
        <div className="md:hidden flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            View All Past Events <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
