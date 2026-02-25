"use client";
import React from "react";
import { LuMail, LuPhone, LuGlobe, LuMapPin, LuLock, LuContact } from "react-icons/lu";
import { cn } from "../../../../lib/utils";

export const ContactInfoSection = () => {
  return (
    <section className={cn('bg-white', 'border-2', 'border-slate-100', 'rounded-[2.5rem]', 'p-8', 'md:p-10', 'shadow-sm', 'transition-all', 'hover:border-primary/20')}>
      {/* 1. Section Header */}
      <div className={cn('flex', 'items-center', 'gap-3', 'mb-10')}>
        <div className={cn('w-10', 'h-10', 'rounded-xl', 'bg-slate-50', 'flex', 'items-center', 'justify-center', 'text-primary', 'border', 'border-slate-100')}>
          <LuContact className={cn('w-5', 'h-5')} />
        </div>
        <div>
          <h3 className={cn('text-xl', 'font-black', 'text-slate-900', 'tracking-tight')}>
            Contact Information
          </h3>
          <p className={cn('text-[10px]', 'font-bold', 'text-slate-400', 'uppercase', 'tracking-widest', 'mt-1')}>
            Communication & Residency details
          </p>
        </div>
      </div>

      {/* 2. Form Grid */}
      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-x-8', 'gap-y-8')}>
        {/* Email - Read Only State */}
        <div className="space-y-2">
          <label className={cn('text-[10px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'ml-1', 'flex', 'items-center', 'gap-2')}>
            Email Address <LuLock className={cn('w-2.5', 'h-2.5')} />
          </label>
          <div className="relative">
            <LuMail className={cn('absolute', 'left-6', 'top-1/2', '-translate-y-1/2', 'text-slate-400', 'w-4', 'h-4')} />
            <input
              type="email"
              value="alex.chidubem@example.com"
              readOnly
              className={cn('w-full', 'bg-slate-100', 'border-2', 'border-slate-100', 'rounded-2xl', 'pl-12', 'pr-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-500', 'cursor-not-allowed')}
            />
            <div className={cn('absolute', 'right-4', 'top-1/2', '-translate-y-1/2', 'bg-white', 'px-2', 'py-1', 'rounded-md', 'text-[8px]', 'font-black', 'text-emerald-600', 'uppercase', 'border', 'border-emerald-100')}>
              Verified
            </div>
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <label className={cn('text-[10px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'ml-1')}>
            Phone Number
          </label>
          <div className="relative">
            <LuPhone className={cn('absolute', 'left-6', 'top-1/2', '-translate-y-1/2', 'text-slate-400', 'w-4', 'h-4')} />
            <input
              type="tel"
              placeholder="+234 --- --- ----"
              className={cn('w-full', 'bg-slate-50', 'border-2', 'border-slate-50', 'rounded-2xl', 'pl-12', 'pr-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-700', 'outline-hidden', 'focus:border-primary/20', 'focus:bg-white', 'transition-all')}
            />
          </div>
        </div>

        {/* Country Select */}
        <div className="space-y-2">
          <label className={cn('text-[10px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'ml-1')}>
            Country
          </label>
          <div className="relative">
            <LuGlobe className={cn('absolute', 'left-6', 'top-1/2', '-translate-y-1/2', 'text-slate-400', 'w-4', 'h-4')} />
            <select className={cn('w-full', 'bg-slate-50', 'border-2', 'border-slate-50', 'rounded-2xl', 'pl-12', 'pr-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-700', 'outline-hidden', 'focus:border-primary/20', 'focus:bg-white', 'transition-all', 'appearance-none', 'cursor-pointer')}>
              <option value="NG">Nigeria</option>
              <option value="GH">Ghana</option>
              <option value="KE">Kenya</option>
              <option value="RW">Rwanda</option>
              {/* Add more as needed */}
            </select>
          </div>
        </div>

        {/* City / State */}
        <div className="space-y-2">
          <label className={cn('text-[10px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'ml-1')}>
            City / State
          </label>
          <div className="relative">
            <LuMapPin className={cn('absolute', 'left-6', 'top-1/2', '-translate-y-1/2', 'text-slate-400', 'w-4', 'h-4')} />
            <input
              type="text"
              placeholder="e.g. Lagos Island"
              className={cn('w-full', 'bg-slate-50', 'border-2', 'border-slate-50', 'rounded-2xl', 'pl-12', 'pr-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-700', 'outline-hidden', 'focus:border-primary/20', 'focus:bg-white', 'transition-all')}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
