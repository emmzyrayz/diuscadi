"use client";
// components/sections/profile/edit/ProInfo.tsx
// Institution selection via 3-step modal:
//   Step 1 → Select Institution (searchable)
//   Step 2 → Select Faculty (scoped to institution)
//   Step 3 → Select Department + Level (scoped to faculty, level constrained by durationYears)
// After selection: degreeType + durationYears shown as read-only metadata.

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuBriefcase, LuBuilding2, LuGraduationCap, LuChartBar,
  LuLoader, LuCheck, LuX, LuSearch, LuBookOpen, LuInfo,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { Portal } from "@/components/ui/Portal";
import { toast } from "react-hot-toast";
import { getLevelsForDuration } from "@/lib/models/Institutiondepartment";
import type { DurationRange, DegreeType } from "@/lib/models/Institutiondepartment";

// ── Types ──────────────────────────────────────────────────────────────────────

interface InstitutionOption {
  id: string; name: string; abbreviation: string; type: string;
}
interface FacultyOption {
  id: string; name: string; departments: string[];
}
interface DepartmentOption {
  id: string; name: string;
}
interface JunctionData {
  degreeType:    DegreeType | null;
  durationYears: DurationRange | null;
}

// ── 3-Step Modal ─────────────────────────────────────────────────────────────

function InstitutionSelectModal({
  isOpen, onClose, onSaved,
}: {
  isOpen:   boolean;
  onClose:  () => void;
  onSaved:  () => void;
}) {
  const [step,           setStep]       = useState<1 | 2 | 3>(1);
  const [instSearch,     setInstSearch] = useState("");
  const [institutions,   setInstitutions] = useState<InstitutionOption[]>([]);
  const [loadingInst,    setLoadingInst]  = useState(false);
  const [selectedInst,   setSelectedInst]   = useState<InstitutionOption | null>(null);
  const [faculties,      setFaculties]      = useState<FacultyOption[]>([]);
  const [loadingFac,     setLoadingFac]     = useState(false);
  const [selectedFaculty,setSelectedFaculty]= useState<FacultyOption | null>(null);
  const [departments,    setDepartments]    = useState<DepartmentOption[]>([]);
  const [loadingDept,    setLoadingDept]    = useState(false);
  const [selectedDept,   setSelectedDept]   = useState<DepartmentOption | null>(null);
  const [junctionData,   setJunctionData]   = useState<JunctionData | null>(null);
  const [loadingJunction,setLoadingJunction]= useState(false);
  const [level,          setLevel]          = useState("");
  const [saving,         setSaving]         = useState(false);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1); setInstSearch(""); setSelectedInst(null);
      setSelectedFaculty(null); setSelectedDept(null);
      setJunctionData(null); setLevel("");
      setFaculties([]); setDepartments([]);
    }
  }, [isOpen]);

  // ── Step 1: search institutions ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || step !== 1) return;
    const timeout = setTimeout(() => {
      setLoadingInst(true);
      const params = new URLSearchParams({ limit: "30" });
      if (instSearch.trim()) params.set("search", instSearch.trim());
      fetch(`/api/platform/institutions?${params}`)
        .then((r) => r.json())
        .then((d) => setInstitutions(d.institutions ?? []))
        .catch(() => {})
        .finally(() => setLoadingInst(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [isOpen, step, instSearch]);

  // ── Step 2: load faculties for selected institution ──────────────────────
  useEffect(() => {
    if (!selectedInst || step !== 2) return;
    setLoadingFac(true);
    fetch(`/api/platform/institutions/${selectedInst.id}/faculties`)
      .then((r) => r.json())
      .then((d) => setFaculties(d.faculties ?? []))
      .catch(() => setFaculties([]))
      .finally(() => setLoadingFac(false));
  }, [selectedInst, step]);

  // ── Step 3: load departments for selected faculty ──────────────────────
  useEffect(() => {
    if (!selectedFaculty || step !== 3) return;
    setLoadingDept(true);
    fetch(`/api/platform/faculties/${selectedFaculty.id}/departments`)
      .then((r) => r.json())
      .then((d) => setDepartments(d.departments ?? []))
      .catch(() => setDepartments([]))
      .finally(() => setLoadingDept(false));
  }, [selectedFaculty, step]);

  // ── Load junction data when department selected ──────────────────────────
  const loadJunction = useCallback(async (deptId: string) => {
    if (!selectedInst || !selectedFaculty) return;
    setLoadingJunction(true);
    try {
      const params = new URLSearchParams({
        institutionId: selectedInst.id,
        facultyId:     selectedFaculty.id,
        departmentId:  deptId,
      });
      const res  = await fetch(`/api/platform/institution-department?${params}`);
      const data = await res.json();
      setJunctionData({
        degreeType:    data.degreeType    ?? null,
        durationYears: data.durationYears ?? null,
      });
    } catch {
      setJunctionData(null);
    } finally {
      setLoadingJunction(false);
    }
  }, [selectedInst, selectedFaculty]);

  const handleSelectDept = (dept: DepartmentOption) => {
    setSelectedDept(dept);
    setLevel("");
    loadJunction(dept.id);
  };

  // ── Level options ────────────────────────────────────────────────────────
  const levelOptions: string[] = junctionData?.durationYears && junctionData?.degreeType
    ? getLevelsForDuration(junctionData.durationYears, junctionData.degreeType)
    : ["100", "200", "300", "400", "500"]; // fallback when no junction data

  // ── Final save ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedInst || !selectedFaculty || !selectedDept) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users/institution", {
        method:  "PATCH",
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${localStorage.getItem("diuscadi_token")}`,
        },
        body: JSON.stringify({
          institutionId: selectedInst.id,
          facultyId:     selectedFaculty.id,
          departmentId:  selectedDept.id,
          level:         level || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      toast.success("Institution saved");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const STEP_LABELS = ["Select Institution", "Select Faculty", "Select Department"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-background rounded-[2.5rem] border-2 border-border w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight uppercase">Link Institution</h2>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Step {step} of 3 — {STEP_LABELS[step - 1]}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl cursor-pointer shrink-0">
            <LuX className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-muted shrink-0">
          <div className="h-1 bg-primary transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-4 overflow-y-auto flex-1">

          {/* ── Step 1: Institution search ──────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="relative">
                <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input value={instSearch} onChange={(e) => setInstSearch(e.target.value)}
                  placeholder="Search by name or abbreviation…"
                  autoFocus
                  className="w-full bg-muted border border-border rounded-2xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:border-primary/40 transition-all" />
              </div>
              {loadingInst ? (
                <div className="flex items-center justify-center py-8">
                  <LuLoader className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : institutions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No institutions found</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {institutions.map((inst) => (
                    <button key={inst.id} onClick={() => { setSelectedInst(inst); setStep(2); }}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer",
                        selectedInst?.id === inst.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted",
                      )}>
                      <p className="text-sm font-black text-foreground">{inst.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        {inst.abbreviation} · {inst.type}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Step 2: Faculty ─────────────────────────────────────────── */}
          {step === 2 && (
            <>
              <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-3">
                <LuBuilding2 className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-black text-foreground">{selectedInst?.name}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{selectedInst?.abbreviation}</p>
                </div>
              </div>
              {loadingFac ? (
                <div className="flex items-center justify-center py-8">
                  <LuLoader className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : faculties.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground">No faculties assigned to this institution yet.</p>
                  <p className="text-[10px] text-muted-foreground">Contact an admin to set up faculties for {selectedInst?.abbreviation}.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {faculties.map((fac) => (
                    <button key={fac.id} onClick={() => { setSelectedFaculty(fac); setStep(3); }}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer",
                        selectedFaculty?.id === fac.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted",
                      )}>
                      <p className="text-sm font-black text-foreground">{fac.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground">{fac.departments.length} department(s)</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Step 3: Department + Level ──────────────────────────────── */}
          {step === 3 && (
            <>
              <div className="bg-muted rounded-2xl px-4 py-3 space-y-1">
                <div className="flex items-center gap-2">
                  <LuBuilding2 className="w-3.5 h-3.5 text-primary" />
                  <p className="text-[10px] font-black text-foreground">{selectedInst?.abbreviation} · {selectedFaculty?.name}</p>
                </div>
              </div>
              {loadingDept ? (
                <div className="flex items-center justify-center py-8">
                  <LuLoader className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : departments.length === 0 ? (
                <p className="text-xs font-bold text-muted-foreground text-center py-8">No departments in this faculty yet.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Select Department</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {departments.map((dept) => (
                      <button key={dept.id} onClick={() => handleSelectDept(dept)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer",
                          selectedDept?.id === dept.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted",
                        )}>
                        <p className="text-sm font-black text-foreground">{dept.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Junction metadata — read-only, shown after dept selected */}
              {selectedDept && (
                <AnimatePresence>
                  {loadingJunction ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                      <LuLoader className="w-3.5 h-3.5 animate-spin" /> Loading program details…
                    </div>
                  ) : junctionData ? (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
                      <LuInfo className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Program Details</p>
                        <p className="text-[11px] font-bold text-muted-foreground">
                          {junctionData.degreeType && <span className="text-foreground">{junctionData.degreeType}</span>}
                          {junctionData.durationYears && (
                            <span> · {junctionData.durationYears.min === junctionData.durationYears.max
                              ? `${junctionData.durationYears.min}-year program`
                              : `${junctionData.durationYears.min}–${junctionData.durationYears.max} year program`
                            }</span>
                          )}
                        </p>
                        <p className="text-[9px] text-muted-foreground">These details are set by your institution and cannot be changed.</p>
                      </div>
                    </motion.div>
                  ) : (
                    <p className="text-[9px] text-muted-foreground py-1">No program details configured for this pairing yet.</p>
                  )}
                </AnimatePresence>
              )}

              {/* Level selection */}
              {selectedDept && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Current Level
                    {junctionData?.durationYears && (
                      <span className="ml-2 text-primary normal-case font-bold">
                        (up to {junctionData.durationYears.max * 100}L)
                      </span>
                    )}
                  </label>
                  <select value={level} onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-muted border-2 border-border rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/40 transition-all appearance-none cursor-pointer">
                    <option value="">Select level (optional)</option>
                    {levelOptions.map((l) => (
                      <option key={l} value={l}>{l}{!l.startsWith("ND") && !l.startsWith("HND") ? " Level" : ""}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-4 border-t border-border shrink-0 flex gap-3">
          {step > 1 && (
            <button onClick={() => { setStep((s) => (s - 1) as 1 | 2); setSelectedDept(null); setJunctionData(null); }}
              className="flex-1 py-4 rounded-2xl border border-border text-[11px] font-black uppercase tracking-widest hover:border-foreground transition-all cursor-pointer">
              Back
            </button>
          )}
          {step === 3 && selectedDept && (
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-foreground text-background text-[11px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all cursor-pointer disabled:opacity-60">
              {saving ? <LuLoader className="w-4 h-4 animate-spin" /> : <LuCheck className="w-4 h-4" />}
              {saving ? "Saving…" : "Save Institution"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

export const ProfessionalInfoSection = () => {
  const { profile, refreshProfile } = useUser();
  const [showModal, setShowModal] = useState(false);

  const institution  = profile?.Institution;
  const hasInstitution = !!(institution?.institutionId && institution?.name);

  return (
    <section className="bg-background border-2 border-border rounded-[2.5rem] p-8 md:p-10 shadow-sm transition-all hover:border-primary/20">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary border border-border">
          <LuBriefcase className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground tracking-tight">Professional Background</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Help us tailor your DIUSCADI experience
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">

        {/* Primary Path — read-only */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Primary Path</label>
          <div className="relative">
            <LuGraduationCap className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input type="text" value={profile?.eduStatus ?? ""} readOnly
              className="w-full bg-muted border-2 border-border rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-muted-foreground cursor-not-allowed" />
          </div>
          <p className="text-[9px] text-muted-foreground font-bold ml-1">Set during signup — contact support to change</p>
        </div>

        {/* Experience Level */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Experience Level</label>
          <div className="relative">
            <LuChartBar className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <select className="w-full bg-muted border-2 border-border rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-foreground outline-none focus:border-primary/40 focus:bg-background transition-all appearance-none cursor-pointer">
              <option value="entry">Entry Level / Undergraduate</option>
              <option value="mid">Mid-Level / Graduate</option>
              <option value="senior">Senior / Professional</option>
              <option value="expert">Expert / Founder</option>
            </select>
          </div>
          {/* TODO: persist experienceLevel when field added to UserData */}
        </div>

        {/* Institution — full width, interactive */}
        <div className="md:col-span-2 space-y-3">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
            Institution / School
          </label>

          {hasInstitution ? (
            // Linked state — show current data
            <div className="border-2 border-border rounded-2xl p-5 space-y-3 bg-muted/30">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <LuBuilding2 className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-sm font-black text-foreground">{institution.name}</p>
                    {institution.abbreviation && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-[8px] font-black uppercase tracking-widest">
                        {institution.abbreviation}
                      </span>
                    )}
                  </div>
                  {institution.faculty && (
                    <div className="flex items-center gap-2 ml-6">
                      <LuBookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <p className="text-xs font-bold text-muted-foreground">{institution.faculty}</p>
                    </div>
                  )}
                  {institution.department && (
                    <div className="flex items-center gap-2 ml-6">
                      <LuGraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <p className="text-xs font-bold text-muted-foreground">{institution.department}</p>
                      {institution.degreeType && (
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                          · {institution.degreeType}
                        </span>
                      )}
                    </div>
                  )}
                  {institution.level && (
                    <p className="text-[10px] font-bold text-primary ml-6">
                      {institution.level}{!institution.level.startsWith("ND") && !institution.level.startsWith("HND") ? " Level" : ""}
                    </p>
                  )}
                  {institution.durationYears && (
                    <p className="text-[9px] font-bold text-muted-foreground ml-6">
                      {institution.durationYears.min === institution.durationYears.max
                        ? `${institution.durationYears.min}-year program`
                        : `${institution.durationYears.min}–${institution.durationYears.max} year program`
                      }
                    </p>
                  )}
                </div>
                <button onClick={() => setShowModal(true)}
                  className="shrink-0 px-4 py-2 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-foreground transition-all cursor-pointer">
                  Change
                </button>
              </div>
            </div>
          ) : (
            // Unlinked state — CTA to open modal
            <button onClick={() => setShowModal(true)}
              className="w-full flex items-center gap-4 p-5 border-2 border-dashed border-border rounded-2xl hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer group text-left">
              <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                <LuBuilding2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">Link Your Institution</p>
                <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                  Select your school, faculty, and department
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

      <Portal>
        <InstitutionSelectModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSaved={refreshProfile}
        />
      </Portal>
    </section>
  );
};