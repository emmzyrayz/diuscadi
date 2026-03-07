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
};
