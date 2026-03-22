"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Mock Data with specific grid spans
// 'span' determines the layout: 'large' (2x2), 'tall' (1x2), 'wide' (2x1), 'small' (1x1)
const galleryItems = [
  {
    id: "1",
    eventId: "event-abc",
    src: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a",
    alt: "Global Tech Summit",
    description:
      "Keynote session on the future of AI in decentralized platforms.",
    span: "large",
  },
  {
    id: "2",
    eventId: "event-123",
    src: "https://images.unsplash.com/photo-1515187029135-18ee286d815b",
    alt: "Networking Mixer",
    description: "Connect with industry leaders and fellow DIUSCADI members.",
    span: "small",
  },
  {
    id: "3",
    eventId: "event-456",
    src: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678",
    alt: "Hackathon 2025",
    description: "48 hours of pure building and innovation.",
    span: "tall",
  },
  {
    id: "4",
    eventId: "event-789",
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
    alt: "Workshop: UI/UX",
    description: "Deep dive into glassmorphism and modern design trends.",
    span: "wide",
  },
  {
    id: "5",
    eventId: "event-000",
    src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952",
    alt: "Annual Board Meet",
    description: "Planning the roadmap for the next quarter.",
    span: "small",
  },
  {
    id: "6",
    eventId: "event-999",
    src: "https://images.unsplash.com/photo-1556761175-b413da4baf72",
    alt: "Product Launch",
    description: "Unveiling the new DIUSCADI member dashboard.",
    span: "small",
  },
];

// Helper to map span types to Tailwind classes
const getSpanClass = (span: string) => {
  switch (span) {
    case "large":
      return "md:col-span-2 md:row-span-2 h-[400px] md:h-[600px]";
    case "tall":
      return "md:col-span-1 md:row-span-2 h-[400px] md:h-[600px]";
    case "wide":
      return "md:col-span-2 md:row-span-1 h-[300px]";
    default:
      return "md:col-span-1 md:row-span-1 h-[300px]";
  }
};

export default function GalleryPage() {
  return (
    <main className={cn('min-h-screen', 'pt-24', 'pb-12', 'px-6', 'max-w-7xl', 'mx-auto', 'space-y-12')}>
      {/* Header */}
      <div className={cn('flex', 'flex-col', 'md:flex-row', 'justify-between', 'items-end', 'gap-4', 'border-b', 'border-border/50', 'pb-8')}>
        <div>
          <h1 className={cn('text-5xl', 'font-black', 'italic', 'tracking-tighter')}>
            MOMENTS
          </h1>
          <p className={cn('text-muted-foreground', 'mt-2')}>
            A visual journey through DIUSCADI events.
          </p>
        </div>
        <div className={cn('glass', 'px-6', 'py-3', 'rounded-2xl', 'flex', 'items-center', 'gap-3', 'text-primary', 'font-black', 'text-sm', 'uppercase', 'tracking-widest')}>
          <Camera size={20} /> {galleryItems.length} Captures
        </div>
      </div>

      {/* Bento Grid */}
      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-4', 'gap-6', 'auto-rows-fr')}>
        {galleryItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "group relative rounded-[2.5rem] overflow-hidden glass p-2 cursor-pointer",
              getSpanClass(item.span),
            )}
          >
            <Link
              href={`/events/${item.eventId}`}
              className={cn('block', 'w-full', 'h-full', 'relative', 'overflow-hidden', 'rounded-[2rem]')}
            >
              {/* Image */}
              <Image
                height={300}
                width={500}
                src={item.src}
                alt={item.alt}
                className={cn('w-full', 'h-full', 'object-cover', 'transition-transform', 'duration-700', 'group-hover:scale-110')}
              />

              {/* Glass Overlay (Shows on Hover) */}
              <div className={cn('absolute', 'inset-0', 'bg-background/20', 'backdrop-blur-sm', 'opacity-0', 'group-hover:opacity-100', 'transition-all', 'duration-500', 'flex', 'flex-col', 'justify-end', 'p-8')}>
                <motion.div
                  initial={{ y: 20 }}
                  whileHover={{ y: 0 }}
                  className="space-y-3"
                >
                  <div className={cn('flex', 'items-center', 'justify-between')}>
                    <h3 className={cn('text-2xl', 'font-black', 'text-white', 'drop-shadow-md')}>
                      {item.alt}
                    </h3>
                    <div className={cn('bg-primary', 'p-2', 'rounded-xl', 'text-white')}>
                      <ExternalLink size={18} />
                    </div>
                  </div>
                  <p className={cn('text-white/90', 'text-sm', 'font-medium', 'leading-relaxed', 'max-w-sm')}>
                    {item.description}
                  </p>
                  <div className="pt-2">
                    <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-[0.2em]', 'text-primary', 'bg-white/20', 'backdrop-blur-md', 'px-3', 'py-1', 'rounded-full', 'border', 'border-white/30')}>
                      View Event
                    </span>
                  </div>
                </motion.div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
