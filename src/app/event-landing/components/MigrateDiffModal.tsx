"use client";
// MigrateDiffModal.tsx — N-way conflict resolution overlay.
// Shared by MigrateCTA (cold-migrate) and GuestMergePopup (warm-migrate).
// Self-contained styling — does not depend on any parent component's CSS
// variables, since it's mounted in different DOM contexts across both flows.

import React, { useState } from "react";
import type { NameConflict } from "@/lib/guestProfile";

interface MigrateDiffModalProps {
  conflicts: NameConflict[];
  /** Fallback for any field NOT present in conflicts (already consistent) */
  currentFirstName: string;
  currentLastName: string;
  loading?: boolean;
  error?: string | null;
  onResolve: (resolved: { firstName: string; lastName: string }) => void;
  onCancel: () => void;
}

const FIELD_LABELS: Record<"firstname" | "lastname", string> = {
  firstname: "First Name",
  lastname: "Last Name",
};

export default function MigrateDiffModal({
  conflicts,
  currentFirstName,
  currentLastName,
  loading,
  error,
  onResolve,
  onCancel,
}: MigrateDiffModalProps) {
  const firstnameConflict = conflicts.find((c) => c.field === "firstname");
  const lastnameConflict = conflicts.find((c) => c.field === "lastname");

  const [firstName, setFirstName] = useState(
    firstnameConflict?.values[0]?.value ?? currentFirstName,
  );
  const [lastName, setLastName] = useState(
    lastnameConflict?.values[0]?.value ?? currentLastName,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onResolve({ firstName, lastName });
  };

  return (
    <div className="mdm-overlay" role="dialog" aria-modal="true">
      <style>{`
        .mdm-overlay {
          --mdm-bg: #0a0a0f;
          --mdm-surface: #111118;
          --mdm-border: #1e1e2e;
          --mdm-accent: #6366f1;
          --mdm-accent-hi: #818cf8;
          --mdm-text: #e2e8f0;
          --mdm-muted: #64748b;
          --mdm-danger: #f87171;
          --mdm-font: 'DM Sans', 'Segoe UI', system-ui, sans-serif;

          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          z-index: 1000;
          font-family: var(--mdm-font);
        }
        .mdm-card {
          width: 100%;
          max-width: 460px;
          background: var(--mdm-surface);
          border: 1px solid var(--mdm-border);
          border-radius: 20px;
          padding: 2rem 1.75rem;
          box-shadow: 0 32px 64px rgba(0,0,0,.6);
        }
        .mdm-badge {
          display: inline-flex;
          align-items: center;
          gap: .35rem;
          padding: .3rem .7rem;
          border-radius: 99px;
          background: rgba(99,102,241,.1);
          border: 1px solid rgba(99,102,241,.2);
          font-size: .7rem;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--mdm-accent-hi);
          margin-bottom: .9rem;
        }
        .mdm-title {
          margin: 0 0 .4rem;
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--mdm-text);
          letter-spacing: -.01em;
        }
        .mdm-subtitle {
          margin: 0 0 1.5rem;
          font-size: .85rem;
          color: var(--mdm-muted);
          line-height: 1.55;
        }
        .mdm-field { margin-bottom: 1.2rem; }
        .mdm-label {
          display: block;
          margin-bottom: .5rem;
          font-size: .75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .06em;
          color: var(--mdm-muted);
        }
        .mdm-options {
          display: flex;
          flex-direction: column;
          gap: .5rem;
        }
        .mdm-option {
          display: flex;
          align-items: center;
          gap: .65rem;
          padding: .75rem .9rem;
          border: 1.5px solid var(--mdm-border);
          border-radius: 12px;
          cursor: pointer;
          background: var(--mdm-bg);
          transition: border-color .15s, background .15s;
        }
        .mdm-option:hover { border-color: var(--mdm-accent); }
        .mdm-option.selected {
          border-color: var(--mdm-accent);
          background: rgba(99,102,241,.08);
        }
        .mdm-radio {
          width: 16px;
          height: 16px;
          border: 2px solid var(--mdm-border);
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mdm-option.selected .mdm-radio { border-color: var(--mdm-accent); }
        .mdm-radio-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--mdm-accent);
        }
        .mdm-option-text {
          font-size: .9rem;
          font-weight: 600;
          color: var(--mdm-text);
        }
        .mdm-error {
          background: rgba(248,113,113,.08);
          border: 1px solid rgba(248,113,113,.22);
          border-radius: 10px;
          padding: .65rem .9rem;
          font-size: .82rem;
          color: var(--mdm-danger);
          margin-bottom: 1.1rem;
          line-height: 1.4;
        }
        .mdm-actions {
          display: flex;
          gap: .6rem;
          margin-top: 1.5rem;
        }
        .mdm-btn {
          flex: 1;
          padding: .8rem 1rem;
          border-radius: 12px;
          font-size: .88rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
        }
        .mdm-btn-primary {
          background: var(--mdm-accent);
          color: #fff;
        }
        .mdm-btn-primary:disabled { opacity: .55; cursor: not-allowed; }
        .mdm-btn-ghost {
          background: transparent;
          border: 1.5px solid var(--mdm-border);
          color: var(--mdm-muted);
        }
        .mdm-btn-ghost:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>

      <div className="mdm-card">
        <div className="mdm-badge">◈ Confirm Your Details</div>
        <h2 className="mdm-title">A few details don&apos;t match</h2>
        <p className="mdm-subtitle">
          We found different details across your event registrations. Pick the
          correct one for each — this only updates your account profile, your
          past tickets stay exactly as they were.
        </p>

        {error && (
          <div className="mdm-error" role="alert">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {firstnameConflict && (
            <div className="mdm-field">
              <label className="mdm-label">{FIELD_LABELS.firstname}</label>
              <div className="mdm-options" role="radiogroup">
                {firstnameConflict.values.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={firstName === opt.value}
                    disabled={loading}
                    onClick={() => setFirstName(opt.value)}
                    className={`mdm-option ${firstName === opt.value ? "selected" : ""}`}
                  >
                    <div className="mdm-radio">
                      {firstName === opt.value && (
                        <div className="mdm-radio-dot" />
                      )}
                    </div>
                    <span className="mdm-option-text">{opt.value}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {lastnameConflict && (
            <div className="mdm-field">
              <label className="mdm-label">{FIELD_LABELS.lastname}</label>
              <div className="mdm-options" role="radiogroup">
                {lastnameConflict.values.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={lastName === opt.value}
                    disabled={loading}
                    onClick={() => setLastName(opt.value)}
                    className={`mdm-option ${lastName === opt.value ? "selected" : ""}`}
                  >
                    <div className="mdm-radio">
                      {lastName === opt.value && (
                        <div className="mdm-radio-dot" />
                      )}
                    </div>
                    <span className="mdm-option-text">{opt.value}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mdm-actions">
            <button
              type="button"
              className="mdm-btn mdm-btn-ghost"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="mdm-btn mdm-btn-primary"
              disabled={loading}
            >
              {loading ? "Confirming…" : "Confirm & Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
