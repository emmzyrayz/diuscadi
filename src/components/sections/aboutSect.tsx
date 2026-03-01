'use client'
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import { Target, Lightbulb, Users2, Rocket } from "lucide-react";
import mentor from "@/assets/img/downloads/Dr-Ikechukwu-Umeh-1440x1920.webp"

export const AboutSection = () => {
  return (
    <section className={cn("py-24", "bg-white", "overflow-hidden")}>
      <div className={cn("container", "mx-auto", "px-6")}>
        <div
          className={cn(
            "grid",
            "grid-cols-1",
            "lg:grid-cols-2",
            "gap-16",
            "items-center",
          )}
        >
          {/* LEFT SIDE: Image with Founder Glass Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative hover:scale-102 lg:hover:scale-105 duration-700 ease-in-out transition-all"
          >
            <div
              className={cn(
                "relative",
                "w-full",
                "aspect-4/5",
                "rounded-[2.5rem]",
                "overflow-hidden",
                "shadow-2xl",
              )}
            >
              <Image
                src={mentor}
                alt="Founder of DIUSCADI"
                fill
                className="object-cover"
              />
            </div>

            {/* Floating Glass Card - Founder Info */}
            <div
              className={cn(
                "absolute -bottom-8 -right-4 md:-right-8 p-6 max-w-xs rounded-2xl",
                "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl",
                "hover:bg-black/60 transition-all duration-500 group",
              )}
            >
              <p
                className={cn(
                  "text-white",
                  "font-bold",
                  "text-lg",
                  "leading-tight",
                )}
              >
                Dr. Ikechukwu Umeh
              </p>
              <p className={cn("text-white/70", "text-sm", "mt-1")}>
                Founder, DIUSCADI & Convener of LASCADSS
              </p>
              <div
                className={cn(
                  "mt-3",
                  "h-1",
                  "w-12",
                  "bg-primary",
                  "rounded-full",
                )}
              />
            </div>
          </motion.div>

          {/* RIGHT SIDE: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h4
                className={cn(
                  "text-primary",
                  "font-bold",
                  "tracking-widest",
                  "uppercase",
                  "text-sm",
                )}
              >
                What to expect at #LASCDSS5
              </h4>
              <h2
                className={cn(
                  "text-3xl",
                  "md:text-5xl",
                  "font-extrabold",
                  "text-foreground",
                  "leading-tight",
                )}
              >
                Turn Your Skills into Wealth for{" "}
                <span className="text-secondary">Life-After School</span>
              </h2>
              <p
                className={cn(
                  "text-muted-foreground",
                  "text-lg",
                  "leading-relaxed",
                )}
              >
                Life after tertiary education is definitely not a bed of roses.
                With the rising unemployment and a harsh labour market, many
                graduates find themselves unprepared. <strong>DIUSCADI</strong>{" "}
                was born to change that narrative.
              </p>
            </div>

            {/* Mission & Vision Grid */}
            <div
              className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-6")}
            >
              {/* Mission */}
              <div
                className={cn(
                  "p-6",
                  "rounded-2xl",
                  "bg-slate-50",
                  "border",
                  "border-slate-100",
                  "group scale-100 hover:scale-105 duration-800 transition-all ease-in-out",
                  "hover:border-primary/30 hover:scale-105",
                  "transition-colors",
                )}
              >
                <Target className={cn("w-8", "h-8", "text-primary", "mb-4")} />
                <h3
                  className={cn(
                    "font-bold",
                    "text-xl",
                    "mb-2",
                    "text-foreground",
                  )}
                >
                  Our Mission
                </h3>
                <p
                  className={cn(
                    "text-sm",
                    "text-muted-foreground",
                    "leading-relaxed",
                  )}
                >
                  To bridge the gap in transition from academia to
                  professionalism seamlessly via our Career Development Seminar
                  series.
                </p>
              </div>

              {/* Vision */}
              <div
                className={cn(
                  "p-6",
                  "rounded-2xl",
                  "bg-slate-50",
                  "border",
                  "border-slate-100",
                  "group scale-100 hover:scale-105 duration-800 transition-all ease-in-out ",
                  "hover:border-primary/30",
                  "transition-colors",
                )}
              >
                <Lightbulb
                  className={cn("w-8", "h-8", "text-primary", "mb-4")}
                />
                <h3
                  className={cn(
                    "font-bold",
                    "text-xl",
                    "mb-2",
                    "text-foreground",
                  )}
                >
                  Our Vision
                </h3>
                <p
                  className={cn(
                    "text-sm",
                    "text-muted-foreground",
                    "leading-relaxed",
                  )}
                >
                  To empower finalists and graduates to discover their hard and
                  soft skills early enough to become successful entrepreneurs.
                </p>
              </div>
            </div>

            {/* Why It Matters / Who We Help */}
            <div className={cn("flex", "flex-col", "gap-4", "pt-4")}>
              <div className={cn("flex", "items-start", "gap-4")}>
                <div
                  className={cn(
                    "mt-1",
                    "shrink-0",
                    "w-5",
                    "h-5",
                    "rounded-full",
                    "bg-green-100",
                    "flex",
                    "items-center",
                    "justify-center",
                    "text-green-600",
                  )}
                >
                  <Rocket className={cn("w-3", "h-3")} />
                </div>
                <p className={cn("text-muted-foreground", "text-sm")}>
                  <span className={cn("font-bold", "text-foreground")}>
                    Who we help:
                  </span>{" "}
                  Final year students and fresh graduates navigating the
                  universal workforce.
                </p>
              </div>
              <div className={cn("flex", "items-start", "gap-4")}>
                <div
                  className={cn(
                    "mt-1",
                    "shrink-0",
                    "w-5",
                    "h-5",
                    "rounded-full",
                    "bg-blue-100",
                    "flex",
                    "items-center",
                    "justify-center",
                    "text-blue-600",
                  )}
                >
                  <Users2 className={cn("w-3", "h-3")} />
                </div>
                <p className={cn("text-muted-foreground", "text-sm")}>
                  <span className={cn("font-bold", "text-foreground")}>
                    The Goal:
                  </span>{" "}
                  Transforming academic knowledge into employable hard skills
                  and entrepreneurial ventures.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
