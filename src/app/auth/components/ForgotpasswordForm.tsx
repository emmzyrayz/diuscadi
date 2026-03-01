"use client";
import React, { useState } from "react";
import { LuMail, LuSend } from "react-icons/lu";
import { AuthInput } from "./AuthInput";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export const ForgotPasswordForm: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
    // Redirect to verify page after a beat
    setTimeout(() => router.push("/auth/verify"), 1500);
  };

  return (
    <AnimatePresence mode="wait">
      {!submitted ? (
        <motion.form
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 w-full"
          onSubmit={handleSubmit}
        >
          <AuthInput label="Campus Email" icon={LuMail} type="email" required />

          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center leading-relaxed px-4">
            Enter the email address associated with your DIUSCADI account and
            we&apos;ll send a secure reset link.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-slate-900 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8,
                    ease: "linear",
                  }}
                  className="w-3 h-3 border-2 border-current border-t-transparent rounded-full inline-block"
                />
                Sending Link...
              </>
            ) : (
              <>
                <LuSend className="w-3 h-3" />
                Send Reset Link
              </>
            )}
          </button>
        </motion.form>
      ) : (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-4 py-4"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <LuSend className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
            Reset link sent — redirecting…
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
