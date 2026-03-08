"use client";

// context/PlatformContext.tsx
// Manages all public platform data: institutions, faculties, departments,
// skills list, and committees list.
//
// READ operations are public — no auth needed.
// WRITE operations (create/update/assign) are webmaster only — the API
// enforces this, the context just calls the route.
//
// PlatformContext is consumed by:
//   - UserContext   → institution/faculty/department dropdowns on profile setup
//   - AdminContext  → institution management UI

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { SKILLS, COMMITTEES } from "@/types/domain";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Faculty {
  id: string;
  name: string;
  isActive: boolean;
  departments: Department[];
}

export interface Institution {
  id: string;
  name: string;
  type: "University" | "Polytechnic";
  state: string;
  country: string;
  isActive: boolean;
  faculties: string[]; // faculty IDs — populated separately via loadFaculties
}

export interface CreateInstitutionPayload {
  name: string;
  type: "University" | "Polytechnic";
  state: string;
  country: string;
}

export interface UpdateInstitutionPayload {
  name?: string;
  type?: "University" | "Polytechnic";
  state?: string;
  country?: string;
  isActive?: boolean;
}

interface PlatformState {
  // ── Data ──────────────────────────────────────────────────────────────────
  institutions: Institution[];
  // facultyMap: keyed by institutionId → Faculty[]
  facultyMap: Record<string, Faculty[]>;
  // departmentMap: keyed by facultyId → Department[]
  departmentMap: Record<string, Department[]>;
  // Static domain lists (from domain.ts — no API call needed)
  skills: string[];
  committees: string[];

  // ── Loading / error states ────────────────────────────────────────────────
  loadingInstitutions: boolean;
  loadingFaculties: Record<string, boolean>; // keyed by institutionId
  loadingDepartments: Record<string, boolean>; // keyed by facultyId
  error: string | null;
}

interface PlatformContextValue extends PlatformState {
  // ── Read ──────────────────────────────────────────────────────────────────
  loadInstitutions: (opts?: {
    search?: string;
    type?: string;
    all?: boolean;
  }) => Promise<void>;
  loadFaculties: (institutionId: string) => Promise<Faculty[]>;
  loadDepartments: (facultyId: string) => Promise<Department[]>;

  // ── Write (webmaster only — token passed from AuthContext) ─────────────────
  createInstitution: (
    payload: CreateInstitutionPayload,
    token: string,
  ) => Promise<Institution>;
  updateInstitution: (
    id: string,
    payload: UpdateInstitutionPayload,
    token: string,
  ) => Promise<void>;
  assignFaculty: (
    institutionId: string,
    facultyId: string,
    token: string,
  ) => Promise<void>;
  unassignFaculty: (
    institutionId: string,
    facultyId: string,
    token: string,
  ) => Promise<void>;

  createFaculty: (name: string, token: string) => Promise<Faculty>;
  updateFaculty: (
    id: string,
    payload: { name?: string; isActive?: boolean },
    token: string,
  ) => Promise<void>;
  assignDepartment: (
    facultyId: string,
    departmentId: string,
    token: string,
  ) => Promise<void>;
  unassignDepartment: (
    facultyId: string,
    departmentId: string,
    token: string,
  ) => Promise<void>;

  createDepartment: (name: string, token: string) => Promise<Department>;
  updateDepartment: (
    id: string,
    payload: { name?: string; isActive?: boolean },
    token: string,
  ) => Promise<void>;

  clearError: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function usePlatform(): PlatformContextValue {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform must be used within PlatformProvider");
  return ctx;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlatformState>({
    institutions: [],
    facultyMap: {},
    departmentMap: {},
    skills: [...SKILLS],
    committees: [...COMMITTEES],
    loadingInstitutions: false,
    loadingFaculties: {},
    loadingDepartments: {},
    error: null,
  });

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  // ── loadInstitutions ───────────────────────────────────────────────────────
  const loadInstitutions = useCallback(
    async (opts: { search?: string; type?: string; all?: boolean } = {}) => {
      setState((s) => ({ ...s, loadingInstitutions: true, error: null }));
      try {
        const params = new URLSearchParams();
        if (opts.search) params.set("search", opts.search);
        if (opts.type) params.set("type", opts.type);
        if (opts.all) params.set("all", "true");

        const res = await fetch(`/api/platform/institutions?${params}`);
        const data = await handleResponse<{ institutions: Institution[] }>(res);
        setState((s) => ({
          ...s,
          institutions: data.institutions,
          loadingInstitutions: false,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          loadingInstitutions: false,
          error:
            err instanceof Error ? err.message : "Failed to load institutions",
        }));
      }
    },
    [],
  );

  // ── loadFaculties ──────────────────────────────────────────────────────────
  const loadFaculties = useCallback(
    async (institutionId: string): Promise<Faculty[]> => {
      // Return cached if already loaded
      if (state.facultyMap[institutionId])
        return state.facultyMap[institutionId];

      setState((s) => ({
        ...s,
        loadingFaculties: { ...s.loadingFaculties, [institutionId]: true },
        error: null,
      }));
      try {
        const res = await fetch(
          `/api/platform/institutions/${institutionId}/faculties`,
        );
        const data = await handleResponse<{ faculties: Faculty[] }>(res);
        setState((s) => ({
          ...s,
          facultyMap: { ...s.facultyMap, [institutionId]: data.faculties },
          loadingFaculties: { ...s.loadingFaculties, [institutionId]: false },
        }));
        return data.faculties;
      } catch (err) {
        setState((s) => ({
          ...s,
          loadingFaculties: { ...s.loadingFaculties, [institutionId]: false },
          error:
            err instanceof Error ? err.message : "Failed to load faculties",
        }));
        return [];
      }
    },
    [state.facultyMap],
  );

  // ── loadDepartments ────────────────────────────────────────────────────────
  const loadDepartments = useCallback(
    async (facultyId: string): Promise<Department[]> => {
      if (state.departmentMap[facultyId]) return state.departmentMap[facultyId];

      setState((s) => ({
        ...s,
        loadingDepartments: { ...s.loadingDepartments, [facultyId]: true },
        error: null,
      }));
      try {
        const res = await fetch(
          `/api/platform/faculties/${facultyId}/departments`,
        );
        const data = await handleResponse<{ departments: Department[] }>(res);
        setState((s) => ({
          ...s,
          departmentMap: { ...s.departmentMap, [facultyId]: data.departments },
          loadingDepartments: { ...s.loadingDepartments, [facultyId]: false },
        }));
        return data.departments;
      } catch (err) {
        setState((s) => ({
          ...s,
          loadingDepartments: { ...s.loadingDepartments, [facultyId]: false },
          error:
            err instanceof Error ? err.message : "Failed to load departments",
        }));
        return [];
      }
    },
    [state.departmentMap],
  );

  // ── createInstitution ──────────────────────────────────────────────────────
  const createInstitution = useCallback(
    async (
      payload: CreateInstitutionPayload,
      token: string,
    ): Promise<Institution> => {
      const res = await fetch("/api/platform/institutions", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      const data = await handleResponse<{ institution: Institution }>(res);
      setState((s) => ({
        ...s,
        institutions: [...s.institutions, data.institution],
      }));
      return data.institution;
    },
    [],
  );

  // ── updateInstitution ──────────────────────────────────────────────────────
  const updateInstitution = useCallback(
    async (id: string, payload: UpdateInstitutionPayload, token: string) => {
      const res = await fetch(`/api/platform/institutions/${id}`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      const data = await handleResponse<{ institution: Institution }>(res);
      setState((s) => ({
        ...s,
        institutions: s.institutions.map((i) =>
          i.id === id ? { ...i, ...data.institution } : i,
        ),
      }));
    },
    [],
  );

  // ── assignFaculty ──────────────────────────────────────────────────────────
  const assignFaculty = useCallback(
    async (institutionId: string, facultyId: string, token: string) => {
      const res = await fetch(
        `/api/platform/institutions/${institutionId}/faculties`,
        {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ facultyId }),
        },
      );
      await handleResponse(res);
      // Invalidate faculty cache for this institution so next loadFaculties re-fetches
      setState((s) => ({
        ...s,
        facultyMap: { ...s.facultyMap, [institutionId]: undefined as never },
      }));
    },
    [],
  );

  // ── unassignFaculty ────────────────────────────────────────────────────────
  const unassignFaculty = useCallback(
    async (institutionId: string, facultyId: string, token: string) => {
      const res = await fetch(
        `/api/platform/institutions/${institutionId}/faculties/${facultyId}`,
        { method: "DELETE", headers: authHeaders(token) },
      );
      await handleResponse(res);
      setState((s) => ({
        ...s,
        facultyMap: {
          ...s.facultyMap,
          [institutionId]: (s.facultyMap[institutionId] ?? []).filter(
            (f) => f.id !== facultyId,
          ),
        },
      }));
    },
    [],
  );

  // ── createFaculty ──────────────────────────────────────────────────────────
  const createFaculty = useCallback(
    async (name: string, token: string): Promise<Faculty> => {
      const res = await fetch("/api/platform/faculties", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ name }),
      });
      const data = await handleResponse<{ faculty: Faculty }>(res);
      return data.faculty;
    },
    [],
  );

  // ── updateFaculty ──────────────────────────────────────────────────────────
  const updateFaculty = useCallback(
    async (
      id: string,
      payload: { name?: string; isActive?: boolean },
      token: string,
    ) => {
      const res = await fetch(`/api/platform/faculties/${id}`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      await handleResponse(res);
      // Invalidate all faculty caches since we don't know which institution holds this faculty
      setState((s) => ({ ...s, facultyMap: {} }));
    },
    [],
  );

  // ── assignDepartment ───────────────────────────────────────────────────────
  const assignDepartment = useCallback(
    async (facultyId: string, departmentId: string, token: string) => {
      const res = await fetch(
        `/api/platform/faculties/${facultyId}/departments`,
        {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ departmentId }),
        },
      );
      await handleResponse(res);
      // Invalidate department cache for this faculty
      setState((s) => ({
        ...s,
        departmentMap: { ...s.departmentMap, [facultyId]: undefined as never },
        // Also invalidate faculty cache since departments are embedded in faculty responses
        facultyMap: {},
      }));
    },
    [],
  );

  // ── unassignDepartment ─────────────────────────────────────────────────────
  const unassignDepartment = useCallback(
    async (facultyId: string, departmentId: string, token: string) => {
      const res = await fetch(
        `/api/platform/faculties/${facultyId}/departments/${departmentId}`,
        { method: "DELETE", headers: authHeaders(token) },
      );
      await handleResponse(res);
      setState((s) => ({
        ...s,
        departmentMap: {
          ...s.departmentMap,
          [facultyId]: (s.departmentMap[facultyId] ?? []).filter(
            (d) => d.id !== departmentId,
          ),
        },
        facultyMap: {},
      }));
    },
    [],
  );

  // ── createDepartment ───────────────────────────────────────────────────────
  const createDepartment = useCallback(
    async (name: string, token: string): Promise<Department> => {
      const res = await fetch("/api/platform/departments", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ name }),
      });
      const data = await handleResponse<{ department: Department }>(res);
      return data.department;
    },
    [],
  );

  // ── updateDepartment ───────────────────────────────────────────────────────
  const updateDepartment = useCallback(
    async (
      id: string,
      payload: { name?: string; isActive?: boolean },
      token: string,
    ) => {
      const res = await fetch(`/api/platform/departments/${id}`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      await handleResponse(res);
      // Invalidate all department caches
      setState((s) => ({ ...s, departmentMap: {} }));
    },
    [],
  );

  return (
    <PlatformContext.Provider
      value={{
        ...state,
        loadInstitutions,
        loadFaculties,
        loadDepartments,
        createInstitution,
        updateInstitution,
        assignFaculty,
        unassignFaculty,
        createFaculty,
        updateFaculty,
        assignDepartment,
        unassignDepartment,
        createDepartment,
        updateDepartment,
        clearError,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}