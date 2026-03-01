"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { LuMailCheck, LuRefreshCw } from "react-icons/lu";
import Link from "next/link";

export const VerifyEmailView: React.FC = () => {
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="relative"
      >
        <div className="w-20 h-20 rounded-[1.75rem] bg-slate-50 border border-slate-100 flex items-center justify-center">
          <LuMailCheck className="w-9 h-9 text-slate-900" />
        </div>
        {/* Ping ring */}
        <span className="absolute inset-0 rounded-[1.75rem] border-2 border-primary/30 animate-ping opacity-40" />
      </motion.div>

      {/* Instructions */}
      <div className="text-center space-y-2 px-4">
        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
          Verification Email Sent
        </p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          Click the link in your inbox to activate your account. It may take a
          minute to arrive.
        </p>
      </div>

      {/* Resend */}
      <div className="w-full flex flex-col items-center gap-4">
        <button
          onClick={handleResend}
          disabled={loading || resent}
          className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors disabled:opacity-50"
        >
          <motion.span
            animate={loading ? { rotate: 360 } : { rotate: 0 }}
            transition={
              loading ? { repeat: Infinity, duration: 0.7, ease: "linear" } : {}
            }
          >
            <LuRefreshCw className="w-3 h-3" />
          </motion.span>
          {resent ? "Email Resent!" : loading ? "Resending..." : "Resend Email"}
        </button>

        <div className="pt-4 border-t border-slate-50 w-full flex justify-center">
          <Link
            href="/auth"
            className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
