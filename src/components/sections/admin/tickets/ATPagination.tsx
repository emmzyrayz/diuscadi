"use client";
import React from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuTicket,
  LuLayers,
} from "react-icons/lu";

interface TicketsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalTickets: number;
  onPageChange: (page: number) => void;
}

export const AdminTicketsPagination: React.FC<TicketsPaginationProps> = ({
  currentPage,
  totalPages,
  totalTickets,
  onPageChange,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 py-10 px-12 bg-background border-t-2 border-slate-50 rounded-b-[3.5rem] shadow-sm">
      {/* 1. Manifest Summary */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl shadow-lg shadow-foreground/10">
          <LuTicket className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {totalTickets.toLocaleString()} Total Records
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

      {/* 2. Navigation Controls */}
      <div className="flex items-center gap-4">
        {/* PreviousButton */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="group p-4 bg-background border border-border rounded-2xl text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-20 disabled:hover:border-border transition-all shadow-sm"
        >
          <LuChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>

        {/* PageNumbers */}
        <div className="flex items-center gap-2 bg-muted p-1.5 rounded-[1.5rem] border border-border">
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const pageNum = i + 1;
            const isActive = currentPage === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-11 h-11 rounded-xl text-[10px] font-black transition-all ${
                  isActive
                    ? "bg-background text-foreground shadow-md scale-105 border border-border"
                    : "text-muted-foreground hover:text-slate-600"
                }`}
              >
                {pageNum.toString().padStart(2, "0")}
              </button>
            );
          })}
        </div>

        {/* NextButton */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="group p-4 bg-background border border-border rounded-2xl text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-20 disabled:hover:border-border transition-all shadow-sm"
        >
          <LuChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 3. Per Page Configuration */}
      <div className="hidden xl:flex items-center gap-3">
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
          Rows:
        </span>
        <select className="bg-muted border border-border rounded-xl px-3 py-2 text-[10px] font-black outline-none focus:border-primary">
          <option>25</option>
          <option>50</option>
          <option>100</option>
        </select>
      </div>
    </div>
  );
};
