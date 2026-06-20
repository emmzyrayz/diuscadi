"use client";
// GuestMergePopup.tsx — login-triggered warm-migrate popup. Mounted wherever
// AuthContext's guestMergeInfo state is non-null (likely the root layout or
// a header component — not included here, see integration notes below).

import React, { useState } from "react";
import MigrateDiffModal from "@/app/event-landing/components/MigrateDiffModal";
import type { NameConflict } from "@/lib/guestProfile";

export interface GuestMergeEventSummary {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
}

export interface GuestMergeInfo {
  autoMigrated: boolean;
  ticketsMigrated?: number;
  events?: GuestMergeEventSummary[];
  conflicts?: NameConflict[];
  hoursUntilAutoMigrate?: number | null;
}

interface GuestMergePopupProps {
  info: GuestMergeInfo;
  authHeaders: () => HeadersInit;
  onDismiss: () => void;
}

export default function GuestMergePopup({
  info,
  authHeaders,
  onDismiss,
}: GuestMergePopupProps) {
  const hasConflicts = !!info.conflicts && info.conflicts.length > 0;
  const [stage, setStage] = useState<
    "prompt" | "conflicts" | "loading" | "done"
  >(info.autoMigrated ? "done" : "prompt");
  const [error, setError] = useState<string | null>(null);
  const [ticketsMigrated, setTicketsMigrated] = useState(
    info.ticketsMigrated ?? 0,
  );

  const handleMigrateNow = async (resolved?: {
    firstName: string;
    lastName: string;
  }) => {
    setStage("loading");
    setError(null);
    try {
      const res = await fetch("/api/auth/session-merge-check", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          action: "migrate_now",
          ...(resolved && {
            resolvedFirstName: resolved.firstName,
            resolvedLastName: resolved.lastName,
          }),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.conflicts) {
          setStage("conflicts");
          return;
        }
        setError(data.error ?? "Something went wrong. Please try again.");
        setStage("prompt");
        return;
      }

      setTicketsMigrated(data.ticketsMigrated ?? 0);
      setStage("done");
    } catch {
      setError("Network error. Please try again.");
      setStage("prompt");
    }
  };

  const handleSnooze = async () => {
    try {
      await fetch("/api/auth/session-merge-check", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action: "snooze" }),
      });
    } catch {
      // Failing silently is fine — worst case it reappears next login,
      // same as if snooze had never been clicked.
    } finally {
      onDismiss();
    }
  };

  if (stage === "conflicts") {
    return (
      <MigrateDiffModal
        conflicts={info.conflicts ?? []}
        currentFirstName=""
        currentLastName=""
        loading={false}
        error={error}
        onResolve={(resolved) => handleMigrateNow(resolved)}
        onCancel={() => setStage("prompt")}
      />
    );
  }

  return (
    <div className="gmp-overlay" role="dialog" aria-modal="true">
      <style>{`
        .gmp-overlay {
          --gmp-bg: #0a0a0f; --gmp-surface: #111118; --gmp-border: #1e1e2e;
          --gmp-accent: #6366f1; --gmp-text: #e2e8f0; --gmp-muted: #64748b;
          --gmp-success: #34d399; --gmp-danger: #f87171;
          position: fixed; inset: 0; background: rgba(0,0,0,.7);
          backdrop-filter: blur(4px); display: flex; align-items: center;
          justify-content: center; padding: 1.5rem; z-index: 1000;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .gmp-card {
          width: 100%; max-width: 440px; background: var(--gmp-surface);
          border: 1px solid var(--gmp-border); border-radius: 20px;
          padding: 2rem 1.75rem; box-shadow: 0 32px 64px rgba(0,0,0,.6);
        }
        .gmp-title { margin: 0 0 .4rem; font-size: 1.15rem; font-weight: 800; color: var(--gmp-text); }
        .gmp-subtitle { margin: 0 0 1.25rem; font-size: .85rem; color: var(--gmp-muted); line-height: 1.55; }
        .gmp-event-list { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1.25rem; max-height: 200px; overflow-y: auto; }
        .gmp-event-item { padding: .65rem .85rem; background: var(--gmp-bg); border: 1px solid var(--gmp-border); border-radius: 10px; font-size: .83rem; color: var(--gmp-text); }
        .gmp-actions { display: flex; gap: .6rem; }
        .gmp-btn { flex: 1; padding: .75rem 1rem; border-radius: 12px; font-size: .85rem; font-weight: 700; cursor: pointer; border: none; }
        .gmp-btn-primary { background: var(--gmp-accent); color: #fff; }
        .gmp-btn-primary:disabled { opacity: .55; cursor: not-allowed; }
        .gmp-btn-ghost { background: transparent; border: 1.5px solid var(--gmp-border); color: var(--gmp-muted); }
        .gmp-success-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(52,211,153,.12); border: 2px solid var(--gmp-success); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 1.5rem; color: var(--gmp-success); }
        .gmp-error { background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.22); border-radius: 10px; padding: .6rem .85rem; font-size: .8rem; color: var(--gmp-danger); margin-bottom: 1rem; }
      `}</style>

      <div className="gmp-card">
        {stage === "done" ? (
          <div style={{ textAlign: "center" }}>
            <div className="gmp-success-icon">✓</div>
            <h2 className="gmp-title" style={{ textAlign: "center" }}>
              All Merged!
            </h2>
            <p className="gmp-subtitle" style={{ textAlign: "center" }}>
              {ticketsMigrated > 0
                ? `${ticketsMigrated} guest ticket${ticketsMigrated === 1 ? "" : "s"} ${ticketsMigrated === 1 ? "has" : "have"} been added to your account.`
                : "Your guest tickets are now part of your account."}
            </p>
            <button
              type="button"
              className="gmp-btn gmp-btn-primary"
              onClick={onDismiss}
            >
              Got it
            </button>
          </div>
        ) : (
          <>
            <h2 className="gmp-title">You have unmigrated guest tickets</h2>
            <p className="gmp-subtitle">
              These guest registrations match your account email. Merge them in
              to see all your tickets in one place.
            </p>

            {error && <div className="gmp-error">⚠ {error}</div>}

            {info.events && info.events.length > 0 && (
              <div className="gmp-event-list">
                {info.events.map((ev) => (
                  <div key={ev.registrationId} className="gmp-event-item">
                    {ev.eventTitle}
                  </div>
                ))}
              </div>
            )}

            <div className="gmp-actions">
              <button
                type="button"
                className="gmp-btn gmp-btn-ghost"
                onClick={handleSnooze}
                disabled={stage === "loading"}
              >
                Remind Me Later
              </button>
              <button
                type="button"
                className="gmp-btn gmp-btn-primary"
                onClick={() =>
                  hasConflicts ? setStage("conflicts") : handleMigrateNow()
                }
                disabled={stage === "loading"}
              >
                {stage === "loading" ? "Merging…" : "Migrate Now"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
