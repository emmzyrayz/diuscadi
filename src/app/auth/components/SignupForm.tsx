"use client";
import React, { useState } from "react";
import {
  LuUser,
  LuMail,
  LuLock,
  LuShieldCheck,
  LuPhone,
  LuArrowRight,
  LuArrowLeft,
  LuCheck,
} from "react-icons/lu";
import { AuthInput } from "./AuthInput";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, SignupData } from "@/context/AuthContext";
import type { EduStatus } from "@/types/domain";

// ─── Country codes ────────────────────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: 234, label: "🇳🇬 +234" },
  { code: 1, label: "🇺🇸 +1" },
  { code: 44, label: "🇬🇧 +44" },
  { code: 233, label: "🇬🇭 +233" },
  { code: 27, label: "🇿🇦 +27" },
  { code: 254, label: "🇰🇪 +254" },
  { code: 251, label: "🇪🇹 +251" },
  { code: 255, label: "🇹🇿 +255" },
  { code: 256, label: "🇺🇬 +256" },
  { code: 212, label: "🇲🇦 +212" },
];

// ─── Step metadata ────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Personal", hint: "Tell us who you are" },
  { label: "Contact", hint: "How we'll reach you" },
  { label: "Security", hint: "Protect your account" },
];
const TOTAL_STEPS = STEPS.length;

// ─── Form state ───────────────────────────────────────────────────────────────
interface FormState {
  // Step 1
  firstName: string;
  lastName: string;
  eduStatus: EduStatus;
  // Step 2
  email: string;
  countryCode: number;
  phoneNumber: string;
  schoolEmail: string;
  // Step 3
  password: string;
  confirmPassword: string;
}

const INITIAL: FormState = {
  firstName: "",
  lastName: "",
  eduStatus: "STUDENT",
  email: "",
  countryCode: 234,
  phoneNumber: "",
  schoolEmail: "",
  password: "",
  confirmPassword: "",
};

// ─── Validation ───────────────────────────────────────────────────────────────
function validateStep(step: number, form: FormState): string | null {
  if (step === 1) {
    if (!form.firstName.trim()) return "First name is required.";
    if (!form.lastName.trim()) return "Last name is required.";
  }
  if (step === 2) {
    if (!form.email.trim()) return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Enter a valid email address.";
    if (!form.phoneNumber.trim()) return "Phone number is required.";
    if (!/^\d{7,12}$/.test(form.phoneNumber))
      return "Enter a valid phone number (digits only).";
    if (form.schoolEmail && !/\S+@\S+\.\S+/.test(form.schoolEmail))
      return "Enter a valid school email address.";
  }
  if (step === 3) {
    if (!form.password) return "Password is required.";
    if (form.password.length < 8)
      return "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword)
      return "Passwords do not match.";
  }
  return null;
}


// ─── Slide animation variants ─────────────────────────────────────────────────
// ease must be typed as a const tuple — Framer Motion's Easing type does not
// accept a plain number[], it requires [number, number, number, number].
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.28, ease: EASE } },
  exit:  (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0, transition: { duration: 0.2, ease: EASE } }),
};


// ─── Component ────────────────────────────────────────────────────────────────
export const SignupForm: React.FC = () => {
  const { signup, isLoading, error, clearError } = useAuth();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1); // 1 = forward, -1 = back
  const [form, setForm] = useState<FormState>(INITIAL);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const progress = (step / TOTAL_STEPS) * 100;

  // ── Field helpers ─────────────────────────────────────────────────────────
  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      clearError();
      setLocalErr(null);
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const setEdu = (val: EduStatus) => {
    clearError();
    setLocalErr(null);
    setForm((prev) => ({ ...prev, eduStatus: val }));
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const next = () => {
    const err = validateStep(step, form);
    if (err) {
      setLocalErr(err);
      return;
    }
    setDir(1);
    setStep((s) => s + 1);
  };

  const back = () => {
    setLocalErr(null);
    clearError();
    setDir(-1);
    setStep((s) => s - 1);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep(3, form);
    if (err) {
      setLocalErr(err);
      return;
    }

    const payload: SignupData = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      eduStatus: form.eduStatus,
      phone: {
        countryCode: form.countryCode,
        phoneNumber: parseInt(form.phoneNumber, 10),
      },
      schoolEmail: form.schoolEmail.trim() || undefined,
    };

    await signup(payload);
  };

  const displayError = localErr ?? error?.message ?? null;

  return (
    <div className="w-full space-y-5">
      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            {STEPS[step - 1].label}
          </span>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            {step} / {TOTAL_STEPS}
          </span>
        </div>
        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-slate-900 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <p className="text-[9px] text-slate-400 tracking-wide">
          {STEPS[step - 1].hint}
        </p>
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
      <form onSubmit={handleSubmit} className="w-full">
        <div className="overflow-hidden">
          <AnimatePresence custom={dir} mode="wait">
            {/* STEP 1 — Personal info */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                <AuthInput
                  label="First Name"
                  icon={LuUser}
                  type="text"
                  value={form.firstName}
                  onChange={set("firstName")}
                  autoComplete="given-name"
                />
                <AuthInput
                  label="Last Name"
                  icon={LuUser}
                  type="text"
                  value={form.lastName}
                  onChange={set("lastName")}
                  autoComplete="family-name"
                />

                {/* EduStatus toggle */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">
                    I am a
                  </p>
                  <div className="grid grid-cols-2 gap-2 relative">
                    {(["STUDENT", "GRADUATE"] as EduStatus[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEdu(type)}
                        className="relative py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors overflow-hidden"
                      >
                        {form.eduStatus === type && (
                          <motion.span
                            layoutId="edu-pill"
                            className="absolute inset-0 bg-white border border-slate-900 rounded-xl shadow-sm"
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 28,
                            }}
                          />
                        )}
                        <span
                          className={`relative z-10 ${form.eduStatus === type ? "text-slate-900" : "text-slate-400"}`}
                        >
                          {type.charAt(0) + type.slice(1).toLowerCase()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2 — Contact */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                <AuthInput
                  label="Personal Email"
                  icon={LuMail}
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  autoComplete="email"
                />

                {/* Phone with country code */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <LuPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      <select
                        value={form.countryCode}
                        onChange={set("countryCode")}
                        className="h-full pl-8 pr-2 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 appearance-none focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                      >
                        {COUNTRY_CODES.map(({ code, label }) => (
                          <option key={code} value={code}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="8012345678"
                      value={form.phoneNumber}
                      onChange={set("phoneNumber")}
                      autoComplete="tel-national"
                      className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                    />
                  </div>
                </div>

                {/* School email — optional */}
                <div className="space-y-1.5">
                  <AuthInput
                    label="School Email (optional)"
                    icon={LuMail}
                    type="email"
                    value={form.schoolEmail}
                    onChange={set("schoolEmail")}
                    autoComplete="off"
                  />
                  <p className="text-[8px] text-slate-400 px-1 tracking-wide">
                    Only for students with an active institutional email
                    address.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 3 — Security */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                <AuthInput
                  label="Create Password"
                  icon={LuLock}
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  autoComplete="new-password"
                />
                <AuthInput
                  label="Confirm Password"
                  icon={LuShieldCheck}
                  type="password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  autoComplete="new-password"
                />
                <p className="text-[8px] text-slate-400 px-1 tracking-wide">
                  Minimum 8 characters. You&apos;ll receive a verification code on
                  your email and phone.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Navigation buttons ──────────────────────────────────────────── */}
        <div
          className={`flex gap-3 mt-6 ${step > 1 ? "grid grid-cols-2" : ""}`}
        >
          {step > 1 && (
            <button
              type="button"
              onClick={back}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3.5 border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all duration-300 disabled:opacity-40"
            >
              <LuArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={next}
              className={`flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all duration-300 shadow-xl shadow-slate-900/10 ${step === 1 ? "w-full" : ""}`}
            >
              Continue
              <LuArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary hover:text-slate-900 border border-transparent hover:border-primary transition-all duration-700 shadow-xl shadow-slate-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full inline-block"
                  />
                  Creating Account...
                </>
              ) : (
                <>
                  <LuCheck className="w-3.5 h-3.5" />
                  Create Account
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
