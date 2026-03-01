"use client";
import React from "react";
import { motion } from "framer-motion";

interface AuthCardProps {
  children: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children }) => {
  return (
    <motion.div
      key="auth-card"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      // GPU-accelerated: force compositing layer for smooth glassmorphism on all devices
      style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
      className="w-full max-w-md"
    >
      <div
        className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 relative overflow-hidden"
        // Isolate stacking context so backdrop-filter renders correctly on mobile Safari
        style={{ isolation: "isolate" }}
      >
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          className="relative z-10 flex flex-col gap-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.08,
                delayChildren: 0.15,
              },
            },
          }}
        >
          {React.Children.map(children, (child, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                },
              }}
            >
              {child}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom Legal/Utility Links */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed px-10"
      >
        By continuing, you agree to the{" "}
        <span className="text-slate-900 cursor-pointer hover:underline">
          Terms of Service
        </span>{" "}
        and{" "}
        <span className="text-slate-900 cursor-pointer hover:underline">
          Privacy Policy
        </span>
        .
      </motion.p>
    </motion.div>
  );
};