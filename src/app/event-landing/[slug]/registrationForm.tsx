"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import MigrateCTA from "./MigrateCTA";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TicketType {
  _id: string;
  name: string;
  price: number;
  currency: "NGN" | "USD" | "GBP";
  maxQuantity: number;
  isActive: boolean;
  availableFrom?: string;
  availableUntil?: string;
}

interface RegistrationFormProps {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  ticketTypes: TicketType[];
}

type Step = "details" | "otp" | "success";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  ticketTypeId: string;
  referralCode: string;
}

interface ApiError {
  error: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatPrice(price: number, currency: string): string {
  if (price === 0) return "Free";
  const symbols: Record<string, string> = { NGN: "₦", USD: "$", GBP: "£" };
  return `${symbols[currency] ?? currency}${price.toLocaleString()}`;
}

function isApiError(val: unknown): val is ApiError {
  return typeof val === "object" && val !== null && "error" in val;
}

// ─────────────────────────────────────────────────────────────────────────────
// OTP Input Component
// ─────────────────────────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const handleChange = (idx: number, char: string) => {
    const sanitized = char.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = sanitized;
    onChange(next.join("").trimEnd());
    if (sanitized && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
      const next = [...digits];
      next[idx - 1] = "";
      onChange(next.join("").trimEnd());
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputs.current[focusIdx]?.focus();
  };

  return (
    <div className="otp-grid">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[idx] ?? ""}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="otp-cell"
          aria-label={`Digit ${idx + 1}`}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function RegistrationForm({
  eventId,
  eventSlug,
  eventTitle,
  ticketTypes,
}: RegistrationFormProps) {
  const [step, setStep] = useState<Step>("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    ticketTypeId: ticketTypes.find((t) => t.isActive)?._id ?? "",
    referralCode: "",
  });

  // Step 2 state
  const [registrationId, setRegistrationId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 3 state
  const [inviteCode, setInviteCode] = useState("");

  // ── Cooldown timer for OTP resend ──────────────────────────────────────────
  const startCooldown = useCallback((seconds = 60) => {
    setResendCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // ── Field helpers ──────────────────────────────────────────────────────────
  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // ── Step 1: Submit details, receive registrationId ─────────────────────────
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!form.ticketTypeId) {
      setError("Please select a ticket type.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/events/register-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          ticketTypeId: form.ticketTypeId,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          ...(form.referralCode.trim() && {
            referralCodeUsed: form.referralCode.trim(),
          }),
        }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        // On 409, probe guest-status to route to the correct step
        // instead of showing a flat error
        if (res.status === 409) {
          try {
            const statusRes = await fetch(
              `/api/events/guest-status?email=${encodeURIComponent(
                form.email.trim().toLowerCase(),
              )}&eventId=${eventId}`,
            );
            const statusData = (await statusRes.json()) as {
              status: "verified" | "pending" | "none";
              registrationId?: string;
              inviteCode?: string;
              firstName?: string;
            };

            if (statusData.status === "verified" && statusData.inviteCode) {
              setInviteCode(statusData.inviteCode);
              if (statusData.registrationId)
                setRegistrationId(statusData.registrationId);
              setStep("success");
              return;
            }

            if (statusData.status === "pending" && statusData.registrationId) {
              setRegistrationId(statusData.registrationId);
              const [local, domain] = form.email.split("@");
              setMaskedEmail(
                `${local.slice(0, 1)}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`,
              );
              startCooldown(60);
              setStep("otp");
              return;
            }
          } catch {
            // status check failed — fall through to generic error
          }
        }

        setError(
          isApiError(data)
            ? data.error
            : "Something went wrong. Please try again.",
        );
        return;
      }

      const { registrationId: regId, email } = data as {
        registrationId: string;
        email: string;
      };

      setRegistrationId(regId);
      // Mask email: j***@example.com
      const [local, domain] = email.split("@");
      setMaskedEmail(
        `${local.slice(0, 1)}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`,
      );

      startCooldown(60);
      setStep("otp");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Submit OTP ─────────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/events/verify-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, code: otp }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        setError(
          isApiError(data)
            ? data.error
            : "Verification failed. Please try again.",
        );
        return;
      }

      const { registration } = data as {
        registration: { inviteCode: string };
      };

      setInviteCode(registration.inviteCode);
      setStep("success");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0 || !registrationId) return;
    setError(null);
    setOtp("");
    setLoading(true);

    try {
      const res = await fetch("/api/events/resend-guest-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          email: form.email.trim().toLowerCase(),
        }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        if (
          res.status === 429 &&
          typeof data === "object" &&
          data !== null &&
          "cooldownSeconds" in data
        ) {
          startCooldown((data as { cooldownSeconds: number }).cooldownSeconds);
          return;
        }
        setError(
          isApiError(data)
            ? data.error
            : "Failed to resend code. Please try again.",
        );
        return;
      }

      startCooldown(60);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Selected ticket ────────────────────────────────────────────────────────
  const selectedTicket = ticketTypes.find((t) => t._id === form.ticketTypeId);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        /* ── Reset & base ──────────────────────────────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── CSS variables ──────────────────────────────────────────────────── */
        .rf-root {
          --rf-bg:        #0a0a0f;
          --rf-surface:   #111118;
          --rf-border:    #1e1e2e;
          --rf-accent:    #6366f1;
          --rf-accent-hi: #818cf8;
          --rf-text:      #e2e8f0;
          --rf-muted:     #64748b;
          --rf-danger:    #f87171;
          --rf-success:   #34d399;
          --rf-radius:    14px;
          --rf-font:      'DM Sans', 'Segoe UI', system-ui, sans-serif;

          font-family: var(--rf-font);
          color: var(--rf-text);
          background: var(--rf-bg);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
        }

        /* ── Card ───────────────────────────────────────────────────────────── */
        .rf-card {
          width: 100%;
          max-width: 480px;
          background: var(--rf-surface);
          border: 1px solid var(--rf-border);
          border-radius: calc(var(--rf-radius) * 1.4);
          padding: 2.5rem 2rem;
          box-shadow: 0 0 0 1px rgba(99,102,241,.08), 0 32px 64px rgba(0,0,0,.6);
          animation: rf-slide-up .35s cubic-bezier(.16,1,.3,1) both;
        }
        @keyframes rf-slide-up {
          from { opacity:0; transform: translateY(20px); }
          to   { opacity:1; transform: translateY(0); }
        }

        /* ── Header ─────────────────────────────────────────────────────────── */
        .rf-header { margin-bottom: 2rem; }
        .rf-eyebrow {
          font-size: .7rem;
          font-weight: 700;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: var(--rf-accent-hi);
          margin-bottom: .5rem;
        }
        .rf-title {
          font-size: 1.35rem;
          font-weight: 800;
          line-height: 1.25;
          letter-spacing: -.02em;
          color: var(--rf-text);
        }
        .rf-subtitle {
          font-size: .85rem;
          color: var(--rf-muted);
          margin-top: .4rem;
          line-height: 1.5;
        }

        /* ── Step indicator ─────────────────────────────────────────────────── */
        .rf-steps {
          display: flex;
          gap: .5rem;
          margin-bottom: 2rem;
        }
        .rf-step-dot {
          height: 3px;
          flex: 1;
          border-radius: 99px;
          background: var(--rf-border);
          transition: background .3s;
        }
        .rf-step-dot.active { background: var(--rf-accent); }
        .rf-step-dot.done   { background: var(--rf-success); }

        /* ── Form fields ─────────────────────────────────────────────────────── */
        .rf-field { margin-bottom: 1.1rem; }
        .rf-label {
          display: block;
          font-size: .78rem;
          font-weight: 600;
          letter-spacing: .04em;
          text-transform: uppercase;
          color: var(--rf-muted);
          margin-bottom: .4rem;
        }
        .rf-input, .rf-select {
          width: 100%;
          background: var(--rf-bg);
          border: 1px solid var(--rf-border);
          border-radius: var(--rf-radius);
          color: var(--rf-text);
          font-family: var(--rf-font);
          font-size: .95rem;
          padding: .75rem 1rem;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
          appearance: none;
        }
        .rf-input:focus, .rf-select:focus {
          border-color: var(--rf-accent);
          box-shadow: 0 0 0 3px rgba(99,102,241,.15);
        }
        .rf-input::placeholder { color: var(--rf-muted); opacity: .6; }
        .rf-select option { background: var(--rf-surface); }

        /* Two columns on wide screens */
        .rf-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 420px) { .rf-row { grid-template-columns: 1fr; } }

        /* ── Ticket card ─────────────────────────────────────────────────────── */
        .rf-ticket-cards {
          display: flex;
          flex-direction: column;
          gap: .6rem;
          margin-bottom: 1.1rem;
        }
        .rf-ticket-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: .9rem 1rem;
          border: 1.5px solid var(--rf-border);
          border-radius: var(--rf-radius);
          cursor: pointer;
          background: var(--rf-bg);
          transition: border-color .2s, background .2s;
          gap: .5rem;
        }
        .rf-ticket-card:hover { border-color: var(--rf-accent); }
        .rf-ticket-card.selected {
          border-color: var(--rf-accent);
          background: rgba(99,102,241,.08);
        }
        .rf-ticket-card.disabled {
          opacity: .45;
          cursor: not-allowed;
        }
        .rf-ticket-name {
          font-size: .9rem;
          font-weight: 600;
          color: var(--rf-text);
        }
        .rf-ticket-price {
          font-size: .85rem;
          font-weight: 700;
          color: var(--rf-accent-hi);
          white-space: nowrap;
        }
        .rf-ticket-radio {
          width: 16px;
          height: 16px;
          border: 2px solid var(--rf-border);
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color .2s;
        }
        .rf-ticket-card.selected .rf-ticket-radio {
          border-color: var(--rf-accent);
        }
        .rf-ticket-radio-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--rf-accent);
          opacity: 0;
          transform: scale(0);
          transition: opacity .2s, transform .2s;
        }
        .rf-ticket-card.selected .rf-ticket-radio-dot {
          opacity: 1;
          transform: scale(1);
        }

        /* ── OTP grid ────────────────────────────────────────────────────────── */
        .otp-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: .5rem;
          margin: 1.5rem 0;
        }
        .otp-cell {
          aspect-ratio: 1;
          width: 100%;
          background: var(--rf-bg);
          border: 1.5px solid var(--rf-border);
          border-radius: 10px;
          color: var(--rf-text);
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 1.35rem;
          font-weight: 700;
          text-align: center;
          outline: none;
          caret-color: var(--rf-accent);
          transition: border-color .2s, box-shadow .2s;
        }
        .otp-cell:focus {
          border-color: var(--rf-accent);
          box-shadow: 0 0 0 3px rgba(99,102,241,.18);
        }
        .otp-cell:disabled { opacity: .5; cursor: not-allowed; }

        /* ── Button ──────────────────────────────────────────────────────────── */
        .rf-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          width: 100%;
          padding: .9rem 1.5rem;
          border: none;
          border-radius: var(--rf-radius);
          font-family: var(--rf-font);
          font-size: .95rem;
          font-weight: 700;
          letter-spacing: .01em;
          cursor: pointer;
          transition: opacity .2s, transform .1s;
        }
        .rf-btn:active { transform: scale(.98); }
        .rf-btn-primary {
          background: var(--rf-accent);
          color: #fff;
        }
        .rf-btn-primary:hover:not(:disabled) { background: var(--rf-accent-hi); }
        .rf-btn-primary:disabled { opacity: .55; cursor: not-allowed; }
        .rf-btn-ghost {
          background: transparent;
          color: var(--rf-muted);
          font-size: .85rem;
          font-weight: 600;
          margin-top: .5rem;
          padding: .6rem;
        }
        .rf-btn-ghost:hover:not(:disabled) { color: var(--rf-text); }
        .rf-btn-ghost:disabled { opacity: .4; cursor: not-allowed; }

        /* ── Error ───────────────────────────────────────────────────────────── */
        .rf-error {
          display: flex;
          align-items: flex-start;
          gap: .5rem;
          background: rgba(248,113,113,.08);
          border: 1px solid rgba(248,113,113,.25);
          border-radius: 10px;
          padding: .75rem 1rem;
          font-size: .85rem;
          color: var(--rf-danger);
          margin-bottom: 1.25rem;
          line-height: 1.45;
          animation: rf-slide-up .2s ease both;
        }

        /* ── Success state ───────────────────────────────────────────────────── */
        .rf-success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(52,211,153,.12);
          border: 2px solid var(--rf-success);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          font-size: 1.75rem;
        }
        .rf-ticket-box {
          background: var(--rf-bg);
          border: 1.5px dashed var(--rf-border);
          border-radius: var(--rf-radius);
          padding: 1.25rem;
          text-align: center;
          margin: 1.5rem 0;
        }
        .rf-ticket-box-label {
          font-size: .7rem;
          font-weight: 700;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: var(--rf-muted);
          margin-bottom: .5rem;
        }
        .rf-ticket-code {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 1.6rem;
          font-weight: 900;
          color: var(--rf-accent-hi);
          letter-spacing: .15em;
        }
        .rf-success-note {
          font-size: .82rem;
          color: var(--rf-muted);
          text-align: center;
          line-height: 1.6;
        }

        /* ── Divider ─────────────────────────────────────────────────────────── */
        .rf-divider {
          height: 1px;
          background: var(--rf-border);
          margin: 1.5rem 0;
        }

        /* ── Resend row ──────────────────────────────────────────────────────── */
        .rf-resend-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .35rem;
          font-size: .82rem;
          color: var(--rf-muted);
          margin-top: .25rem;
        }
        .rf-resend-link {
          background: none;
          border: none;
          color: var(--rf-accent-hi);
          font-family: var(--rf-font);
          font-size: .82rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .rf-resend-link:disabled { opacity: .4; cursor: not-allowed; }

        /* ── Guest badge ─────────────────────────────────────────────────────── */
        .rf-guest-badge {
          display: inline-flex;
          align-items: center;
          gap: .35rem;
          padding: .3rem .7rem;
          border-radius: 99px;
          background: rgba(99,102,241,.1);
          border: 1px solid rgba(99,102,241,.2);
          font-size: .72rem;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--rf-accent-hi);
          margin-bottom: 1rem;
        }

        /* ── Spinner ─────────────────────────────────────────────────────────── */
        .rf-spinner {
          width: 16px;
          height: 16px;
          border: 2.5px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: rf-spin .6s linear infinite;
        }
        @keyframes rf-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="rf-root">
        <div className="rf-card">
          {/* ── Step indicator ─────────────────────────────────────────────── */}
          <div className="rf-steps" aria-label="Registration progress">
            {(["details", "otp", "success"] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`rf-step-dot ${
                  step === s
                    ? "active"
                    : ["details", "otp", "success"].indexOf(step) > i
                      ? "done"
                      : ""
                }`}
              />
            ))}
          </div>

          {/* ── Step 1: Details ────────────────────────────────────────────── */}
          {step === "details" && (
            <>
              <div className="rf-header">
                <div className="rf-guest-badge">
                  <span>◈</span> Guest Registration
                </div>
                <h1 className="rf-title">Register for {eventTitle}</h1>
                <p className="rf-subtitle">
                  No account needed. We&apos;ll send a verification code to your
                  email.
                </p>
              </div>

              {error && (
                <div className="rf-error" role="alert">
                  <span>⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleDetailsSubmit} noValidate>
                {/* Name row */}
                <div className="rf-row">
                  <div className="rf-field">
                    <label className="rf-label" htmlFor="firstName">
                      First Name <span aria-hidden>*</span>
                    </label>
                    <input
                      id="firstName"
                      className="rf-input"
                      type="text"
                      placeholder="Ada"
                      autoComplete="given-name"
                      value={form.firstName}
                      onChange={(e) => setField("firstName", e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="rf-field">
                    <label className="rf-label" htmlFor="lastName">
                      Last Name <span aria-hidden>*</span>
                    </label>
                    <input
                      id="lastName"
                      className="rf-input"
                      type="text"
                      placeholder="Okonkwo"
                      autoComplete="family-name"
                      value={form.lastName}
                      onChange={(e) => setField("lastName", e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="rf-field">
                  <label className="rf-label" htmlFor="email">
                    Email Address <span aria-hidden>*</span>
                  </label>
                  <input
                    id="email"
                    className="rf-input"
                    type="email"
                    placeholder="ada@example.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                {/* Ticket selection */}
                <div className="rf-field">
                  <span className="rf-label">
                    Ticket Type <span aria-hidden>*</span>
                  </span>
                  <div
                    className="rf-ticket-cards"
                    role="radiogroup"
                    aria-label="Select ticket type"
                  >
                    {ticketTypes.map((ticket) => {
                      const isSelected = form.ticketTypeId === ticket._id;
                      const isDisabled = !ticket.isActive;

                      return (
                        <button
                          key={ticket._id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          disabled={isDisabled || loading}
                          className={`rf-ticket-card ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                          onClick={() =>
                            !isDisabled && setField("ticketTypeId", ticket._id)
                          }
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: ".75rem",
                            }}
                          >
                            <div className="rf-ticket-radio">
                              <div className="rf-ticket-radio-dot" />
                            </div>
                            <span className="rf-ticket-name">
                              {ticket.name}
                            </span>
                          </div>
                          <span className="rf-ticket-price">
                            {formatPrice(ticket.price, ticket.currency)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Referral code (optional) */}
                <div className="rf-field">
                  <label className="rf-label" htmlFor="referralCode">
                    Referral Code{" "}
                    <span style={{ textTransform: "none", fontWeight: 400 }}>
                      (optional)
                    </span>
                  </label>
                  <input
                    id="referralCode"
                    className="rf-input"
                    type="text"
                    placeholder="e.g. ABC123"
                    value={form.referralCode}
                    onChange={(e) =>
                      setField("referralCode", e.target.value.toUpperCase())
                    }
                    disabled={loading}
                  />
                </div>

                <div className="rf-divider" />

                <button
                  type="submit"
                  className="rf-btn rf-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="rf-spinner" />
                      Sending code…
                    </>
                  ) : (
                    "Continue →"
                  )}
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: OTP verification ────────────────────────────────────── */}
          {step === "otp" && (
            <>
              <div className="rf-header">
                <div className="rf-guest-badge">
                  <span>✉</span> Check Your Email
                </div>
                <h1 className="rf-title">Enter Verification Code</h1>
                <p className="rf-subtitle">
                  We sent a 6-digit code to{" "}
                  <strong style={{ color: "var(--rf-text)" }}>
                    {maskedEmail}
                  </strong>
                  . It expires in 15 minutes.
                </p>
              </div>

              {error && (
                <div className="rf-error" role="alert">
                  <span>⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleOtpSubmit} noValidate>
                <OtpInput value={otp} onChange={setOtp} disabled={loading} />

                <button
                  type="submit"
                  className="rf-btn rf-btn-primary"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <span className="rf-spinner" />
                      Verifying…
                    </>
                  ) : (
                    "Verify & Complete Registration"
                  )}
                </button>
              </form>

              {/* Resend row */}
              <div className="rf-resend-row">
                <span>Didn&apos;t receive it?</span>
                <button
                  type="button"
                  className="rf-resend-link"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend code"}
                </button>
              </div>

              {/* Back link */}
              <button
                type="button"
                className="rf-btn rf-btn-ghost"
                onClick={() => {
                  setStep("details");
                  setOtp("");
                  setError(null);
                }}
                disabled={loading}
              >
                ← Change my details
              </button>
            </>
          )}

          {/* ── Step 3: Success ─────────────────────────────────────────────── */}
          {step === "success" && (
            <>
              <div className="rf-success-icon" aria-hidden>
                ✓
              </div>

              <div className="rf-header" style={{ textAlign: "center" }}>
                <h1 className="rf-title">You&apos;re Registered!</h1>
                <p className="rf-subtitle">
                  Your guest spot at <strong>{eventTitle}</strong> is confirmed.
                  A confirmation email is on its way to you.
                </p>
              </div>

              {/* Ticket code */}
              <div className="rf-ticket-box">
                <div className="rf-ticket-box-label">Your Ticket Code</div>
                <div className="rf-ticket-code">{inviteCode}</div>
                {selectedTicket && (
                  <div
                    style={{
                      marginTop: ".5rem",
                      fontSize: ".8rem",
                      color: "var(--rf-muted)",
                    }}
                  >
                    {selectedTicket.name} ·{" "}
                    {formatPrice(selectedTicket.price, selectedTicket.currency)}
                    {" · "}
                    <span
                      style={{
                        color: "var(--rf-accent-hi)",
                        fontWeight: 600,
                      }}
                    >
                      Guest
                    </span>
                  </div>
                )}
              </div>

              <p className="rf-success-note">
                Present this code at the event entrance. You can also find it in
                your confirmation email. Keep it safe!
              </p>
              <MigrateCTA
                registrationId={registrationId}
                email={form.email.trim().toLowerCase()}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
