// lib/models/Application.ts
// Committee or skill change requests submitted by users.
// Reviewed by admin or moderator.
//
// Committee application flow:
//   1. User applies for a committee (type: "committee") — role defaults to MEMBER
//   2. Admin approves → user gets committeeMembership: { committee, role: "MEMBER", joinedAt }
//   3. Admin separately assigns a higher role via PATCH /api/admin/users/[id]/committee-role

import { ObjectId } from "mongodb";

export type ApplicationType = "committee" | "skills";
export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface ApplicationDocument {
  _id?: ObjectId;

  userId: ObjectId; // → UserData._id
  vaultId: ObjectId; // → Vault._id

  type: ApplicationType;
  status: ApplicationStatus;

  // Committee application
  requestedCommittee?: string; // which committee they want to join

  // Skills application
  requestedSkills?: string[];

  reason?: string; // optional message from user

  // Review
  reviewedBy?: ObjectId;
  reviewNote?: string;
  reviewedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
