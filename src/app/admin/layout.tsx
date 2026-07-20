// src/app/admin/layout.tsx
import { Metadata } from "next";
import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { verifyJWT } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { canAccessAdminPanel } from "@/lib/roles";
import ModConsole from "@/components/sections/admin/mod/modConsole";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("diuscadi_token")?.value;

  if (!token) {
    redirect("/auth?next=/admin");
  }

  let payload;
  try {
    payload = verifyJWT(token);
  } catch {
    redirect("/auth?next=/admin");
  }

  // Mirror withAuth's checks: a syntactically valid JWT with a revoked
  // session or a since-changed tokenVersion should not get through.
  const db = await getDb();
  const session = await Collections.sessions(db).findOne({
    _id: new ObjectId(payload.sessionId),
    vaultId: new ObjectId(payload.vaultId),
  });
  if (!session || session.expiresAt < new Date()) {
    redirect("/auth?next=/admin");
  }

  const vault = await Collections.vault(db).findOne({
    _id: new ObjectId(payload.vaultId),
  });
  if (!vault || vault.tokenVersion !== payload.tokenVersion) {
    redirect("/auth?next=/admin");
  }

  if (!canAccessAdminPanel(vault.role)) {
    redirect("/home");
  }

   if (vault.role === "moderator") {
     return <ModConsole />;
   }

  return <>{children}</>;
}
