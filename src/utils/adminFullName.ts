// utils/adminFullName.ts
// AdminUser.fullName is typed as string in AdminContext but the API
// returns { firstname, secondname?, lastname } — same shape as UserProfile.
// This helper handles both until the AdminContext type is corrected.

type FullNameShape =
  | string
  | { firstname: string; secondname?: string; lastname?: string };

export function resolveAdminFullName(fullName: FullNameShape): string {
  if (typeof fullName === "string") return fullName;
  return [fullName.firstname, fullName.secondname, fullName.lastname]
    .filter(Boolean)
    .join(" ");
}

export function resolveAdminInitial(fullName: FullNameShape): string {
  if (typeof fullName === "string") return (fullName[0] ?? "?").toUpperCase();
  return (fullName.firstname?.[0] ?? "?").toUpperCase();
}