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
import { authFetch } from "@/lib/authFetch";
import { BugReportButton } from "@/components/ui/BugReportButton";

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [isDebugTarget, setIsDebugTarget] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const check = async () => {
      try {
        const data = await authFetch<{
          config?: { isDebugTarget?: boolean };
        }>("/api/platform/config");
        setIsDebugTarget(data.config?.isDebugTarget === true);
      } catch {
        /* silently fail — no debug button */
      }
    };

    check();
  }, [isAuthenticated]);

  return (
    <>
      {children}
      <BugReportButton isDebugTarget={isDebugTarget} />
    </>
  );
};
