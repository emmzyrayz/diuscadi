"use client";
// sections/admin/invites/AIPagination.tsx

import React from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuTicket,
  LuLayers,
} from "react-icons/lu";
import { cn } from "../../../../lib/utils";

interface Props {
  currentPage: number;
  totalPages: number;
  totalInvites: number;
  onPageChange: (page: number) => void;
}

export const AdminInvitesPagination: React.FC<Props> = ({
  currentPage,
  totalPages,
  totalInvites,
  onPageChange,
}) => (
  <div className={cn('flex', 'flex-col', 'lg:flex-row', 'items-center', 'justify-between', 'gap-6', 'py-8', 'px-10', 'bg-background', 'border-t-2', 'border-slate-50', 'rounded-b-[3.5rem]', 'shadow-sm')}>
    <div className={cn('flex', 'items-center', 'gap-5')}>
      <div className={cn('flex', 'items-center', 'gap-2', 'px-4', 'py-2.5', 'bg-foreground', 'text-background', 'rounded-xl', 'shadow-lg', 'shadow-foreground/10')}>
        <LuTicket className={cn('w-4', 'h-4', 'text-primary')} />
        <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest')}>
          {totalInvites.toLocaleString()} Total Codes
        </span>
      </div>
      <div className={cn('flex', 'items-center', 'gap-2', 'text-muted-foreground')}>
        <LuLayers className={cn('w-4', 'h-4')} />
        <p className={cn('text-[9px]', 'font-bold', 'uppercase', 'tracking-[0.2em]')}>
          Page <span className="text-foreground">{currentPage}</span> of{" "}
          {totalPages}
        </p>
      </div>
    </div>

    <div className={cn('flex', 'items-center', 'gap-4')}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn('group', 'p-4', 'bg-background', 'border', 'border-border', 'rounded-2xl', 'text-muted-foreground', 'hover:border-foreground', 'hover:text-foreground', 'disabled:opacity-20', 'transition-all', 'shadow-sm', 'cursor-pointer')}
      >
        <LuChevronLeft className={cn('w-5', 'h-5', 'group-hover:-translate-x-1', 'transition-transform')} />
      </button>

      <div className={cn('flex', 'items-center', 'gap-2', 'bg-muted', 'p-1.5', 'rounded-[1.5rem]', 'border', 'border-border')}>
        {[...Array(Math.min(5, totalPages))].map((_, i) => {
          const pageNum = i + 1;
          const isActive = currentPage === pageNum;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-11 h-11 rounded-xl text-[10px] font-black transition-all ${isActive ? "bg-background text-foreground shadow-md scale-105 border border-border" : "text-muted-foreground hover:text-slate-600"}`}
            >
              {pageNum.toString().padStart(2, "0")}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn('group', 'p-4', 'bg-background', 'border', 'border-border', 'rounded-2xl', 'text-muted-foreground', 'hover:border-foreground', 'hover:text-foreground', 'disabled:opacity-20', 'transition-all', 'shadow-sm', 'cursor-pointer')}
      >
        <LuChevronRight className={cn('w-5', 'h-5', 'group-hover:translate-x-1', 'transition-transform')} />
      </button>
    </div>
  </div>
);
