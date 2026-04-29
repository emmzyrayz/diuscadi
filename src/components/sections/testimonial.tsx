"use client";
import React from "react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import { Quote, Play, Star } from "lucide-react";
import stephanie from "@/assets/img/downloads/Stephanie-Nkamigbo.webp";
import Esther from "@/assets/img/downloads/Esther-Chiamaka.webp";
import Mbah from "@/assets/img/downloads/Mbah-Divine-Chinecherem.webp";
import Azubuike from "@/assets/img/downloads/Azubike-Desiree.webp";
import networking from "@/assets/img/downloads/networking-diuscadi.webp";

// All testimonials are real — sourced from DIUSCADI PDF and actual participants
const TESTIMONIALS = [
  {
    id: 1,
    name: "Stephanie Nkamigbo",
    role: "Participant & Organiser, LASCADSS",
    review:
      "Being part of DIUSCADI was an amazing opportunity. The Finalist Launchpad Workshop gave me insight into what life after school really looks like. For the first time, someone actually educated me on how to prepare my CV and get ready for interviews.",
    image: stephanie,
    edition: "LASCADSS 2.0",
  },
  {
    id: 2,
    name: "Okoro Esther Chiamaka",
    role: "Graduate Participant",
    review:
      "DIUSCADI taught me that one needs little to no capital to start — for example, in digital marketing. The seasoned speakers shared life stories that were incredibly inspiring. Their resilience is truly worth emulating.",
    image: Esther,
    edition: "LASCADSS 2023",
  },
  {
    id: 3,
    name: "Mbah Divine Chinecherem",
    role: "Teacher & LASCADSS Attendee",
    review:
      "The last edition helped me understand the job market better. I was able to network more and connect with potential mentors and fellow mentees in my chosen field.",
    image: Mbah,
    edition: "LASCADSS 5.0",
  },
  {
    id: 4,
    name: "Azubike Desiree",
    role: "Participant",
    review:
      "I personally gained practical knowledge in solar panel installation and digital marketing. The dedication of the speakers was commendable. I highly recommend it for all students.",
    image: Azubuike,
    edition: "LASCADSS 4.0",
  },
];

export const Testimonials = () => {
  return (
    <section
      className={cn(
        "py-24 w-full bg-foreground text-background overflow-hidden rounded-2xl",
      )}
    >
      <div className="container mx-auto px-6">
        {/* Header */}
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
          {/* LEFT: Featured / Video */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="group relative aspect-video rounded-[2rem] overflow-hidden border-4 border-background/10 shadow-2xl">
              <Image
                src={networking}
                alt="Networking at LASCADSS"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <button className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-background fill-background ml-1" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-background/10 backdrop-blur-md border border-background/20">
                <p className="text-sm font-medium">
                  Watch the #LASCADSS Highlights
                </p>
              </div>
            </div>

            {/* Founder quote */}
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

            {/* PDF testimonials */}
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

          {/* RIGHT: Review cards */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, idx) => (
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
                    {t.review}
                  </p>
                  <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">
                    {t.edition}
                  </span>
                </div>
                <div className="flex items-center gap-4 pt-6 border-t border-background/10 mt-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
                    <Image
                      src={t.image}
                      alt={t.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h5 className="font-bold text-background text-sm">
                      {t.name}
                    </h5>
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
