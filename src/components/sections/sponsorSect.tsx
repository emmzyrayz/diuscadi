"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import Image from "next/image";
import airtel from "@/assets/img/logo/Airtel.webp"
import mtn from "@/assets/img/logo/mtn.jpg"
import i1960 from "@/assets/img/logo/1960.webp"
import codex from "@/assets/img/logo/codex.webp"
import radopin from "@/assets/img/logo/adopin.jpg"
import lovebite from "@/assets/img/logo/Lovebite.webp"
import AICIC from "@/assets/img/logo/AICIC.png"

const PARTNERS = [
  {
    name: "Airtel",
    logo: airtel,
  },
  {
    name: "MTN",
    logo: mtn,
  }, // Placeholder for MTN
  {
    name: "1960 Laundry",
    logo: i1960,
  },
  {
    name: "Codex Microsystem",
    logo: codex,
  },
  {
    name: "RADOPIN",
    logo: radopin,
  },
  {
    name: "Lovebite",
    logo: lovebite,
  },
  {
    name: "AICIC",
    logo: AICIC,
  },
];

export const SponsorSection = () => {
  return (
    <section className="py-24 w-full bg-slate-200 mt-5 rounded-2xl overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Header Text */}
        <div className="max-w-3xl mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6"
          >
            <Heart className="w-4 h-4" />
            <span>Pay It Forward</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
            Support Career Development of Nigerian Youths
          </h2>
          <p className="text-xl text-slate-600 leading-relaxed">
            At DIUSCADI, we believe one person can make a big difference and
            that kindness should be passed on. Join these leading brands in
            fueling the next generation of tech talent.
          </p>
        </div>

        {/* Infinite Logo Slider */}
        <div className="relative mt-10 flex overflow-hidden group">
          <motion.div
            className="flex whitespace-nowrap items-center gap-10"
            animate={{
              x: [0, -1000], // Adjust -1000 based on your total row width
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 40, // Adjust for speed (higher = slower)
                ease: "linear",
              },
            }}
          >
            {/* Render PARTNERS multiple times to ensure no gaps during the loop */}
            {[...PARTNERS, ...PARTNERS, ...PARTNERS].map((partner, index) => (
              <div
                key={`${partner.name}-${index}`}
                className="flex flex-none w-[120px] h-[120px] md:h-[150px] md:w-[150px] items-center justify-center grayscale-50 opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-pointer"
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  className="h-full w-full items-center justify-center flex rounded-xl object-contain"
                />
              </div>
            ))}
          </motion.div>

          {/* Gradient Overlays */}
          <div className="absolute inset-y-0 left-0 w-32 bg-linear-to-r from-slate-200 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-linear-to-l from-slate-200 to-transparent z-10 pointer-events-none" />
        </div>

        {/* Action Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-20 p-8 md:p-12 rounded-[3rem] bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
        >
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">
              Ready to make an impact?
            </h3>
            <p className="text-slate-400 text-lg">
              Partner with us for the 2026 Academic Session.
            </p>
          </div>

          <a
            href="/sponsor"
            className="relative z-10 group flex items-center gap-3 bg-primary hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/25"
          >
            Sponsor DIUSCADI
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>

          {/* Subtle background glow for the card */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
        </motion.div>
      </div>
    </section>
  );
};
