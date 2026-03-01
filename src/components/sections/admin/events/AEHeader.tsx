"use client";
import React, { useState } from "react";
import { LuCalendarPlus, LuPlus, LuInfo } from "react-icons/lu";
import { AdminEventModal } from "./modals/AEEditModal";
import { cn } from "../../../../lib/utils";

export const AdminEventsHeader: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  return (
    <>
      <div className={cn('flex', 'flex-col', 'md:flex-row', 'md:items-center', 'justify-between', 'gap-6', 'mb-10')}>
        {/* 1. Context & Identity */}
        <div className="space-y-2">
          <div className={cn('flex', 'items-center', 'gap-3')}>
            <div className={cn('w-10', 'h-10', 'rounded-xl', 'bg-primary/10', 'flex', 'items-center', 'justify-center', 'text-primary', 'border', 'border-primary/20', 'shadow-sm')}>
              <LuCalendarPlus className={cn('w-5', 'h-5')} />
            </div>
            <h1 className={cn('text-3xl', 'font-black', 'text-slate-900', 'tracking-tighter', 'uppercase')}>
              Manage Events
            </h1>
          </div>
          <div className={cn('flex', 'items-center', 'gap-2', 'text-slate-500')}>
            <LuInfo className={cn('w-3.5', 'h-3.5')} />
            <p className={cn('text-[10px]', 'font-bold', 'uppercase', 'tracking-widest')}>
              Create, edit, and oversee all platform sessions and summits
            </p>
          </div>
        </div>

        {/* 2. Primary CTA */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className={cn('group', 'relative', 'flex', 'items-center', 'gap-3', 'px-8', 'py-4', 'bg-slate-900', 'text-white', 'rounded-[1.5rem]', 'overflow-hidden', 'transition-all', 'hover:scale-[1.02]', 'active:scale-95', 'shadow-xl', 'shadow-slate-900/20')}
        >
          <div className={cn('absolute', 'inset-0', 'bg-primary', 'translate-y-full', 'group-hover:translate-y-0', 'transition-transform', 'duration-300')} />

          <LuPlus className={cn('relative', 'z-10', 'w-5', 'h-5', 'group-hover:text-slate-900', 'transition-colors')} />
          <span className={cn('relative', 'z-10', 'text-[11px]', 'font-black', 'uppercase', 'tracking-[0.2em]', 'group-hover:text-slate-900', 'transition-colors')}>
            Create New Event
          </span>
        </button>
      </div>

      {/* 3. The Modal Triggered by Header */}
      <AdminEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
};
