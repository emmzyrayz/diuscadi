"use client";
import React from "react";
import {
  LuInfo,
  LuMessageCircle,
  LuFileQuestion,
  LuArrowRight,
} from "react-icons/lu";
import Link from "next/link";
import { cn } from "../../../../lib/utils";

export const HelpSection = () => {
  return (
    <section className={cn('w-full', 'mt-12', 'mb-20')}>
      <div className={cn('bg-slate-900', 'rounded-[2.5rem]', 'p-8', 'md:p-12', 'overflow-hidden', 'relative', 'group')}>
        {/* Decorative Background Icon */}
        <LuInfo className={cn('absolute', '-right-8', '-bottom-8', 'w-64', 'h-64', 'text-white/5', '-rotate-12', 'pointer-events-none', 'group-hover:rotate-0', 'transition-transform', 'duration-700')} />

        <div className={cn('relative', 'z-10', 'flex', 'flex-col', 'md:flex-row', 'items-center', 'justify-between', 'gap-10')}>
          <div className={cn('max-w-md', 'text-center', 'md:text-left', 'space-y-4')}>
            <h3 className={cn('text-2xl', 'md:text-3xl', 'font-black', 'text-white', 'tracking-tight')}>
              Need help with <br className={cn('hidden', 'md:block')} /> your ticket?
            </h3>
            <p className={cn('text-slate-400', 'text-sm', 'font-medium', 'leading-relaxed')}>
              If you&apos;re having trouble with your QR code, need to update your
              details, or can&apos;t find the venue, our team is here to help 24/7.
            </p>
          </div>

          <div className={cn('flex', 'flex-col', 'sm:flex-row', 'items-center', 'gap-4', 'w-full', 'md:w-auto')}>
            {/* Primary Action: Support */}
            <button className={cn('w-full', 'sm:w-auto', 'flex', 'items-center', 'justify-center', 'gap-3', 'px-8', 'py-4', 'bg-primary', 'text-white', 'rounded-2xl', 'font-black', 'text-xs', 'uppercase', 'tracking-widest', 'hover:scale-105', 'transition-all', 'shadow-xl', 'shadow-primary/20')}>
              <LuMessageCircle className={cn('w-5', 'h-5')} />
              Contact Support
            </button>

            {/* Secondary Action: FAQ */}
            <Link
              href="/faq"
              className={cn('w-full', 'sm:w-auto', 'flex', 'items-center', 'justify-center', 'gap-3', 'px-8', 'py-4', 'bg-white/10', 'text-white', 'border', 'border-white/10', 'rounded-2xl', 'font-black', 'text-xs', 'uppercase', 'tracking-widest', 'hover:bg-white/20', 'transition-all')}
            >
              <LuFileQuestion className={cn('w-5', 'h-5')} />
              Help Center
            </Link>
          </div>
        </div>
      </div>

      {/* Trust Footer */}
      <div className={cn('mt-8', 'flex', 'flex-col', 'sm:flex-row', 'items-center', 'justify-center', 'gap-6', 'text-slate-300')}>
        <p className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-[0.3em]')}>
          Securely Processed by DIUSCADI
        </p>
        <div className={cn('hidden', 'sm:block', 'w-1.5', 'h-1.5', 'bg-slate-200', 'rounded-full')} />
        <Link
          href="/terms"
          className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-[0.3em]', 'hover:text-primary', 'transition-colors')}
        >
          Ticket Terms & Conditions
        </Link>
      </div>
    </section>
  );
};
