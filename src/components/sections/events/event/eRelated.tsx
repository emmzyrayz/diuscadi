"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuArrowRight, LuCalendar, LuMapPin } from "react-icons/lu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

const RELATED_MOCK = [
  {
    id: "digital-marketing-2026",
    title: "Digital Marketing Strategy for Startups",
    date: "May 15, 2026",
    location: "Lagos / Virtual",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=500",
    category: "Marketing",
  },
  {
    id: "uiux-design-jam",
    title: "UI/UX Design Jam: Accessibility First",
    date: "June 02, 2026",
    location: "Unilag Design Studio",
    image:
      "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?q=80&w=500",
    category: "Design",
  },
  {
    id: "fintech-founders-meet",
    title: "Fintech Founders & Investors Mixer",
    date: "June 20, 2026",
    location: "Eko Hotels, Lagos",
    image:
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=500",
    category: "Networking",
  },
];

export const RelatedEvents = () => {
  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-20', 'border-t', 'border-slate-100')}>
      <div className={cn('flex', 'flex-col', 'md:flex-row', 'md:items-end', 'justify-between', 'gap-6', 'mb-12')}>
        <div>
          <h3 className={cn('text-sm', 'font-black', 'text-primary', 'uppercase', 'tracking-[0.3em]', 'mb-4')}>
            Don&apos;t Stop Here
          </h3>
          <h2 className={cn('text-3xl', 'md:text-5xl', 'font-black', 'text-slate-900', 'tracking-tighter')}>
            Similar <span className="text-primary">Events.</span>
          </h2>
        </div>
        <Link
          href="/events"
          className={cn('flex', 'items-center', 'gap-2', 'text-slate-900', 'font-black', 'hover:text-primary', 'transition-colors', 'group')}
        >
          Explore All Events
          <LuArrowRight className={cn('w-5', 'h-5', 'group-hover:translate-x-1', 'transition-transform')} />
        </Link>
      </div>

      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-8')}>
        {RELATED_MOCK.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={cn('group', 'cursor-pointer')}
          >
            {/* Image Container */}
            <div className={cn('relative', 'h-48', 'md:h-56', 'rounded-[2rem]', 'overflow-hidden', 'mb-6')}>
                    <Image
                        height={300}
                        width={500}
                src={event.image}
                alt={event.title}
                className={cn('w-full', 'h-full', 'object-cover', 'group-hover:scale-110', 'transition-transform', 'duration-700')}
              />
              <div className={cn('absolute', 'top-4', 'left-4')}>
                <span className={cn('px-3', 'py-1', 'bg-white/90', 'backdrop-blur-md', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-900', 'rounded-lg')}>
                  {event.category}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className={cn('space-y-3', 'px-2')}>
              <div className={cn('flex', 'items-center', 'gap-4', 'text-[11px]', 'font-bold', 'text-slate-400')}>
                <span className={cn('flex', 'items-center', 'gap-1.5')}>
                  <LuCalendar className={cn('w-3.5', 'h-3.5', 'text-primary')} />{" "}
                  {event.date}
                </span>
                <span className={cn('flex', 'items-center', 'gap-1.5')}>
                  <LuMapPin className={cn('w-3.5', 'h-3.5', 'text-primary')} />{" "}
                  {event.location}
                </span>
              </div>

              <h4 className={cn('text-xl', 'font-bold', 'text-slate-900', 'leading-tight', 'group-hover:text-primary', 'transition-colors', 'line-clamp-2')}>
                {event.title}
              </h4>

              <div className={cn('flex', 'items-center', 'gap-2', 'text-primary', 'font-black', 'text-xs', 'uppercase', 'tracking-widest', 'opacity-0', 'group-hover:opacity-100', 'transition-opacity')}>
                View Event <LuArrowRight className={cn('w-4', 'h-4')} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
