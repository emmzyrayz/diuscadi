import { ObjectId } from "mongodb";

export interface NewsletterSubscriberDocument {
  _id?: ObjectId;
  email: string;
  subscribedAt: Date;
  active: boolean;
}
