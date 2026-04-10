"use client";
// app/admin/settings/institutions/page.tsx
// Supports: manual create, bulk JSON/CSV import, edit, toggle active

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuBuilding2,
  LuPlus,
  LuChevronLeft,
  LuLoader,
  LuPencil,
  LuPower,
  LuUpload,
  LuX,
  LuCheck,
  LuSearch,
  LuFilter,
  LuChevronDown,
  LuTriangleAlert,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { SettingsCreateModal } from "@/components/sections/admin/modals/settingsCreateModal";
import { SettingsEditModal } from "@/components/sections/admin/modals/settingsEditModal";

interface Institution {
  id: string;
  name: string;
  abbreviation: string;
  type: string;
  state: string;
  city?: string;
  country: string;
  website?: string;
  membership?: string;
  level?: string;
  usid?: string;
  psid?: string;
  isActive: boolean;
  faculties: string[];
  gradingSystemConfirmed: boolean;
}

interface BulkResult {
  inserted: number;
  skipped: number;
  errors: number;
}

const TYPES = ["University", "Polytechnic", "College", "Institute"];
const LEVELS = ["federal", "state", "private"];
const MEMBERSHIPS = ["public", "private"];

const PAGE_SIZE = 50;

export default function InstitutionsSettingsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Institution | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterState, setFilterState] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

  const fetchInstitutions = useCallback(
    async (p = 1) => {
      if (!token) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          all: "true",
          page: String(p),
          limit: String(PAGE_SIZE),
          ...(search ? { search } : {}),
          ...(filterType ? { type: filterType } : {}),
          ...(filterState ? { state: filterState } : {}),
        });
        const res = await fetch(`/api/platform/institutions?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setInstitutions(data.institutions ?? []);
        setTotal(data.total ?? 0);
        setPage(p);
      } catch {
        toast.error("Failed to load institutions");
      } finally {
        setLoading(false);
      }
    },
    [token, search, filterType, filterState],
  );

  useEffect(() => {
    fetchInstitutions(1);
  }, [token, search, filterType, filterState, fetchInstitutions]);

  const handleToggle = async (inst: Institution) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/platform/institutions/${inst.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !inst.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        `${inst.name} ${inst.isActive ? "deactivated" : "activated"}`,
      );
      fetchInstitutions(page);
    } catch {
      toast.error("Failed to update");
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
        // Simple CSV parser — expects headers: name,abbreviation,type,state,country
        const lines = text.split("\n").filter(Boolean);
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const rows = lines.slice(1).map((line) => {
          const vals: Record<string, string> = {};
          line.split(",").forEach((v, i) => {
            vals[headers[i]] = v.trim();
          });
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
      let data: unknown;
      try {
        data = JSON.parse(bulkJson);
      } catch {
        toast.error("Invalid JSON");
        setBulkLoading(false);
        return;
      }

      const arr = Array.isArray(data)
        ? data
        : ((data as { universities?: unknown[] }).universities ?? []);
      if (!arr.length) {
        toast.error("No records found in input");
        setBulkLoading(false);
        return;
      }

      const res = await fetch("/api/admin/institutions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ institutions: arr }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Bulk import failed");

      setBulkResult(result);
      toast.success(`Imported ${result.inserted} institutions`);
      fetchInstitutions(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
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
      className={cn('max-w-[1600px]', 'w-full', 'mt-20', 'p-5', 'mx-auto', 'space-y-6')}
    >
      {/* Header */}
      <div className={cn('flex', 'flex-col', 'xl:flex-row', 'xl:items-end', 'justify-between', 'gap-6')}>
        <div className={cn('flex', 'items-center', 'gap-4')}>
          <button
            onClick={() => router.push("/admin/settings")}
            className={cn('p-3', 'rounded-2xl', 'border', 'border-border', 'hover:border-foreground', 'transition-all', 'cursor-pointer')}
          >
            <LuChevronLeft className={cn('w-5', 'h-5')} />
          </button>
          <div className={cn('w-14', 'h-14', 'rounded-2xl', 'bg-foreground', 'flex', 'items-center', 'justify-center', 'shadow-xl', 'shadow-foreground/20')}>
            <LuBuilding2 className={cn('w-7', 'h-7', 'text-background')} />
          </div>
          <div>
            <h1 className={cn('text-3xl', 'font-black', 'text-foreground', 'tracking-tighter', 'uppercase')}>
              Institutions
            </h1>
            <p className={cn('text-xs', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-1')}>
              {total.toLocaleString()} institutions
            </p>
          </div>
        </div>
        <div className={cn('flex', 'items-center', 'gap-3')}>
          <button
            onClick={() => setShowBulk((v) => !v)}
            className={cn('flex', 'items-center', 'gap-2', 'px-5', 'py-3', 'border', 'border-border', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'hover:border-foreground', 'transition-all', 'cursor-pointer')}
          >
            <LuUpload className={cn('w-4', 'h-4')} /> Bulk Import
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className={cn('flex', 'items-center', 'gap-3', 'px-6', 'py-3', 'bg-foreground', 'text-background', 'rounded-2xl', 'font-black', 'text-[10px]', 'uppercase', 'tracking-widest', 'hover:bg-primary', 'hover:text-foreground', 'transition-all', 'shadow-xl', 'cursor-pointer')}
          >
            <LuPlus className={cn('w-4', 'h-4')} /> Add Institution
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
            <div className={cn('bg-background', 'border-2', 'border-border', 'rounded-[2.5rem]', 'p-8', 'space-y-4')}>
              <div className={cn('flex', 'items-center', 'justify-between')}>
                <div>
                  <h3 className={cn('text-sm', 'font-black', 'text-foreground', 'uppercase', 'tracking-tight')}>
                    Bulk Import
                  </h3>
                  <p className={cn('text-[9px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-0.5')}>
                    Paste JSON array or upload CSV/JSON file
                  </p>
                </div>
                <button
                  onClick={() => setShowBulk(false)}
                  className={cn('p-2', 'hover:bg-muted', 'rounded-xl', 'cursor-pointer')}
                >
                  <LuX className={cn('w-4', 'h-4', 'text-muted-foreground')} />
                </button>
              </div>

              {/* Expected format hint */}
              <div className={cn('bg-muted', 'rounded-2xl', 'p-4')}>
                <p className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mb-1')}>
                  Expected JSON format
                </p>
                <pre className={cn('text-[9px]', 'font-mono', 'text-muted-foreground')}>
                  {`[{ "name": "...", "abbreviation": "...", "type": "University",
   "state": "Lagos", "country": "Nigeria", "website": "...",
   "membership": "public", "level": "federal" }]`}
                </pre>
              </div>

              {/* File upload */}
              <div className={cn('flex', 'items-center', 'gap-3')}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn('flex', 'items-center', 'gap-2', 'px-4', 'py-2.5', 'border', 'border-border', 'rounded-xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'hover:border-primary', 'transition-all', 'cursor-pointer')}
                >
                  <LuUpload className={cn('w-3.5', 'h-3.5')} /> Upload File (.json /
                  .csv)
                </button>
                {bulkJson && (
                  <span className={cn('text-[9px]', 'font-bold', 'text-emerald-600', 'uppercase', 'tracking-widest', 'flex', 'items-center', 'gap-1')}>
                    <LuCheck className={cn('w-3', 'h-3')} /> File loaded
                  </span>
                )}
              </div>

              <textarea
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                placeholder='[{"name":"University of Lagos","abbreviation":"UNILAG","type":"University","state":"Lagos","country":"Nigeria"}]'
                rows={6}
                className={cn('w-full', 'bg-muted', 'border', 'border-border', 'rounded-2xl', 'p-4', 'text-xs', 'font-mono', 'outline-none', 'focus:border-primary', 'transition-all', 'resize-none')}
              />

              {/* Result */}
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
                    <LuTriangleAlert className={cn('w-4', 'h-4', 'text-amber-600', 'shrink-0')} />
                  ) : (
                    <LuCheck className={cn('w-4', 'h-4', 'text-emerald-600', 'shrink-0')} />
                  )}
                  <p className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-foreground')}>
                    Inserted: {bulkResult.inserted} · Skipped:{" "}
                    {bulkResult.skipped} · Errors: {bulkResult.errors}
                  </p>
                </div>
              )}

              <div className={cn('flex', 'gap-3')}>
                <button
                  onClick={() => {
                    setBulkJson("");
                    setBulkResult(null);
                  }}
                  className={cn('flex-1', 'py-3', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-muted-foreground', 'hover:bg-muted', 'transition-all', 'cursor-pointer')}
                >
                  Clear
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={bulkLoading || !bulkJson.trim()}
                  className={cn('flex-1', 'flex', 'items-center', 'justify-center', 'gap-2', 'py-3', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'bg-foreground', 'text-background', 'hover:bg-primary', 'hover:text-foreground', 'transition-all', 'cursor-pointer', 'disabled:opacity-60')}
                >
                  {bulkLoading ? (
                    <LuLoader className={cn('w-4', 'h-4', 'animate-spin')} />
                  ) : (
                    <LuUpload className={cn('w-4', 'h-4')} />
                  )}
                  {bulkLoading ? "Importing…" : "Import"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className={cn('flex', 'flex-wrap', 'items-center', 'gap-3')}>
        <div className={cn('flex', 'items-center', 'gap-2', 'bg-muted', 'border', 'border-border', 'rounded-xl', 'px-3', 'py-2', 'flex-1', 'max-w-xs')}>
          <LuSearch className={cn('w-4', 'h-4', 'text-muted-foreground')} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or abbreviation…"
            className={cn('bg-transparent', 'text-sm', 'outline-none', 'w-full', 'placeholder:text-muted-foreground')}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={cn('bg-muted', 'border', 'border-border', 'rounded-xl', 'px-3', 'py-2', 'text-[11px]', 'font-black', 'uppercase', 'tracking-widest', 'outline-none', 'cursor-pointer')}
        >
          <option value="">All Types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          placeholder="Filter by state…"
          className={cn('bg-muted', 'border', 'border-border', 'rounded-xl', 'px-3', 'py-2', 'text-sm', 'outline-none')}
        />
        {(search || filterType || filterState) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterType("");
              setFilterState("");
            }}
            className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'hover:text-foreground', 'uppercase', 'tracking-widest', 'cursor-pointer')}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className={cn('flex', 'items-center', 'justify-center', 'py-20')}>
          <LuLoader className={cn('w-8', 'h-8', 'text-primary', 'animate-spin')} />
        </div>
      ) : (
        <>
          <div className={cn('bg-background', 'border-2', 'border-border', 'rounded-[2.5rem]', 'overflow-hidden', 'shadow-sm')}>
            <div className="overflow-x-auto">
              <table className={cn('w-full', 'text-left', 'border-collapse', 'min-w-[900px]')}>
                <thead>
                  <tr className={cn('bg-muted/50', 'border-b', 'border-border')}>
                    {[
                      "Institution",
                      "Abbr",
                      "Type",
                      "State",
                      "Membership",
                      "Level",
                      "Grading",
                      "Status",
                      "Actions",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-5 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]",
                          i === 8 && "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={cn('divide-y', 'divide-slate-50')}>
                  {institutions.map((inst, index) => (
                    <motion.tr
                      key={inst.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        "group hover:bg-muted/50 transition-all",
                        !inst.isActive && "opacity-50",
                      )}
                    >
                      <td className={cn('px-5', 'py-3', 'max-w-[240px]')}>
                        <p className={cn('text-[12px]', 'font-black', 'text-foreground', 'truncate')}>
                          {inst.name}
                        </p>
                        {inst.usid && (
                          <p className={cn('text-[8px]', 'font-mono', 'text-muted-foreground')}>
                            {inst.usid}
                          </p>
                        )}
                      </td>
                      <td className={cn('px-5', 'py-3')}>
                        <span className={cn('text-[10px]', 'font-black', 'text-primary', 'uppercase')}>
                          {inst.abbreviation}
                        </span>
                      </td>
                      <td className={cn('px-5', 'py-3')}>
                        <span className={cn('text-[10px]', 'font-bold', 'text-muted-foreground')}>
                          {inst.type}
                        </span>
                      </td>
                      <td className={cn('px-5', 'py-3')}>
                        <span className={cn('text-[10px]', 'font-bold', 'text-muted-foreground')}>
                          {inst.state}
                        </span>
                      </td>
                      <td className={cn('px-5', 'py-3')}>
                        {inst.membership ? (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                              inst.membership === "public"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-purple-50 text-purple-600",
                            )}
                          >
                            {inst.membership}
                          </span>
                        ) : (
                          <span className={cn('text-[8px]', 'text-slate-300')}>—</span>
                        )}
                      </td>
                      <td className={cn('px-5', 'py-3')}>
                        {inst.level ? (
                          <span className={cn('text-[9px]', 'font-bold', 'text-muted-foreground', 'capitalize')}>
                            {inst.level}
                          </span>
                        ) : (
                          <span className={cn('text-[8px]', 'text-slate-300')}>—</span>
                        )}
                      </td>
                      <td className={cn('px-5', 'py-3')}>
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full inline-block",
                            inst.gradingSystemConfirmed
                              ? "bg-emerald-500"
                              : "bg-slate-300",
                          )}
                          title={
                            inst.gradingSystemConfirmed
                              ? "Grading configured"
                              : "Pending grading setup"
                          }
                        />
                      </td>
                      <td className={cn('px-5', 'py-3')}>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                            inst.isActive
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-muted text-muted-foreground border-border",
                          )}
                        >
                          {inst.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className={cn('px-5', 'py-3', 'text-right')}>
                        <div className={cn('flex', 'items-center', 'justify-end', 'gap-1.5')}>
                          <button
                            onClick={() => setEditing(inst)}
                            className={cn('p-1.5', 'hover:bg-background', 'border', 'border-transparent', 'hover:border-border', 'rounded-lg', 'text-muted-foreground', 'hover:text-foreground', 'transition-all', 'cursor-pointer')}
                          >
                            <LuPencil className={cn('w-3.5', 'h-3.5')} />
                          </button>
                          <button
                            onClick={() => handleToggle(inst)}
                            className={cn(
                              "p-1.5 rounded-lg border border-transparent transition-all cursor-pointer",
                              inst.isActive
                                ? "text-amber-600 hover:bg-amber-50 hover:border-amber-100"
                                : "text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100",
                            )}
                          >
                            <LuPower className={cn('w-3.5', 'h-3.5')} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={cn('flex', 'items-center', 'justify-center', 'gap-3')}>
              <button
                onClick={() => fetchInstitutions(page - 1)}
                disabled={page === 1}
                className={cn('px-4', 'py-2', 'rounded-xl', 'border', 'border-border', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'disabled:opacity-40', 'hover:border-foreground', 'transition-all', 'cursor-pointer')}
              >
                Previous
              </button>
              <span className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                {page} of {totalPages}
              </span>
              <button
                onClick={() => fetchInstitutions(page + 1)}
                disabled={page === totalPages}
                className={cn('px-4', 'py-2', 'rounded-xl', 'border', 'border-border', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'disabled:opacity-40', 'hover:border-foreground', 'transition-all', 'cursor-pointer')}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      <Portal>
        <SettingsCreateModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          title="Add Institution"
          fields={[
            { key: "name", label: "Full Name", type: "text", required: true },
            {
              key: "abbreviation",
              label: "Abbreviation",
              type: "text",
              required: true,
              placeholder: "e.g. UNILAG",
            },
            {
              key: "type",
              label: "Type",
              type: "select",
              options: TYPES,
              required: true,
            },
            { key: "state", label: "State", type: "text", required: true },
            { key: "city", label: "City", type: "text" },
            {
              key: "country",
              label: "Country",
              type: "text",
              required: true,
              defaultValue: "Nigeria",
            },
            {
              key: "website",
              label: "Website",
              type: "text",
              placeholder: "https://...",
            },
            {
              key: "membership",
              label: "Membership",
              type: "select",
              options: MEMBERSHIPS,
            },
            { key: "level", label: "Level", type: "select", options: LEVELS },
          ]}
          onConfirm={async (data) => {
            if (!token) return;
            try {
              const res = await fetch("/api/platform/institutions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
              });
              if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error ?? "Failed");
              }
              toast.success("Institution created");
              setShowCreate(false);
              fetchInstitutions(1);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            }
          }}
          className="w-screen h-screen py-10"
        />
      </Portal>

      {/* Edit modal */}
      <Portal>
        {editing && (
          <SettingsEditModal
            isOpen={!!editing}
            onClose={() => setEditing(null)}
            title="Edit Institution"
            fields={[
              {
                key: "name",
                label: "Full Name",
                type: "text",
                required: true,
                defaultValue: editing.name,
              },
              {
                key: "abbreviation",
                label: "Abbreviation",
                type: "text",
                required: true,
                defaultValue: editing.abbreviation,
              },
              {
                key: "type",
                label: "Type",
                type: "select",
                options: TYPES,
                required: true,
                defaultValue: editing.type,
              },
              {
                key: "state",
                label: "State",
                type: "text",
                required: true,
                defaultValue: editing.state,
              },
              {
                key: "city",
                label: "City",
                type: "text",
                defaultValue: editing.city ?? "",
              },
              {
                key: "website",
                label: "Website",
                type: "text",
                defaultValue: editing.website ?? "",
              },
              {
                key: "membership",
                label: "Membership",
                type: "select",
                options: MEMBERSHIPS,
                defaultValue: editing.membership ?? "",
              },
              {
                key: "level",
                label: "Level",
                type: "select",
                options: LEVELS,
                defaultValue: editing.level ?? "",
              },
              { key: "motto", label: "Motto", type: "text" },
              { key: "foundingYear", label: "Founding Year", type: "number" },
              { key: "chancellor", label: "Chancellor", type: "text" },
              { key: "viceChancellor", label: "Vice Chancellor", type: "text" },
            ]}
            onConfirm={async (data) => {
              if (!token) return;
              try {
                const res = await fetch(
                  `/api/platform/institutions/${editing.id}`,
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(data),
                  },
                );
                if (!res.ok) throw new Error("Failed to update");
                toast.success("Institution updated");
                setEditing(null);
                fetchInstitutions(page);
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
