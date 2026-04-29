// GET /api/member/[username]
// Public endpoint. Resolves user by username slug (firstname-lastname or vaultId prefix).
// Applies privacy filter based on viewer role from JWT cookie.
// NEVER returns: cgpa, cgpaScale, gpaRecord, privacySettings, vaultId, signupInviteCode.
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { verifyJWT } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

type Visibility = "public" | "members" | "private";
type ViewerRole = "public" | "participant" | "member" | "admin";

function resolveViewerRole(
  membershipStatus: string | undefined,
  role: string | undefined,
): ViewerRole {
  if (!role) return "public";
  if (role === "admin" || role === "webmaster") return "admin";
  if (membershipStatus === "approved") return "member";
  return "participant";
}

function canSee(setting: Visibility, viewer: ViewerRole): boolean {
  if (viewer === "admin") return true;
  if (setting === "public") return true;
  if (
    setting === "members" &&
    (viewer === "member" || viewer === "participant")
  )
    return true;
  return false;
}

type Context = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

export async function GET(req: Request, context?: Context) {
  try {
    const params = context?.params ? await Promise.resolve(context.params) : {};
    const username = (params.username as string)?.toLowerCase();
    if (!username)
      return NextResponse.json({ error: "Missing username" }, { status: 400 });

    const db = await getDb();

    // Resolve user by username slug (firstname-lastname) or vaultId prefix
    const allUsers = await Collections.userData(db)
      .find(
        {},
        { projection: { fullName: 1, vaultId: 1, membershipStatus: 1 } },
      )
      .toArray();

    const match = allUsers.find((u) => {
      const fn = u.fullName as { firstname?: string; lastname?: string };
      const slug = `${fn?.firstname ?? ""}-${fn?.lastname ?? ""}`
        .toLowerCase()
        .replace(/\s+/g, "-");
      return (
        slug === username ||
        u.vaultId?.toString().slice(-8).toLowerCase() === username
      );
    });

    if (!match)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Fetch full profile
    const userData = await Collections.userData(db).findOne(
      { _id: match._id },
      {
        projection: {
          // Always excluded
          "Institution.cgpa": 0,
          "Institution.cgpaScale": 0,
          "Institution.gpaRecord": 0,
          signupInviteCode: 0,
          vaultId: 0,
          referredBy: 0,
        },
      },
    );
    if (!userData)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Determine viewer role from cookie
    let viewerRole: ViewerRole = "public";
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("diuscadi_token")?.value;
      if (token) {
        const payload = verifyJWT(token);
        if (payload?.vaultId) {
          const viewerData = await Collections.userData(db).findOne(
            { vaultId: new ObjectId(payload.vaultId) },
            { projection: { membershipStatus: 1, role: 1 } },
          );
          viewerRole = resolveViewerRole(
            viewerData?.membershipStatus,
            viewerData?.role ?? payload.role,
          );
        }
      }
    } catch {
      /* unauthenticated */
    }

    const fp = userData.preferences?.privacy?.fieldPermissions ?? {};

    // Build response — apply privacy filter per field
    const profile: Record<string, unknown> = {
      // Always public
      id: userData._id!.toString(),
      fullName: userData.fullName,
      hasAvatar: userData.hasAvatar,
      avatar: userData.avatar ?? null,
      role: userData.role,
      eduStatus: userData.eduStatus,
      membershipStatus: userData.membershipStatus,
      committeeMembership: userData.committeeMembership ?? null,
      skills: userData.skills ?? [],
      verifiedSkills: userData.verifiedSkills ?? [],
      profile: userData.profile ?? null,
      createdAt: userData.createdAt,
    };

    // Privacy-gated fields
    if (canSee(fp.phone ?? "private", viewerRole))
      profile.phone = userData.phone;
    if (canSee(fp.email ?? "members", viewerRole))
      profile.email = userData.email;
    if (canSee(fp.location ?? "private", viewerRole))
      profile.location = userData.location;
    if (canSee(fp.socials ?? "members", viewerRole))
      profile.socials = userData.socials;
    if (canSee(fp.academic ?? "private", viewerRole)) {
      profile.institution = userData.Institution
        ? {
            name: userData.Institution.name,
            abbreviation: userData.Institution.abbreviation,
            type: userData.Institution.Type,
            faculty: userData.Institution.faculty,
            department: userData.Institution.department,
            degreeType: userData.Institution.degreeType,
            level: userData.Institution.level,
            currentStatus: userData.Institution.currentStatus,
          }
        : null;
    }

    return NextResponse.json({ profile, viewerRole });
  } catch (err) {
    console.error("[GET /api/member/[username]]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
