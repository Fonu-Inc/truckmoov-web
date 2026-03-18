import { UserRole } from "@/features/auth/api/types";

export type RoleWithAccess = Array<UserRole>

export type SidebarListItem = {
  label: string;
  roleWithAccess: RoleWithAccess;
  to?: string;
  icon: React.ElementType;
  items?: SidebarListItem[];
  pageTitle?: string
  pageDescription?: string
};

export type DetailsType = Omit<SidebarListItem, "roleWithAccess" | "to" | "icon" | "items"> & {
 icon?: React.ElementType
}

export type DetailsObjectType = Partial<Record<UserRole, DetailsType>>