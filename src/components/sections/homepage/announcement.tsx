"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuMegaphone, LuInfo, LuSparkles, LuArrowRight } from "react-icons/lu";
import { cn } from "@/lib/utils";

const news = [
  {
    id: 1,
    title: "DevFest Lagos 2026 Schedule Released!",
    desc: "The full lineup of speakers and workshop tracks is now live. Check your track.",
    type: "Update",
    icon: <LuMegaphone className={cn('w-5', 'h-5')} />,
    color: "bg-blue-600",
    lightColor: "bg-blue-50",
    borderColor: "border-blue-100",
  },
  {
    id: 2,
    title: "New Career Mentorship Program",
    desc: "Applications are now open for the Q2 Senior Executive Mentorship cohort.",
    type: "New",
    icon: <LuSparkles className={cn('w-5', 'h-5')} />,
    color: "bg-orange-600",
    lightColor: "bg-orange-50",
    borderColor: "border-orange-100",
  },
  {
    id: 3,
    title: "Platform Maintenance Notice",
    desc: "The portal will be offline for 2 hours this Sunday for security upgrades.",
    type: "Alert",
    icon: <LuInfo className={cn('w-5', 'h-5')} />,
    color: "bg-slate-900",
    lightColor: "bg-slate-50",
    borderColor: "border-slate-200",
  },
];

export const Announcements = () => {
  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mt-16')}>
      <div className={cn('flex', 'items-center', 'gap-3', 'mb-8')}>
        <h3 className={cn('text-xl', 'font-black', 'text-slate-900', 'uppercase', 'tracking-tighter')}>
          Community Updates
        </h3>
        <span className={cn('px-2', 'py-0.5', 'bg-red-100', 'text-red-600', 'text-[10px]', 'font-bold', 'rounded-md', 'animate-pulse')}>
          3 NEW
        </span>
      </div>

      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6')}>
        {news.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "group p-6 rounded-[2rem] border bg-white flex flex-col h-full transition-all duration-300",
              "hover:shadow-xl hover:shadow-slate-200/40",
              item.borderColor,
            )}
          >
            <div className={cn('flex', 'items-start', 'justify-between', 'mb-6')}>
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20",
                  item.color,
                )}
              >
                {item.icon}
              </div>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  item.lightColor,
                  item.color.replace("bg-", "text-"),
                )}
              >
                {item.type}
              </span>
            </div>

            <div className="flex-1">
              <h4 className={cn('text-lg', 'font-bold', 'text-slate-900', 'mb-2', 'leading-tight', 'group-hover:text-primary', 'transition-colors')}>
                {item.title}
              </h4>
              <p className={cn('text-sm', 'text-slate-500', 'leading-relaxed')}>
                {item.desc}
              </p>
            </div>

            <button className={cn('mt-6', 'flex', 'items-center', 'gap-2', 'text-sm', 'font-bold', 'text-slate-900', 'group-hover:text-primary', 'transition-all')}>
              Read More
              <LuArrowRight className={cn('w-4', 'h-4', 'group-hover:translate-x-1', 'transition-transform')} />
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
