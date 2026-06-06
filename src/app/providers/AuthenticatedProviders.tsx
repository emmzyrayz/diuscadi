"use client";

import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApplicationProvider } from "@/context/ApplicationContext";
import { AdminProvider } from "@/context/AdminContext";
import { TaskProvider } from "@/context/TaskContext";
import { TaskAdminProvider } from "@/context/TaskAdminContext";

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
        <TaskAdminProvider token={token}>
          <AdminProvider token={token}>{children}</AdminProvider>
        </TaskAdminProvider>
      </TaskProvider>
    </ApplicationProvider>
  );
}