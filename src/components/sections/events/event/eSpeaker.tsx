"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuLinkedin, LuTwitter, LuGlobe } from "react-icons/lu";
import { cn } from "../../../../lib/utils";
import Image from "next/image";

const speakers = [
  {
    id: 1,
    name: "Dr. Sarah Olaitan",
    role: "VP of Engineering",
    org: "Paystack",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Emeka Azikiwe",
    role: "Senior Product Designer",
    org: "Google",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Titi Adebayo",
    role: "Founder & CEO",
    org: "TechFuture Africa",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Marcus Thorne",
    role: "Head of Strategy",
    org: "Microsoft",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
  },
];

export const SpeakersSection = () => {
  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-20')}>
      <div className={cn('flex', 'flex-col', 'md:flex-row', 'md:items-end', 'justify-between', 'gap-6', 'mb-12')}>
        <div className="max-w-xl">
          <h3 className={cn('text-sm', 'font-black', 'text-primary', 'uppercase', 'tracking-[0.3em]', 'mb-4')}>
            Experts & Leaders
          </h3>
          <h2 className={cn('text-3xl', 'md:text-5xl', 'font-black', 'text-slate-900', 'tracking-tighter', 'leading-tight')}>
            Meet our <span className="text-primary">Speakers.</span>
          </h2>
        </div>
        <p className={cn('text-slate-500', 'font-medium', 'max-w-xs', 'md:text-right')}>
          Learn directly from industry giants who are shaping the future of
          African tech.
        </p>
      </div>

      <div className={cn('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4', 'gap-8')}>
        {speakers.map((speaker, index) => (
          <motion.div
            key={speaker.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            {/* Speaker Photo Container */}
            <div className={cn('relative', 'aspect-4/5', 'overflow-hidden', 'rounded-[2rem]', 'bg-slate-100', 'mb-6', 'border-4', 'border-white', 'shadow-xl', 'shadow-slate-200/50')}>
                    <Image
                        height={300}
                        width={500}
                src={speaker.image}
                alt={speaker.name}
                className={cn('w-full', 'h-full', 'object-cover', 'grayscale', 'group-hover:grayscale-0', 'group-hover:scale-105', 'transition-all', 'duration-500')}
              />

              {/* Social Links Overlay */}
              <div className={cn('absolute', 'inset-0', 'bg-linear-to-t', 'from-slate-900/80', 'via-transparent', 'to-transparent', 'opacity-0', 'group-hover:opacity-100', 'transition-opacity', 'flex', 'items-end', 'justify-center', 'pb-8')}>
                <div className={cn('flex', 'gap-4')}>
                  <button className={cn('p-2', 'bg-white', 'rounded-xl', 'text-slate-900', 'hover:bg-primary', 'hover:text-white', 'transition-all')}>
                    <LuLinkedin className={cn('w-5', 'h-5')} />
                  </button>
                  <button className={cn('p-2', 'bg-white', 'rounded-xl', 'text-slate-900', 'hover:bg-primary', 'hover:text-white', 'transition-all')}>
                    <LuTwitter className={cn('w-5', 'h-5')} />
                  </button>
                </div>
              </div>
            </div>

            {/* Speaker Details */}
            <div className={cn('text-center', 'md:text-left', 'space-y-1')}>
              <h4 className={cn('text-xl', 'font-black', 'text-slate-900', 'group-hover:text-primary', 'transition-colors')}>
                {speaker.name}
              </h4>
              <div className={cn('flex', 'flex-col')}>
                <span className={cn('text-sm', 'font-bold', 'text-slate-500')}>
                  {speaker.role}
                </span>
                <span className={cn('text-xs', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'mt-1')}>
                  at {speaker.org}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
