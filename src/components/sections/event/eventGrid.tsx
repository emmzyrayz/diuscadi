"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuCalendar, LuMapPin, LuArrowRight } from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Image1 from "@/assets/img/downloads/Diuscadi-2023-Testimonial-Thumbnail-1920x1272.webp";
import Image2 from "@/assets/img/downloads/networking-diuscadi.webp";
import Image3 from "@/assets/img/downloads/networking-diuscadi.webp";

const events = [
  {
    id: 1,
    title: "Product Design Mastery Workshop",
    date: "Mar 22, 2026",
    location: "Lagos Tech Hub",
    tag: "Upcoming",
    image: Image1,
    price: "Free",
  },
  {
    id: 2,
    title: "Backend Engineering with Go",
    date: "Mar 28, 2026",
    location: "Virtual (Google Meet)",
    tag: "Upcoming",
    image: Image2,
    price: "Paid",
  },
  {
    id: 3,
    title: "Quarterly Networking Mixer",
    date: "Feb 10, 2026",
    location: "Abuja Continental",
    tag: "Past",
    image: Image3,
    price: "Free",
  },
  // Add more as needed...
];

export const EventsGrid = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group flex flex-col bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500"
          >
            {/* Image & Tag Area */}
            <div className="relative h-64 overflow-hidden">
              <Image
                width={500}
                height={300}
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Floating Tag */}
              <div
                className={cn(
                  "absolute top-4 right-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg",
                  event.tag === "Upcoming"
                    ? "bg-primary text-white"
                    : "bg-white/90 text-slate-500",
                )}
              >
                {event.tag}
              </div>

              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 bg-white/95 text-slate-900 text-[10px] font-black rounded-lg uppercase">
                  {event.price}
                </span>
              </div>
            </div>

            {/* Details Area */}
            <div className="p-8 flex flex-col flex-1">
              <div className="flex items-center gap-3 text-slate-400 text-xs font-bold mb-3">
                <div className="flex items-center gap-1.5 text-primary">
                  <LuCalendar className="w-4 h-4" />
                  {event.date}
                </div>
                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                <div className="flex items-center gap-1.5">
                  <LuMapPin className="w-4 h-4" />
                  {event.location}
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-6 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {event.title}
              </h3>

              <div className="mt-auto pt-6 border-t border-slate-50">
                <button
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm transition-all",
                    event.tag === "Past"
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-slate-900 text-white hover:bg-primary shadow-lg shadow-slate-200 hover:shadow-primary/20",
                  )}
                >
                  {event.tag === "Past" ? "Event Concluded" : "Register Now"}
                  {event.tag !== "Past" && <LuArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
