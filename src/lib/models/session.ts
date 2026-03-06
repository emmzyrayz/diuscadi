import { ObjectId } from "mongodb";

export interface SessionDocument {
  _id?: ObjectId;

  userId: ObjectId; // same as vaultId — kept for legacy queries
  vaultId: ObjectId; // → Vault._id

  token: string; // secure random token (not the JWT)

  userAgent?: string; // used as device fingerprint for upsert
  ip?: string; // ::1 in dev, real IP in prod via x-forwarded-for

  expiresAt: Date;
  createdAt: Date;
  lastUsedAt?: Date; // updated on every login from same device
}
