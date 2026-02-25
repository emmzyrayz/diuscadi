"use client";
import React from "react";
import { LuUser, LuAtSign, LuTextQuote } from "react-icons/lu";
import { cn } from "@/lib/utils";

export const BasicInfoSection = () => {
  return (
    <section className={cn('bg-white', 'border-2', 'border-slate-100', 'rounded-[2.5rem]', 'p-8', 'md:p-10', 'shadow-sm', 'transition-all', 'hover:border-primary/20')}>
      
      {/* 1. Section Header */}
      <div className={cn('flex', 'items-center', 'gap-3', 'mb-10')}>
        <div className={cn('w-10', 'h-10', 'rounded-xl', 'bg-slate-50', 'flex', 'items-center', 'justify-center', 'text-primary', 'border', 'border-slate-100')}>
          <LuUser className={cn('w-5', 'h-5')} />
        </div>
        <div>
          <h3 className={cn('text-xl', 'font-black', 'text-slate-900', 'tracking-tight')}>Basic Information</h3>
          <p className={cn('text-[10px]', 'font-bold', 'text-slate-400', 'uppercase', 'tracking-widest', 'mt-1')}>
            Your core identity within the ecosystem
          </p>
        </div>
      </div>

      {/* 2. Form Grid */}
      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-x-8', 'gap-y-10')}>
        
        {/* First Name */}
        <div className="space-y-2">
          <label className={cn('text-[10px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'ml-1')}>
            First Name
          </label>
          <input 
            type="text" 
            placeholder="e.g. Alexander"
            className={cn('w-full', 'bg-slate-50', 'border-2', 'border-slate-50', 'rounded-2xl', 'px-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-700', 'outline-hidden', 'focus:border-primary/20', 'focus:bg-white', 'transition-all')}
          />
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <label className={cn('text-[10px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'ml-1')}>
            Last Name
          </label>
          <input 
            type="text" 
            placeholder="e.g. Chidubem"
            className={cn('w-full', 'bg-slate-50', 'border-2', 'border-slate-50', 'rounded-2xl', 'px-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-700', 'outline-hidden', 'focus:border-primary/20', 'focus:bg-white', 'transition-all')}
          />
        </div>

        {/* Username */}
        <div className={cn('md:col-span-2', 'space-y-2')}>
          <label className={cn('text-[10px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'ml-1')}>
            Username
          </label>
          <div className={cn('relative', 'group')}>
            <div className={cn('absolute', 'left-6', 'top-1/2', '-translate-y-1/2', 'text-slate-400')}>
              <LuAtSign className={cn('w-4', 'h-4')} />
            </div>
            <input 
              type="text" 
              placeholder="alex_chidubem"
              className={cn('w-full', 'bg-slate-50', 'border-2', 'border-slate-50', 'rounded-2xl', 'pl-12', 'pr-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-700', 'outline-hidden', 'focus:border-primary/20', 'focus:bg-white', 'transition-all')}
            />
          </div>
        </div>

        {/* Bio Textarea */}
        <div className={cn('md:col-span-2', 'space-y-2')}>
          <div className={cn('flex', 'justify-between', 'items-end', 'ml-1')}>
            <label className={cn('text-[10px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest')}>
              Professional Biography
            </label>
            <span className={cn('text-[9px]', 'font-bold', 'text-slate-300', 'uppercase', 'tracking-tighter')}>
              Max 160 Characters
            </span>
          </div>
          <div className="relative">
            <div className={cn('absolute', 'left-6', 'top-5', 'text-slate-400')}>
              <LuTextQuote className={cn('w-4', 'h-4')} />
            </div>
            <textarea 
              rows={4}
              placeholder="Tell the DIUSCADI community about yourself..."
              className={cn('w-full', 'bg-slate-50', 'border-2', 'border-slate-50', 'rounded-[2rem]', 'pl-12', 'pr-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-700', 'outline-hidden', 'focus:border-primary/20', 'focus:bg-white', 'transition-all', 'resize-none')}
            />
          </div>
        </div>

      </div>
    </section>
  );
};