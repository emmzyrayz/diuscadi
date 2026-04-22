// lib/models/EventReview.ts

import { ObjectId } from "mongodb";

export interface EventReviewDocument {
  _id?: ObjectId;

  eventId: ObjectId; // → events._id
  userId: ObjectId; // → userData._id
  vaultId: ObjectId; // → vault._id

  rating: 1 | 2 | 3 | 4 | 5;
  body?: string; // max 500 chars, optional
  isAnonymous: boolean; // user's choice at submission
  isVisible: boolean; // default true — admin can hide without deleting

  createdAt: Date;
  updatedAt: Date;
}
