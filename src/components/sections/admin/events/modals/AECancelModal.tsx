"use client";
// modals/AECancelModal.tsx
// Confirms cancellation of an event (soft action — sets status to "cancelled",
// does NOT delete data or tickets).
// Calls AdminContext.deleteEvent(id, "cancel", token).

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuCircleX, LuTriangleAlert, LuX, LuLoader } from "react-icons/lu";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  eventId: string;
  eventName: string;
}

export const AdminCancelEventModal: React.FC<CancelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  eventId,
  eventName,
}) => {
  const { token } = useAuth();
  const { deleteEvent } = useAdmin();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await deleteEvent(eventId, "cancel", token);
      toast.success(`"${eventName}" has been cancelled`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancellation failed");
    } finally {
      setLoading(false);
    }
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
            className="relative w-full max-w-md bg-background rounded-[2.5rem] shadow-2xl overflow-hidden border border-amber-100"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-foreground transition-colors cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <div className="p-10 text-center">
              {/* Icon */}
              <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-100 relative">
                <LuTriangleAlert className="w-10 h-10 text-amber-500" />
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-background p-1.5 rounded-lg border-2 border-background">
                  <LuCircleX className="w-3 h-3" />
                </div>
              </div>

              <h3 className="text-xl font-black text-foreground uppercase tracking-tighter mb-3">
                Cancel Event
              </h3>
              <p className="text-[11px] font-medium text-muted-foreground leading-relaxed uppercase tracking-wide">
                You&apos;re about to cancel <br />
                <span className="text-amber-600 font-black underline decoration-amber-200 underline-offset-4">
                  &quot;{eventName}&quot;
                </span>
              </p>

              {/* Distinction from delete */}
              <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-left space-y-2">
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                  What happens when you cancel:
                </p>
                <ul className="space-y-1">
                  {[
                    "Event status → cancelled",
                    "Existing tickets remain in user accounts",
                    "New registrations are blocked",
                    "Event data is preserved (not deleted)",
                  ].map((item) => (
                    <li
                      key={item}
                      className="text-[9px] font-bold text-amber-700 uppercase flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-3 p-8 pt-0">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all border border-transparent hover:border-border disabled:opacity-50 cursor-pointer"
              >
                Keep Active
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 text-background rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <>
                    <LuLoader className="w-4 h-4 animate-spin" /> Cancelling…
                  </>
                ) : (
                  <>
                    <LuCircleX className="w-4 h-4" /> Confirm Cancel
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
