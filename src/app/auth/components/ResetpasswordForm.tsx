"use client";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuLock,
  LuShieldCheck,
  LuCircleCheck,
  LuCircle,
  LuTriangleAlert,
} from "react-icons/lu";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthInput } from "./AuthInput";
import { useAuth } from "@/context/AuthContext";

// ─── Password strength ────────────────────────────────────────────────────────

interface StrengthRule {
  label: string;
  test: (pw: string) => boolean;
}

const RULES: StrengthRule[] = [
  { label: "8+ characters", test: (pw) => pw.length >= 8 },
  { label: "Uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "Number", test: (pw) => /\d/.test(pw) },
  { label: "Special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const getStrength = (pw: string): number =>
  RULES.filter((r) => r.test(pw)).length;

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong", "Excellent"];
const STRENGTH_BAR_COLORS = [
  "text-muted",
  "bg-rose-400",
  "bg-orange-400",
  "bg-amber-400",
  "bg-emerald-400",
  "bg-emerald-500",
];
const STRENGTH_TEXT_COLORS = [
  "",
  "text-rose-400",
  "text-orange-400",
  "text-amber-500",
  "text-emerald-500",
  "text-emerald-600",
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─── Component ────────────────────────────────────────────────────────────────

export const ResetPasswordForm: React.FC = () => {
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Read params directly — no useEffect needed ───────────────────────────
  // The parent <Suspense> boundary ensures useSearchParams() is populated
  // before this component renders. useMemo reads synchronously with no
  // cascading setState.
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const email = useMemo(() => searchParams.get("email") ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [done, setDone] = useState(false);

  const strength = getStrength(password);

  // ── Guard: no token after hydration — user landed here directly ───────────
  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <LuTriangleAlert className="w-5 h-5 text-amber-500" />
        </div>
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center leading-relaxed px-4">
          Invalid or missing reset token.{" "}
          <button
            type="button"
            onClick={() => router.push("/auth/forgot-password")}
            className="text-foreground underline underline-offset-2"
          >
            Request a new reset code.
          </button>
        </p>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="flex flex-col items-center gap-5 py-4"
      >
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center"
        >
          <LuCircleCheck className="w-8 h-8 text-emerald-600" />
        </motion.div>
        <div className="text-center space-y-1">
          <p className="text-[10px] font-black text-foreground uppercase tracking-widest">
            Password Updated
          </p>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            Redirecting you to sign in…
          </p>
        </div>
      </motion.div>
    );
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setConfirmError("");
    clearError();

    let valid = true;

    if (strength < 3) {
      setPwError("Password is too weak — meet at least 3 requirements.");
      valid = false;
    }
    if (password !== confirm) {
      setConfirmError("Passwords do not match.");
      valid = false;
    }
    if (!valid) return;

    try {
      await resetPassword(token, password);
      setDone(true);
    } catch {
      // error already set in AuthContext
    }
  };

  const displayError = error?.message ?? null;

  return (
    <form className="w-full space-y-5" onSubmit={handleSubmit}>
      {/* ── Sent-to badge ──────────────────────────────────────────────── */}
      {email && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-muted border border-border rounded-xl">
          <LuCircleCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <p className="text-[9px] font-bold text-muted-foreground tracking-wide truncate">
            Resetting password for{" "}
            <span className="text-foreground">{email}</span>
          </p>
        </div>
      )}

      {/* ── API error banner ──────────────────────────────────────────── */}
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

      {/* ── Password field ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <AuthInput
          label="New Password"
          icon={LuLock}
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPwError("");
            clearError();
          }}
          autoComplete="new-password"
        />
        {pwError && (
          <p className="text-[9px] font-bold text-red-400 px-1">{pwError}</p>
        )}

        {/* Strength meter */}
        <AnimatePresence>
          {password.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="space-y-2.5 px-1 overflow-hidden"
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      i < strength
                        ? STRENGTH_BAR_COLORS[strength]
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                  Strength
                </span>
                <span
                  className={`text-[8px] font-black uppercase tracking-widest ${STRENGTH_TEXT_COLORS[strength]}`}
                >
                  {STRENGTH_LABELS[strength]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-0.5">
                {RULES.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <div key={rule.label} className="flex items-center gap-1.5">
                      {passed ? (
                        <LuCircleCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                      ) : (
                        <LuCircle className="w-3 h-3 text-slate-200 shrink-0" />
                      )}
                      <span
                        className={`text-[8px] font-bold uppercase tracking-wider transition-colors ${passed ? "text-slate-600" : "text-slate-300"}`}
                      >
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Confirm password ──────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <AuthInput
          label="Confirm New Password"
          icon={LuShieldCheck}
          type="password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setConfirmError("");
            clearError();
          }}
          autoComplete="new-password"
        />
        {confirmError && (
          <p className="text-[9px] font-bold text-red-400 px-1">
            {confirmError}
          </p>
        )}
      </div>

      {/* ── Submit ────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-secondary hover:text-foreground hover:border-primary border border-transparent transition-all duration-700 shadow-xl shadow-foreground/10 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
              className="w-3 h-3 border-2 border-current border-t-transparent rounded-full inline-block"
            />
            Saving...
          </>
        ) : (
          <>
            <LuShieldCheck className="w-3 h-3" />
            Set New Password
          </>
        )}
      </button>
    </form>
  );
};
