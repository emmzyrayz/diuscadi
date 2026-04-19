"use client";
import React, { useState } from "react";
import {
  LuTicket,
  LuQrCode,
  LuDownload,
  LuPlus,
  LuActivity,
} from "react-icons/lu";

interface AdminTicketsHeaderProps {
  onScanClick: () => void;
  onExportClick: () => void;
  activeTickets: number;
  exporting: boolean;
}

export const AdminTicketsHeader: React.FC<AdminTicketsHeaderProps> = ({
  onScanClick,
  onExportClick,
  activeTickets,
  exporting,
}) => {
  return (
    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-10">
      {/* 1. Identity & Context */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center text-secondary shadow-xl shadow-foreground/20 border border-background/10">
            <LuTicket className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">
                Manage Tickets
              </h1>
              <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-1.5">
                <LuActivity className="w-3 h-3 text-primary-dark" />
                <span className="text-[10px] font-black text-primary-dark uppercase tracking-widest">
                  {activeTickets.toLocaleString()} Valid
                </span>
              </div>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Real-time ticket validation and entry governance terminal
            </p>
          </div>
        </div>
      </div>

      {/* 2. Tactical Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Export Utility */}
        <button
          onClick={onExportClick}
          disabled={exporting}
          className="flex items-center gap-2 px-5 py-4 bg-background border border-border rounded-2xl text-slate-600 hover:border-foreground hover:text-foreground transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LuDownload
            className={`w-4 h-4 ${exporting ? "animate-bounce" : "group-hover:translate-y-0.5"} transition-transform`}
          />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {exporting ? "Exporting…" : "Export Manifest"}
          </span>
        </button>

        {/* PRIMARY CTA: Scan Ticket */}
        <button
          onClick={onScanClick}
          className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl hover:bg-primary hover:text-foreground transition-all shadow-2xl shadow-foreground/20 group relative overflow-hidden"
        >
          {/* Subtle pulse effect for the scan button */}
          <div className="absolute inset-0 bg-background/5 animate-pulse" />

          <LuQrCode className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-[0.15em] relative z-10">
            Scan Entry Pass
          </span>
        </button>
      </div>
    </div>
  );
};
