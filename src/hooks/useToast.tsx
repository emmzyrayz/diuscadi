// hooks/useToast.ts  +  components/ui/Toaster.tsx
//
// Minimal toast system — no external dependency needed.
// 1. Wrap your layout with <Toaster /> once (e.g. in app/layout.tsx).
// 2. Call useToast() anywhere to get toast().
//
// Usage:
//   const { toast } = useToast();
//   toast({ title: "Saved", description: "Changes saved.", variant: "success" });
//   toast({ title: "Oops",  variant: "destructive" });

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
  FC,
} from "react";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = "default" | "success" | "destructive";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** ms — default 4000 */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// ─── Provider + Toaster (combine into one component for simplicity) ───────────

export const Toaster: FC<{ children?: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = Math.random().toString(36).slice(2);
      const duration = options.duration ?? 4000;
      setToasts((prev) => [...prev, { ...options, id }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  // Cleanup on unmount
  useEffect(
    () => () => {
      Object.values(timers.current).forEach(clearTimeout);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: "1.25rem",
          right: "1.25rem",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxWidth: "24rem",
          width: "100%",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ─── Individual toast card ────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, React.CSSProperties> = {
  default: {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    color: "hsl(var(--popover-foreground))",
  },
  success: {
    background: "hsl(142 71% 45%)",
    border: "1px solid hsl(142 71% 38%)",
    color: "#fff",
  },
  destructive: {
    background: "hsl(var(--destructive))",
    border: "1px solid hsl(var(--destructive))",
    color: "hsl(var(--destructive-foreground))",
  },
};

const ToastCard: FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast: t,
  onDismiss,
}) => {
  const variantStyle = VARIANT_STYLES[t.variant ?? "default"];

  return (
    <div
      role="alert"
      style={{
        ...variantStyle,
        borderRadius: "0.75rem",
        padding: "0.75rem 1rem",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        pointerEvents: "auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "0.75rem",
        animation: "toast-in 0.2s ease",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem" }}>
          {t.title}
        </p>
        {t.description && (
          <p
            style={{
              margin: "0.25rem 0 0",
              fontSize: "0.75rem",
              opacity: 0.85,
            }}
          >
            {t.description}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(t.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          opacity: 0.7,
          fontSize: "1rem",
          lineHeight: 1,
          padding: "0.125rem",
          color: "inherit",
          flexShrink: 0,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <Toaster>. Wrap your layout with <Toaster>.");
  }
  return ctx;
}