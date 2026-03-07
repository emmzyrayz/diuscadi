// lib/models/Department.ts
// Shared pool — one "Computer Science" department can be assigned to many faculties.
// The faculty stores the reference (faculties.departments[]), not the department.
import { ObjectId } from "mongodb";

export interface DepartmentDocument {
  _id?: ObjectId;

  name: string; // e.g. "Computer Science"
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}