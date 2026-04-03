// lib/db/collections.ts
import { Db } from "mongodb";
import { VaultDocument } from "@/lib/models/vault";
import { UserDataDocument } from "@/lib/models/UserData";
import { ApplicationDocument } from "@/lib/models/Application";
import { EventDocument } from "@/lib/models/Events";
import { TicketTypeDocument } from "@/lib/models/ticketType";
import { EventRegistrationDocument } from "@/lib/models/EventRegistration";
import { InstitutionDocument } from "@/lib/models/institution";
import { FacultyDocument } from "@/lib/models/Faculty";
import { DepartmentDocument } from "@/lib/models/Department";
import { InviteDocument } from "@/lib/models/invite";
import { HealthReportDocument } from "@/lib/models/healthReport";
import { FileDocument } from "@/lib/models/FileDocument";
import { ReferralLinkDocument } from "@/lib/models/ReferralLink";
import { ReferralEventDocument } from "@/lib/models/ReferralEvent";
import type { CurriculumSubmissionDocument } from "@/lib/models/CurriculumSubmission";
import type {
  CommitteeDocument,
  SkillDocument,
  CommitteeRoleDocument,
  PlatformConfigDocument,
} from "@/lib/models/platformConfig";

export const Collections = {
  vault: (db: Db) => db.collection<VaultDocument>("vault"),
  userData: (db: Db) => db.collection<UserDataDocument>("userData"),
  sessions: (db: Db) => db.collection("sessions"),
  applications: (db: Db) => db.collection<ApplicationDocument>("applications"),
  events: (db: Db) => db.collection<EventDocument>("events"),
  ticketTypes: (db: Db) => db.collection<TicketTypeDocument>("ticketTypes"),
  eventRegistrations: (db: Db) =>
    db.collection<EventRegistrationDocument>("eventRegistrations"),
  institutions: (db: Db) => db.collection<InstitutionDocument>("institutions"),
  faculties: (db: Db) => db.collection<FacultyDocument>("faculties"),
  departments: (db: Db) => db.collection<DepartmentDocument>("departments"),
  invites: (db: Db) => db.collection<InviteDocument>("invites"),
  healthReports: (db: Db) =>
    db.collection<HealthReportDocument>("healthReports"),
  files: (db: Db) => db.collection<FileDocument>("files"),
  referralLinks: (db: Db) =>
    db.collection<ReferralLinkDocument>("referralLinks"),
  referralEvents: (db: Db) =>
    db.collection<ReferralEventDocument>("referralEvents"),

  // ── Academic / curriculum ──────────────────────────────────────────────────
  curriculumSubmissions: (db: Db) =>
    db.collection<CurriculumSubmissionDocument>("curriculumSubmissions"),

  // ── Platform config (DB-driven lists) ─────────────────────────────────────
  committees: (db: Db) => db.collection<CommitteeDocument>("committees"),
  skills: (db: Db) => db.collection<SkillDocument>("skills"),
  committeeRoles: (db: Db) =>
    db.collection<CommitteeRoleDocument>("committeeRoles"),
  // ── NEW ───────────────────────────────────────────────────────────────────
  platformConfig: (db: Db) =>
    db.collection<PlatformConfigDocument>("platformConfig"),
};
