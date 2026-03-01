"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuTrash2, LuTriangleAlert, LuX, LuUserX } from "react-icons/lu";

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  userEmail: string;
}

export const AdminUserDeleteModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  userEmail,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4">
          {/* 1. Backdrop with heavy "Danger Zone" blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-md bg-white rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(225,29,72,0.3)] overflow-hidden border border-rose-100"
          >
            {/* Header Close */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors"
            >
              <LuX className="w-5 h-5" />
            </button>

            <div className="p-10 text-center">
              {/* 2. WarningIcon - Pulse Animation */}
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 bg-rose-500/20 rounded-[2.5rem] animate-ping" />
                <div className="relative w-full h-full bg-rose-50 rounded-[2.5rem] border-2 border-rose-100 flex items-center justify-center">
                  <LuUserX className="w-10 h-10 text-rose-600" />
                </div>
              </div>

              {/* 3. ConfirmationText */}
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                Purge User Data?
              </h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed px-4">
                You are about to permanently delete the profile for:
              </p>

              <div className="mt-4 p-5 bg-rose-50/50 rounded-2xl border border-rose-100 inline-block w-full">
                <p className="text-sm font-black text-rose-700">{userName}</p>
                <p className="text-[10px] font-medium text-rose-500 font-mono mt-1">
                  {userEmail}
                </p>
              </div>

              <div className="mt-6 flex items-start gap-3 text-left p-4 bg-slate-50 rounded-2xl">
                <LuTriangleAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[9px] font-bold text-slate-500 uppercase leading-normal tracking-tight">
                  <span className="text-slate-900 font-black">Warning:</span>{" "}
                  All associated tickets, workshop registrations, and digital
                  certificates for this user will be invalidated immediately.
                </p>
              </div>
            </div>

            {/* 4. Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 p-8 pt-0">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
              >
                Keep Profile
              </button>

              <button
                onClick={onConfirm}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 active:scale-95"
              >
                <LuTrash2 className="w-4 h-4" />
                Confirm Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};