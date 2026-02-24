"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuHeart, LuArrowRight } from "react-icons/lu";
import Image from "next/image";

// Importing your specific assets
import airtel from "@/assets/img/logo/Airtel.webp";
import mtn from "@/assets/img/logo/mtn.jpg";
import i1960 from "@/assets/img/logo/1960.webp";
import codex from "@/assets/img/logo/codex.webp";
import radopin from "@/assets/img/logo/adopin.jpg";
import lovebite from "@/assets/img/logo/Lovebite.webp";
import AICIC from "@/assets/img/logo/AICIC.png";
import { cn } from "../../../../lib/utils";

const PARTNERS = [
  { name: "Airtel", logo: airtel },
  { name: "MTN", logo: mtn },
  { name: "1960 Laundry", logo: i1960 },
  { name: "Codex Microsystem", logo: codex },
  { name: "RADOPIN", logo: radopin },
  { name: "Lovebite", logo: lovebite },
  { name: "AICIC", logo: AICIC },
];

interface SponsorsSectionProps {
  eventTitle?: string;
}

export const SponsorsSection = ({
  eventTitle = "this event",
}: SponsorsSectionProps) => {
  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-20')}>
      <div className={cn('bg-slate-50', 'rounded-[3rem]', 'p-8', 'md:p-16', 'border', 'border-slate-100', 'overflow-hidden')}>
        {/* Header Section */}
        <div className={cn('max-w-3xl', 'mb-12')}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn('inline-flex', 'items-center', 'gap-2', 'px-4', 'py-1.5', 'rounded-full', 'bg-primary/10', 'text-primary', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'mb-6')}
          >
            <LuHeart className={cn('w-3', 'h-3')} />
            <span>Powering Career Growth</span>
          </motion.div>

          <h2 className={cn('text-3xl', 'md:text-5xl', 'font-black', 'text-slate-900', 'mb-6', 'tracking-tighter', 'leading-tight')}>
            Backed by Industry{" "}
            <span className={cn('text-primary', 'text-glow')}>Leaders.</span>
          </h2>
          <p className={cn('text-lg', 'text-slate-500', 'font-medium')}>
            Join the visionary brands supporting{" "}
            <span className={cn('text-slate-900', 'font-bold')}>{eventTitle}</span> and
            fueling the next generation of Nigerian tech talent.
          </p>
        </div>

        {/* The Infinite Logo Loop Container */}
        <div className={cn('relative', 'mt-12', 'flex', 'overflow-hidden', 'group')}>
          <motion.div
            className={cn('flex', 'whitespace-nowrap', 'items-center', 'gap-12')}
            animate={{ x: [0, -1200] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 30,
                ease: "linear",
              },
            }}
          >
            {/* Double the array for a seamless loop */}
            {[...PARTNERS, ...PARTNERS].map((partner, index) => (
              <div
                key={`${partner.name}-${index}`}
                className={cn('relative', 'flex-none', 'w-32', 'h-16', 'md:w-40', 'md:h-20', 'grayscale', 'opacity-40', 'hover:grayscale-0', 'hover:opacity-100', 'transition-all', 'duration-500')}
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  className="object-contain"
                />
              </div>
            ))}
          </motion.div>

          {/* Fade Edges for the loop */}
          <div className={cn('absolute', 'inset-y-0', 'left-0', 'w-24', 'bg-linear-to-r', 'from-slate-50', 'to-transparent', 'z-10', 'pointer-events-none')} />
          <div className={cn('absolute', 'inset-y-0', 'right-0', 'w-24', 'bg-linear-to-l', 'from-slate-50', 'to-transparent', 'z-10', 'pointer-events-none')} />
        </div>

        {/* Partner CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={cn('mt-16', 'p-8', 'md:p-10', 'bg-slate-950', 'rounded-[2.5rem]', 'flex', 'flex-col', 'md:flex-row', 'items-center', 'justify-between', 'gap-8', 'border', 'border-slate-800')}
        >
          <div>
            <h4 className={cn('text-xl', 'md:text-2xl', 'font-black', 'text-white', 'mb-2')}>
              Want to sponsor this event?
            </h4>
            <p className={cn('text-slate-400', 'font-medium')}>
              Showcase your brand to thousands of emerging professionals.
            </p>
          </div>

          <button className={cn('flex', 'items-center', 'gap-2', 'px-8', 'py-4', 'bg-primary', 'text-white', 'font-black', 'rounded-2xl', 'hover:bg-orange-600', 'transition-all', 'group')}>
            Partner With Us
            <LuArrowRight className={cn('w-5', 'h-5', 'group-hover:translate-x-1', 'transition-transform')} />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
