"use client";
import React from "react";
import { LuUser, LuAtSign, LuTextQuote } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface BasicInfoSectionProps {
  firstName: string;
  lastName: string;
  username: string;
  bio: string;
  onChange: (patch: Partial<Pick<BasicInfoSectionProps, "firstName" | "lastName" | "username" | "bio">>) => void;
}

export const BasicInfoSection = ({
  firstName,
  lastName,
  username,
  bio,
  onChange,
}: BasicInfoSectionProps) => {
  return (
    <section className={cn('bg-background', 'border-2', 'border-border', 'rounded-[2.5rem]', 'p-8', 'md:p-10', 'shadow-sm', 'transition-all', 'hover:border-primary/20')}>
      
      {/* 1. Section Header */}
      <div className={cn('flex', 'items-center', 'gap-3', 'mb-10')}>
        <div className={cn('w-10', 'h-10', 'rounded-xl', 'bg-muted', 'flex', 'items-center', 'justify-center', 'text-primary', 'border', 'border-border')}>
          <LuUser className={cn('w-5', 'h-5')} />
        </div>
        <div>
          <h3 className={cn('text-xl', 'font-black', 'text-foreground', 'tracking-tight')}>Basic Information</h3>
          <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-1')}>
            Your core identity within the ecosystem
          </p>
        </div>
      </div>

      {/* 2. Form Grid */}
      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-x-8', 'gap-y-10')}>
        
        {/* First Name */}
        <div className="space-y-2">
          <label className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'ml-1')}>
            First Name
          </label>
          <input
            type="text"
            placeholder="e.g. Alexander"
            value={firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className={cn('w-full', 'bg-muted', 'border-2', 'border-slate-50', 'rounded-2xl', 'px-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-700', 'outline-hidden', 'focus:border-primary/20', 'focus:bg-backgroundround', 'transition-all')}
          />
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <label className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'ml-1')}>
            Last Name
          </label>
          <input
            type="text"
            placeholder="e.g. Chidubem"
            value={lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            className={cn('w-full', 'bg-muted', 'border-2', 'border-slate-50', 'rounded-2xl', 'px-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-700', 'outline-hidden', 'focus:border-primary/20', 'focus:bg-backgroundround', 'transition-all')}
          />
        </div>

        {/* Username */}
        <div className={cn('md:col-span-2', 'space-y-2')}>
          <label className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'ml-1')}>
            Username
          </label>
          <div className={cn('relative', 'group')}>
            <div className={cn('absolute', 'left-6', 'top-1/2', '-translate-y-1/2', 'text-muted-foreground')}>
              <LuAtSign className={cn('w-4', 'h-4')} />
            </div>
            <input
              type="text"
              placeholder="alex_chidubem"
              value={username}
              onChange={(e) => onChange({ username: e.target.value })}
              className={cn('w-full', 'bg-muted', 'border-2', 'border-slate-50', 'rounded-2xl', 'pl-12', 'pr-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-700', 'outline-hidden', 'focus:border-primary/20', 'focus:bg-backgroundround', 'transition-all')}
            />
          </div>
        </div>

        {/* Bio Textarea */}
        <div className={cn('md:col-span-2', 'space-y-2')}>
          <div className={cn('flex', 'justify-between', 'items-end', 'ml-1')}>
            <label className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
              Professional Biography
            </label>
            <span className={cn('text-[9px]', 'font-bold', 'text-slate-300', 'uppercase', 'tracking-tighter')}>
              Max 160 Characters
            </span>
          </div>
          <div className="relative">
            <div className={cn('absolute', 'left-6', 'top-5', 'text-muted-foreground')}>
              <LuTextQuote className={cn('w-4', 'h-4')} />
            </div>
            <textarea
              rows={4}
              placeholder="Tell the DIUSCADI community about yourself..."
              value={bio}
              onChange={(e) => onChange({ bio: e.target.value })}
              className={cn('w-full', 'bg-muted', 'border-2', 'border-slate-50', 'rounded-[2rem]', 'pl-12', 'pr-6', 'py-4', 'text-sm', 'font-bold', 'text-slate-700', 'outline-hidden', 'focus:border-primary/20', 'focus:bg-backgroundround', 'transition-all', 'resize-none')}
            />
          </div>
        </div>

      </div>
    </section>
  );
};