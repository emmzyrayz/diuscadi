"use client";
// components/ui/Portal.tsx
// React 19 compatible portal — avoids both:
//   - reading refs during render
//   - calling setState synchronously inside useEffect
//
// Strategy: create the DOM node once with useMemo (runs synchronously
// during the first render on the client, never on the server), then
// append / remove it in useEffect without any setState.

import { useMemo, useEffect } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
}

export function Portal({ children }: PortalProps) {
  // useMemo runs during render but only on the client after hydration.
  // Returns undefined on the server (typeof document === "undefined").
  const container = useMemo(() => {
    if (typeof document === "undefined") return null;
    return document.createElement("div");
  }, []);

  useEffect(() => {
    if (!container) return;
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  }, [container]);

  if (!container) return null;
  return createPortal(children, container);
}
