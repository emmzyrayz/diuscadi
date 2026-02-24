"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuUserCog, LuShieldCheck, LuSparkles } from "react-icons/lu";
import { cn } from "../../../lib/utils";

interface ProfileHeaderProps {
  completionPercentage: number;
}

export const ProfileHeader = ({ completionPercentage }: ProfileHeaderProps) => {
  return (
    <header className={cn('w-full', 'bg-white', 'border-b', 'border-slate-100', 'py-10', 'md:py-14')}>
      <div className={cn('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8')}>
        <div className={cn('flex', 'flex-col', 'md:flex-row', 'md:items-end', 'justify-between', 'gap-8')}>
          {/* 1. Identity Context */}
          <div className={cn('space-y-4', 'max-w-xl')}>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex', 'items-center', 'gap-2', 'text-primary', 'font-black', 'text-[10px]', 'uppercase', 'tracking-[0.3em]')}
            >
              <LuShieldCheck className={cn('w-4', 'h-4')} />
              Secure Identity Hub
            </motion.div>

            <div className="space-y-1">
              <h1 className={cn('text-4xl', 'md:text-5xl', 'font-black', 'text-slate-900', 'tracking-tighter')}>
                My <span className="text-primary">Profile.</span>
              </h1>
              <p className={cn('text-slate-500', 'font-medium', 'text-lg')}>
                Manage your personal information and membership credentials.
              </p>
            </div>

            {/* 2. Completion Progress (The Nudge) */}
            <div className="pt-2">
              <div className={cn('flex', 'items-center', 'justify-between', 'mb-2')}>
                <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400')}>
                  Profile Completion
                </span>
                <span className={cn('text-[10px]', 'font-black', 'text-primary')}>
                  {completionPercentage}%
                </span>
              </div>
              <div className={cn('w-full', 'h-2', 'bg-slate-100', 'rounded-full', 'overflow-hidden')}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn('h-full', 'bg-linear-to-r', 'from-primary', 'to-blue-600')}
                />
              </div>
              {completionPercentage < 100 && (
                <p className={cn('mt-2', 'text-[11px]', 'font-bold', 'text-slate-400', 'flex', 'items-center', 'gap-1.5')}>
                  <LuSparkles className={cn('w-3', 'h-3', 'text-primary')} />
                  Complete your profile to unlock all ticket features.
                </p>
              )}
            </div>
          </div>

          {/* 3. Global Actions */}
          <div className={cn('flex', 'items-center', 'gap-3')}>
            <button className={cn('flex-1', 'md:flex-none', 'flex', 'items-center', 'justify-center', 'gap-2', 'px-8', 'py-4', 'bg-slate-900', 'text-white', 'rounded-2xl', 'font-black', 'text-xs', 'uppercase', 'tracking-widest', 'hover:bg-primary', 'transition-all', 'shadow-xl', 'shadow-slate-900/10', 'group')}>
              <LuUserCog className={cn('w-4', 'h-4', 'group-hover:rotate-45', 'transition-transform')} />
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
