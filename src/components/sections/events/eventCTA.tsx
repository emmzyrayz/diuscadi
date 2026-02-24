"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { LuMail, LuSend, LuCircleCheck, LuBellRing } from "react-icons/lu";
import { cn } from "@/lib/utils";

export const NewsletterOrCTA = () => {
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
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
        "py-20",
      )}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className={cn(
          "relative",
          "overflow-hidden",
          "bg-slate-950",
          "rounded-[3rem]",
          "p-8",
          "md:p-16",
          "text-center",
        )}
      >
        {/* Decorative Background Glows */}
        <div
          className={cn(
            "absolute",
            "top-0",
            "left-1/4",
            "w-64",
            "h-64",
            "bg-primary/20",
            "rounded-full",
            "blur-[100px]",
            "pointer-events-none",
          )}
        />
        <div
          className={cn(
            "absolute",
            "bottom-0",
            "right-1/4",
            "w-64",
            "h-64",
            "bg-blue-600/10",
            "rounded-full",
            "blur-[100px]",
            "pointer-events-none",
          )}
        />

        <div className={cn("relative", "z-10", "max-w-2xl", "mx-auto")}>
          <div
            className={cn(
              "inline-flex",
              "p-3",
              "bg-white/10",
              "backdrop-blur-md",
              "rounded-2xl",
              "mb-6",
              "text-primary",
            )}
          >
            <LuBellRing className={cn("w-6", "h-6", "animate-bounce")} />
          </div>

          <h2
            className={cn(
              "text-3xl",
              "md:text-5xl",
              "font-black",
              "text-white",
              "mb-4",
              "tracking-tighter",
            )}
          >
            Never miss an{" "}
            <span className={cn("text-primary", "text-glow")}>Event.</span>
          </h2>

          <p
            className={cn(
              "text-slate-400",
              "text-base",
              "md:text-lg",
              "mb-10",
              "font-medium",
            )}
          >
            Join 10,000+ professionals getting weekly updates on workshops,
            networking mixers, and career mentorship programs.
          </p>

          {!subscribed ? (
            <form
              onSubmit={handleSubscribe}
              className={cn(
                "flex",
                "flex-col",
                "md:flex-row",
                "gap-3",
                "p-2",
                "bg-white/5",
                "border",
                "border-white/10",
                "rounded-[2rem]",
                "backdrop-blur-sm",
              )}
            >
              <div className={cn("flex-1", "relative")}>
                <LuMail
                  className={cn(
                    "absolute",
                    "left-5",
                    "top-1/2",
                    "-translate-y-1/2",
                    "text-slate-500",
                    "w-5",
                    "h-5",
                  )}
                />
                <input
                  required
                  type="email"
                  placeholder="Enter your professional email"
                  className={cn(
                    "w-full",
                    "pl-14",
                    "pr-4",
                    "py-4",
                    "bg-transparent",
                    "text-white",
                    "placeholder:text-slate-500",
                    "focus:outline-none",
                    "text-sm",
                    "font-bold",
                  )}
                />
              </div>
              <button
                type="submit"
                className={cn(
                  "px-8",
                  "py-4",
                  "bg-primary",
                  "hover:bg-orange-600",
                  "text-white",
                  "font-black",
                  "rounded-[1.5rem]",
                  "transition-all",
                  "flex",
                  "items-center",
                  "justify-center",
                  "gap-2",
                  "group",
                )}
              >
                Subscribe Now
                <LuSend
                  className={cn(
                    "w-4",
                    "h-4",
                    "group-hover:translate-x-1",
                    "group-hover:-translate-y-1",
                    "transition-transform",
                  )}
                />
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex",
                "items-center",
                "justify-center",
                "gap-3",
                "py-4",
                "text-emerald-400",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-sm",
              )}
            >
              <LuCircleCheck className={cn("w-6", "h-6")} />
              You&apos;re on the list!
            </motion.div>
          )}

          <p
            className={cn(
              "mt-6",
              "text-[10px]",
              "text-slate-500",
              "font-bold",
              "uppercase",
              "tracking-widest",
            )}
          >
            No spam. Only high-value career opportunities.
          </p>
        </div>
      </motion.div>
    </section>
  );
};
