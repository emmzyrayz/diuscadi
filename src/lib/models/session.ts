import { ObjectId } from "mongodb";

export interface SessionDocument {
  _id?: ObjectId;

  userId: ObjectId;
  vaultId: ObjectId;

  token: string; // unique, hashed

  userAgent?: string;
  ip?: string;

  expiresAt: Date;

  createdAt: Date;
  lastUsedAt?: Date;
}
