"use client";

// providers/AuthenticatedProviders.tsx
// Unchanged structure — TaskProvider inserted between ApplicationProvider
// and AdminProvider. All three receive token from useAuth() for consistency,
// even though TaskProvider reads from localStorage directly (same as EventContext).

import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApplicationProvider } from "@/context/ApplicationContext";
import { AdminProvider } from "@/context/AdminContext";
import { TaskProvider } from "@/context/TaskContext";

interface AuthenticatedProvidersProps {
  children: ReactNode;
}

export function AuthenticatedProviders({
  children,
}: AuthenticatedProvidersProps) {
  const { token } = useAuth();

  return (
    <ApplicationProvider token={token}>
      <TaskProvider token={token}>
        <AdminProvider token={token}>{children}</AdminProvider>
      </TaskProvider>
    </ApplicationProvider>
  );
}
