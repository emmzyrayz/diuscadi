"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuSearch, LuTicket, LuArrowRight, LuSparkles } from "react-icons/lu";
import Link from "next/link";
import { cn } from "../../../lib/utils";

export const EmptyState = () => {
  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'py-20')}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn('bg-white', 'border-2', 'border-dashed', 'border-slate-200', 'rounded-[3rem]', 'p-12', 'md:p-20', 'flex', 'flex-col', 'items-center', 'text-center')}
      >
        {/* 1. Illustration Area */}
        <div className={cn('relative', 'mb-8')}>
          <div className={cn('w-24', 'h-24', 'bg-slate-50', 'rounded-full', 'flex', 'items-center', 'justify-center', 'relative', 'z-10')}>
            <LuTicket className={cn('w-12', 'h-12', 'text-slate-200', '-rotate-12')} />
          </div>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, 0],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className={cn('absolute', '-top-2', '-right-2', 'w-8', 'h-8', 'bg-primary/10', 'text-primary', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'z-20')}
          >
            <LuSparkles className={cn('w-4', 'h-4')} />
          </motion.div>
        </div>

        {/* 2. Text Content */}
        <div className={cn('max-w-md', 'space-y-4', 'mb-10')}>
          <h2 className={cn('text-2xl', 'md:text-3xl', 'font-black', 'text-slate-900', 'tracking-tight')}>
            No tickets found yet.
          </h2>
          <p className={cn('text-slate-500', 'font-medium', 'leading-relaxed')}>
            It looks like you haven&apos;t registered for any events yet, or
            your current filters don&apos;t match any tickets. Ready to start
            your journey?
          </p>
        </div>

        {/* 3. Primary Action */}
        <div className={cn('flex', 'flex-col', 'sm:flex-row', 'items-center', 'gap-4')}>
          <Link
            href="/events"
            className={cn('px-8', 'py-4', 'bg-slate-900', 'text-white', 'font-black', 'rounded-2xl', 'flex', 'items-center', 'gap-3', 'hover:bg-primary', 'transition-all', 'shadow-xl', 'shadow-slate-900/10', 'group')}
          >
            Explore Events
            <LuArrowRight className={cn('w-5', 'h-5', 'group-hover:translate-x-1', 'transition-transform')} />
          </Link>

          <button className={cn('px-8', 'py-4', 'bg-white', 'border-2', 'border-slate-100', 'text-slate-600', 'font-bold', 'rounded-2xl', 'hover:border-slate-300', 'transition-all', 'flex', 'items-center', 'gap-2')}>
            <LuSearch className={cn('w-4', 'h-4')} />
            Clear All Filters
          </button>
        </div>

        {/* 4. Help Footer */}
        <p className={cn('mt-12', 'text-[10px]', 'font-black', 'uppercase', 'tracking-[0.2em]', 'text-slate-300')}>
          Need help?{" "}
          <a href="#" className={cn('text-primary', 'hover:underline')}>
            Contact Support
          </a>
        </p>
      </motion.div>
    </section>
  );
};
