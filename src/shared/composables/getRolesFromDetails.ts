import type { UserRole } from "@/features/auth/api/types";
import { DetailsObjectType, RoleWithAccess } from "../types";

export function getRolesFromDetails(details: DetailsObjectType): RoleWithAccess {
  return Object.keys(details) as Array<UserRole>;
}
