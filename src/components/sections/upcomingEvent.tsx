'use client'
// import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import Image from "next/image";
import { CalendarDays, MapPin, Clock, ArrowRight } from "lucide-react";
import img1 from "@/assets/img/downloads/Diuscadi-2023-Testimonial-Thumbnail-1920x1272.webp";

export const UpcomingEvent = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-900"
        >
          {/* BACKGROUND IMAGE WITH OVERLAY */}
          <div className="absolute inset-0 w-full h-full z-0">
            <Image
              src={img1} // Replace with a wide shot of a previous event or a cool tech/campus background
              alt="Upcoming Event Background"
              fill
              className="object-cover opacity-40 mix-blend-overlay"
            />
            {/* Gradient overlay to ensure text is always readable */}
            <div className="absolute inset-0 bg-linear-to-r from-slate-900 via-slate-900/90 to-transparent md:to-slate-900/40" />
          </div>

          {/* FOREGROUND CONTENT */}
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-16 gap-10">
            {/* Left Side: Event Info */}
            <div className="w-full md:w-2/3 space-y-8">
              {/* Event Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-semibold tracking-wide uppercase">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                </span>
                Next Big Event
              </div>

              {/* Title & Description */}
              <div className="space-y-4 text-white text-left">
                <h2 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
                  #LASCDSS5:{" "}
                  <span className="text-primary">Life After School</span>{" "}
                  Bootcamp 2026
                </h2>
                <p className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed">
                  Join hundreds of fresh graduates for an intensive 2-day
                  bootcamp. Master interview skills, network with top employers,
                  and build a resilient career roadmap.
                </p>
              </div>

              {/* Event Metadata (Date, Time, Location) */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-3 text-slate-200 bg-white/5 px-4 py-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  <span className="font-medium">Oct 15 - 16, 2026</span>
                </div>
                <div className="flex items-center gap-3 text-slate-200 bg-white/5 px-4 py-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-medium">9:00 AM WAT</span>
                </div>
                <div className="flex items-center gap-3 text-slate-200 bg-white/5 px-4 py-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-medium">Nnamdi Azikiwe University</span>
                </div>
              </div>
            </div>

            {/* Right Side: CTA & Urgency */}
            <div className="w-full md:w-1/3 flex flex-col items-start md:items-end gap-6 border-t border-white/10 md:border-t-0 md:border-l pt-8 md:pt-0 md:pl-10 mt-4 md:mt-0">
              <div className="text-left md:text-right space-y-2">
                <p className="text-slate-300 font-medium">
                  Limited Seats Available
                </p>
                <p className="text-white/60 text-sm">
                  Registration closes in 14 days.
                </p>
              </div>

              <div className="flex flex-col w-full gap-3">
                {/* Primary Action */}
                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                >
                  Register Now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                {/* Secondary Action (Leads to the dynamic event page you mentioned) */}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-14 text-lg text-white border-white/20 bg-white/5 hover:bg-white/10 hover:text-white backdrop-blur-md"
                >
                  View Full Agenda
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
