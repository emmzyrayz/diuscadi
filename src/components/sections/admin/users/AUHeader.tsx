"use client";
import React from "react";
import {
  LuUsers,
  LuDownload,
  LuUpload,
  LuLayers,
  LuShieldCheck,
} from "react-icons/lu";

// 1. TypeScript Interface for Header Props
interface AdminUsersHeaderProps {
  totalUsers: number;
  onExport: () => void;
  onImport: () => void;
}

export const AdminUsersHeader: React.FC<AdminUsersHeaderProps> = ({
  totalUsers,
  onExport,
  onImport,
}) => {
  return (
    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-10">
      {/* 1. Identity & Context */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-secondary shadow-xl shadow-slate-900/20 border border-white/10">
            <LuUsers className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                Manage Users
              </h1>
              <div className="px-3 py-1 bg-emerald-100 border border-emerald-200 rounded-full flex items-center gap-1.5">
                <LuShieldCheck className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  {totalUsers.toLocaleString()} Active
                </span>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
              Centralized identity governance and verification terminal
            </p>
          </div>
        </div>
      </div>

      {/* 2. Administrative Action Suite */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Bulk Action Toggle (Optional but Elite) */}
        <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-all group">
          <LuLayers className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Bulk Actions
          </span>
        </button>

        {/* Import Button */}
        <button
          onClick={onImport}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-all group"
        >
          <LuUpload className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Import CSV
          </span>
        </button>

        {/* Primary CTA: Export Users */}
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-primary hover:text-slate-900 transition-all shadow-xl shadow-slate-900/10 group"
        >
          <LuDownload className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-[0.15em]">
            Export User Base
          </span>
        </button>
      </div>
    </div>
  );
};
