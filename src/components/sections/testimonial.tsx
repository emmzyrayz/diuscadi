'use client'
import React from "react";
// import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import { Quote, Play, Star } from "lucide-react";
import stephanie from "@/assets/img/downloads/Stephanie-Nkamigbo.webp";
import Esther from "@/assets/img/downloads/Esther-Chiamaka.webp";
import Mbah from "@/assets/img/downloads/Mbah-Divine-Chinecherem.webp";
import Azubuike from "@/assets/img/downloads/Azubike-Desiree.webp";
import networking from "@/assets/img/downloads/networking-diuscadi.webp";

const TESTIMONIALS = [
  {
    id: 1,
    name: "Stephanie Nkamigbo",
    role: "Participant & Organizer",
    review:
      "Being part of DIUSCADI 2.0 was an amazing opportunity. The Finalist Launchpad Workshop gave me an insight of what life after school looks like. For the first time, I actually had someone educate me on how to prepare my CV and get prepared for interviews.",
    image: stephanie,
  },
  {
    id: 2,
    name: "Okoro Esther Chiamaka",
    role: "Graduate Participant",
    review:
      "DIUSCADI 2023 taught me that one needs little to no capital to start—for example, in digital marketing. The seasoned speakers shared life stories that were incredibly inspiring. Their resilience is truly worth emulating.",
    image: Esther,
  },
  {
    id: 3,
    name: "Mbah Divine Chinecherem",
    role: "Teacher",
    review:
      "The last edition helped me understand the job market better. I was able to network more, and connect with potential mentors and fellow mentees in my chosen job field.",
    image: Mbah,
  },
  {
    id: 4,
    name: "Azubike Desiree",
    role: "Participant",
    review:
      "I personally gained practical knowledge in solar panel installation and digital marketing. The dedication of the speakers was commendable. I highly recommend it for students.",
    image: Azubuike,
  },
];

export const Testimonials = () => {
  return (
    <section className="py-24 bg-slate-900 text-white overflow-hidden rounded-2xl">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h4 className="text-primary font-bold tracking-widest uppercase text-sm">
            Past Attendees Are Raving…
          </h4>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Trusted Community.{" "}
            <span className="text-secondary">True Connections.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* LEFT: Video Testimonial (The "Hero" Review) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="group relative aspect-video rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-2xl">
              <Image
                src={networking} // Replace with networking-diuscadi.webp
                alt="Networking at DIUSCADI"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <button className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </button>
              </div>
              {/* Glass Info Tag */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                <p className="text-sm font-medium">
                  Watch the #LASCDSSHighlights
                </p>
              </div>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex gap-1 text-secondary mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-secondary" />
                ))}
              </div>
              <p className="text-lg italic text-slate-300">
                &quot;Our mission is to ensure no student enters the labor market
                feeling invisible or unprepared.&quot;
              </p>
            </div>
          </motion.div>

          {/* RIGHT: Scrollable Reviews Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[700px] overflow-y-auto pr-4 scrollbar-0">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-between hover:bg-white/10 transition-colors group"
              >
                <div>
                  <Quote className="w-8 h-8 text-primary/40 mb-4 group-hover:text-primary transition-colors" />
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    {t.review}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                    <Image
                      src={t.image}
                      alt={t.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">{t.name}</h5>
                    <p className="text-xs text-primary font-medium">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
