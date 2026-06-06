"use client";
import { cn } from "../../lib/utils";
import { motion, Variants } from "framer-motion";
import Image from "next/image";
import { Target, Rocket, BookOpen, Globe, ArrowUpRight } from "lucide-react";
import mentor from "@/assets/img/downloads/Dr-Ikechukwu-Umeh-1440x1920.png";

const CARD_DATA = [
  {
    icon: BookOpen,
    title: "Digital Skills & ICT",
    desc: "Practical technical training for the modern market.",
    color: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-500",
  },
  {
    icon: Target,
    title: "Career & Mentorship",
    desc: "Bridging classroom learning with industry professionals.",
    color: "from-purple-500/10 to-indigo-500/10",
    iconColor: "text-purple-500",
  },
  {
    icon: Rocket,
    title: "Startup Support",
    desc: "Incubating business ideas and youth entrepreneurship.",
    color: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-500",
  },
  {
    icon: Globe,
    title: "Wealth Creation",
    desc: "Financial literacy for sustainable independent living.",
    color: "from-emerald-500/10 to-green-500/10",
    iconColor: "text-emerald-500",
  },
];

// Framer Motion Variants for Staggered Layout
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } as const,
};

const iconVariants = {
  rest: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.15,
    rotate: 8,
    transition: { type: "spring", stiffness: 300 } as const,
  },
};

export const AboutSection = () => {
  return (
    <section
      className={cn("w-full rounded-2xl py-24 bg-background overflow-hidden")}
    >
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* LEFT: Founder image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative w-full aspect-4/5 rounded-[2.5rem] overflow-hidden shadow-2xl group">
              <Image
                src={mentor}
                alt="Prof. Ikechukwu I. Umeh, Founder of DIUSCADI"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            <div className="absolute -bottom-8 -right-4 md:-right-8 p-6 max-w-xs rounded-2xl bg-background/10 backdrop-blur-xl border border-background/20 shadow-2xl transition-all duration-500 bg-neutral-900/80">
              <p className="text-white font-bold text-lg leading-tight">
                Prof. Ikechukwu Umeh
              </p>
              <p className="text-white/50 text-xs mt-1">
                Professor of Information Technology and Data Science, UNIZIK
              </p>
              <p className="text-white/70 text-sm mt-1">
                FNCS, FIPMD · Founder & Convener, DIUSCADI
              </p>
              <div className="mt-3 h-1 w-12 bg-primary rounded-full" />
            </div>
          </motion.div>

          {/* RIGHT: Content with Summarized Layout & Animations */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-primary font-bold tracking-widest uppercase text-sm">
                Founded 2020 · UNIZIK, Awka
              </h4>
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight">
                Turn Your Skills into Wealth for{" "}
                <span className="text-primary">Life After School</span>
              </h2>
              {/* The Summarized Sentence */}
              <p className="text-muted-foreground text-lg leading-relaxed">
                DIUSCADI bridges the gap between academia and industry—equipping
                final-year students and fresh graduates with the practical
                digital skills, mentorship, and entrepreneurial support needed
                to build sustainable wealth.
              </p>
            </div>

            {/* Animated Layout Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {CARD_DATA.map((card, idx) => {
                const IconComponent = card.icon;
                return (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    initial="rest"
                    whileHover="hover"
                    className={cn(
                      "p-5 rounded-2xl border border-border bg-gradient-to-br transition-colors duration-300 relative overflow-hidden group hover:border-primary/40",
                      card.color,
                    )}
                  >
                    <div className="flex items-start justify-between">
                      {/* Animated Icon Wrapper */}
                      <motion.div
                        variants={iconVariants}
                        className={cn(
                          "p-3 rounded-xl bg-background shadow-sm border border-border/50",
                          card.iconColor,
                        )}
                      >
                        <IconComponent className="w-6 h-6" />
                      </motion.div>

                      <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                    </div>

                    <h3 className="font-bold text-base mt-4 text-foreground group-hover:text-primary transition-colors duration-300">
                      {card.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {card.desc}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Micro KPI Callout */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-xs text-muted-foreground font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Empowering the Next Generation:{" "}
              <strong className="text-foreground">
                5,000+ Students Trained
              </strong>{" "}
              since 2020.
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
