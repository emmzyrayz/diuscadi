"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuCalendar, LuArrowRight, LuCirclePlay } from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";

export interface FeaturedEvent {
  image: string;
  title: string;
  category?: string;
  daysLeft?: number;
  date?: string;
  slug?: string;
}

export interface CurrentTask {
  category: string;
  title: string;
  progress: number;
}

interface HomeHeroProps {
  featuredEvent: FeaturedEvent;
  currentTask: CurrentTask;
}

export const HomeHero = ({ featuredEvent, currentTask }: HomeHeroProps) => {
  const router = useRouter();

  const handleRegister = () => {
    if (featuredEvent.slug)
      router.push(`/events/${featuredEvent.slug}/register`);
    else router.push("/events");
  };

  const handleDetails = () => {
    if (featuredEvent.slug) router.push(`/events/${featuredEvent.slug}`);
    else router.push("/events");
  };

  return (
    <section
      className={cn(
        "w-full",
        "max-w-7xl",
        "mx-auto",
        "px-4",
        "sm:px-6",
        "lg:px-8",
        "py-8",
      )}
    >
      <div className={cn("grid", "grid-cols-1", "lg:grid-cols-3", "gap-6")}>
        {/* Featured Event */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "lg:col-span-2",
            "relative",
            "group",
            "overflow-hidden",
            "rounded-[2.5rem]",
            "bg-foreground",
            "min-h-[320px]",
            "flex",
            "flex-col",
            "justify-end",
            "p-8",
            "md:p-10",
          )}
        >
          <Image
            src={featuredEvent.image}
            alt={featuredEvent.title}
            fill
            className={cn(
              "absolute",
              "inset-0",
              "object-cover",
              "opacity-40",
              "group-hover:scale-105",
              "transition-transform",
              "duration-700",
              "ease-in-out",
            )}
          />
          <div
            className={cn(
              "absolute",
              "inset-0",
              "bg-gradient-to-t",
              "from-slate-950",
              "via-slate-950/60",
              "to-transparent",
            )}
          />

          <div className={cn("relative", "z-10")}>
            <div className={cn("flex", "items-center", "gap-3", "mb-4")}>
              <span
                className={cn(
                  "px-3",
                  "py-1",
                  "bg-primary",
                  "text-background",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "rounded-full",
                )}
              >
                {featuredEvent.category ?? "Upcoming Event"}
              </span>
              {featuredEvent.daysLeft != null && (
                <span
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-1.5",
                    "text-orange-200",
                    "text-sm",
                    "font-bold",
                  )}
                >
                  <LuCalendar className={cn("w-4", "h-4")} />
                  Starts in {featuredEvent.daysLeft} days
                </span>
              )}
            </div>

            <h2
              className={cn(
                "text-3xl",
                "md:text-4xl",
                "font-black",
                "text-background",
                "mb-6",
                "leading-tight",
              )}
            >
              {featuredEvent.title}
            </h2>

            <div className={cn("flex", "flex-wrap", "gap-4")}>
              <button
                onClick={handleRegister}
                className={cn(
                  "px-8",
                  "py-3.5",
                  "bg-background",
                  "text-slate-950",
                  "font-black",
                  "rounded-2xl",
                  "hover:bg-primary",
                  "hover:text-background",
                  "transition-all",
                  "duration-700",
                  "ease-in-out",
                  "cursor-pointer",
                  "flex",
                  "items-center",
                  "gap-2",
                  "group/btn",
                )}
              >
                Register Now
                <LuArrowRight
                  className={cn(
                    "w-4",
                    "h-4",
                    "group-hover/btn:translate-x-1",
                    "transition-transform",
                  )}
                />
              </button>
              <button
                onClick={handleDetails}
                className={cn(
                  "px-6",
                  "py-3.5",
                  "bg-background/10",
                  "backdrop-blur-md",
                  "text-background",
                  "font-bold",
                  "rounded-2xl",
                  "cursor-pointer",
                  "border",
                  "border-background/20",
                  "hover:bg-background/20",
                  "transition-all",
                )}
              >
                Event Details
              </button>
            </div>
          </div>
        </motion.div>

        {/* Continue Learning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "bg-background",
            "border",
            "border-border",
            "rounded-[2.5rem]",
            "p-8",
            "flex",
            "flex-col",
            "shadow-sm",
          )}
        >
          <div
            className={cn("flex", "items-center", "justify-between", "mb-8")}
          >
            <h3
              className={cn(
                "font-bold",
                "text-foreground",
                "uppercase",
                "tracking-tighter",
                "text-sm",
              )}
            >
              Resume Learning
            </h3>
            <LuCirclePlay className={cn("text-primary", "w-6", "h-6")} />
          </div>

          <div className="mb-auto">
            <span
              className={cn(
                "text-[10px]",
                "font-bold",
                "text-muted-foreground",
                "uppercase",
              )}
            >
              {currentTask.category}
            </span>
            <h4
              className={cn(
                "text-xl",
                "font-black",
                "text-foreground",
                "mt-1",
                "mb-6",
              )}
            >
              {currentTask.title}
            </h4>
            <div className="space-y-3">
              <div
                className={cn(
                  "flex",
                  "justify-between",
                  "text-sm",
                  "font-bold",
                )}
              >
                <span className="text-muted-foreground">Progress</span>
                <span className="text-primary">{currentTask.progress}%</span>
              </div>
              <div
                className={cn(
                  "h-3",
                  "w-full",
                  "text-muted",
                  "rounded-full",
                  "overflow-hidden",
                )}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentTask.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "h-full",
                    "bg-gradient-to-r",
                    "from-orange-400",
                    "to-primary",
                    "rounded-full",
                    "shadow-[0_0_12px_rgba(249,115,22,0.3)]",
                  )}
                />
              </div>
            </div>
          </div>

          {/* TODO: wire to real learning module path when learning system is built */}
          <button
            className={cn(
              "mt-8",
              "w-full",
              "py-4",
              "bg-muted",
              "hover:bg-primary",
              "hover:text-background",
              "text-foreground",
              "font-bold",
              "rounded-2xl",
              "transition-all",
              "duration-700",
              "ease-in-out",
              "cursor-pointer",
              "flex",
              "items-center",
              "justify-center",
              "gap-2",
              "group",
            )}
          >
            Continue Module
            <LuCirclePlay
              className={cn(
                "w-4",
                "h-4",
                "group-hover:scale-110",
                "transition-transform",
              )}
            />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
