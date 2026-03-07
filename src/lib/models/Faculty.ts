// lib/models/Faculty.ts
// Shared pool — one "Engineering" faculty can be assigned to many institutions.
// The institution stores the reference (institutions.faculties[]), not the faculty.
import { ObjectId } from "mongodb";

export interface FacultyDocument {
  _id?: ObjectId;

  name: string; // e.g. "Faculty of Engineering"
  isActive: boolean;

  // IDs of departments assigned to this faculty by a webmaster.
  // The actual department documents live in the departments collection.
  departments: ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}