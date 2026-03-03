"use client";
import React, { useState, useEffect, useCallback } from "react";
import { LuMail, LuSend, LuArrowLeft, LuCircleCheck } from "react-icons/lu";
import { AuthInput } from "./AuthInput";
import { OtpInput } from "./OTPInput";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = "request" | "verify";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const RESEND_COOLDOWN = 60;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.28, ease: EASE } },
  exit: (dir: number) => ({
    x: dir > 0 ? -40 : 40,
    opacity: 0,
    transition: { duration: 0.2, ease: EASE },
  }),
};

export const ForgotPasswordForm: React.FC = () => {
  const { forgotPassword, verifyResetOtp, error, clearError } = useAuth();
  const router = useRouter();

  // ── Step state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("request");
  const [dir, setDir] = useState(1);

  // ── Request step ──────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  // ── Verify step ───────────────────────────────────────────────────────────
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");

  // ── Resend cooldown ───────────────────────────────────────────────────────
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // ── Step 1: Request OTP ───────────────────────────────────────────────────
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    clearError();

    if (!email.trim()) {
      setLocalErr("Please enter your email address.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setLocalErr("Enter a valid email address.");
      return;
    }

    setRequesting(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setDir(1);
      setStep("verify");
      setCooldown(RESEND_COOLDOWN);
    } catch {
      // error already set in AuthContext
    } finally {
      setRequesting(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setResending(true);
    setOtpError("");
    try {
      await forgotPassword(email.trim().toLowerCase());
      setResent(true);
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(6).fill(""));
      setTimeout(() => setResent(false), 3000);
    } catch {
      setOtpError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerify = useCallback(async () => {
    const code = digits.join("");
    if (code.length < 6) {
      setOtpError("Please enter all 6 digits.");
      return;
    }

    setVerifying(true);
    setOtpError("");
    clearError();

    try {
      // Returns a short-lived resetToken (10 min) from /api/auth/verify-reset
      const resetToken = await verifyResetOtp(email.trim().toLowerCase(), code);
      // Carry token to reset-password page — never store in localStorage
      router.push(
        `/auth/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(email)}`,
      );
    } catch (err: unknown) {
      setOtpError(
        err instanceof Error ? err.message : "Invalid or expired code.",
      );
      setDigits(Array(6).fill(""));
    } finally {
      setVerifying(false);
    }
  }, [digits, email, verifyResetOtp, router, clearError]);

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (digits.every((d) => d !== "") && !verifying) {
      handleVerify();
    }
  }, [digits, verifying, handleVerify]);

  const displayError = localErr ?? error?.message ?? null;

  return (
    <div className="w-full space-y-5">
      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            {step === "request" ? "Request Reset" : "Verify Code"}
          </span>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            {step === "request" ? "1" : "2"} / 2
          </span>
        </div>
        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-slate-900 rounded-full"
            animate={{ width: step === "request" ? "50%" : "100%" }}
            transition={{ duration: 0.4, ease: EASE }}
          />
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {displayError && (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl"
          >
            <p className="text-[10px] font-bold text-red-500">{displayError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step slides ───────────────────────────────────────────────────── */}
      <div className="overflow-hidden">
        <AnimatePresence custom={dir} mode="wait">
          {/* STEP 1 — Email input */}
          {step === "request" && (
            <motion.form
              key="request"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-5"
              onSubmit={handleRequest}
            >
              <AuthInput
                label="Email Address"
                icon={LuMail}
                type="email"
                value={email}
                onChange={(e) => {
                  clearError();
                  setLocalErr(null);
                  setEmail(e.target.value);
                }}
                autoComplete="email"
              />

              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center leading-relaxed px-2">
                Enter the email address linked to your DIUSCADI account.
                We&apos;ll send a 6-digit reset code.
              </p>

              <button
                type="submit"
                disabled={requesting}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-secondary hover:text-slate-900 hover:border-primary border border-transparent transition-all duration-700 shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {requesting ? (
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
                    Sending Code...
                  </>
                ) : (
                  <>
                    <LuSend className="w-3 h-3" />
                    Send Reset Code
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* STEP 2 — OTP verification */}
          {step === "verify" && (
            <motion.div
              key="verify"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-5"
            >
              {/* Sent-to badge */}
              <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
                <LuCircleCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <p className="text-[9px] font-bold text-slate-500 tracking-wide truncate">
                  Code sent to <span className="text-slate-900">{email}</span>
                </p>
              </div>

              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center leading-relaxed">
                Enter the 6-digit code from your email to continue.
              </p>

              {/* OTP-level error */}
              <AnimatePresence>
                {otpError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] font-bold text-red-500 text-center"
                  >
                    {otpError}
                  </motion.p>
                )}
              </AnimatePresence>

              <OtpInput
                value={digits}
                onChange={setDigits}
                error={otpError}
                disabled={verifying}
              />

              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying || digits.some((d) => !d)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-secondary hover:text-slate-900 hover:border-primary border border-transparent transition-all duration-700 shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.7,
                        ease: "linear",
                      }}
                      className="w-3 h-3 border-2 border-current border-t-transparent rounded-full inline-block"
                    />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </button>

              {/* Change email + resend row */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDir(-1);
                    setStep("request");
                    setDigits(Array(6).fill(""));
                    setOtpError("");
                    clearError();
                  }}
                  className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                >
                  <LuArrowLeft className="w-3 h-3" />
                  Change Email
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0}
                  className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {resent
                    ? "Code Resent!"
                    : resending
                      ? "Resending..."
                      : cooldown > 0
                        ? `Resend in ${cooldown}s`
                        : "Resend Code"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};