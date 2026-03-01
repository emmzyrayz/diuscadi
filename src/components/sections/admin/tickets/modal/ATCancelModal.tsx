"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuCircleAlert,
  LuX,
  LuTicket,
  LuSlash,
  LuMessageSquare,
  LuBan,
} from "react-icons/lu";

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  ticketCode: string;
  userName: string;
}

export const AdminTicketCancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  ticketCode,
  userName,
}) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
      {/* Heavy Backdrop for High-Friction Action */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden"
      >
        {/* Warning Banner */}
        <div className="bg-rose-600 p-8 text-white flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <LuBan className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter">
            Revoke Access?
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">
            This action is irreversible for this ticket code
          </p>
        </div>

        <div className="p-10 space-y-8">
          {/* 1. WarningText & Context */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <LuCircleAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[11px] font-black text-rose-900 uppercase">
                  Warning
                </p>
                <p className="text-[10px] font-bold text-rose-600 uppercase leading-relaxed tracking-tight">
                  Ticket <span className="underline">{ticketCode}</span>{" "}
                  belonging to{" "}
                  <span className="font-black underline">{userName}</span> will
                  be marked as &qout;Cancelled&qout; and rejected at all
                  scanning points.
                </p>
              </div>
            </div>
          </div>

          {/* 2. ReasonInput */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <LuMessageSquare className="w-3.5 h-3.5" /> Internal Cancellation
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Payment dispute, User requested refund, Fraudulent invite code..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs font-bold text-slate-900 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all min-h-[100px] resize-none"
            />
          </div>

          {/* 3 & 4. Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onConfirm(reason)}
              disabled={!reason.trim()}
              className="w-full py-5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-rose-600/20 flex items-center justify-center gap-2"
            >
              <LuSlash className="w-4 h-4" />
              Confirm Cancellation
            </button>

            <button
              onClick={onClose}
              className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              Keep Ticket Active
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
