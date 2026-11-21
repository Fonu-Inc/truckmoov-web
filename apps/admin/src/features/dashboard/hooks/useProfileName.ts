import { useQuery } from "@tanstack/react-query";
import { getProfileQueryOptions } from "@truckmoov/api/auth";

type Loose = Record<string, unknown> | undefined;

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/**
 * The signed-in admin's display name, from `GET /auth/profile` — the auth
 * session (`AuthUser`) carries no name. Fleetflow reads `user.name` off its
 * auth store for the same spots (profile dropdown, support widget greeting).
 *
 * The profile record is untyped and the field may sit at the top level or
 * under `profile` / `user`, so read the first non-empty one (same lookup as
 * `MyProfileCard`). Undefined while loading or when the profile has no name.
 */
export function useProfileName(): string | undefined {
  const profile = useQuery(getProfileQueryOptions()).data?.data as Loose;
  for (const source of [
    profile,
    profile?.profile as Loose,
    profile?.user as Loose,
  ]) {
    if (!source)
      continue;
    const name = str(source.fullName) ?? str(source.full_name) ?? str(source.name)
      ?? str([
        source.firstName,
        source.lastName,
      ].filter(Boolean).join(" "));
    if (name)
      return name;
  }
  return undefined;
}
