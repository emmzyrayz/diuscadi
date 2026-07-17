// lib/authFetch.ts
import { signalSessionExpired } from "@/lib/sessionEvents";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("diuscadi_token");
}

export function authHeaders(extra?: Record<string, string>): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

/**
 * Wraps fetch for authenticated API calls. Parses JSON, throws on non-OK,
 * and signals a global session-expired event on 401 so AuthContext can
 * clear state and RouteGuard can redirect — without every context needing
 * its own 401 handling.
 *
 * IMPORTANT: the generic parameter here (TResponse) must never share a name
 * with a built-in DOM type (Event, Response, ResponseType, etc). Doing so
 * silently shadows the global and causes `res` to lose its real fetch
 * Response type — this is what caused the ".json() does not exist" errors.
 */
export async function authFetch<TResponse>(
  url: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const res: Response = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers as Record<string, string>),
    },
  });
  const data: unknown = await res.json();
  if (res.status === 401) signalSessionExpired();
  if (!res.ok) {
    const errMsg =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error?: unknown }).error)
        : "Request failed";
    throw new Error(errMsg);
  }
  return data as TResponse;
}
