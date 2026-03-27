"use client";
// sections/admin/invites/AIHeader.tsx

import React from "react";
import { LuTicket, LuPlus, LuActivity } from "react-icons/lu";
import { cn } from "../../../../lib/utils";

interface Props {
  activeCount: number;
  onGenerateClick: () => void;
}

export const AdminInvitesHeader: React.FC<Props> = ({
  activeCount,
  onGenerateClick,
}) => (
  <div className={cn('flex', 'flex-col', 'xl:flex-row', 'xl:items-end', 'justify-between', 'gap-8')}>
    <div className="space-y-4">
      <div className={cn('flex', 'items-center', 'gap-4')}>
        <div className={cn('w-14', 'h-14', 'rounded-2xl', 'bg-foreground', 'flex', 'items-center', 'justify-center', 'text-secondary', 'shadow-xl', 'shadow-foreground/20', 'border', 'border-background/10')}>
          <LuTicket className={cn('w-7', 'h-7')} />
        </div>
        <div>
          <div className={cn('flex', 'items-center', 'gap-3')}>
            <h1 className={cn('text-4xl', 'font-black', 'text-foreground', 'tracking-tighter', 'uppercase')}>
              Invite Codes
            </h1>
            <div className={cn('px-3', 'py-1', 'bg-primary/10', 'border', 'border-primary/20', 'rounded-full', 'flex', 'items-center', 'gap-1.5')}>
              <LuActivity className={cn('w-3', 'h-3', 'text-primary')} />
              <span className={cn('text-[10px]', 'font-black', 'text-primary', 'uppercase', 'tracking-widest')}>
                {activeCount.toLocaleString()} Active
              </span>
            </div>
          </div>
          <p className={cn('text-xs', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-1')}>
            Generate and manage platform access codes
          </p>
        </div>
      </div>
    </div>

    <button
      onClick={onGenerateClick}
      className={cn('flex', 'items-center', 'gap-3', 'px-8', 'py-4', 'bg-foreground', 'text-background', 'rounded-2xl', 'hover:bg-primary', 'hover:text-foreground', 'transition-all', 'shadow-2xl', 'shadow-foreground/20', 'group', 'relative', 'overflow-hidden', 'cursor-pointer')}
    >
      <div className={cn('absolute', 'inset-0', 'bg-background/5', 'animate-pulse')} />
      <LuPlus className={cn('w-5', 'h-5', 'relative', 'z-10', 'group-hover:scale-110', 'transition-transform')} />
      <span className={cn('text-[11px]', 'font-black', 'uppercase', 'tracking-[0.15em]', 'relative', 'z-10')}>
        Generate Codes
      </span>
    </button>
  </div>
);
