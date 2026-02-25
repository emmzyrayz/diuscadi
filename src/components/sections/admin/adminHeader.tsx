"use client";
import React from "react";
import {
  LuLayoutDashboard,
  LuShieldCheck,
  LuChevronRight,
  LuBell,
  LuSearch,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

export const AdminHeader = () => {
  return (
    <header className={cn('w-full lg:rounded-2xl md:rounded-b-2xl', 'bg-slate-900', 'text-white', 'border-b', 'border-white/5', 'sticky', 'top-0', 'z-30')}>
      <div className={cn('max-w-[1600px]', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-4')}>
        <div className={cn('flex', 'items-center', 'justify-between', 'gap-8')}>
          {/* 1. Brand & Breadcrumb */}
          <div className={cn('flex', 'items-center', 'gap-6')}>
            <div className={cn('hidden', 'md:flex', 'flex-col')}>
              <div className={cn('flex', 'items-center', 'gap-2', 'text-[10px]', 'font-black', 'text-slate-500', 'uppercase', 'tracking-[0.2em]')}>
                <span>Admin</span>
                <LuChevronRight className={cn('w-3', 'h-3')} />
                <span className="text-slate-500">Dashboard</span>
              </div>
              <h1 className={cn('text-xl', 'font-black', 'tracking-tighter', 'mt-1')}>
                Admin <span className="text-slate-500">Console</span>
              </h1>
            </div>

            {/* Global Admin Search - High Efficiency */}
            <div className={cn('relative', 'hidden', 'xl:block')}>
              <LuSearch className={cn('absolute', 'left-4', 'top-1/2', '-translate-y-1/2', 'text-slate-500', 'w-4', 'h-4')} />
              <input
                type="text"
                placeholder="Search users, tickets, or events..."
                className={cn('bg-white/5', 'border', 'border-white/10', 'rounded-xl', 'pl-12', 'pr-4', 'py-2.5', 'text-xs', 'font-medium', 'w-80', 'focus:w-96', 'focus:bg-white/10', 'focus:border-primary/50', 'transition-all', 'outline-none')}
              />
            </div>
          </div>

          {/* 2. Admin Identity & Actions */}
          <div className={cn('flex', 'items-center', 'gap-4')}>
            {/* System Notifications */}
            <button className={cn('relative', 'p-2.5', 'bg-white/5', 'hover:bg-white/10', 'rounded-xl', 'transition-colors', 'group')}>
              <LuBell className={cn('w-5', 'h-5', 'text-slate-400', 'group-hover:text-white')} />
              <span className={cn('absolute', 'top-2', 'right-2', 'w-2', 'h-2', 'bg-primary', 'rounded-full', 'border-2', 'border-slate-900')} />
            </button>

            <div className={cn('h-8', 'w-px', 'bg-white/10', 'mx-2', 'hidden', 'sm:block')} />

            {/* Admin Profile & Badge */}
            <div className={cn('flex', 'items-center', 'gap-4', 'group', 'cursor-pointer')}>
              <div className={cn('text-right', 'hidden', 'sm:block')}>
                <p className={cn('text-xs', 'font-black', 'tracking-tight', 'leading-none')}>
                  Super Admin
                </p>
                <div className={cn('inline-flex', 'items-center', 'gap-1.5', 'mt-1.5', 'px-2', 'py-0.5', 'bg-primary/10', 'border', 'border-primary/20', 'rounded', 'text-[8px]', 'font-black', 'text-slate-500', 'uppercase', 'tracking-widest')}>
                  <LuShieldCheck className={cn('w-2.5', 'h-2.5')} />
                  Webmaster
                </div>
              </div>
              <div className={cn('w-10', 'h-10', 'rounded-xl', 'bg-primary', 'flex', 'items-center', 'justify-center', 'text-slate-500', 'font-black', 'shadow-lg', 'shadow-primary/20', 'ring-2', 'ring-white/10')}>
                AD
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
