"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  // MapPin,
  CheckCircle2,
  // ChevronRight,
  Coffee,
  Mic2,
  Users,
  Trophy,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "../../lib/utils";

const SCHEDULE_DATA = [
  {
    time: "7:30 am",
    title: "Registration",
    description:
      "Registration is open in front of the ASUU Secretariate Building. Collect your badges and welcome packs.",
    icon: ClipboardCheck,
  },
  {
    time: "8:00 am",
    title: "Opening Remarks",
    description:
      "Join us for a red-carpet worthy meet & greet with our Host, Dr. Umeh and this year’s LASCDS awesome speakers.",
    icon: Mic2,
  },
  {
    time: "8:30 am",
    title: "Keynote Speeches",
    description:
      "Renowned speakers are geared up to deliver insightful talks that will spark your imagination and fuel your entrepreneurial drive.",
    icon: Mic2,
  },
  {
    time: "10:00 am",
    title: "Breakout Sessions",
    description:
      "Dive into interactive workshops. Sessions are separated by industries—pick your interest and go all in.",
    icon: CheckCircle2,
  },
  {
    time: "1:00 pm",
    title: "Lunch Break & Exhibition",
    description:
      "Unwind and explore offerings from our exhibitors while enjoying refreshing drinks and delicious food.",
    icon: Coffee,
  },
  {
    time: "2:00 pm",
    title: "Panel Discussions",
    description:
      "Engage in dynamic discussions led by experts. Explore new ideas and enjoy a Q&A interactive session.",
    icon: Users,
  },
  {
    time: "3:00 pm",
    title: "Networking Session",
    description:
      "Meet fellow growth-driven students, forge valuable connections, and exchange ideas with facilitators.",
    icon: Users,
  },
  {
    time: "4:00 pm",
    title: "Closing & Awards",
    description:
      "A grand celebration featuring fun quizzes, games, and an exciting prize-giving ceremony for excellent participants.",
    icon: Trophy,
  },
];

export const EventSchedule = () => {
  return (
    <section id="schedule" className={cn('w-full rounded-2xl py-24', 'bg-background')}>
      <div className={cn('container', 'mx-auto', 'px-6')}>
        <div className={cn('flex', 'flex-col', 'lg:flex-row', 'gap-16')}>
          {/* LEFT COLUMN: Sticky Info */}
          <div className="lg:w-1/3">
            <div className={cn('lg:sticky', 'lg:top-32', 'space-y-8')}>
              <div className="space-y-4">
                <h4 className={cn('text-primary', 'font-bold', 'tracking-widest', 'uppercase', 'text-sm')}>
                  The Agenda
                </h4>
                <h2 className={cn('text-4xl', 'md:text-5xl', 'font-extrabold', 'text-foreground', 'tracking-tight')}>
                  Event Schedule
                </h2>
              </div>

              <div className={cn('p-8', 'rounded-[2rem]', 'bg-foreground', 'text-background', 'shadow-xl', 'relative', 'overflow-hidden')}>
                {/* Decorative Pattern */}
                <div className={cn('absolute', 'top-0', 'right-0', 'w-32', 'h-32', 'bg-primary/20', 'rounded-full', 'blur-3xl', '-translate-y-1/2', 'translate-x-1/2')} />

                <p className={cn('relative', 'z-10', 'text-xl', 'leading-relaxed')}>
                  We strive for a very impactful event. We&apos;re focused on
                  just
                  <span className={cn('text-primary', 'font-black')}>
                    {" "}
                    10% ACTIONABLE TALKS
                  </span>{" "}
                  &
                  <span className={cn('text-secondary', 'font-black')}>
                    {" "}
                    90% PRACTICAL WORKSHOPS!
                  </span>
                </p>

                <div className={cn('mt-8', 'flex', 'items-center', 'gap-3', 'text-muted-foreground', 'text-sm')}>
                  <Clock className={cn('w-5', 'h-5', 'text-primary')} />
                  <span>Starts at 10:00 am prompt</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Timeline */}
          <div className="lg:w-2/3">
            <div className={cn('relative', 'border-l-2', 'border-border', 'ml-4', 'md:ml-6', 'pl-8', 'md:pl-12', 'space-y-12')}>
              {SCHEDULE_DATA.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn('relative', 'group')}
                >
                  {/* Timeline Dot & Icon */}
                  <div className={cn('absolute', '-left-[calc(2rem+1px)]', 'md:-left-[calc(3rem+1px)]', 'top-0', 'w-12', 'h-12', 'md:w-14', 'md:h-14', 'bg-background', 'border-2', 'border-border', 'rounded-2xl', 'flex', 'items-center', 'justify-center', 'shadow-sm', 'group-hover:border-primary', 'group-hover:text-primary', 'transition-all', 'duration-300')}>
                    <item.icon className={cn('w-6', 'h-6')} />
                  </div>

                  {/* Content Card */}
                  <div className={cn('bg-muted', 'group-hover:bg-background', 'group-hover:shadow-md', 'border', 'border-transparent', 'group-hover:border-border', 'p-6', 'md:p-8', 'rounded-[2rem]', 'transition-all', 'duration-300')}>
                    <div className={cn('flex', 'flex-col', 'md:flex-row', 'md:items-center', 'justify-between', 'gap-2', 'mb-4')}>
                      <span className={cn('text-primary', 'font-bold', 'tracking-tighter', 'text-lg')}>
                        {item.time}
                      </span>
                      <div className={cn('h-px', 'grow', 'bg-slate-200', 'mx-4', 'hidden', 'md:block')} />
                    </div>

                    <h3 className={cn('text-xl', 'md:text-2xl', 'font-bold', 'text-foreground', 'mb-3')}>
                      {item.title}
                    </h3>
                    <p className={cn('text-slate-600', 'leading-relaxed', 'max-w-2xl')}>
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
