import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('Missing environment variable "JWT_SECRET"');

const JWT_EXPIRES_IN = "15m";
const BCRYPT_ROUNDS = 12;

export interface JWTPayload {
  vaultId: string;
  sessionId: string;
  role: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

// ─── Password ─────────────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export function signJWT(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJWT(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET!) as JWTPayload;
}

// ─── Tokens & OTPs ───────────────────────────────────────────────────────────

/** Cryptographically random 6-digit OTP */
export function generateOTP(): string {
  return crypto.randomInt(100_000, 999_999).toString();
}

/** 64-char hex token for magic links / reset tokens */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Unique 6-char alphanumeric invite code */
export function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

export function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
