"use client";
// Standalone migration page — guest converts their OTP-verified registration
// into a full platform account.
// Path: /migrate/guest?token=<jwt>

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ── EDU STATUS OPTIONS ────────────────────────────────────────────────────────
const EDU_OPTIONS = [
  { value: "STUDENT", label: "Current Student" },
  { value: "GRADUATE", label: "Graduate / Alumni" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isApiError(val: unknown): val is { error: string } {
  return typeof val === "object" && val !== null && "error" in val;
}

// ── Inner page (uses hooks, wrapped in Suspense) ──────────────────────────────
function MigrateGuestInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [firstName, setFirstName] = useState("there");
  const [phone, setPhone] = useState({ countryCode: 234, phoneNumber: "" });
  const [eduStatus, setEduStatus] = useState("STUDENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ticketsMigrated, setTicketsMigrated] = useState(0);

  // Decode name for greeting (no server round-trip needed)
  useEffect(() => {
    if (!token) return;
    const payload = decodeTokenPayload(token);
    if (payload?.firstName && typeof payload.firstName === "string") {
      setFirstName(payload.firstName);
    }
    // Validate purpose
    if (payload?.purpose !== "guest-migration") {
      setError(
        "This link is invalid or has expired. Please go back to your ticket and request a new one.",
      );
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone.phoneNumber || String(phone.phoneNumber).length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/migrate-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          migrationToken: token,
          phone: {
            countryCode: Number(phone.countryCode),
            phoneNumber: Number(phone.phoneNumber),
          },
          eduStatus,
        }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        setError(
          isApiError(data)
            ? data.error
            : "Something went wrong. Please try again.",
        );
        return;
      }

      const result = data as { ticketsMigrated: number };
      setTicketsMigrated(result.ticketsMigrated);
      setSuccess(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const S = {
    root: {
      minHeight: "100vh",
      background: "#0a0a0f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    } as React.CSSProperties,
    card: {
      width: "100%",
      maxWidth: 460,
      background: "#111118",
      border: "1px solid #1e1e2e",
      borderRadius: 24,
      padding: "2.5rem 2rem",
      boxShadow: "0 0 0 1px rgba(99,102,241,.07), 0 32px 64px rgba(0,0,0,.6)",
    } as React.CSSProperties,
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: ".35rem",
      padding: ".3rem .7rem",
      borderRadius: 99,
      background: "rgba(99,102,241,.1)",
      border: "1px solid rgba(99,102,241,.2)",
      fontSize: ".72rem",
      fontWeight: 700,
      letterSpacing: ".06em",
      textTransform: "uppercase" as const,
      color: "#818cf8",
      marginBottom: "1rem",
    } as React.CSSProperties,
    title: {
      margin: "0 0 .4rem",
      fontSize: "1.5rem",
      fontWeight: 800,
      color: "#e2e8f0",
      letterSpacing: "-.02em",
    } as React.CSSProperties,
    subtitle: {
      margin: "0 0 2rem",
      fontSize: ".875rem",
      color: "#64748b",
      lineHeight: 1.55,
    } as React.CSSProperties,
    label: {
      display: "block",
      marginBottom: ".4rem",
      fontSize: ".75rem",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: ".06em",
      color: "#64748b",
    } as React.CSSProperties,
    field: { marginBottom: "1.1rem" } as React.CSSProperties,
    input: {
      width: "100%",
      background: "#0a0a0f",
      border: "1px solid #1e1e2e",
      borderRadius: 12,
      color: "#e2e8f0",
      fontSize: ".95rem",
      padding: ".75rem 1rem",
      outline: "none",
      boxSizing: "border-box" as const,
    } as React.CSSProperties,
    select: {
      width: "100%",
      background: "#0a0a0f",
      border: "1px solid #1e1e2e",
      borderRadius: 12,
      color: "#e2e8f0",
      fontSize: ".95rem",
      padding: ".75rem 1rem",
      outline: "none",
      appearance: "none" as const,
      boxSizing: "border-box" as const,
    } as React.CSSProperties,
    phoneRow: {
      display: "grid",
      gridTemplateColumns: "90px 1fr",
      gap: ".5rem",
    } as React.CSSProperties,
    btn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: ".5rem",
      width: "100%",
      padding: ".9rem",
      background: "#6366f1",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      fontSize: ".95rem",
      fontWeight: 700,
      cursor: "pointer",
      marginTop: ".5rem",
    } as React.CSSProperties,
    error: {
      background: "rgba(248,113,113,.08)",
      border: "1px solid rgba(248,113,113,.22)",
      borderRadius: 10,
      padding: ".75rem 1rem",
      fontSize: ".85rem",
      color: "#f87171",
      marginBottom: "1.25rem",
      lineHeight: 1.45,
    } as React.CSSProperties,
    successIcon: {
      width: 64,
      height: 64,
      borderRadius: "50%",
      background: "rgba(52,211,153,.12)",
      border: "2px solid #34d399",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 1.5rem",
      fontSize: "1.75rem",
      color: "#34d399",
    } as React.CSSProperties,
  };

  // ── No token ──────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div style={S.root}>
        <div style={S.card}>
          <p style={{ color: "#f87171", textAlign: "center" }}>
            Invalid migration link. Please go back to your ticket page.
          </p>
        </div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={S.root}>
        <div style={{ ...S.card, textAlign: "center" }}>
          <div style={S.successIcon}>✓</div>
          <h1 style={{ ...S.title, textAlign: "center" }}>Account Created!</h1>
          <p style={{ ...S.subtitle, textAlign: "center" }}>
            Welcome to DIUSCADI, {firstName}. Check your email for your
            temporary password.
            {ticketsMigrated > 0 && (
              <>
                {" "}
                Your {ticketsMigrated} guest ticket
                {ticketsMigrated !== 1 ? "s have" : " has"} been carried over.
              </>
            )}
          </p>
          <button
            type="button"
            style={{ ...S.btn, textDecoration: "none" }}
            onClick={() => router.push("/auth")}
          >
            Sign in to your account →
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      <div style={S.card}>
        <div style={S.badge}>◈ Create Account</div>
        <h1 style={S.title}>Hi, {firstName}!</h1>
        <p style={S.subtitle}>
          Just two more details and your DIUSCADI account is ready. Your guest
          ticket will be linked automatically.
        </p>

        {error && (
          <div style={S.error} role="alert">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Phone */}
          <div style={S.field}>
            <label style={S.label}>Phone Number *</label>
            <div style={S.phoneRow}>
              <input
                style={S.input}
                type="number"
                value={phone.countryCode}
                onChange={(e) =>
                  setPhone((p) => ({
                    ...p,
                    countryCode: Number(e.target.value),
                  }))
                }
                placeholder="234"
                disabled={loading}
                min={1}
              />
              <input
                style={S.input}
                type="tel"
                value={phone.phoneNumber}
                onChange={(e) =>
                  setPhone((p) => ({ ...p, phoneNumber: e.target.value }))
                }
                placeholder="8012345678"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Edu status */}
          <div style={S.field}>
            <label style={S.label}>I am a… *</label>
            <select
              style={S.select}
              value={eduStatus}
              onChange={(e) => setEduStatus(e.target.value)}
              disabled={loading}
            >
              {EDU_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" style={S.btn} disabled={loading}>
            {loading ? (
              <>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(255,255,255,.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin .6s linear infinite",
                  }}
                />
                Creating account…
              </>
            ) : (
              "Create my account →"
            )}
          </button>
        </form>

        <p
          style={{
            marginTop: "1.25rem",
            fontSize: ".78rem",
            color: "#334155",
            textAlign: "center",
            lineHeight: 1.55,
          }}
        >
          By creating an account you agree to the DIUSCADI terms of service.
          Your guest ticket code remains valid regardless.
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function MigrateGuestPage() {
  return (
    <Suspense>
      <MigrateGuestInner />
    </Suspense>
  );
}
