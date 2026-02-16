"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuUsers,
  LuHeartHandshake,
  LuRocket,
  LuArrowRight,
  LuGift,
  LuShieldCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

const ctaCards = [
  {
    title: "Become a Mentor",
    desc: "Share your professional journey and guide the next generation of tech talent.",
    icon: <LuUsers className={cn('w-8', 'h-8')} />,
    cta: "Apply to Lead",
    variant: "orange",
    gridSpan: "md:col-span-2",
  },
  {
    title: "Sponsor a Student",
    desc: "Help fund a student's participation in our advanced career tracks.",
    icon: <LuHeartHandshake className={cn('w-8', 'h-8')} />,
    cta: "Support Now",
    variant: "blue",
    gridSpan: "md:col-span-1",
  },
];

export const HomeCTAOptional = () => {
  return (
    <section
      className={cn(
        "w-full",
        "max-w-7xl",
        "mx-auto",
        "px-4",
        "sm:px-6",
        "lg:px-8",
        "mt-16",
        "mb-20",
        "space-y-6",
      )}
    >
      {/* NEW: Referral & Upgrade Row */}
      <div className={cn("grid", "grid-cols-1", "lg:grid-cols-2", "gap-6")}>
        {/* Refer a Friend Banner */}
        <motion.div
          whileHover={{ x: 5 }}
          className={cn(
            "flex",
            "items-center",
            "justify-between",
            "p-6",
            "bg-emerald-50",
            "border",
            "border-emerald-100",
            "rounded-[2rem]",
            "group",
            "cursor-pointer",
            "transition-all",
          )}
        >
          <div className={cn("flex", "items-center", "gap-4")}>
            <div
              className={cn(
                "w-12",
                "h-12",
                "bg-emerald-500",
                "rounded-2xl",
                "flex",
                "items-center",
                "justify-center",
                "text-white",
                "shadow-lg",
                "shadow-emerald-200",
              )}
            >
              <LuGift className={cn("w-6", "h-6")} />
            </div>
            <div>
              <h4 className={cn("font-black", "text-slate-900")}>
                Refer a Friend
              </h4>
              <p className={cn("text-xs", "font-bold", "text-emerald-700")}>
                Get 200 Career Points for every invite
              </p>
            </div>
          </div>
          <LuArrowRight
            className={cn(
              "w-5",
              "h-5",
              "text-emerald-400",
              "group-hover:translate-x-1",
              "transition-transform",
            )}
          />
        </motion.div>

        {/* Upgrade Profile Banner */}
        <motion.div
          whileHover={{ x: 5 }}
          className={cn(
            "flex",
            "items-center",
            "justify-between",
            "p-6",
            "bg-purple-50",
            "border",
            "border-purple-100",
            "rounded-[2rem]",
            "group",
            "cursor-pointer",
            "transition-all",
          )}
        >
          <div className={cn("flex", "items-center", "gap-4")}>
            <div
              className={cn(
                "w-12",
                "h-12",
                "bg-purple-600",
                "rounded-2xl",
                "flex",
                "items-center",
                "justify-center",
                "text-white",
                "shadow-lg",
                "shadow-purple-200",
              )}
            >
              <LuShieldCheck className={cn("w-6", "h-6")} />
            </div>
            <div>
              <h4 className={cn("font-black", "text-slate-900")}>
                Verify Profile
              </h4>
              <p className={cn("text-xs", "font-bold", "text-purple-700")}>
                Unlock Exclusive Mentor sessions
              </p>
            </div>
          </div>
          <LuArrowRight
            className={cn(
              "w-5",
              "h-5",
              "text-purple-400",
              "group-hover:translate-x-1",
              "transition-transform",
            )}
          />
        </motion.div>
      </div>

      {/* Existing High-Impact Grid */}
      <div className={cn("grid", "grid-cols-1", "md:grid-cols-3", "gap-6")}>
        {ctaCards.map((card, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -8 }}
            className={cn(
              "relative overflow-hidden rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between min-h-[280px]",
              card.gridSpan,
              card.variant === "orange" &&
                "bg-linear-to-br from-orange-500 to-primary text-white",
              card.variant === "blue" &&
                "bg-linear-to-br from-blue-600 to-indigo-700 text-white",
            )}
          >
            <div
              className={cn(
                "absolute",
                "top-0",
                "right-0",
                "-mr-16",
                "-mt-16",
                "w-64",
                "h-64",
                "bg-white/10",
                "rounded-full",
                "blur-3xl",
              )}
            />

            <div className={cn("relative", "z-10")}>
              <div
                className={cn(
                  "mb-6",
                  "inline-flex",
                  "p-3",
                  "bg-white/20",
                  "backdrop-blur-md",
                  "rounded-2xl",
                )}
              >
                {card.icon}
              </div>
              <h3
                className={cn(
                  "text-2xl",
                  "md:text-3xl",
                  "font-black",
                  "mb-3",
                  "leading-tight",
                )}
              >
                {card.title}
              </h3>
              <p className={cn("text-white/80", "font-medium", "max-w-md")}>
                {card.desc}
              </p>
            </div>

            <div className={cn("relative", "z-10", "mt-8")}>
              <button
                className={cn(
                  "group",
                  "flex",
                  "items-center",
                  "gap-2",
                  "px-6",
                  "py-3",
                  "rounded-xl",
                  "font-black",
                  "text-sm",
                  "bg-white",
                  "text-slate-900",
                  "hover:bg-slate-100",
                  "transition-all duration-700 ease-in-out cursor-pointer",
                )}
              >
                {card.cta}
                <LuArrowRight
                  className={cn(
                    "w-4",
                    "h-4",
                    "group-hover:translate-x-1",
                    "transition-transform",
                  )}
                />
              </button>
            </div>
          </motion.div>
        ))}

        {/* Featured Full-Width Card at the bottom */}
        <motion.div
          whileHover={{ y: -8 }}
          className={cn(
            "md:col-span-3",
            "bg-slate-950",
            "rounded-[2.5rem]",
            "p-8",
            "md:p-10",
            "flex",
            "flex-col",
            "md:flex-row",
            "items-center",
            "justify-between",
            "gap-6",
            "border",
            "border-slate-800",
          )}
        >
          <div className={cn("flex", "items-center", "gap-6")}>
            <div
              className={cn(
                "hidden",
                "md:flex",
                "w-16",
                "h-16",
                "bg-primary",
                "rounded-3xl",
                "items-center",
                "justify-center",
                "text-white",
                "shrink-0",
              )}
            >
              <LuRocket className={cn("w-8", "h-8")} />
            </div>
            <div className={cn("text-center", "md:text-left")}>
              <h3
                className={cn("text-2xl", "font-black", "text-white", "mb-2")}
              >
                Advanced Fellowship
              </h3>
              <p className={cn("text-slate-400", "max-w-md")}>
                Ready for more? Join our 6-month intensive leadership and
                technical program.
              </p>
            </div>
          </div>
          <button
            className={cn(
              "w-full",
              "md:w-auto",
              "px-8",
              "py-4",
              "bg-primary",
              "text-white",
              "font-black",
              "rounded-2xl",
              "hover:bg-orange-600",
              "transition-all duration-700 ease-in-out cursor-pointer",
            )}
          >
            Explore Programs
          </button>
        </motion.div>
      </div>
    </section>
  );
};
