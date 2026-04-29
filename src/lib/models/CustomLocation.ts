import { ObjectId } from "mongodb";

export interface CustomLocationDocument {
  _id?: ObjectId;
  type: "state" | "city" | "lga";
  name: string;
  parentState?: string;
  parentCity?: string;
  submittedBy: ObjectId;
  status: "pending" | "verified" | "rejected";
  useCount: number;
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: ObjectId;
}
