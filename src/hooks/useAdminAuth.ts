// hooks/useAdminAuth.ts
//
// Drop-in admin guard hook.
// Redirects to /auth if unauthenticated, to /home if not admin/webmaster.
// Usage: call at the top of any admin page component (matches the old import).

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function useAdminAuth() {
  const { user, sessionStatus } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (sessionStatus === "pending") return; // still restoring — wait

    if (sessionStatus === "unauthenticated" || !user) {
      router.replace("/auth");
      return;
    }

    if (
      user.role !== "admin" &&
      user.role !== "webmaster" &&
      user.role !== "moderator"
    ) {
      router.replace("/home");
    }
  }, [user, sessionStatus, router]);

  return { user, sessionStatus };
}
