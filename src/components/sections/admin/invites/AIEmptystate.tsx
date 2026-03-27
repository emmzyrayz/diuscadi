"use client";
// sections/admin/invites/AIEmptyState.tsx

import React from "react";
import { motion } from "framer-motion";
import { LuTicket, LuSearchX, LuRefreshCcw, LuPlus } from "react-icons/lu";
import { cn } from "../../../../lib/utils";

interface Props {
  isFiltered: boolean;
  onReset: () => void;
  onGenerate: () => void;
}

export const AdminInvitesEmptyState: React.FC<Props> = ({
  isFiltered,
  onReset,
  onGenerate,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn('w-full', 'py-24', 'bg-muted/50', 'border-2', 'border-dashed', 'border-border', 'rounded-[3rem]', 'flex', 'flex-col', 'items-center', 'justify-center', 'text-center', 'px-6')}
  >
    <div className={cn('relative', 'mb-8')}>
      <div className={cn('w-24', 'h-24', 'bg-background', 'rounded-3xl', 'shadow-sm', 'border', 'border-border', 'flex', 'items-center', 'justify-center', 'relative', 'z-10')}>
        {isFiltered ? (
          <LuSearchX className={cn('w-10', 'h-10', 'text-slate-300')} />
        ) : (
          <LuTicket className={cn('w-10', 'h-10', 'text-slate-200')} />
        )}
      </div>
      <div className={cn('absolute', 'inset-0', 'bg-primary/5', 'rounded-3xl', 'animate-ping', 'scale-150', '-z-10', 'opacity-20')} />
    </div>

    <div className={cn('max-w-md', 'space-y-3')}>
      <h3 className={cn('text-2xl', 'font-black', 'text-foreground', 'uppercase', 'tracking-tighter')}>
        {isFiltered ? "No Codes Match" : "No Invite Codes Yet"}
      </h3>
      <p className={cn('text-[11px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-[0.15em]', 'leading-relaxed', 'px-10')}>
        {isFiltered
          ? "No invite codes match your current filters. Try adjusting the status or clearing your search."
          : "No invite codes have been generated yet. Create codes to allow users to register on the platform."}
      </p>
    </div>

    <div className={cn('mt-10', 'flex', 'flex-col', 'sm:flex-row', 'gap-4')}>
      {isFiltered ? (
        <button
          onClick={onReset}
          className={cn('flex', 'items-center', 'gap-3', 'px-8', 'py-4', 'bg-foreground', 'text-background', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'hover:bg-primary', 'hover:text-foreground', 'transition-all', 'shadow-xl', 'shadow-foreground/10', 'cursor-pointer')}
        >
          <LuRefreshCcw className={cn('w-4', 'h-4')} /> Clear Filters
        </button>
      ) : (
        <button
          onClick={onGenerate}
          className={cn('flex', 'items-center', 'gap-3', 'px-8', 'py-4', 'bg-foreground', 'text-background', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'hover:bg-primary', 'hover:text-foreground', 'transition-all', 'shadow-xl', 'shadow-foreground/10', 'cursor-pointer')}
        >
          <LuPlus className={cn('w-4', 'h-4')} /> Generate First Code
        </button>
      )}
    </div>
  </motion.div>
);
