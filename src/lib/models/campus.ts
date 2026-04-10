// lib/models/Campus.ts
// Separate collection — one document per campus.
// Linked to an institution via institutionId.
// Collection: `campuses`

import { ObjectId } from "mongodb";

export type CampusType = "main" | "branch" | "satellite";

export interface CampusDocument {
  _id?: ObjectId;
  institutionId: ObjectId; // → Institution._id

  name: string; // e.g. "Main Campus", "Akoka Campus"
  location: string; // e.g. "Yaba, Lagos"
  type: CampusType;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}