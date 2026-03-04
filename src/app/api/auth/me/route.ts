/* eslint-disable @typescript-eslint/no-unused-vars */
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

  // Strip sensitive fields before returning.
  // Prefixed with _ to suppress "assigned but never used" TS warnings —
  // they are intentionally excluded via rest spread, not actually used.
  const {
    passwordHash: _passwordHash,
    emailVerificationCode: _emailVerificationCode,
    emailVerificationExpires: _emailVerificationExpires,
    emailVerificationToken: _emailVerificationToken,
    emailVerificationTokenExpires: _emailVerificationTokenExpires,
    phoneVerificationCode: _phoneVerificationCode,
    phoneVerificationExpires: _phoneVerificationExpires,
    resetPasswordCode: _resetPasswordCode,
    resetPasswordExpires: _resetPasswordExpires,
    resetPasswordToken: _resetPasswordToken,
    resetPasswordTokenExpires: _resetPasswordTokenExpires,
    tokenVersion: _tokenVersion,
    verificationResendCount: _verificationResendCount,
    verificationResendLastAt: _verificationResendLastAt,
    ...safeVault
  } = vault;

  return NextResponse.json({ vault: safeVault, userData });
});
