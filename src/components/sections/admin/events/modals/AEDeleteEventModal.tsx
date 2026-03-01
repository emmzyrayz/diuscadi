"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuTrash2, LuTriangleAlert, LuX } from "react-icons/lu";

// 1. TypeScript Interface
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventName: string; // Dynamic name for context
}

export const AdminDeleteEventModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  eventName,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          {/* Backdrop with Heavy Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-rose-100"
          >
            {/* Header / Close */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors"
            >
              <LuX className="w-5 h-5" />
            </button>

            <div className="p-10 text-center">
              {/* 2. Warning Icon */}
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-100 relative">
                <LuTriangleAlert className="w-10 h-10 text-rose-500 animate-pulse" />
                <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-1.5 rounded-lg border-2 border-white">
                  <LuTrash2 className="w-3 h-3" />
                </div>
              </div>

              {/* 3. Confirmation Text */}
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-3">
                Confirm Deletion
              </h3>
              <p className="text-[11px] font-medium text-slate-500 leading-relaxed uppercase tracking-wide">
                Are you sure you want to delete <br />
                <span className="text-rose-600 font-black underline decoration-rose-200 underline-offset-4">
                  &qout;{eventName}&qout;
                </span>
                ?
              </p>

              <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  This action is permanent and cannot be undone. All ticket data
                  associated with this event will be archived.
                </p>
              </div>
            </div>

            {/* 4. Action Footer */}
            <div className="flex items-center gap-3 p-8 pt-0">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
              >
                Cancel
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