"use client";

// context/PlatformContext.tsx
// Manages all public platform data: institutions, faculties, departments,
// skills list, committees list, and committee roles.
//
// skills, committees, and committeeRoles are now DB-driven —
// fetched from /api/platform/* instead of imported from domain.ts.
//
// READ operations are public — no auth needed.
// WRITE operations (create/update/assign) are webmaster only — the API enforces this.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

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
  faculties: string[];
}

// ── DB-driven list types ──────────────────────────────────────────────────────

export interface CommitteeItem {
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  headName?: string;
  memberCount: number;
  displayOrder: number;
}

export interface SkillItem {
  slug: string;
  name: string;
  category: string;
}

export interface SkillsGrouped {
  [category: string]: { slug: string; name: string; displayOrder: number }[];
}

export interface CommitteeRoleItem {
  slug: string;
  name: string;
  rank: number;
  description: string;
}

// ── Write payload types ───────────────────────────────────────────────────────

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

// ── State ─────────────────────────────────────────────────────────────────────

interface PlatformState {
  institutions: Institution[];
  facultyMap: Record<string, Faculty[]>;
  departmentMap: Record<string, Department[]>;

  // DB-driven lists — null = not yet fetched
  committees: CommitteeItem[] | null;
  skills: SkillItem[] | null;
  skillsGrouped: SkillsGrouped | null;
  committeeRoles: CommitteeRoleItem[] | null;

  loadingInstitutions: boolean;
  loadingFaculties: Record<string, boolean>;
  loadingDepartments: Record<string, boolean>;
  loadingLists: boolean; // committees / skills / roles
  error: string | null;
}

interface PlatformContextValue extends PlatformState {
  // ── DB-driven list loaders ────────────────────────────────────────────────
  loadCommittees: () => Promise<CommitteeItem[]>;
  loadSkills: () => Promise<{ skills: SkillItem[]; grouped: SkillsGrouped }>;
  loadCommitteeRoles: () => Promise<CommitteeRoleItem[]>;

  // ── Institution read ──────────────────────────────────────────────────────
  loadInstitutions: (opts?: {
    search?: string;
    type?: string;
    all?: boolean;
  }) => Promise<void>;
  loadFaculties: (institutionId: string) => Promise<Faculty[]>;
  loadDepartments: (facultyId: string) => Promise<Department[]>;

  // ── Institution write (webmaster only) ────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    committees: null,
    skills: null,
    skillsGrouped: null,
    committeeRoles: null,
    loadingInstitutions: false,
    loadingFaculties: {},
    loadingDepartments: {},
    loadingLists: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  // ── loadCommittees ────────────────────────────────────────────────────────
  const loadCommittees = useCallback(async (): Promise<CommitteeItem[]> => {
    // Return cached if already loaded
    if (state.committees) return state.committees;

    setState((s) => ({ ...s, loadingLists: true, error: null }));
    try {
      const res = await fetch("/api/platform/committees");
      const data = await handleResponse<{ committees: CommitteeItem[] }>(res);
      setState((s) => ({
        ...s,
        committees: data.committees,
        loadingLists: false,
      }));
      return data.committees;
    } catch (err) {
      setState((s) => ({
        ...s,
        loadingLists: false,
        error: err instanceof Error ? err.message : "Failed to load committees",
      }));
      return [];
    }
  }, [state.committees]);

  // ── loadSkills ────────────────────────────────────────────────────────────
  const loadSkills = useCallback(async (): Promise<{
    skills: SkillItem[];
    grouped: SkillsGrouped;
  }> => {
    if (state.skills)
      return { skills: state.skills, grouped: state.skillsGrouped! };

    setState((s) => ({ ...s, loadingLists: true, error: null }));
    try {
      const res = await fetch("/api/platform/skills");
      const data = await handleResponse<{
        skills: SkillItem[];
        grouped: SkillsGrouped;
      }>(res);
      setState((s) => ({
        ...s,
        skills: data.skills,
        skillsGrouped: data.grouped,
        loadingLists: false,
      }));
      return data;
    } catch (err) {
      setState((s) => ({
        ...s,
        loadingLists: false,
        error: err instanceof Error ? err.message : "Failed to load skills",
      }));
      return { skills: [], grouped: {} };
    }
  }, [state.skills, state.skillsGrouped]);

  // ── loadCommitteeRoles ────────────────────────────────────────────────────
  const loadCommitteeRoles = useCallback(async (): Promise<
    CommitteeRoleItem[]
  > => {
    if (state.committeeRoles) return state.committeeRoles;

    setState((s) => ({ ...s, loadingLists: true, error: null }));
    try {
      const res = await fetch("/api/platform/committee-roles");
      const data = await handleResponse<{ roles: CommitteeRoleItem[] }>(res);
      setState((s) => ({
        ...s,
        committeeRoles: data.roles,
        loadingLists: false,
      }));
      return data.roles;
    } catch (err) {
      setState((s) => ({
        ...s,
        loadingLists: false,
        error:
          err instanceof Error ? err.message : "Failed to load committee roles",
      }));
      return [];
    }
  }, [state.committeeRoles]);

  // ── loadInstitutions ──────────────────────────────────────────────────────
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

  // ── loadFaculties ─────────────────────────────────────────────────────────
  const loadFaculties = useCallback(
    async (institutionId: string): Promise<Faculty[]> => {
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

  // ── loadDepartments ───────────────────────────────────────────────────────
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

  // ── createInstitution ─────────────────────────────────────────────────────
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

  // ── updateInstitution ─────────────────────────────────────────────────────
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

  // ── assignFaculty ─────────────────────────────────────────────────────────
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
      setState((s) => {
        const { [institutionId]: _, ...rest } = s.facultyMap;
        return { ...s, facultyMap: rest };
      });
    },
    [],
  );

  // ── unassignFaculty ───────────────────────────────────────────────────────
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

  // ── createFaculty ─────────────────────────────────────────────────────────
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

  // ── updateFaculty ─────────────────────────────────────────────────────────
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
      setState((s) => ({ ...s, facultyMap: {} }));
    },
    [],
  );

  // ── assignDepartment ──────────────────────────────────────────────────────
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
      setState((s) => {
        const { [facultyId]: _, ...rest } = s.departmentMap;
        return { ...s, departmentMap: rest, facultyMap: {} };
      });
    },
    [],
  );

  // ── unassignDepartment ────────────────────────────────────────────────────
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

  // ── createDepartment ──────────────────────────────────────────────────────
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

  // ── updateDepartment ──────────────────────────────────────────────────────
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
      setState((s) => ({ ...s, departmentMap: {} }));
    },
    [],
  );

  return (
    <PlatformContext.Provider
      value={{
        ...state,
        loadCommittees,
        loadSkills,
        loadCommitteeRoles,
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
