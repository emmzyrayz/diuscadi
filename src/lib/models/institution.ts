// lib/models/Institution.ts
import { ObjectId } from "mongodb";

export type InstitutionType = "University" | "Polytechnic";

export interface InstitutionDocument {
  _id?: ObjectId;

  name: string; // e.g. "University of Benin"
  type: InstitutionType; // "University" | "Polytechnic"
  state: string; // e.g. "Edo"
  country: string; // e.g. "Nigeria"
  isActive: boolean;

  // IDs of faculties assigned to this institution by a webmaster.
  // The actual faculty documents live in the faculties collection.
  faculties: ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}