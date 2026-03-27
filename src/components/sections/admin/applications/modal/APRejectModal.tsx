"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { LuCircleAlert, LuX, LuCircleX, LuMessageSquare } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  applicantName: string;
}

export const APRejectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  applicantName,
}) => {
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-background rounded-[3rem] shadow-2xl overflow-hidden"
      >
        <div className="bg-rose-600 p-8 text-background flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-background/20 rounded-2xl flex items-center justify-center mb-4">
            <LuCircleX className="w-8 h-8 text-background" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter">
            Reject Application?
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">
            This will notify {applicantName}
          </p>
        </div>

        <div className="p-10 space-y-6">
          <div className="flex items-start gap-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
            <LuCircleAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-rose-700 uppercase leading-relaxed tracking-tight">
              The applicant will be informed their request was not accepted. You
              can provide a reason below.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <LuMessageSquare className="w-3.5 h-3.5" /> Review Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g., Committee is currently at full capacity..."
              className="w-full bg-muted border border-border rounded-2xl p-5 text-xs font-bold text-foreground outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all min-h-[100px] resize-none"
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => onConfirm(note)}
              className="w-full py-5 bg-rose-600 text-background rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LuCircleX className="w-4 h-4" /> Confirm Rejection
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Keep Pending
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-background/60 hover:text-background transition-colors cursor-pointer"
        >
          <LuX className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
};
