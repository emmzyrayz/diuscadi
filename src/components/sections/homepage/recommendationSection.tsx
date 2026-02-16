"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuSparkles,
  LuBookOpen,
  LuCalendar,
  LuCirclePlay,
  LuStar,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

const recommendations = [
  {
    type: "Program",
    title: "Advanced React Patterns for Enterprise",
    meta: "8 Modules • 12 hours",
    icon: <LuCirclePlay className={cn("w-4", "h-4")} />,
    tag: "Matches your Skill",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    type: "Event",
    title: "Tech Career Fair: Hybrid Edition",
    meta: "Virtual • March 20, 2026",
    icon: <LuCalendar className={cn("w-4", "h-4")} />,
    tag: "Popular in Tech",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
  {
    type: "Resource",
    title: "2026 Salary Guide: Nigeria Tech",
    meta: "PDF Guide • 15 Pages",
    icon: <LuBookOpen className={cn("w-4", "h-4")} />,
    tag: "New Resource",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
];

export const RecommendedSection = () => {
  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mt-16')}>
      <div className={cn('flex', 'items-center', 'gap-2', 'mb-8')}>
        <div className={cn('p-2', 'bg-primary/10', 'rounded-lg')}>
          <LuSparkles className={cn('text-primary', 'w-5', 'h-5')} />
        </div>
        <div>
          <h3 className={cn('text-xl', 'font-black', 'text-slate-900', 'leading-none')}>
            Recommended for you
          </h3>
          <p className={cn('text-sm', 'text-slate-500', 'mt-1')}>
            Based on your interests in Web Dev & Tech
          </p>
        </div>
      </div>

      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-6')}>
        {recommendations.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className={cn('group', 'relative', 'bg-white', 'border', 'border-slate-100', 'rounded-[2rem]', 'p-2', 'shadow-sm', 'hover:shadow-xl', 'hover:shadow-slate-200/50', 'transition-all', 'duration-300')}
          >
            {/* Inner Content Container */}
            <div className="p-6">
              <div className={cn('flex', 'justify-between', 'items-start', 'mb-6')}>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    item.bg,
                    item.color,
                    item.border,
                  )}
                >
                  {item.type}
                </span>
                <LuStar className={cn('text-slate-200', 'group-hover:text-primary', 'transition-colors', 'cursor-pointer')} />
              </div>

              <h4 className={cn('text-lg', 'font-bold', 'text-slate-900', 'group-hover:text-primary', 'transition-colors', 'mb-2', 'line-clamp-2')}>
                {item.title}
              </h4>

              <div className={cn('flex', 'items-center', 'gap-2', 'text-slate-400', 'text-xs', 'font-medium', 'mb-6')}>
                {item.icon}
                {item.meta}
              </div>

              <div className={cn('pt-4', 'border-t', 'border-slate-50', 'flex', 'items-center', 'justify-between')}>
                <span className={cn('text-[10px]', 'font-bold', 'text-slate-400', 'uppercase', 'italic')}>
                  {item.tag}
                </span>
                <button className={cn('p-2', 'bg-slate-50', 'group-hover:bg-primary', 'group-hover:text-white', 'rounded-full', 'transition-all')}>
                  <LuSparkles className={cn('w-4', 'h-4')} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
