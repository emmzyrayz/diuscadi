"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuShieldCheck, LuMapPin, LuBadgeCheck } from "react-icons/lu";
import { cn } from "../../../../lib/utils";
import Image from "next/image";

interface PreviewData {
  firstName: string;
  lastName: string;
  role: string;
  organization: string;
  city: string;
  image: string | null;
  path: string;
}

export const ProfilePreviewCard = ({ data }: { data: PreviewData }) => {
  return (
    <div className={cn('sticky', 'top-32', 'space-y-6')}>
      <div className="px-4">
        <h2 className={cn('text-sm', 'font-black', 'text-slate-900', 'uppercase', 'tracking-[0.2em]')}>
          Live Preview
        </h2>
        <p className={cn('text-[10px]', 'font-bold', 'text-slate-400', 'mt-1')}>
          Real-time Digital ID display
        </p>
      </div>

      <motion.div
        layout
        className={cn('relative', 'bg-white', 'border-2', 'border-slate-100', 'rounded-[2.5rem]', 'p-6', 'shadow-2xl', 'shadow-slate-200/50', 'overflow-hidden')}
      >
        {/* Decorative Background ID Number */}
        <div className={cn('absolute', '-top-4', '-right-4', 'opacity-[0.03]', 'select-none')}>
          <span className={cn('text-8xl', 'font-black', 'italic')}>DIU</span>
        </div>

        <div className={cn('relative', 'z-10', 'space-y-6')}>
          {/* 1. Identity Header */}
          <div className={cn('flex', 'items-center', 'gap-4')}>
            <div className={cn('w-20', 'h-20', 'rounded-3xl', 'bg-slate-100', 'border-2', 'border-slate-50', 'overflow-hidden', 'shrink-0')}>
              {data.image ? (
                              <Image
                                  height={300}
                                  width={500}
                  src={data.image}
                  alt="Preview"
                  className={cn('w-full', 'h-full', 'object-cover')}
                />
              ) : (
                <div className={cn('w-full', 'h-full', 'flex', 'items-center', 'justify-center', 'text-slate-300')}>
                  <LuBadgeCheck className={cn('w-8', 'h-8')} />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className={cn('flex', 'items-center', 'gap-1.5')}>
                <span className={cn('px-2', 'py-0.5', 'bg-primary/10', 'text-primary', 'rounded', 'text-[8px]', 'font-black', 'uppercase', 'tracking-widest')}>
                  {data.path || "MEMBER"}
                </span>
              </div>
              <h3 className={cn('text-lg', 'font-black', 'text-slate-900', 'leading-none', 'truncate', 'max-w-[140px]')}>
                {data.firstName || "Your"} {data.lastName || "Name"}
              </h3>
              <div className={cn('flex', 'items-center', 'gap-1', 'text-slate-400')}>
                <LuMapPin className={cn('w-3', 'h-3')} />
                <span className={cn('text-[10px]', 'font-bold')}>
                  {data.city || "Location"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Professional Details */}
          <div className={cn('space-y-4', 'pt-4', 'border-t', 'border-slate-50')}>
            <div>
              <p className={cn('text-[9px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'mb-1')}>
                Position
              </p>
              <p className={cn('text-sm', 'font-bold', 'text-slate-800')}>
                {data.role || "Not specified"}
              </p>
            </div>
            <div>
              <p className={cn('text-[9px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'mb-1')}>
                Organization
              </p>
              <p className={cn('text-sm', 'font-bold', 'text-slate-800')}>
                {data.organization || "No Organization"}
              </p>
            </div>
          </div>

          {/* 3. Authentication Footer */}
          <div className="pt-4">
            <div className={cn('flex', 'items-center', 'justify-between', 'p-3', 'bg-slate-50', 'rounded-2xl')}>
              <div className={cn('flex', 'items-center', 'gap-2')}>
                <LuShieldCheck className={cn('w-4', 'h-4', 'text-emerald-500')} />
                <span className={cn('text-[9px]', 'font-black', 'text-slate-900', 'uppercase')}>
                  Identity Verified
                </span>
              </div>
              <div className={cn('w-6', 'h-6', 'rounded-full', 'bg-white', 'border', 'border-slate-200', 'flex', 'items-center', 'justify-center')}>
                <div className={cn('w-2', 'h-2', 'rounded-full', 'bg-emerald-500', 'animate-pulse')} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4. Tips Box */}
      <div className={cn('bg-blue-50/50', 'border', 'border-blue-100/50', 'rounded-3xl', 'p-5')}>
        <p className={cn('text-[10px]', 'font-bold', 'text-blue-600', 'leading-relaxed')}>
          <span className="font-black">Pro Tip:</span> Using a professional
          headshot increases your networking reach by 40% within the DIUSCADI
          ecosystem.
        </p>
      </div>
    </div>
  );
};
