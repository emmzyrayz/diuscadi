"use client";
// sections/admin/invites/modal/AIGenerateModal.tsx
// Generate 1–50 invite codes in a single batch.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuPlus,
  LuTicket,
  LuLoader,
  LuCopy,
  LuCircleCheck,
  LuCalendar,
  LuUsers,
  LuFileText,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface GeneratedCode {
  id: string;
  code: string;
  maxUses: number;
}

export const AdminGenerateInviteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { token } = useAuth();

  const [count, setCount] = useState(1);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedCode[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleClose = () => {
    setCount(1);
    setMaxUses(1);
    setExpiresAt("");
    setNote("");
    setGenerated([]);
    setCopiedId(null);
    onClose();
  };

  const handleGenerate = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          count,
          maxUses,
          expiresAt: expiresAt || undefined,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate codes");
      setGenerated(data.invites ?? []);
      toast.success(`${data.invites?.length ?? 0} code(s) generated`);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(generated.map((g) => g.code).join("\n"));
    toast.success("All codes copied");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={cn('fixed', 'inset-0', 'z-[110]', 'flex', 'items-center', 'justify-center', 'p-4')}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className={cn('absolute', 'inset-0', 'bg-foreground/60', 'backdrop-blur-sm')}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn('relative', 'w-full', 'max-w-lg', 'bg-background', 'rounded-[2.5rem]', 'shadow-2xl', 'overflow-hidden')}
          >
            <button
              onClick={handleClose}
              className={cn('absolute', 'top-6', 'right-6', 'p-2', 'text-slate-300', 'hover:text-foreground', 'transition-colors', 'cursor-pointer')}
            >
              <LuX className={cn('w-5', 'h-5')} />
            </button>

            <div className="p-8">
              {/* Header */}
              <div className={cn('flex', 'items-center', 'gap-3', 'mb-8')}>
                <div className={cn('w-10', 'h-10', 'rounded-xl', 'bg-foreground', 'text-background', 'flex', 'items-center', 'justify-center')}>
                  <LuTicket className={cn('w-5', 'h-5')} />
                </div>
                <div>
                  <h3 className={cn('text-lg', 'font-black', 'text-foreground', 'uppercase', 'tracking-tighter')}>
                    Generate Codes
                  </h3>
                  <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                    Create batch invite codes
                  </p>
                </div>
              </div>

              {generated.length === 0 ? (
                /* ── Form ── */
                <div className="space-y-5">
                  {/* Count + MaxUses */}
                  <div className={cn('grid', 'grid-cols-2', 'gap-4')}>
                    <div className="space-y-2">
                      <label className={cn('flex', 'items-center', 'gap-1.5', 'text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                        <LuPlus className={cn('w-3', 'h-3')} /> Quantity (max 50)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={count}
                        onChange={(e) =>
                          setCount(
                            Math.min(
                              50,
                              Math.max(1, parseInt(e.target.value) || 1),
                            ),
                          )
                        }
                        className={cn(
                          "w-full",
                          "bg-muted",
                          "border",
                          "border-border",
                          "rounded-2xl",
                          "p-4",
                          "text-sm",
                          "font-black",
                          "outline-none",
                          "focus:border-primary",
                          "transition-all",
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={cn('flex', 'items-center', 'gap-1.5', 'text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                        <LuUsers className={cn('w-3', 'h-3')} /> Max Uses
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={maxUses}
                        onChange={(e) =>
                          setMaxUses(
                            Math.min(
                              100,
                              Math.max(1, parseInt(e.target.value) || 1),
                            ),
                          )
                        }
                        className={cn(
                          "w-full",
                          "bg-muted",
                          "border",
                          "border-border",
                          "rounded-2xl",
                          "p-4",
                          "text-sm",
                          "font-black",
                          "outline-none",
                          "focus:border-primary",
                          "transition-all",
                        )}
                      />
                    </div>
                  </div>

                  {/* Expiry */}
                  <div className="space-y-2">
                    <label className={cn('flex', 'items-center', 'gap-1.5', 'text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                      <LuCalendar className={cn('w-3', 'h-3')} /> Expires At (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className={cn(
                        "w-full",
                        "bg-muted",
                        "border",
                        "border-border",
                        "rounded-2xl",
                        "p-4",
                        "text-sm",
                        "font-medium",
                        "outline-none",
                        "focus:border-primary",
                        "transition-all",
                      )}
                    />
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <label className={cn('flex', 'items-center', 'gap-1.5', 'text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                      <LuFileText className={cn('w-3', 'h-3')} /> Note (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. For UNIZIK batch 2026"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className={cn(
                        "w-full",
                        "bg-muted",
                        "border",
                        "border-border",
                        "rounded-2xl",
                        "p-4",
                        "text-sm",
                        "font-medium",
                        "outline-none",
                        "focus:border-primary",
                        "transition-all",
                      )}
                    />
                  </div>
                </div>
              ) : (
                /* ── Generated codes list ── */
                <div className="space-y-4">
                  <div className={cn('flex', 'items-center', 'justify-between')}>
                    <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                      {generated.length} Code{generated.length > 1 ? "s" : ""}{" "}
                      Created
                    </p>
                    {generated.length > 1 && (
                      <button
                        onClick={copyAll}
                        className={cn('flex', 'items-center', 'gap-1.5', 'px-3', 'py-1.5', 'bg-muted', 'rounded-xl', 'text-[9px]', 'font-black', 'uppercase', 'tracking-widest', 'hover:bg-slate-200', 'transition-colors', 'cursor-pointer')}
                      >
                        <LuCopy className={cn('w-3', 'h-3')} /> Copy All
                      </button>
                    )}
                  </div>
                  <div className={cn('max-h-64', 'overflow-y-auto', 'space-y-2', 'pr-1')}>
                    {generated.map((g) => (
                      <div
                        key={g.id}
                        className={cn('flex', 'items-center', 'justify-between', 'p-4', 'bg-muted', 'rounded-2xl', 'border', 'border-border')}
                      >
                        <div>
                          <p className={cn('text-sm', 'font-black', 'text-foreground', 'font-mono', 'tracking-widest', 'uppercase')}>
                            {g.code}
                          </p>
                          <p className={cn('text-[9px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-0.5')}>
                            Max {g.maxUses} use{g.maxUses > 1 ? "s" : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => copyCode(g.id, g.code)}
                          className={cn('p-2', 'hover:bg-slate-200', 'rounded-xl', 'text-muted-foreground', 'hover:text-foreground', 'transition-colors', 'cursor-pointer')}
                        >
                          <AnimatePresence mode="wait">
                            {copiedId === g.id ? (
                              <motion.div
                                key="c"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <LuCircleCheck className={cn('w-4', 'h-4', 'text-emerald-500')} />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="u"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <LuCopy className={cn('w-4', 'h-4')} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={cn('flex', 'items-center', 'gap-3', 'p-8', 'pt-0')}>
              <button
                onClick={handleClose}
                disabled={loading}
                className={cn('flex-1', 'px-6', 'py-4', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-muted-foreground', 'hover:bg-muted', 'transition-all', 'cursor-pointer')}
              >
                {generated.length > 0 ? "Done" : "Cancel"}
              </button>
              {generated.length === 0 && (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className={cn('flex-1', 'flex', 'items-center', 'justify-center', 'gap-2', 'px-6', 'py-4', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'bg-foreground', 'text-background', 'hover:bg-primary', 'hover:text-foreground', 'transition-all', 'shadow-xl', 'cursor-pointer', 'disabled:opacity-70')}
                >
                  {loading ? (
                    <>
                      <LuLoader className={cn('w-4', 'h-4', 'animate-spin')} /> Generating…
                    </>
                  ) : (
                    <>
                      <LuPlus className={cn('w-4', 'h-4')} /> Generate
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
