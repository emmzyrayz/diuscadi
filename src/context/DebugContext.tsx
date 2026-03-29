"use client";
// components/providers/DebugProvider.tsx
//
// Wraps the authenticated layout. Fetches platform config once,
// checks if the current user is a debug target, and conditionally
// renders BugReportButton.
//
// Place inside your authenticated root layout, INSIDE the AuthProvider:
//   <AuthProvider>
//     <DebugProvider>        ← add this
//       {children}
//     </DebugProvider>
//   </AuthProvider>

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { BugReportButton } from "@/components/ui/BugReportButton";

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, isAuthenticated } = useAuth();
  const [isDebugTarget, setIsDebugTarget] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const check = async () => {
      try {
        const res = await fetch("/api/platform/config", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setIsDebugTarget(data.config?.isDebugTarget === true);
      } catch {
        /* silently fail — no debug button */
      }
    };

    check();
  }, [isAuthenticated, token]);

  return (
    <>
      {children}
      <BugReportButton isDebugTarget={isDebugTarget} />
    </>
  );
};
