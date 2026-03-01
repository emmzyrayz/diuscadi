'use client'
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import { GraduationCap, CalendarCheck } from "lucide-react";
// import mentor from "@/assets/img/downloads/Dr-Ikechukwu-Umeh-1440x1920.webp"
import student from "@/assets/img/downloads/Esther-Chiamaka.webp"

export const Hero = () => {
  return (
    <section
      className={cn(
        "relative",
        "min-h-[90vh] w-full",
        "flex",
        "items-center",
        "overflow-hidden",
        "bg-background",
        "pt-20",
        "pb-12",
      )}
    >
      {/* Background Decorative Glow (Matches the glass vibe) */}
      <div
        className={cn(
          "absolute",
          "top-0",
          "right-0",
          "-translate-y-1/2",
          "translate-x-1/4",
          "w-[500px]",
          "h-[500px]",
          "bg-primary/5",
          "rounded-full",
          "blur-[120px]",
          "-z-10",
        )}
      />

      <div
        className={cn(
          "container",
          "mx-auto",
          "px-6",
          "grid",
          "grid-cols-1",
          "lg:grid-cols-2",
          "gap-12",
          "items-center",
        )}
      >
        {/* LEFT CONTENT */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-left"
        >
          {/* Trust Badge */}
          <div
            className={cn(
              "inline-flex",
              "items-center",
              "gap-2",
              "px-3",
              "py-1",
              "rounded-full",
              "bg-primary/10",
              "border",
              "border-primary/20",
              "text-primary",
              "text-sm",
              "font-semibold",
              "mb-6",
            )}
          >
            <GraduationCap className={cn("w-4", "h-4")} />
            <span>Class of 2026 Initiative</span>
          </div>

          <h1
            className={cn(
              "text-4xl",
              "md:text-6xl",
              "font-bold",
              "text-foreground",
              "leading-[1.1]",
              "tracking-tight",
            )}
          >
            Equipping Students for <br />
            <span className="text-slate-400">Life Beyond</span> the Classroom
          </h1>

          <p
            className={cn(
              "mt-6",
              "text-lg",
              "md:text-xl",
              "text-muted-foreground",
              "max-w-xl",
              "leading-relaxed",
            )}
          >
            Practical workshops and mentorship designed to bridge the gap
            between academic theory and professional reality. Join 2,000+
            graduates navigating their next chapter.
          </p>

          <div className={cn("mt-10", "flex", "flex-wrap", "gap-4")}>
            <Button
              size="lg"
              className={cn(
                "h-12",
                "px-8",
                "text-base",
                "shadow-lg",
                "shadow-primary/20",
              )}
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              className={cn("h-12", "px-8", "text-base", "border-2")}
            >
              Learn More
            </Button>
          </div>

          {/* Trust Indicators (NGO Proof) */}
          <div
            className={cn(
              "mt-12",
              "pt-8",
              "border-t",
              "border-border",
              "flex",
              "items-center",
              "gap-8",
            )}
          >
            <div className={cn("flex", "flex-col")}>
              <span className={cn("text-2xl", "font-bold", "text-foreground")}>
                50+
              </span>
              <span className={cn("text-sm", "text-muted-foreground")}>
                Workshops Held
              </span>
            </div>
            <div className={cn("flex", "flex-col")}>
              <span className={cn("text-2xl", "font-bold", "text-foreground")}>
                120+
              </span>
              <span className={cn("text-sm", "text-muted-foreground")}>
                Expert Mentors
              </span>
            </div>
          </div>
        </motion.div>

        {/* RIGHT IMAGE AREA (With Glass Overlays) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={cn("relative", "group hover:scale-105 duration-700 ease-in-out transition-all")}
        >
          {/* The Main Hero Image */}
          <div
            className={cn(
              "relative",
              "w-full",
              "aspect-4/5",
              "md:aspect-square",
              "rounded-[2rem]",
              "overflow-hidden",
              "border-8",
              "border-white",
              "shadow-2xl",
            )}
          >
            <Image
              src={student} // Replace with image of students or mentor
              alt="Mentorship Session"
              fill
              className="object-cover "
              priority
            />
          </div>

          {/* Floating Glass Event Card (Matches your Banner Style) */}
          <div
            className={cn(
              "absolute -bottom-6 -left-5 lg:-left-12 p-5 rounded-2xl transition-all duration-300",
              "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl",
              "hover:bg-black/40 group-hover:scale-105", // Darkens on hover to boost readability
            )}
          >
            <div className={cn("flex", "items-center cursor-pointer", "gap-4")}>
              <div
                className={cn(
                  "p-3",
                  "bg-primary/20",
                  "rounded-lg",
                  "text-primary",
                )}
              >
                <CalendarCheck className={cn("w-6", "h-6")} />
              </div>
              <div>
                <p
                  className={cn(
                    "text-xs",
                    "font-semibold",
                    "text-white/70",
                    "uppercase",
                    "tracking-wider",
                  )}
                >
                  Next Seminar
                </p>
                <p className={cn("text-white", "font-bold")}>
                  Interview Mastery 2026
                </p>
              </div>
            </div>
          </div>

          {/* Decorative Ring */}
          <div
            className={cn(
              "absolute",
              "-top-6",
              "-right-6",
              "w-32",
              "h-32",
              "border-12",
              "border-secondary/20",
              "rounded-full",
              "-z-10",
            )}
          />
        </motion.div>
      </div>
    </section>
  );
};
