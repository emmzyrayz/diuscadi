"use client";
import React from "react";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import Image from "next/image";

const photos = [
  {
    src: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a",
    alt: "Tech Summit 2025 Keynote",
  },
  {
    src: "https://images.unsplash.com/photo-1515187029135-18ee286d815b",
    alt: "Community Mixer Workshop",
  },
  {
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
    alt: "Hackathon Team Huddle",
  },
  {
    src: "https://images.unsplash.com/photo-1531482615713-2afd69097998",
    alt: "Collaborative Session",
  },
  {
    src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952",
    alt: "Annual Board Meeting",
  },
  {
    src: "https://images.unsplash.com/photo-1556761175-b413da4baf72",
    alt: "Product Showcase",
  },
];

export default function GalleryPage() {
  return (
    <main className="min-h-screen pt-24 pb-12 px-6 max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-black italic">GALLERY</h1>
          <p className="text-muted-foreground">
            Captured moments from our events and sessions.
          </p>
        </div>
        <div className="glass px-4 py-2 rounded-full flex items-center gap-2 text-primary font-bold text-sm">
          <Camera size={16} /> {photos.length} Captures
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="group glass p-2 rounded-3xl overflow-hidden cursor-pointer"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                width={500}
                height={300}
                src={photo.src}
                alt={photo.alt}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                <p className="text-white text-sm font-medium">{photo.alt}</p>
                <p className="text-primary text-[10px] font-bold tracking-widest uppercase mt-1">
                  DIUSCADI Event
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
