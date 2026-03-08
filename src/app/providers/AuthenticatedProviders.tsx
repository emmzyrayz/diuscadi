"use client";

// providers/AuthenticatedProviders.tsx
// Wrapper for providers that need the token from AuthContext.
// ApplicationProvider and AdminProvider both require token as a prop
// so they can't be registered directly in the registry — they need to
// read from AuthContext first.
//
// This component sits inside AuthProvider in the registry and bridges
// the gap between the registry pattern and token-dependent providers.

import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApplicationProvider } from "@/context/ApplicationContext";
import { AdminProvider } from "@/context/AdminContext";

interface AuthenticatedProvidersProps {
  children: ReactNode;
}

export function AuthenticatedProviders({
  children,
}: AuthenticatedProvidersProps) {
  const { token } = useAuth();

  return (
    <ApplicationProvider token={token}>
      <AdminProvider token={token}>{children}</AdminProvider>
    </ApplicationProvider>
  );
}
