"use client";
import React from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuInbox,
  LuLayers,
} from "react-icons/lu";

interface Props {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const APPagination: React.FC<Props> = ({
  currentPage,
  totalPages,
  total,
  onPageChange,
}) => (
  <div className="flex flex-col lg:flex-row items-center justify-between gap-6 py-8 px-10 bg-background border-t-2 border-slate-50 rounded-b-[3.5rem] shadow-sm">
    <div className="flex items-center gap-5">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl shadow-lg shadow-foreground/10">
        <LuInbox className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest">
          {total.toLocaleString()} Applications
        </span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <LuLayers className="w-4 h-4" />
        <p className="text-[9px] font-bold uppercase tracking-[0.2em]">
          Page <span className="text-foreground">{currentPage}</span> of{" "}
          {totalPages}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="group p-4 bg-background border border-border rounded-2xl text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-20 transition-all shadow-sm cursor-pointer"
      >
        <LuChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      </button>
      <div className="flex items-center gap-2 bg-muted p-1.5 rounded-[1.5rem] border border-border">
        {[...Array(Math.min(5, totalPages))].map((_, i) => {
          const n = i + 1;
          const active = currentPage === n;
          return (
            <button
              key={n}
              onClick={() => onPageChange(n)}
              className={`w-11 h-11 rounded-xl text-[10px] font-black transition-all cursor-pointer ${active ? "bg-background text-foreground shadow-md scale-105 border border-border" : "text-muted-foreground hover:text-slate-600"}`}
            >
              {n.toString().padStart(2, "0")}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="group p-4 bg-background border border-border rounded-2xl text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-20 transition-all shadow-sm cursor-pointer"
      >
        <LuChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  </div>
);
