'use client'
import React from "react";
import { motion } from "framer-motion";
import { Mic2, Hammer, Briefcase, GraduationCap } from "lucide-react";
import { cn } from "../../lib/utils";

const STATS = [
  {
    id: 1,
    label: "Students Trained",
    value: "5,000+",
    subtext: "Across Nigerian Institutions",
    icon: GraduationCap,
    color: "text-primary",
    border: "border-primary/20",
  },
  {
    id: 2,
    label: "Expert Speakers",
    value: "10+",
    subtext: "Industry Leaders & Tech Evangelists",
    icon: Mic2,
    color: "text-secondary",
    border: "border-secondary/20",
  },
  {
    id: 3,
    label: "Hands-on Workshops",
    value: "15+",
    subtext: "ICT, Solar, & Entrepreneurship",
    icon: Hammer,
    color: "text-blue-400",
    border: "border-blue-400/20",
  },
  {
    id: 4,
    label: "Graduates Employed",
    value: "300+",
    subtext: "Meaningful Career Placements",
    icon: Briefcase,
    color: "text-green-400",
    border: "border-green-400/20",
  },
];

export const ImpactSection = () => {
  return (
    <section className="relative py-24 bg-[#060C2C]/70 overflow-hidden w-[99%] lg:w-[69%] mt-5 rounded-2xl">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

      <div className="container relative z-10 mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat, idx) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className={cn(
                "relative group p-8 rounded-[2rem] cursor-pointer",
                "bg-white/5 backdrop-blur-sm border",
                stat.border,
                "hover:bg-white/10 transition-all duration-500",
              )}
            >
              {/* Icon Circle */}
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-6",
                  "bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500",
                )}
              >
                <stat.icon className={cn("w-7 h-7", stat.color)} />
              </div>

              {/* Number and Label */}
              <div className="space-y-2">
                <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                  {stat.value}
                </h3>
                <div>
                  <p className="text-lg font-bold text-slate-200">
                    {stat.label}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">{stat.subtext}</p>
                </div>
              </div>

              {/* Decorative Accent Line */}
              <div
                className={cn(
                  "absolute bottom-0 left-8 right-8 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity",
                  stat.id === 1
                    ? "bg-primary"
                    : stat.id === 2
                      ? "bg-secondary"
                      : stat.id === 3
                        ? "bg-blue-400"
                        : "bg-green-400",
                )}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom Trust Message */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center mt-16 text-slate-500 text-sm font-medium tracking-widest uppercase"
        >
          Data verified by the DIUSCADI Academic Committee
        </motion.p>
      </div>
    </section>
  );
};
