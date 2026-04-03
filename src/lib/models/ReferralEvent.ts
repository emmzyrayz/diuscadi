import { ObjectId } from "mongodb";
import { ReferralResourceType } from "@/lib/models/ReferralLink";

export type ReferralEventType =
  | "share"
  | "click"
  | "register"
  | "calendar_add"
  | "ticket_pdf_download";

export interface ReferralEventDocument {
  _id?: ObjectId;
  code: string;
  ownerVaultId: ObjectId;
  actorVaultId?: ObjectId;
  eventType: ReferralEventType;
  resourceType: ReferralResourceType;
  resourceId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

