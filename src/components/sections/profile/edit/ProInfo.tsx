"use client";
import React from "react";
import { cn } from "../../../../lib/utils";
import {
  LuBriefcase,
  LuBuilding2,
  LuGraduationCap,
  LuChartBar,
} from "react-icons/lu";

export const ProfessionalInfoSection = () => {
  return (
    <section className={cn('bg-white', 'border-2', 'border-slate-100', 'rounded-[2.5rem]', 'p-8', 'md:p-10', 'shadow-sm', 'transition-all', 'hover:border-primary/20')}>
      {/* 1. Section Header */}
      <div className={cn('flex', 'items-center', 'gap-3', 'mb-10')}>
        <div className={cn('w-10', 'h-10', 'rounded-xl', 'bg-slate-50', 'flex', 'items-center', 'justify-center', 'text-primary', 'border', 'border-slate-100')}>
          <LuBriefcase className={cn('w-5', 'h-5')} />
        </div>
        <div>
          <h3 className={cn('text-xl', 'font-black', 'text-slate-900', 'tracking-tight')}>
            Professional Background
          </h3>
          <p className={cn('text-[10px]', 'font-bold', 'text-slate-400', 'uppercase', 'tracking-widest', 'mt-1')}>
            Help us tailor your DIUSCADI experience
          </p>
        </div>
      </div>

      {/* 2. Form Grid */}
      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-x-8', 'gap-y-8')}>
        {/* Occupation / Path */}
        <div className="space-y-2">
          <label className={cn('text-[10px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'ml-1')}>
            Primary Path
          </label>
          <div className="relative">
            <LuGraduationCap className={cn('absolute', 'left-6', 'top-1/2', '-translate-y-1/2', 'text-slate-400', 'w-4', 'h-4')} />
            <select className={cn('w-full', 'bg-slate-50', 'border-2', 'border-slate-50', 'rounded-2xl', 'pl-12', 'pr-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-700', 'outline-hidden', 'focus:border-primary/20', 'focus:bg-white', 'transition-all', 'appearance-none', 'cursor-pointer')}>
              <option value="student">Student</option>
              <option value="developer">Developer</option>
              <option value="entrepreneur">Entrepreneur</option>
              <option value="researcher">Researcher</option>
            </select>
          </div>
        </div>

        {/* Organization / Institution */}
        <div className="space-y-2">
          <label className={cn('text-[10px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'ml-1')}>
            Organization / School
          </label>
          <div className="relative">
            <LuBuilding2 className={cn('absolute', 'left-6', 'top-1/2', '-translate-y-1/2', 'text-slate-400', 'w-4', 'h-4')} />
            <input
              type="text"
              placeholder="e.g. UNILAG or TechNexus"
              className={cn('w-full', 'bg-slate-50', 'border-2', 'border-slate-50', 'rounded-2xl', 'pl-12', 'pr-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-700', 'outline-hidden', 'focus:border-primary/20', 'focus:bg-white', 'transition-all')}
            />
          </div>
        </div>

        {/* Current Role */}
        <div className="space-y-2">
          <label className={cn('text-[10px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'ml-1')}>
            Current Role
          </label>
          <input
            type="text"
            placeholder="e.g. 300L Student or Senior Dev"
            className={cn('w-full', 'bg-slate-50', 'border-2', 'border-slate-50', 'rounded-2xl', 'px-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-700', 'outline-hidden', 'focus:border-primary/20', 'focus:bg-white', 'transition-all')}
          />
        </div>

        {/* Experience Level */}
        <div className="space-y-2">
          <label className={cn('text-[10px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'ml-1')}>
            Experience Level
          </label>
          <div className="relative">
            <LuChartBar className={cn('absolute', 'left-6', 'top-1/2', '-translate-y-1/2', 'text-slate-400', 'w-4', 'h-4')} />
            <select className={cn('w-full', 'bg-slate-50', 'border-2', 'border-slate-50', 'rounded-2xl', 'pl-12', 'pr-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-700', 'outline-hidden', 'focus:border-primary/20', 'focus:bg-white', 'transition-all', 'appearance-none', 'cursor-pointer')}>
              <option value="entry">Entry Level / Undergraduate</option>
              <option value="mid">Mid-Level / Graduate</option>
              <option value="senior">Senior / Professional</option>
              <option value="expert">Expert / Founder</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
};
