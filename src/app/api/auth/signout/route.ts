import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const db = await getDb();

  await Collections.sessions(db).deleteOne({
    _id: new ObjectId(req.auth.sessionId),
  });

  return NextResponse.json({ message: "Signed out successfully" });
});
