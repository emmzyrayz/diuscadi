"use client";
import React from "react";
import { LuChevronLeft, LuChevronRight, LuUsers, LuHash } from "react-icons/lu";

// 1. TypeScript Interface
interface UsersPaginationProps {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const AdminUsersPagination: React.FC<UsersPaginationProps> = ({
  currentPage,
  totalPages,
  totalUsers,
  pageSize,
  onPageChange,
}) => {
  // Calculate range for "Showing X to Y of Z"
  const startUser = (currentPage - 1) * pageSize + 1;
  const endUser = Math.min(currentPage * pageSize, totalUsers);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-8 px-10 bg-white border-t-2 border-slate-50 rounded-b-[2.5rem] shadow-sm">
      {/* 2. Global Count & Context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <LuUsers className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
            {totalUsers.toLocaleString()} Total Users
          </span>
        </div>
        <div className="hidden sm:block h-4 w-px bg-slate-200" />
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Displaying{" "}
          <span className="text-slate-900">
            {startUser} — {endUser}
          </span>
        </p>
      </div>

      {/* 3. Navigation Controls */}
      <div className="flex items-center gap-3">
        {/* PreviousButton */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-900 disabled:opacity-20 disabled:hover:border-slate-100 transition-all"
        >
          <LuChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
            Prev
          </span>
        </button>

        {/* PageNumbers (Smart Logic) */}
        <div className="flex items-center gap-1.5 px-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
            )
            .map((page, index, array) => (
              <React.Fragment key={page}>
                {index > 0 && array[index - 1] !== page - 1 && (
                  <span className="text-slate-300 px-1 font-black">...</span>
                )}
                <button
                  onClick={() => onPageChange(page)}
                  className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                    currentPage === page
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-110"
                      : "bg-white text-slate-400 border border-slate-100 hover:border-slate-900 hover:text-slate-900"
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            ))}
        </div>

        {/* NextButton */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-900 disabled:opacity-20 disabled:hover:border-slate-100 transition-all"
        >
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
            Next
          </span>
          <LuChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 4. Quick Jump (Optional Utility) */}
      <div className="hidden xl:flex items-center gap-3">
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
          Jump to:
        </span>
        <div className="relative">
          <LuHash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
          <input
            type="number"
            placeholder="Pg"
            className="w-14 bg-slate-50 border border-slate-100 rounded-lg pl-6 pr-2 py-1.5 text-[10px] font-black outline-none focus:border-primary transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter")
                onPageChange(Number((e.target as HTMLInputElement).value));
            }}
          />
        </div>
      </div>
    </div>
  );
};
