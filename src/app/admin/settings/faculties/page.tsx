"use client";
// app/admin/settings/faculties/page.tsx
//
// Global pool view of all faculties.
// Each row shows: faculty name | assigned institution(s) | status
// Create flow: name → assign to institution (optional at creation)
// Bulk import: JSON array of { name, institutionAbbr? }

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuGraduationCap,
  LuPlus,
  LuChevronLeft,
  LuLoader,
  LuPencil,
  LuPower,
  LuUpload,
  LuX,
  LuCheck,
  LuSearch,
  LuTriangleAlert,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { SettingsCreateModal } from "@/components/sections/admin/modals/settingsCreateModal";
import { SettingsEditModal }   from "@/components/sections/admin/modals/settingsEditModal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FacultyRow {
  id:           string;
  name:         string;
  isActive:     boolean;
  departments:  string[]; // department IDs
  // Populated after join with institutions
  institutions: { id: string; name: string; abbreviation: string }[];
}

interface InstitutionOption {
  id:           string;
  name:         string;
  abbreviation: string;
}

interface BulkResult {
  inserted: number;
  skipped:  number;
  errors:   number;
}

const PAGE_SIZE = 50;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FacultiesSettingsPage() {
  const router       = useRouter();
  const { token }    = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [faculties,     setFaculties]     = useState<FacultyRow[]>([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [search,        setSearch]        = useState("");
  const [filterInst,    setFilterInst]    = useState("");
  const [showCreate,    setShowCreate]    = useState(false);
  const [editing,       setEditing]       = useState<FacultyRow | null>(null);
  const [showBulk,      setShowBulk]      = useState(false);
  const [bulkJson,      setBulkJson]      = useState("");
  const [bulkLoading,   setBulkLoading]   = useState(false);
  const [bulkResult,    setBulkResult]    = useState<BulkResult | null>(null);
  const [institutions,  setInstitutions]  = useState<InstitutionOption[]>([]);

  // ── Load institutions for dropdowns ───────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch("/api/platform/institutions?all=true&limit=200", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setInstitutions(d.institutions ?? []))
      .catch(() => {});
  }, [token]);

  // ── Load faculties (global pool) ───────────────────────────────────────────
  // Strategy: fetch all faculties, then for each fetch which institutions
  // reference them. We do this in one extra aggregation call on the server
  // via a dedicated endpoint, or we join client-side using institution data.
  //
  // For now: fetch faculties + fetch all institutions, then cross-reference
  // institution.faculties[] to build the reverse map client-side.
  const fetchFaculties = useCallback(async (p = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        all:   "true",
        page:  String(p),
        limit: String(PAGE_SIZE),
        ...(search ? { search } : {}),
      });

      const [facRes, instRes] = await Promise.all([
        fetch(`/api/platform/faculties?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/platform/institutions?all=true&limit=500", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [facData, instData] = await Promise.all([
        facRes.json(),
        instRes.json(),
      ]);

      const allInstitutions: (InstitutionOption & { faculties: string[] })[] =
        instData.institutions ?? [];

      // Build reverse map: facultyId → institutions that own it
      const reverseMap = new Map<string, InstitutionOption[]>();
      for (const inst of allInstitutions) {
        for (const fId of inst.faculties) {
          if (!reverseMap.has(fId)) reverseMap.set(fId, []);
          reverseMap.get(fId)!.push({ id: inst.id, name: inst.name, abbreviation: inst.abbreviation });
        }
      }

      const rows: FacultyRow[] = (facData.faculties ?? []).map((f: {
        id: string; name: string; isActive: boolean; departments: string[];
      }) => ({
        ...f,
        institutions: reverseMap.get(f.id) ?? [],
      }));

      // Filter by institution if selected
      const filtered = filterInst
        ? rows.filter((r) => r.institutions.some((i) => i.id === filterInst))
        : rows;

      setFaculties(filtered);
      setTotal(filterInst ? filtered.length : (facData.total ?? 0));
      setPage(p);
    } catch { toast.error("Failed to load faculties"); }
    finally  { setLoading(false); }
  }, [token, search, filterInst]);

  useEffect(() => { fetchFaculties(1); }, [fetchFaculties]);

  // ── Toggle active ──────────────────────────────────────────────────────────
  const handleToggle = async (fac: FacultyRow) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/platform/faculties/${fac.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ isActive: !fac.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${fac.name} ${fac.isActive ? "deactivated" : "activated"}`);
      fetchFaculties(page);
    } catch { toast.error("Failed to update"); }
  };

  // ── Assign faculty to institution ──────────────────────────────────────────
  const assignToInstitution = async (facultyId: string, institutionId: string) => {
    if (!token || !institutionId) return;
    try {
      const res = await fetch(`/api/platform/institutions/${institutionId}/faculties`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ facultyId }),
      });
      if (!res.ok) {
        const d = await res.json();
        // 409 = already assigned — not a real error
        if (res.status !== 409) throw new Error(d.error ?? "Assignment failed");
      }
    } catch (err) {
      throw err;
    }
  };

  // ── Bulk import ────────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (file.name.endsWith(".csv")) {
        const lines   = text.split("\n").filter(Boolean);
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const rows    = lines.slice(1).map((line) => {
          const vals: Record<string, string> = {};
          line.split(",").forEach((v, i) => { vals[headers[i]] = v.trim(); });
          return vals;
        });
        setBulkJson(JSON.stringify(rows, null, 2));
      } else {
        setBulkJson(text);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (!token || !bulkJson.trim()) return;
    setBulkLoading(true);
    setBulkResult(null);
    try {
      let arr: unknown[];
      try { arr = JSON.parse(bulkJson); }
      catch { toast.error("Invalid JSON"); return; }
      if (!Array.isArray(arr) || !arr.length) { toast.error("No records found"); return; }

      // Build institution abbreviation → id map for assignment
      const abbrMap = new Map(institutions.map((i) => [i.abbreviation.toUpperCase(), i.id]));

      let inserted = 0, skipped = 0, errors = 0;

      for (const item of arr as Record<string, unknown>[]) {
        const name = String(item.name ?? "").trim();
        if (!name) { errors++; continue; }

        // Create faculty
        const res = await fetch("/api/platform/faculties", {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ name }),
        });

        if (res.status === 409) { skipped++; continue; }
        if (!res.ok)            { errors++;  continue; }

        const data = await res.json();
        inserted++;

        // Auto-assign to institution if institutionAbbr provided
        const abbr = String(item.institutionAbbr ?? "").toUpperCase();
        if (abbr && abbrMap.has(abbr)) {
          try { await assignToInstitution(data.faculty.id, abbrMap.get(abbr)!); }
          catch { /* assignment failure doesn't fail the import */ }
        }
      }

      setBulkResult({ inserted, skipped, errors });
      toast.success(`Imported ${inserted} faculties`);
      fetchFaculties(1);
    } finally {
      setBulkLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "max-w-[1600px]",
        "w-full",
        "md:mt-20",
        "mt-10",
        "p-5",
        "mx-auto",
        "space-y-6",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex",
          "flex-col",
          "xl:flex-row",
          "xl:items-end",
          "justify-between",
          "gap-6",
        )}
      >
        <div className={cn("flex", "items-center", "gap-4")}>
          <button
            onClick={() => router.push("/admin/settings")}
            className={cn(
              "p-3",
              "rounded-2xl",
              "border",
              "border-border",
              "hover:border-foreground",
              "transition-all",
              "cursor-pointer",
            )}
          >
            <LuChevronLeft className={cn("w-5", "h-5")} />
          </button>
          <div
            className={cn(
              "w-14",
              "h-14",
              "rounded-2xl",
              "bg-foreground",
              "flex",
              "items-center",
              "justify-center",
              "shadow-xl",
              "shadow-foreground/20",
            )}
          >
            <LuGraduationCap className={cn("w-7", "h-7", "text-background")} />
          </div>
          <div>
            <h1
              className={cn(
                "text-3xl",
                "font-black",
                "text-foreground",
                "tracking-tighter",
                "uppercase",
              )}
            >
              Faculties
            </h1>
            <p
              className={cn(
                "text-xs",
                "font-bold",
                "text-muted-foreground",
                "uppercase",
                "tracking-widest",
                "mt-1",
              )}
            >
              {total} faculties across all institutions
            </p>
          </div>
        </div>
        <div className={cn("flex", "items-center", "gap-3")}>
          <button
            onClick={() => setShowBulk((v) => !v)}
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "px-5",
              "py-3",
              "border",
              "border-border",
              "rounded-2xl",
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "hover:border-foreground",
              "transition-all",
              "cursor-pointer",
            )}
          >
            <LuUpload className={cn("w-4", "h-4")} /> Bulk Import
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className={cn(
              "flex",
              "items-center",
              "gap-3",
              "px-6",
              "py-3",
              "bg-foreground",
              "text-background",
              "rounded-2xl",
              "font-black",
              "text-[10px]",
              "uppercase",
              "tracking-widest",
              "hover:bg-primary",
              "hover:text-foreground",
              "transition-all",
              "shadow-xl",
              "cursor-pointer",
            )}
          >
            <LuPlus className={cn("w-4", "h-4")} /> Add Faculty
          </button>
        </div>
      </div>

      {/* Bulk import panel */}
      <AnimatePresence>
        {showBulk && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "bg-background",
                "border-2",
                "border-border",
                "rounded-[2.5rem]",
                "p-8",
                "space-y-4",
              )}
            >
              <div className={cn("flex", "items-center", "justify-between")}>
                <div>
                  <h3
                    className={cn(
                      "text-sm",
                      "font-black",
                      "text-foreground",
                      "uppercase",
                      "tracking-tight",
                    )}
                  >
                    Bulk Import Faculties
                  </h3>
                  <p
                    className={cn(
                      "text-[9px]",
                      "font-bold",
                      "text-muted-foreground",
                      "uppercase",
                      "tracking-widest",
                      "mt-0.5",
                    )}
                  >
                    Paste JSON or upload CSV/JSON file
                  </p>
                </div>
                <button
                  onClick={() => setShowBulk(false)}
                  className={cn(
                    "p-2",
                    "hover:bg-muted",
                    "rounded-xl",
                    "cursor-pointer",
                  )}
                >
                  <LuX className={cn("w-4", "h-4", "text-muted-foreground")} />
                </button>
              </div>
              <div className={cn("bg-muted", "rounded-2xl", "p-4")}>
                <p
                  className={cn(
                    "text-[9px]",
                    "font-black",
                    "text-muted-foreground",
                    "uppercase",
                    "tracking-widest",
                    "mb-1",
                  )}
                >
                  Expected format
                </p>
                <pre
                  className={cn(
                    "text-[9px]",
                    "font-mono",
                    "text-muted-foreground",
                  )}
                >
                  {`[{ "name": "Faculty of Engineering", "institutionAbbr": "UNILAG" },
 { "name": "Faculty of Sciences" }]`}
                </pre>
                <p
                  className={cn("text-[9px]", "text-muted-foreground", "mt-1")}
                >
                  <span className="font-black">institutionAbbr</span> is
                  optional — omit to create without assignment
                </p>
              </div>
              <div className={cn("flex", "items-center", "gap-3")}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-2",
                    "px-4",
                    "py-2.5",
                    "border",
                    "border-border",
                    "rounded-xl",
                    "text-[10px]",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                    "hover:border-primary",
                    "transition-all",
                    "cursor-pointer",
                  )}
                >
                  <LuUpload className={cn("w-3.5", "h-3.5")} /> Upload File
                </button>
                {bulkJson && (
                  <span
                    className={cn(
                      "text-[9px]",
                      "font-bold",
                      "text-emerald-600",
                      "uppercase",
                      "tracking-widest",
                      "flex",
                      "items-center",
                      "gap-1",
                    )}
                  >
                    <LuCheck className={cn("w-3", "h-3")} /> Loaded
                  </span>
                )}
              </div>
              <textarea
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                placeholder='[{"name":"Faculty of Engineering","institutionAbbr":"UNILAG"}]'
                rows={5}
                className={cn(
                  "w-full",
                  "bg-muted",
                  "border",
                  "border-border",
                  "rounded-2xl",
                  "p-4",
                  "text-xs",
                  "font-mono",
                  "outline-none",
                  "focus:border-primary",
                  "transition-all",
                  "resize-none",
                )}
              />
              {bulkResult && (
                <div
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border",
                    bulkResult.errors > 0
                      ? "bg-amber-50 border-amber-100"
                      : "bg-emerald-50 border-emerald-100",
                  )}
                >
                  {bulkResult.errors > 0 ? (
                    <LuTriangleAlert
                      className={cn("w-4", "h-4", "text-amber-600", "shrink-0")}
                    />
                  ) : (
                    <LuCheck
                      className={cn(
                        "w-4",
                        "h-4",
                        "text-emerald-600",
                        "shrink-0",
                      )}
                    />
                  )}
                  <p
                    className={cn(
                      "text-[10px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                      "text-foreground",
                    )}
                  >
                    Inserted: {bulkResult.inserted} · Skipped:{" "}
                    {bulkResult.skipped} · Errors: {bulkResult.errors}
                  </p>
                </div>
              )}
              <div className={cn("flex", "gap-3")}>
                <button
                  onClick={() => {
                    setBulkJson("");
                    setBulkResult(null);
                  }}
                  className={cn(
                    "flex-1",
                    "py-3",
                    "rounded-2xl",
                    "text-[10px]",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                    "text-muted-foreground",
                    "hover:bg-muted",
                    "transition-all",
                    "cursor-pointer",
                  )}
                >
                  Clear
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={bulkLoading || !bulkJson.trim()}
                  className={cn(
                    "flex-1",
                    "flex",
                    "items-center",
                    "justify-center",
                    "gap-2",
                    "py-3",
                    "rounded-2xl",
                    "text-[10px]",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                    "bg-foreground",
                    "text-background",
                    "hover:bg-primary",
                    "hover:text-foreground",
                    "transition-all",
                    "cursor-pointer",
                    "disabled:opacity-60",
                  )}
                >
                  {bulkLoading ? (
                    <LuLoader className={cn("w-4", "h-4", "animate-spin")} />
                  ) : (
                    <LuUpload className={cn("w-4", "h-4")} />
                  )}
                  {bulkLoading ? "Importing…" : "Import"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className={cn("flex", "flex-wrap", "items-center", "gap-3")}>
        <div
          className={cn(
            "flex",
            "items-center",
            "gap-2",
            "bg-muted",
            "border",
            "border-border",
            "rounded-xl",
            "px-3",
            "py-2",
            "flex-1",
            "max-w-xs",
          )}
        >
          <LuSearch
            className={cn("w-4", "h-4", "text-muted-foreground", "shrink-0")}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search faculties…"
            className={cn(
              "bg-transparent",
              "text-sm",
              "outline-none",
              "w-full",
              "placeholder:text-muted-foreground",
            )}
          />
        </div>
        <select
          value={filterInst}
          onChange={(e) => setFilterInst(e.target.value)}
          className={cn(
            "bg-muted",
            "border",
            "border-border",
            "rounded-xl",
            "px-3",
            "py-2",
            "text-[11px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "outline-none",
            "cursor-pointer",
            "max-w-[240px]",
          )}
        >
          <option value="">All Institutions</option>
          {institutions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.abbreviation} — {i.name}
            </option>
          ))}
        </select>
        {(search || filterInst) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterInst("");
            }}
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "hover:text-foreground",
              "uppercase",
              "tracking-widest",
              "cursor-pointer",
            )}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className={cn("flex", "items-center", "justify-center", "py-20")}>
          <LuLoader
            className={cn("w-8", "h-8", "text-primary", "animate-spin")}
          />
        </div>
      ) : (
        <>
          <div
            className={cn(
              "bg-background",
              "border-2",
              "border-border",
              "rounded-[2.5rem]",
              "overflow-hidden",
              "shadow-sm",
            )}
          >
            <div className="overflow-x-auto">
              <table
                className={cn(
                  "w-full",
                  "text-left",
                  "border-collapse",
                  "min-w-[600px]",
                )}
              >
                <thead>
                  <tr
                    className={cn("bg-muted/50", "border-b", "border-border")}
                  >
                    {[
                      "Faculty Name",
                      "Assigned To",
                      "Departments",
                      "Status",
                      "Actions",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-5 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]",
                          i === 4 && "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={cn("divide-y", "divide-slate-50")}>
                  {faculties.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className={cn(
                          "px-6",
                          "py-16",
                          "text-center",
                          "text-xs",
                          "font-bold",
                          "text-muted-foreground",
                        )}
                      >
                        No faculties found
                      </td>
                    </tr>
                  ) : (
                    faculties.map((fac, index) => (
                      <motion.tr
                        key={fac.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={cn(
                          "group hover:bg-muted/50 transition-all",
                          !fac.isActive && "opacity-50",
                        )}
                      >
                        <td className={cn("px-5", "py-3")}>
                          <span
                            className={cn(
                              "text-sm",
                              "font-black",
                              "text-foreground",
                              "group-hover:text-primary",
                              "transition-colors",
                            )}
                          >
                            {fac.name}
                          </span>
                        </td>
                        <td className={cn("px-5", "py-3", "max-w-[220px]")}>
                          {fac.institutions.length === 0 ? (
                            <span
                              className={cn(
                                "text-[9px]",
                                "font-bold",
                                "text-slate-300",
                                "uppercase",
                                "tracking-widest",
                              )}
                            >
                              Unassigned
                            </span>
                          ) : (
                            <div className={cn("flex", "flex-wrap", "gap-1")}>
                              {fac.institutions.map((i) => (
                                <span
                                  key={i.id}
                                  className={cn(
                                    "px-2",
                                    "py-0.5",
                                    "bg-primary/10",
                                    "text-primary",
                                    "rounded-lg",
                                    "text-[8px]",
                                    "font-black",
                                    "uppercase",
                                    "tracking-widest",
                                  )}
                                >
                                  {i.abbreviation}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className={cn("px-5", "py-3")}>
                          <span
                            className={cn(
                              "text-[11px]",
                              "font-bold",
                              "text-muted-foreground",
                            )}
                          >
                            {fac.departments.length}
                          </span>
                        </td>
                        <td className={cn("px-5", "py-3")}>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                              fac.isActive
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-muted text-muted-foreground border-border",
                            )}
                          >
                            {fac.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className={cn("px-5", "py-3", "text-right")}>
                          <div
                            className={cn(
                              "flex",
                              "items-center",
                              "justify-end",
                              "gap-1.5",
                            )}
                          >
                            <button
                              onClick={() => setEditing(fac)}
                              className={cn(
                                "p-1.5",
                                "hover:bg-background",
                                "border",
                                "border-transparent",
                                "hover:border-border",
                                "rounded-lg",
                                "text-muted-foreground",
                                "hover:text-foreground",
                                "transition-all",
                                "cursor-pointer",
                              )}
                            >
                              <LuPencil className={cn("w-3.5", "h-3.5")} />
                            </button>
                            <button
                              onClick={() => handleToggle(fac)}
                              className={cn(
                                "p-1.5 rounded-lg border border-transparent transition-all cursor-pointer",
                                fac.isActive
                                  ? "text-amber-600 hover:bg-amber-50 hover:border-amber-100"
                                  : "text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100",
                              )}
                            >
                              <LuPower className={cn("w-3.5", "h-3.5")} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div
              className={cn("flex", "items-center", "justify-center", "gap-3")}
            >
              <button
                onClick={() => fetchFaculties(page - 1)}
                disabled={page === 1}
                className={cn(
                  "px-4",
                  "py-2",
                  "rounded-xl",
                  "border",
                  "border-border",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "disabled:opacity-40",
                  "hover:border-foreground",
                  "transition-all",
                  "cursor-pointer",
                )}
              >
                Previous
              </button>
              <span
                className={cn(
                  "text-[10px]",
                  "font-black",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                {page} of {totalPages}
              </span>
              <button
                onClick={() => fetchFaculties(page + 1)}
                disabled={page === totalPages}
                className={cn(
                  "px-4",
                  "py-2",
                  "rounded-xl",
                  "border",
                  "border-border",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "disabled:opacity-40",
                  "hover:border-foreground",
                  "transition-all",
                  "cursor-pointer",
                )}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Create modal — includes institution assignment */}
      <Portal>
        <SettingsCreateModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          title="Add Faculty"
          fields={[
            {
              key: "name",
              label: "Faculty Name",
              type: "text",
              required: true,
              placeholder: "e.g. Faculty of Engineering",
            },
            {
              key: "institutionId",
              label: "Assign to Institution (optional)",
              type: "select",
              options: ["", ...institutions.map((i) => i.id)],
              optionLabels: [
                "— Skip assignment —",
                ...institutions.map((i) => `${i.abbreviation} — ${i.name}`),
              ],
            },
          ]}
          onConfirm={async (data) => {
            if (!token) return;
            try {
              // Step 1: create faculty
              const res = await fetch("/api/platform/faculties", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: data.name }),
              });
              const d = await res.json();
              if (!res.ok)
                throw new Error(d.error ?? "Failed to create faculty");

              // Step 2: assign to institution if selected
              if (data.institutionId) {
                await assignToInstitution(
                  d.faculty.id,
                  data.institutionId as string,
                );
              }

              toast.success(
                "Faculty created" + (data.institutionId ? " and assigned" : ""),
              );
              setShowCreate(false);
              fetchFaculties(1);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            }
          }}
        />
      </Portal>

      {/* Edit modal */}
      <Portal>
        {editing && (
          <SettingsEditModal
            isOpen={!!editing}
            onClose={() => setEditing(null)}
            title="Edit Faculty"
            fields={[
              {
                key: "name",
                label: "Faculty Name",
                type: "text",
                required: true,
                defaultValue: editing.name,
              },
              {
                key: "isActive",
                label: "Active",
                type: "select",
                options: ["true", "false"],
                optionLabels: ["Active", "Inactive"],
                defaultValue: String(editing.isActive),
              },
            ]}
            onConfirm={async (data) => {
              if (!token) return;
              try {
                const res = await fetch(
                  `/api/platform/faculties/${editing.id}`,
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      name: data.name,
                      isActive: data.isActive === "true",
                    }),
                  },
                );
                if (!res.ok) throw new Error("Failed to update");
                toast.success("Faculty updated");
                setEditing(null);
                fetchFaculties(page);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed");
              }
            }}
          />
        )}
      </Portal>
    </motion.div>
  );
}