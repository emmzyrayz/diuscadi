"use client";
// MigrateCTA.tsx — shown on step 3 of the guest registration form.
// Calls POST /api/auth/generate-migration-token and opens the migration page.

import React, { useState } from "react";

interface MigrateCTAProps {
  registrationId: string;
  email: string;
}

function isApiError(val: unknown): val is { error: string; alreadyHasAccount?: boolean } {
  return typeof val === "object" && val !== null && "error" in val;
}

export default function MigrateCTA({ registrationId, email }: MigrateCTAProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [migrationUrl, setMigrationUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/generate-migration-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, email }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        if (isApiError(data) && data.alreadyHasAccount) {
          setError("You already have an account. Sign in to view your tickets.");
          return;
        }
        setError(isApiError(data) ? data.error : "Something went wrong.");
        return;
      }

      const { migrationUrl: url } = data as { migrationUrl: string };
      setMigrationUrl(url);
      setDone(true);

      // Navigate after brief delay so the user sees the success state
      setTimeout(() => window.location.assign(url), 800);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "2rem",
        padding: "1.25rem 1.5rem",
        background: "rgba(99,102,241,.06)",
        border: "1px solid rgba(99,102,241,.18)",
        borderRadius: "14px",
      }}
    >
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
        Create a free DIUSCADI account to manage your tickets, track events,
        and get member benefits. Your guest ticket stays valid.
      </p>

      {error && (
        <div
          style={{
            marginBottom: ".75rem",
            padding: ".6rem .9rem",
            background: "rgba(248,113,113,.08)",
            border: "1px solid rgba(248,113,113,.22)",
            borderRadius: "8px",
            fontSize: ".82rem",
            color: "var(--rf-danger)",
          }}
        >
          {error}
        </div>
      )}

      {done ? (
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
      ) : (
        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          style={{
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
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.65 : 1,
            transition: "opacity .2s",
          }}
        >
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
                  animation: "rf-spin .6s linear infinite",
                }}
              />
              Creating link…
            </>
          ) : (
            "Create a free account →"
          )}
        </button>
      )}

      {migrationUrl && done && (
        <p
          style={{
            marginTop: ".6rem",
            fontSize: ".75rem",
            color: "var(--rf-muted)",
            textAlign: "center",
          }}
        >
          Or{" "}
          <a
            href={migrationUrl}
            style={{ color: "var(--rf-accent-hi)", textDecoration: "underline" }}
          >
            click here
          </a>{" "}
          if not redirected automatically.
        </p>
      )}
    </div>
  );
}