import { ObjectId } from "mongodb";

export type ReferralResourceType = "event" | "ticket" | "page" | "other";

export interface ReferralLinkDocument {
  _id?: ObjectId;
  code: string;
  ownerVaultId: ObjectId;
  resourceType: ReferralResourceType;
  resourceId: string;
  path: string;
  title?: string;
  parentCode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

