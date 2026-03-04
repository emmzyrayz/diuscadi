"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuMailCheck,
  LuRefreshCw,
  LuLink,
  LuKeyRound,
  LuCircleCheck,
  LuTriangleAlert,
} from "react-icons/lu";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { OtpInput } from "./OTPInput";
import { useAuth } from "@/context/AuthContext";
import { cn } from "../../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "code" | "link";
type TokenState = "idle" | "checking" | "success" | "failed";

const RESEND_COOLDOWN = 60; // seconds

const tabVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 20 }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -20,
    transition: { duration: 0.2 },
  }),
};

// ─── Component ────────────────────────────────────────────────────────────────
export const VerifyEmailView: React.FC = () => {
  const { verifyEmail, resendVerification, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL params set by signup redirect
  const emailParam = searchParams.get("email") ?? "";
  const tokenParam = searchParams.get("token") ?? "";

  // ── Tab state ───────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("code");
  const [tabDir, setTabDir] = useState(1);

  // ── OTP code state ──────────────────────────────────────────────────────────
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [codeError, setCodeError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  // ── Magic link token state ──────────────────────────────────────────────────
  const [tokenState, setTokenState] = useState<TokenState>(
    tokenParam ? "checking" : "idle",
  );

  // ── Resend state ────────────────────────────────────────────────────────────
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState("");

  // ── Cooldown ticker ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // ── Auto-verify magic link token on mount ───────────────────────────────────
  // If ?token= is in the URL, hit GET /api/auth/verify?token= directly.
  // Do NOT call verifyEmail() here — that hits the POST (OTP) endpoint and
  // would either fail or interfere with the token lookup.
  useEffect(() => {
    if (!tokenParam) return;

    const verifyToken = async () => {
      setTokenState("checking");
      try {
        const res = await fetch(
          `/api/auth/verify?token=${encodeURIComponent(tokenParam)}`,
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Invalid or expired link.");
        }
        setTokenState("success");
        setVerified(true);
        setTimeout(() => router.push("/auth"), 1800);
      } catch {
        setTokenState("failed");
        // Strip token from URL so the user sees the clean code fallback
        const url = new URL(window.location.href);
        url.searchParams.delete("token");
        window.history.replaceState({}, "", url.toString());
      }
    };

    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tab switch ──────────────────────────────────────────────────────────────
  const switchTab = (next: Tab) => {
    setTabDir(next === "code" ? -1 : 1);
    setTab(next);
    setCodeError("");
    clearError();
  };

  // ── Resend ──────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!emailParam) {
      setResendError("Email not found in URL. Please return to signup.");
      return;
    }
    setResending(true);
    setResendError("");
    try {
      await resendVerification(emailParam);
      setResent(true);
      setCooldown(RESEND_COOLDOWN);
      setTimeout(() => setResent(false), 3000);
    } catch {
      setResendError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // ── Verify OTP code ─────────────────────────────────────────────────────────
  const handleVerifyCode = useCallback(async () => {
    const code = digits.join("");
    if (code.length < 6) {
      setCodeError("Please enter all 6 digits.");
      return;
    }

    setVerifying(true);
    setCodeError("");
    clearError();

    try {
      await verifyEmail(code, emailParam);
      setVerified(true);
      setTimeout(() => router.push("/auth"), 1800);
    } catch (err: unknown) {
      setCodeError(
        err instanceof Error ? err.message : "Invalid or expired code.",
      );
      setDigits(Array(6).fill(""));
    } finally {
      setVerifying(false);
    }
  }, [digits, emailParam, verifyEmail, router, clearError]);

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (digits.every((d) => d !== "") && !verifying && !verified) {
      handleVerifyCode();
    }
  }, [digits, verifying, verified, handleVerifyCode]);

  // ── Verified success screen ──────────────────────────────────────────────────
  if (verified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
        className={cn('flex', 'flex-col', 'items-center', 'gap-5', 'py-4')}
      >
        <div className={cn('w-16', 'h-16', 'rounded-[1.5rem]', 'bg-emerald-50', 'border', 'border-emerald-100', 'flex', 'items-center', 'justify-center')}>
          <LuCircleCheck className={cn('w-8', 'h-8', 'text-emerald-600')} />
        </div>
        <div className={cn('text-center', 'space-y-1')}>
          <p className={cn('text-[10px]', 'font-black', 'text-slate-900', 'uppercase', 'tracking-widest')}>
            Account Verified
          </p>
          <p className={cn('text-[9px]', 'font-bold', 'text-slate-400', 'uppercase', 'tracking-widest')}>
            Redirecting you to sign in…
          </p>
        </div>
      </motion.div>
    );
  }

  // ── Checking magic link screen ───────────────────────────────────────────────
  if (tokenState === "checking") {
    return (
      <div className={cn('flex', 'flex-col', 'items-center', 'gap-5', 'py-4')}>
        <div className={cn('w-16', 'h-16', 'rounded-[1.5rem]', 'bg-slate-50', 'border', 'border-slate-100', 'flex', 'items-center', 'justify-center')}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            className={cn('w-7', 'h-7', 'border-2', 'border-slate-200', 'border-t-slate-900', 'rounded-full')}
          />
        </div>
        <p className={cn('text-[9px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'text-center')}>
          Verifying your magic link…
        </p>
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────────
  return (
    <div className={cn('flex', 'flex-col', 'items-center', 'gap-6', 'w-full')}>
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative"
      >
        <div className={cn('w-16', 'h-16', 'rounded-[1.5rem]', 'bg-slate-50', 'border', 'border-slate-100', 'flex', 'items-center', 'justify-center')}>
          <LuMailCheck className={cn('w-7', 'h-7', 'text-slate-900')} />
        </div>
        <span className={cn('absolute', 'inset-0', 'rounded-[1.5rem]', 'border-2', 'border-primary/30', 'animate-ping', 'opacity-30')} />
      </motion.div>

      {/* Magic link failed notice */}
      <AnimatePresence>
        {tokenState === "failed" && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn('w-full', 'flex', 'items-start', 'gap-2.5', 'px-4', 'py-3', 'bg-amber-50', 'border', 'border-amber-100', 'rounded-xl')}
          >
            <LuTriangleAlert className={cn('w-3.5', 'h-3.5', 'text-amber-500', 'mt-0.5', 'shrink-0')} />
            <p className={cn('text-[9px]', 'font-bold', 'text-amber-700', 'leading-relaxed')}>
              The magic link was invalid or has expired. Enter your 6-digit code
              below instead.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instruction */}
      <p className={cn('text-[9px]', 'font-bold', 'text-slate-400', 'uppercase', 'tracking-widest', 'text-center', 'leading-relaxed', 'px-2')}>
        {emailParam
          ? `A 6-digit code and a magic link were sent to ${emailParam} and your registered phone.`
          : "A 6-digit code and a magic link were sent to your email and phone."}
      </p>

      {/* Tab switcher */}
      <div className={cn('flex', 'w-full', 'bg-slate-50', 'border', 'border-slate-100', 'rounded-2xl', 'p-1', 'gap-1')}>
        {(["code", "link"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={cn('relative', 'flex-1', 'flex', 'items-center', 'justify-center', 'gap-2', 'py-2.5', 'rounded-xl', 'text-[9px]', 'font-black', 'uppercase', 'tracking-widest', 'transition-colors')}
          >
            {tab === t && (
              <motion.span
                layoutId="verify-tab-pill"
                className={cn('absolute', 'inset-0', 'bg-white', 'border', 'border-slate-200', 'rounded-xl', 'shadow-sm')}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span
              className={`relative z-10 flex items-center gap-1.5 ${tab === t ? "text-slate-900" : "text-slate-400"}`}
            >
              {t === "code" ? (
                <LuKeyRound className={cn('w-3', 'h-3')} />
              ) : (
                <LuLink className={cn('w-3', 'h-3')} />
              )}
              {t === "code" ? "Enter Code" : "Magic Link"}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={cn('w-full', 'overflow-hidden')}>
        <AnimatePresence mode="wait" custom={tabDir}>
          {/* Code tab */}
          {tab === "code" && (
            <motion.div
              key="code-tab"
              custom={tabDir}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className={cn('flex', 'flex-col', 'items-center', 'gap-5', 'w-full')}
            >
              {/* API-level error */}
              <AnimatePresence>
                {(codeError || error?.message) && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn('text-[10px]', 'font-bold', 'text-red-500', 'text-center')}
                  >
                    {codeError || error?.message}
                  </motion.p>
                )}
              </AnimatePresence>

              <OtpInput
                value={digits}
                onChange={setDigits}
                error={codeError}
                disabled={verifying}
              />

              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={verifying || digits.some((d) => !d)}
                className={cn('w-full', 'py-4', 'bg-slate-900', 'text-white', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-[0.2em]', 'hover:bg-primary', 'hover:text-slate-900', 'transition-all', 'shadow-xl', 'shadow-slate-900/10', 'disabled:opacity-50', 'disabled:cursor-not-allowed', 'flex', 'items-center', 'justify-center', 'gap-2')}
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
                      className={cn('w-3', 'h-3', 'border-2', 'border-current', 'border-t-transparent', 'rounded-full', 'inline-block')}
                    />
                    Verifying…
                  </>
                ) : (
                  "Verify Account"
                )}
              </button>
            </motion.div>
          )}

          {/* Magic link tab */}
          {tab === "link" && (
            <motion.div
              key="link-tab"
              custom={tabDir}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className={cn('flex', 'flex-col', 'items-center', 'gap-4', 'text-center')}
            >
              <p className={cn('text-[9px]', 'font-bold', 'text-slate-400', 'uppercase', 'tracking-widest', 'leading-relaxed', 'px-4')}>
                Click the link in your inbox to instantly verify your account.
                No code needed.
              </p>
              <div className={cn('w-full', 'p-4', 'bg-slate-50', 'border', 'border-slate-100', 'rounded-2xl')}>
                <p className={cn('text-[8px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest')}>
                  Link expires in{" "}
                  <span className="text-slate-900">15 minutes</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Resend row */}
      <div className={cn('flex', 'flex-col', 'items-center', 'gap-3', 'w-full', 'pt-2')}>
        <AnimatePresence>
          {resendError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn('text-[9px]', 'font-bold', 'text-red-400', 'text-center')}
            >
              {resendError}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className={cn('flex', 'items-center', 'gap-2', 'text-[9px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest', 'hover:text-slate-900', 'transition-colors', 'disabled:opacity-40', 'disabled:cursor-not-allowed')}
        >
          <motion.span
            animate={resending ? { rotate: 360 } : {}}
            transition={
              resending
                ? { repeat: Infinity, duration: 0.7, ease: "linear" }
                : {}
            }
          >
            <LuRefreshCw className={cn('w-3', 'h-3')} />
          </motion.span>
          {resent
            ? "Code & Link Resent!"
            : resending
              ? "Resending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend Code & Link"}
        </button>

        <div className={cn('pt-4', 'border-t', 'border-slate-50', 'w-full', 'flex', 'justify-center')}>
          <Link
            href="/auth"
            className={cn('text-[9px]', 'font-black', 'text-slate-300', 'uppercase', 'tracking-widest', 'hover:text-slate-600', 'transition-colors')}
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
