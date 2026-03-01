"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuHexagon } from "react-icons/lu";
import { SessionStatus } from "@/context/AuthContext";

interface SessionSplashProps {
  sessionStatus: SessionStatus;
}

export const SessionSplash: React.FC<SessionSplashProps> = ({
  sessionStatus,
}) => {
  const isVisible = sessionStatus === "pending";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="session-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeOut" } }}
          className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center"
          style={{ zIndex: 9999 }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative mb-8"
          >
            <div className="w-20 h-20 bg-slate-900 rounded-[1.75rem] flex items-center justify-center shadow-2xl shadow-slate-900/20 border border-white/10">
              <LuHexagon className="w-9 h-9 text-primary" />
            </div>
            {/* Ping ring */}
            <span className="absolute inset-0 rounded-[1.75rem] border-2 border-primary/30 animate-ping opacity-30" />
          </motion.div>

          {/* Status text */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex flex-col items-center gap-3"
          >
            {/* Animated bar loader */}
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  className="w-1 h-4 bg-slate-900 rounded-full"
                  animate={{ scaleY: [0.4, 1, 0.4] }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">
              Restoring Session...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
