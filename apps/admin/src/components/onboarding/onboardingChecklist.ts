import {
  ShieldCheck,
  Truck,
  ClipboardList,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface OnboardingAction {
  /** Unique action id within a group. */
  id: string;
  /** Button label. */
  label: string;
  /** Where this action navigates to. Empty string = handled via `action`. */
  to: string;
  /** Special handler key — modal trigger instead of route. */
  action?: "subscription";
}

export interface OnboardingGroup {
  /** Stable id used to track completion. */
  id: string;
  title: string;
  hint?: string;
  icon: LucideIcon;
  /** Marks this group as a priority recommendation. */
  priority?: boolean;
  actions: OnboardingAction[];
}

const KYC_GROUP: OnboardingGroup = {
  id: "kyc",
  title: "Complete KYC",
  hint: "First recommended step to unlock full platform capability",
  icon: ShieldCheck,
  priority: true,
  actions: [
    { id: "start-kyc", label: "Start KYC", to: "/settings?tab=kyc" },
  ],
};

/**
 * Returns a role-aware list of suggested first actions.
 */
export function getOnboardingGroups(
  role: UserRole | undefined,
): OnboardingGroup[] {
  const groups: OnboardingGroup[] = [KYC_GROUP];

  // Operations Manager
  if (role === "operations_manager") {
    groups.push({
      id: "ops-overview",
      title: "Stay on top of operations",
      hint: "See how your fleet is performing day to day",
      icon: BarChart3,
      actions: [
        { id: "view-analytics", label: "View Analytics", to: "/analytics" },
        { id: "monitor-performance", label: "Monitor Performance", to: "/dashboard" },
      ],
    });
    return groups;
  }

  // Dispatcher
  if (role === "dispatcher") {
    groups.push({
      id: "dispatch-setup",
      title: "Get your first jobs moving",
      hint: "Create jobs and assign them to drivers",
      icon: ClipboardList,
      actions: [
        { id: "create-jobs", label: "Create Jobs", to: "/jobs" },
        { id: "assign-drivers", label: "Assign Drivers", to: "/jobs" },
      ],
    });
    return groups;
  }

  // Fleet Manager / Provider (default)
  groups.push({
    id: "fleet-setup",
    title: "Set up your fleet",
    hint: "Add the vehicles and drivers you'll be managing",
    icon: Truck,
    actions: [
      { id: "add-vehicles", label: "Add Vehicles", to: "/fleet" },
      { id: "assign-drivers", label: "Assign Drivers", to: "/drivers" },
      { id: "invite-dispatchers", label: "Invite Dispatchers", to: "/users" },
    ],
  });

  return groups;
}
