import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, JWTPayload } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export interface AuthenticatedRequest extends NextRequest {
  auth: JWTPayload;
}

type RouteHandler = (
  req: AuthenticatedRequest,
  context?: { params?: Record<string, string> },
) => Promise<NextResponse>;

/**
 * Higher-order function that wraps a route handler with JWT + session validation.
 *
 * Usage:
 *   export const GET = withAuth(async (req) => { ... req.auth.vaultId ... });
 */
export function withAuth(handler: RouteHandler) {
  return async (
    req: NextRequest,
    context?: { params?: Record<string, string> },
  ): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Missing token" }, { status: 401 });
      }

      const token = authHeader.slice(7);
      let payload: JWTPayload;

      try {
        payload = verifyJWT(token);
      } catch {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 },
        );
      }

      const db = await getDb();

      // Validate session exists
      const session = await Collections.sessions(db).findOne({
        _id: new ObjectId(payload.sessionId),
        vaultId: new ObjectId(payload.vaultId),
      });

      if (!session || session.expiresAt < new Date()) {
        return NextResponse.json({ error: "Session expired" }, { status: 401 });
      }

      // Validate tokenVersion (catches invalidated sessions after password reset)
      const vault = await Collections.vault(db).findOne({
        _id: new ObjectId(payload.vaultId),
      });

      if (!vault || vault.tokenVersion !== payload.tokenVersion) {
        return NextResponse.json(
          { error: "Token invalidated" },
          { status: 401 },
        );
      }

      const authedReq = req as AuthenticatedRequest;
      authedReq.auth = payload;

      return handler(authedReq, context);
    } catch (err) {
      console.error("[withAuth]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
