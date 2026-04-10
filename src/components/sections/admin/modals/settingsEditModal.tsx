"use client";
// Reusable create modal for all settings sub-pages.
// Drives a dynamic form from a `fields` prop.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuX, LuSave, LuLoader } from "react-icons/lu";
import { cn } from "@/lib/utils";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "select" | "number" | "textarea";
  required?: boolean;
  options?: string[];
  optionLabels?: string[];
  defaultValue?: string | number;
  placeholder?: string;
}

interface Props {
  isOpen:    boolean;
  onClose:   () => void;
  title:     string;
  fields:    FieldDef[];
  onConfirm: (data: Record<string, unknown>) => Promise<void>;
}

export const SettingsEditModal: React.FC<Props> = ({
  isOpen, onClose, title, fields, onConfirm,
}) => {
  const initValues = () => {
    const v: Record<string, unknown> = {};
    fields.forEach((f) => { v[f.key] = f.defaultValue ?? (f.type === "number" ? 0 : ""); });
    return v;
  };

  const [values,  setValues]  = useState<Record<string, unknown>>(initValues);
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: unknown) => setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try { await onConfirm(values); setValues(initValues()); }
    finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-background rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-foreground transition-colors cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <div className="p-8 space-y-6">
              <h3 className="text-lg font-black text-foreground uppercase tracking-tighter">
                {title}
              </h3>

              {fields.map((f) => (
                <div key={f.key} className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {f.label}
                    {f.required && (
                      <span className="text-rose-500 ml-1">*</span>
                    )}
                  </label>
                  {f.type === "select" ? (
                    <select
                      value={String(values[f.key] ?? "")}
                      onChange={(e) => set(f.key, e.target.value)}
                      className={cn(
                        "w-full bg-muted border border-border rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary transition-all",
                      )}
                    >
                      <option value="">Select {f.label}…</option>
                      {f.options?.map((o, i) => (
                        <option key={o} value={o}>
                          {f.optionLabels?.[i] ?? o}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      value={String(values[f.key] ?? "")}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      rows={3}
                      className={cn(
                        "w-full bg-muted border border-border rounded-2xl p-4 text-sm font-medium outline-none focus:border-primary transition-all resize-none",
                      )}
                    />
                  ) : (
                    <input
                      type={f.type}
                      value={String(values[f.key] ?? "")}
                      onChange={(e) =>
                        set(
                          f.key,
                          f.type === "number"
                            ? parseFloat(e.target.value) || 0
                            : e.target.value,
                        )
                      }
                      placeholder={f.placeholder ?? f.label}
                      className={cn(
                        "w-full bg-muted border border-border rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary transition-all",
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 p-8 pt-0">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-foreground text-background hover:bg-primary hover:text-foreground transition-all shadow-xl cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <LuLoader className="w-4 h-4 animate-spin" />
                ) : (
                  <LuSave className="w-4 h-4" />
                )}
                {loading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};