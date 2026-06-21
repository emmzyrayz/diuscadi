import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, JWTPayload } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

// const MIN_TOKEN_VERSION = 2; // bump this whenever JWT/session shape changes

export interface AuthenticatedRequest extends NextRequest {
  auth: JWTPayload;
}

type RouteHandler = (
  req: AuthenticatedRequest,
  context?: {
    params?: Promise<Record<string, string>> | Record<string, string>;
  },
) => Promise<NextResponse>;

// Builds a 401 response and clears the stale cookie in one place,
// so every rejection branch below stays consistent.
function unauthorized(message: string): NextResponse {
  const response = NextResponse.json({ error: message }, { status: 401 });
  response.cookies.set("diuscadi_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export function withAuth(handler: RouteHandler) {
  return async (
    req: NextRequest,
    context?: {
      params?: Promise<Record<string, string>> | Record<string, string>;
    },
  ): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get("authorization");
      const cookieToken = req.cookies.get("diuscadi_token")?.value;

      let token = "";
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      } else if (cookieToken) {
        token = cookieToken;
      }

      if (!token) {
        return NextResponse.json({ error: "Missing token" }, { status: 401 });
      }

      let payload: JWTPayload;
      try {
        payload = verifyJWT(token);
      } catch {
        return unauthorized("Invalid or expired token");
      }

      const db = await getDb();

      const session = await Collections.sessions(db).findOne({
        _id: new ObjectId(payload.sessionId),
        vaultId: new ObjectId(payload.vaultId),
      });

      if (!session || session.expiresAt < new Date()) {
        return unauthorized("Session expired");
      }

      const vault = await Collections.vault(db).findOne({
        _id: new ObjectId(payload.vaultId),
      });

      if (
        !vault ||
        vault.tokenVersion !== payload.tokenVersion
      ) {
        return unauthorized("Token invalidated");
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

export async function resolveParams(context?: {
  params?: Promise<Record<string, string>> | Record<string, string>;
}): Promise<Record<string, string>> {
  return (await context?.params) ?? {};
}
