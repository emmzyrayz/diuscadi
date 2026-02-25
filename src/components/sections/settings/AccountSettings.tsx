"use client";
import React from "react";
import {
  LuUserCog,
  LuMail,
  LuAtSign,
  LuShieldCheck,
  LuBadgeCheck,
  LuExternalLink,
} from "react-icons/lu";
import { cn } from "../../../lib/utils";

export const AccountSettingsSection = () => {
  return (
    <section className={cn('bg-white', 'border-2', 'border-slate-100', 'rounded-[2.5rem]', 'p-8', 'md:p-10', 'shadow-sm')}>
      {/* 1. Section Header */}
      <div className={cn('flex', 'items-center', 'gap-3', 'mb-10')}>
        <div className={cn('w-10', 'h-10', 'rounded-xl', 'bg-slate-50', 'flex', 'items-center', 'justify-center', 'text-primary', 'border', 'border-slate-100')}>
          <LuUserCog className={cn('w-5', 'h-5')} />
        </div>
        <div>
          <h3 className={cn('text-xl', 'font-black', 'text-slate-900', 'tracking-tight')}>
            Account Settings
          </h3>
          <p className={cn('text-[10px]', 'font-bold', 'text-slate-400', 'uppercase', 'tracking-widest', 'mt-1')}>
            Manage your core credentials and access
          </p>
        </div>
      </div>

      {/* 2. Settings List */}
      <div className={cn('flex', 'flex-col', 'gap-6')}>
        {/* Email Setting Row */}
        <div className={cn('group', 'flex', 'flex-col', 'md:flex-row', 'md:items-center', 'justify-between', 'p-6', 'bg-slate-50', 'rounded-3xl', 'gap-4', 'hover:bg-white', 'hover:border-slate-100', 'border', 'border-transparent', 'transition-all')}>
          <div className={cn('flex', 'items-center', 'gap-4')}>
            <div className={cn('w-10', 'h-10', 'bg-white', 'rounded-xl', 'flex', 'items-center', 'justify-center', 'text-slate-400')}>
              <LuMail className={cn('w-5', 'h-5')} />
            </div>
            <div>
              <p className={cn('text-[10px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest')}>
                Email Address
              </p>
              <div className={cn('flex', 'items-center', 'gap-2')}>
                <span className={cn('text-sm', 'font-bold', 'text-slate-700')}>
                  alex.chidubem@example.com
                </span>
                <span className={cn('flex', 'items-center', 'gap-1', 'px-2', 'py-0.5', 'bg-emerald-50', 'text-emerald-600', 'rounded', 'text-[9px]', 'font-black', 'uppercase')}>
                  <LuShieldCheck className={cn('w-3', 'h-3')} /> Verified
                </span>
              </div>
            </div>
          </div>
          <button className={cn('flex', 'items-center', 'justify-center', 'gap-2', 'px-6', 'py-3', 'bg-white', 'border', 'border-slate-200', 'text-slate-900', 'rounded-xl', 'font-black', 'text-[10px]', 'uppercase', 'tracking-widest', 'hover:bg-slate-900', 'hover:text-white', 'transition-all')}>
            Change Email
          </button>
        </div>

        {/* Username Setting Row */}
        <div className={cn('group', 'flex', 'flex-col', 'md:flex-row', 'md:items-center', 'justify-between', 'p-6', 'bg-slate-50', 'rounded-3xl', 'gap-4', 'hover:bg-white', 'hover:border-slate-100', 'border', 'border-transparent', 'transition-all')}>
          <div className={cn('flex', 'items-center', 'gap-4')}>
            <div className={cn('w-10', 'h-10', 'bg-white', 'rounded-xl', 'flex', 'items-center', 'justify-center', 'text-slate-400')}>
              <LuAtSign className={cn('w-5', 'h-5')} />
            </div>
            <div>
              <p className={cn('text-[10px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest')}>
                Username
              </p>
              <p className={cn('text-sm', 'font-bold', 'text-slate-700')}>@alex_chidubem</p>
            </div>
          </div>
          <button className={cn('flex', 'items-center', 'justify-center', 'gap-2', 'px-6', 'py-3', 'bg-white', 'border', 'border-slate-200', 'text-slate-900', 'rounded-xl', 'font-black', 'text-[10px]', 'uppercase', 'tracking-widest', 'hover:bg-slate-900', 'hover:text-white', 'transition-all')}>
            Update handle
          </button>
        </div>

        {/* Account Type Display */}
        <div className={cn('flex', 'flex-col', 'md:flex-row', 'md:items-center', 'justify-between', 'p-6', 'bg-slate-900', 'rounded-3xl', 'gap-4', 'shadow-xl', 'shadow-slate-900/10')}>
          <div className={cn('flex', 'items-center', 'gap-4')}>
            <div className={cn('w-10', 'h-10', 'bg-white/10', 'rounded-xl', 'flex', 'items-center', 'justify-center', 'text-primary')}>
              <LuBadgeCheck className={cn('w-6', 'h-6')} />
            </div>
            <div>
              <p className={cn('text-[10px]', 'font-black', 'text-primary', 'uppercase', 'tracking-widest')}>
                Account Tier
              </p>
              <p className={cn('text-sm', 'font-bold', 'text-white', 'uppercase', 'tracking-tight')}>
                DIUSCADI Premium Member
              </p>
            </div>
          </div>
          <button className={cn('flex', 'items-center', 'justify-center', 'gap-2', 'px-6', 'py-3', 'bg-white/10', 'text-white', 'rounded-xl', 'font-black', 'text-[10px]', 'uppercase', 'tracking-widest', 'hover:bg-white', 'hover:text-slate-900', 'transition-all')}>
            View Benefits <LuExternalLink className={cn('w-3', 'h-3')} />
          </button>
        </div>
      </div>
    </section>
  );
};
