"use client";
// MigrateCTA.tsx — shown on step 3 of the guest registration form.
// Full cold-migrate flow inline: request OTP → verify OTP → (conflicts? →
// resolve) → redirect to /migrate/guest with the minted token.
//
// This is the ONLY place OTP exists in the guest system — registration
// itself is fully public/OTP-free. OTP here proves email ownership before
// converting a guest's history into a real account.

import React, { useState, useRef, useEffect, useCallback } from "react";
import MigrateDiffModal from "../components/MigrateDiffModal";
import type { NameConflict } from "@/lib/guestProfile";

interface MigrateCTAProps {
  registrationId: string;
  email: string;
}

type Stage = "idle" | "otp" | "conflicts" | "redirecting" | "terminal";

interface ApiErrorShape {
  error: string;
  alreadyMigrated?: boolean;
  hasExistingAccount?: boolean;
  tooManyAttempts?: boolean;
  cooldownSeconds?: number;
}

function isApiError(val: unknown): val is ApiErrorShape {
  return typeof val === "object" && val !== null && "error" in val;
}

// ── Local OTP input (mirrors RegistrationForm's pattern — kept inline since
// it's not exported as a shared component anywhere in the codebase) ────────
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
    if (sanitized && idx < 5) inputs.current[idx + 1]?.focus();
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
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: ".5rem",
        margin: "1rem 0",
      }}
    >
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
          aria-label={`Digit ${idx + 1}`}
          autoComplete="one-time-code"
          style={{
            aspectRatio: "1",
            width: "100%",
            background: "var(--rf-bg)",
            border: "1.5px solid var(--rf-border)",
            borderRadius: 10,
            color: "var(--rf-text)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "1.2rem",
            fontWeight: 700,
            textAlign: "center",
            outline: "none",
          }}
        />
      ))}
    </div>
  );
}

export default function MigrateCTA({ registrationId, email }: MigrateCTAProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminalMessage, setTerminalMessage] = useState<{
    text: string;
    href?: string;
    label?: string;
  } | null>(null);

  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [conflicts, setConflicts] = useState<NameConflict[]>([]);
  const [currentFirstName, setCurrentFirstName] = useState("");
  const [currentLastName, setCurrentLastName] = useState("");
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [conflictLoading, setConflictLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = useCallback((seconds: number) => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    if (seconds <= 0) {
      setResendCooldown(0);
      return;
    }
    setResendCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleVaultExistsError = (data: ApiErrorShape) => {
    if (data.alreadyMigrated) {
      setTerminalMessage({
        text: "You've already created an account from this ticket.",
        href: "/auth",
        label: "Log in →",
      });
      setStage("terminal");
      return true;
    }
    if (data.hasExistingAccount) {
      setTerminalMessage({
        text: "An account already exists for this email.",
        href: `/auth/forgot-password?email=${encodeURIComponent(email)}`,
        label: "Reset password →",
      });
      setStage("terminal");
      return true;
    }
    return false;
  };

  // ── Stage: idle → request OTP ─────────────────────────────────────────────
  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/guest/migrate/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, email }),
      });
      const data: unknown = await res.json();

      if (!res.ok) {
        if (isApiError(data)) {
          if (handleVaultExistsError(data)) return;
          // 429 on first request — a code may already be outstanding, let
          // them enter it rather than dead-ending.
          if (res.status === 429) {
            startCooldown(data.cooldownSeconds ?? 30);
            setStage("otp");
            setError(
              "A code was already sent recently — check your email, or wait to resend.",
            );
            return;
          }
          setError(data.error);
        } else {
          setError("Something went wrong. Please try again.");
        }
        return;
      }

      const ok = data as { nextResendCooldownSeconds?: number };
      startCooldown(ok.nextResendCooldownSeconds ?? 10);
      setStage("otp");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend ─────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setOtp("");
    setLoading(true);
    try {
      const res = await fetch("/api/guest/migrate/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, email }),
      });
      const data: unknown = await res.json();

      if (!res.ok) {
        if (isApiError(data)) {
          if (handleVaultExistsError(data)) return;
          startCooldown(data.cooldownSeconds ?? 30);
          setError(data.error);
          return;
        }
        setError("Failed to resend code.");
        return;
      }
      const ok = data as { nextResendCooldownSeconds?: number };
      startCooldown(ok.nextResendCooldownSeconds ?? 10);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Redirect helper ───────────────────────────────────────────────────────
  const redirectToMigration = (migrationUrl: string) => {
    setStage("redirecting");
    setTimeout(() => window.location.assign(migrationUrl), 600);
  };

  // ── Stage: otp → verify ───────────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/guest/migrate/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, email, code: otp }),
      });
      const data: unknown = await res.json();

      if (!res.ok) {
        if (isApiError(data)) {
          if (handleVaultExistsError(data)) return;
          if (data.tooManyAttempts) {
            setError("Too many incorrect attempts. Please request a new code.");
            setOtp("");
            return;
          }
          setError(data.error);
        } else {
          setError("Verification failed. Please try again.");
        }
        return;
      }

      // Success — either a direct migrationUrl or a conflicts payload
      if ("migrationUrl" in (data as object)) {
        redirectToMigration((data as { migrationUrl: string }).migrationUrl);
        return;
      }

      const conflictData = data as {
        conflicts: NameConflict[];
        registrationId: string;
        email: string;
      };
      setConflicts(conflictData.conflicts);
      // Current (non-conflicting) name fallback — best-effort from whichever
      // field didn't conflict; conflicting fields are resolved entirely by
      // the modal's own option list.
      setCurrentFirstName("");
      setCurrentLastName("");
      setStage("conflicts");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Stage: conflicts → resolve ────────────────────────────────────────────
  const handleResolveConflicts = async (resolved: {
    firstName: string;
    lastName: string;
  }) => {
    setConflictLoading(true);
    setConflictError(null);
    try {
      const res = await fetch("/api/guest/migrate/resolve-conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          email,
          resolvedFirstName: resolved.firstName,
          resolvedLastName: resolved.lastName,
        }),
      });
      const data: unknown = await res.json();

      if (!res.ok) {
        if (isApiError(data)) {
          if (data.alreadyMigrated) {
            setStage("terminal");
            setTerminalMessage({
              text: "You've already created an account from this ticket.",
              href: "/auth",
              label: "Log in →",
            });
            return;
          }
          if ((data as { verificationExpired?: boolean }).verificationExpired) {
            setConflictError(
              "Your verification expired. Please request a new code.",
            );
            setStage("idle");
            return;
          }
          setConflictError(data.error);
        } else {
          setConflictError("Something went wrong. Please try again.");
        }
        return;
      }

      redirectToMigration((data as { migrationUrl: string }).migrationUrl);
    } catch {
      setConflictError("Network error. Please try again.");
    } finally {
      setConflictLoading(false);
    }
  };

  // ── Render: terminal (already migrated / has account) ────────────────────
  if (stage === "terminal" && terminalMessage) {
    return (
      <div style={ctaWrapperStyle}>
        <p
          style={{
            margin: 0,
            fontSize: ".85rem",
            color: "var(--rf-text)",
            lineHeight: 1.55,
          }}
        >
          {terminalMessage.text}
        </p>
        {terminalMessage.href && (
          <a
            href={terminalMessage.href}
            style={{
              ...ctaButtonStyle,
              display: "inline-block",
              marginTop: "1rem",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            {terminalMessage.label}
          </a>
        )}
      </div>
    );
  }

  // ── Render: redirecting ───────────────────────────────────────────────────
  if (stage === "redirecting") {
    return (
      <div style={ctaWrapperStyle}>
        <div
          style={{
            fontSize: ".85rem",
            color: "var(--rf-success)",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          ✓ Redirecting to account setup…
        </div>
      </div>
    );
  }

  // ── Render: conflicts modal (overlay — renders outside the card flow) ────
  if (stage === "conflicts") {
    return (
      <MigrateDiffModal
        conflicts={conflicts}
        currentFirstName={currentFirstName}
        currentLastName={currentLastName}
        loading={conflictLoading}
        error={conflictError}
        onResolve={handleResolveConflicts}
        onCancel={() => setStage("idle")}
      />
    );
  }

  // ── Render: otp entry ──────────────────────────────────────────────────────
  if (stage === "otp") {
    return (
      <div style={ctaWrapperStyle}>
        <p
          style={{
            margin: "0 0 .5rem",
            fontSize: ".75rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".12em",
            color: "var(--rf-accent-hi)",
          }}
        >
          ✉ Verify Your Email
        </p>
        <p
          style={{
            margin: "0 0 1rem",
            fontSize: ".85rem",
            color: "var(--rf-muted)",
            lineHeight: 1.55,
          }}
        >
          Enter the 6-digit code we sent to confirm it&apos;s really you.
        </p>

        {error && (
          <div
            style={{
              marginBottom: ".75rem",
              padding: ".6rem .9rem",
              background: "rgba(248,113,113,.08)",
              border: "1px solid rgba(248,113,113,.22)",
              borderRadius: 8,
              fontSize: ".82rem",
              color: "var(--rf-danger)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            style={{
              ...ctaButtonStyle,
              opacity: loading || otp.length !== 6 ? 0.6 : 1,
            }}
          >
            {loading ? "Verifying…" : "Verify & Continue →"}
          </button>
        </form>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: ".35rem",
            fontSize: ".8rem",
            color: "var(--rf-muted)",
            marginTop: ".75rem",
          }}
        >
          <span>Didn&apos;t receive it?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
            style={{
              background: "none",
              border: "none",
              color: "var(--rf-accent-hi)",
              fontSize: ".8rem",
              fontWeight: 600,
              cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
              textDecoration: "underline",
              padding: 0,
              opacity: resendCooldown > 0 ? 0.5 : 1,
            }}
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend code"}
          </button>
        </div>
      </div>
    );
  }

  // ── Render: idle (initial CTA) ────────────────────────────────────────────
  return (
    <div style={ctaWrapperStyle}>
      <p
        style={{
          margin: "0 0 .5rem",
          fontSize: ".75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".12em",
          color: "var(--rf-accent-hi)",
        }}
      >
        ◈ Want a full account?
      </p>
      <p
        style={{
          margin: "0 0 1rem",
          fontSize: ".85rem",
          color: "var(--rf-muted)",
          lineHeight: 1.55,
        }}
      >
        Create a free DIUSCADI account to manage your tickets, track events, and
        get member benefits. Your guest ticket stays valid.
      </p>

      {error && (
        <div
          style={{
            marginBottom: ".75rem",
            padding: ".6rem .9rem",
            background: "rgba(248,113,113,.08)",
            border: "1px solid rgba(248,113,113,.22)",
            borderRadius: 8,
            fontSize: ".82rem",
            color: "var(--rf-danger)",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        style={{
          ...ctaButtonStyle,
          opacity: loading ? 0.65 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Sending code…" : "Create a free account →"}
      </button>
    </div>
  );
}

// ── Shared inline styles ──────────────────────────────────────────────────
const ctaWrapperStyle: React.CSSProperties = {
  marginTop: "2rem",
  padding: "1.25rem 1.5rem",
  background: "rgba(99,102,241,.06)",
  border: "1px solid rgba(99,102,241,.18)",
  borderRadius: "14px",
};

const ctaButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: ".5rem",
  width: "100%",
  padding: ".8rem 1rem",
  background: "var(--rf-accent)",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: ".88rem",
  fontWeight: 700,
  transition: "opacity .2s",
};
