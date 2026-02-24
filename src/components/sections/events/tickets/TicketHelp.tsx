"use client";
import React from "react";
import {
  LuInfo,
  LuMail,
  LuArrowRight,
  LuMessageCircle,
} from "react-icons/lu";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const TicketHelpSection = () => {
  return (
    <section className={cn('w-full', 'max-w-4xl', 'mx-auto', 'px-4', 'pb-24', 'pt-4')}>
      <div className={cn('bg-slate-50', 'rounded-[2rem]', 'p-8', 'md:p-10', 'border', 'border-slate-100', 'flex', 'flex-col', 'md:flex-row', 'items-center', 'justify-between', 'gap-8', 'text-center', 'md:text-left')}>
        {/* Left: Help Text */}
        <div className={cn('flex', 'flex-col', 'md:flex-row', 'items-center', 'md:items-start', 'gap-5')}>
          <div className={cn('w-14', 'h-14', 'bg-blue-100', 'text-blue-600', 'rounded-2xl', 'flex', 'items-center', 'justify-center', 'shrink-0', 'shadow-inner')}>
            <LuInfo className={cn('w-7', 'h-7')} />
          </div>
          <div>
            <h3 className={cn('text-xl', 'font-black', 'text-slate-900', 'mb-2', 'tracking-tight')}>
              Having trouble?
            </h3>
            <p className={cn('text-sm', 'font-medium', 'text-slate-500', 'leading-relaxed')}>
              Can&apos;t complete your registration or need special assistance?{" "}
              <br className={cn('hidden', 'md:block')} />
              Our support team is here to help and usually responds quickly.
            </p>
          </div>
        </div>

        {/* Right: Action Links */}
        <div className={cn('flex', 'flex-col', 'sm:flex-row', 'items-center', 'gap-3', 'w-full', 'md:w-auto', 'shrink-0')}>
          <a
            href="mailto:support@diuscadi.org.ng"
            className={cn('w-full', 'sm:w-auto', 'px-6', 'py-3.5', 'bg-white', 'border-2', 'border-slate-200', 'hover:border-blue-600', 'hover:text-blue-600', 'rounded-xl', 'text-sm', 'font-bold', 'text-slate-700', 'transition-all', 'flex', 'items-center', 'justify-center', 'gap-2', 'group', 'shadow-sm', 'hover:shadow-md')}
          >
            <LuMail className={cn('w-4', 'h-4', 'text-slate-400', 'group-hover:text-blue-600', 'transition-colors')} />
            Email Support
          </a>

          <Link
            href="/events#faqs"
            className={cn('w-full', 'sm:w-auto', 'px-6', 'py-3.5', 'bg-transparent', 'hover:bg-slate-200/50', 'rounded-xl', 'text-sm', 'font-bold', 'text-slate-600', 'transition-all', 'flex', 'items-center', 'justify-center', 'gap-2', 'group')}
          >
            Read FAQs
            <LuArrowRight className={cn('w-4', 'h-4', 'text-slate-400', 'group-hover:translate-x-1', 'group-hover:text-slate-900', 'transition-all')} />
          </Link>
        </div>
      </div>
    </section>
  );
};
