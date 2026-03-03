import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const db = await getDb();

  const vault = await Collections.vault(db).findOne({
    _id: new ObjectId(req.auth.vaultId),
  });
  if (!vault) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userData = await Collections.userData(db).findOne({
    vaultId: new ObjectId(req.auth.vaultId),
  });

  // Strip sensitive fields before returning
  const {
    passwordHash,
    emailVerificationCode,
    emailVerificationExpires,
    emailVerificationToken,
    emailVerificationTokenExpires,
    resetPasswordCode,
    resetPasswordExpires,
    resetPasswordToken,
    resetPasswordTokenExpires,
    tokenVersion,
    ...safeVault
  } = vault;

  return NextResponse.json({ vault: safeVault, userData });
});
