// lib/db/collections.ts
import { Db } from "mongodb";
import { VaultDocument } from "@/lib/models/vault";
import { UserDataDocument } from "@/lib/models/UserData";
import { ApplicationDocument } from "@/lib/models/Application";

// Typed collection accessors — import Collections everywhere instead of
// calling db.collection<T>() inline so collection names stay in one place.

export const Collections = {
  vault: (db: Db) => db.collection<VaultDocument>("vault"),

  userData: (db: Db) => db.collection<UserDataDocument>("userData"),

  sessions: (db: Db) => db.collection("sessions"),

  applications: (db: Db) => db.collection<ApplicationDocument>("applications"),
};
