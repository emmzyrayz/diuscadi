"use client";
import React, { useState } from "react";
import { LuX, LuCamera, LuKeyboard, LuShieldCheck } from "react-icons/lu";

export const TicketScannerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [manualCode, setManualCode] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 z-20"
        >
          <LuX className="w-6 h-6" />
        </button>

        <div className="p-10 flex flex-col items-center text-center">
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">
            Validate Entry
          </h3>

          {/* 1. CameraScanner Placeholder */}
          <div className="w-full aspect-square bg-slate-900 rounded-[2.5rem] relative flex items-center justify-center overflow-hidden border-4 border-slate-100 mb-8">
            <div className="absolute inset-0 border-40 border-slate-900/50 z-10" />{" "}
            {/* Framing effect */}
            <LuCamera className="w-12 h-12 text-slate-700 animate-pulse" />
            <p className="absolute bottom-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              Camera Active
            </p>
            {/* Animated Scanning Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary shadow-[0_0_15px_rgba(255,255,0,0.5)] animate-scan" />
          </div>

          <div className="w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                OR
              </span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {/* 2. ManualCodeInput */}
            <div className="relative group">
              <LuKeyboard className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Enter Invite or Ticket Code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 text-sm font-black uppercase tracking-widest outline-none focus:border-primary transition-all"
              />
            </div>

            <button className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary hover:text-slate-900 transition-all">
              <LuShieldCheck className="w-5 h-5" />
              Verify Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
