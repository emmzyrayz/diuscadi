"use client";
import React from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuEllipsis,
} from "react-icons/lu";

// 1. TypeScript Interface
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const AdminEventsPagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  onPageChange,
}) => {
  // Simple logic to show current range (e.g., 1-10 of 50)
  const startRange = (currentPage - 1) * pageSize + 1;
  const endRange = Math.min(currentPage * pageSize, totalResults);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-8 px-10 bg-white border-t-2 border-slate-50 rounded-b-[2.5rem]">
      {/* 2. Range Info */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Showing
        </span>
        <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black">
          {startRange} — {endRange}
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          of {totalResults} Events
        </span>
      </div>

      {/* 3. Navigation Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-3 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:hover:border-slate-100 transition-all"
        >
          <LuChevronLeft className="w-5 h-5" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // Logic to only show pages near current, or first/last (Simplified for this snippet)
            const isSelected = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-slate-300 shadow-lg shadow-primary/20 scale-110"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-3 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:hover:border-slate-100 transition-all"
        >
          <LuChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 4. Page Size Selector (Optional but recommended) */}
      <div className="hidden lg:flex items-center gap-3">
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
          Per Page:
        </span>
        <select className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-black outline-none focus:border-primary">
          <option>10</option>
          <option>25</option>
          <option>50</option>
        </select>
      </div>
    </div>
  );
};
