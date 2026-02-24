"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuCopy,
  LuCheck,
  LuQrCode,
  LuInfo,
  LuShieldCheck,
} from "react-icons/lu";

import { cn } from "@/lib/utils";

interface InviteCodeCardProps {
  inviteCode: string;
}

export const InviteCodeCard = ({ inviteCode }: InviteCodeCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('bg-slate-900', 'rounded-[2.5rem]', 'p-8', 'text-white', 'relative', 'overflow-hidden', 'shadow-2xl', 'shadow-slate-900/20', 'group')}
    >
      {/* 1. Card Header */}
      <div className={cn('relative', 'z-10', 'flex', 'justify-between', 'items-start', 'mb-8')}>
        <div className="space-y-1">
          <p className={cn('text-[10px]', 'font-black', 'text-primary', 'uppercase', 'tracking-[0.3em]')}>
            Digital Identity
          </p>
          <h3 className={cn('text-xl', 'font-black', 'tracking-tight')}>
            Your Invite Code
          </h3>
        </div>
        <div className={cn('w-10', 'h-10', 'bg-white/10', 'rounded-xl', 'flex', 'items-center', 'justify-center', 'backdrop-blur-md', 'border', 'border-white/10')}>
          <LuShieldCheck className={cn('w-5', 'h-5', 'text-primary')} />
        </div>
      </div>

      {/* 2. QR Code Version (The Scannable Asset) */}
      <div className={cn('relative', 'z-10', 'flex', 'flex-col', 'items-center', 'justify-center', 'mb-8')}>
        <div className={cn('bg-white', 'p-4', 'rounded-[2rem]', 'shadow-2xl', 'group-hover:scale-105', 'transition-transform', 'duration-500')}>
          <div className={cn('w-32', 'h-32', 'bg-slate-50', 'flex', 'items-center', 'justify-center', 'rounded-xl', 'overflow-hidden', 'border', 'border-slate-100')}>
            {/* Real-world: <QRCode value={inviteCode} size={128} /> */}
            <LuQrCode className={cn('w-24', 'h-24', 'text-slate-900')} />
          </div>
        </div>
        <p className={cn('mt-4', 'text-[9px]', 'font-black', 'text-slate-500', 'uppercase', 'tracking-widest', 'flex', 'items-center', 'gap-2')}>
          <span className={cn('w-1.5', 'h-1.5', 'bg-emerald-500', 'rounded-full', 'animate-pulse')} />
          Scan at event entrance
        </p>
      </div>

      {/* 3. The Interactive Code Display */}
      <div className={cn('relative', 'z-10', 'space-y-4')}>
        <div className={cn('bg-white/5', 'rounded-2xl', 'p-4', 'flex', 'items-center', 'justify-between', 'border', 'border-white/10', 'group-hover:border-primary/50', 'transition-colors')}>
          <div className="space-y-0.5">
            <p className={cn('text-[8px]', 'font-black', 'text-slate-500', 'uppercase', 'tracking-widest')}>
              Unique Identifier
            </p>
            <span className={cn('font-mono', 'text-lg', 'font-black', 'tracking-[0.4em]', 'text-white')}>
              {inviteCode}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className={cn('p-3', 'bg-white/10', 'hover:bg-primary', 'hover:text-white', 'rounded-xl', 'transition-all', 'active:scale-90')}
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <LuCheck className={cn('w-5', 'h-5')} />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <LuCopy className={cn('w-5', 'h-5')} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        <div className={cn('flex', 'items-start', 'gap-3', 'p-4', 'bg-white/3', 'rounded-2xl')}>
          <LuInfo className={cn('w-4', 'h-4', 'text-primary', 'shrink-0', 'mt-0.5')} />
          <p className={cn('text-[10px]', 'text-slate-400', 'font-medium', 'leading-relaxed')}>
            This code represents your DIUSCADI membership. Keep it private.
            Present this QR code to staff for faster check-in at all
            participating hubs.
          </p>
        </div>
      </div>

      {/* Visual Flair: Abstract Background */}
      <div className={cn('absolute', 'top-0', 'right-0', 'w-40', 'h-40', 'bg-primary/20', 'rounded-full', 'blur-[80px]', '-mr-20', '-mt-20', 'group-hover:bg-primary/30', 'transition-colors')} />
      <div className={cn('absolute', 'bottom-0', 'left-0', 'w-32', 'h-32', 'bg-blue-600/10', 'rounded-full', 'blur-[60px]', '-ml-16', '-mb-16')} />
    </motion.div>
  );
};
