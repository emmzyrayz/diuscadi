"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuPlay,
  LuClipboardCheck,
  LuUserPlus,
  LuChevronRight,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

const continueItems = [
  {
    type: "Learning",
    title: "Resume: Effective Networking for introverts",
    status: "65% Complete",
    icon: <LuPlay className={cn('w-5', 'h-5')} />,
    color: "bg-orange-500",
    link: "/learning/module-4",
    action: "Resume Video",
  },
  {
    type: "Registration",
    title: "Finish: Abuja Career Summit 2026",
    status: "Step 2 of 3",
    icon: <LuClipboardCheck className={cn('w-5', 'h-5')} />,
    color: "bg-blue-600",
    link: "/events/abuja-summit/register",
    action: "Complete Registration",
  },
  {
    type: "Application",
    title: "Pending: Mentor Match Request",
    status: "Awaiting your input",
    icon: <LuUserPlus className={cn('w-5', 'h-5')} />,
    color: "bg-purple-600",
    link: "/mentorship/apply",
    action: "Continue App",
  },
];

export const ContinueSection = () => {
  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mt-12')}>
      <div className={cn('flex', 'items-center', 'justify-between', 'mb-6')}>
        <h3 className={cn('text-lg', 'font-black', 'text-slate-900', 'flex', 'items-center', 'gap-2')}>
          Keep it going
          <span className={cn('w-2', 'h-2', 'rounded-full', 'bg-primary', 'animate-pulse')} />
        </h3>
        <button className={cn('text-sm', 'font-bold', 'text-primary', 'hover:underline', 'flex', 'items-center', 'gap-1 cursor-pointer')}>
          View all tasks <LuChevronRight className={cn('w-4', 'h-4')} />
        </button>
      </div>

      {/* Container with horizontal scroll on mobile */}
      <div className={cn('flex', 'overflow-x-auto', 'pb-4', 'gap-4', 'no-scrollbar', 'lg:grid', 'lg:grid-cols-3', 'lg:overflow-visible')}>
        {continueItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "min-w-[300px] lg:min-w-0 bg-white border border-slate-100 rounded-3xl p-6",
              "hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group",
            )}
          >
            <div className={cn('flex', 'items-start', 'justify-between', 'mb-4')}>
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
                  item.color,
                )}
              >
                {item.icon}
              </div>
              <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400', 'bg-slate-50', 'px-2', 'py-1', 'rounded-md')}>
                {item.type}
              </span>
            </div>

            <div className="mb-6">
              <h4 className={cn('text-base', 'font-bold', 'text-slate-900', 'group-hover:text-primary', 'transition-colors', 'leading-tight', 'mb-2')}>
                {item.title}
              </h4>
              <p className={cn('text-xs', 'font-semibold', 'text-slate-500')}>
                {item.status}
              </p>
            </div>

            <a
              href={item.link}
              className={cn(
                "flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm",
                "bg-slate-900 text-white hover:bg-primary transition-all active:scale-95",
              )}
            >
              {item.action}
              <LuChevronRight className={cn('w-4', 'h-4')} />
            </a>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
