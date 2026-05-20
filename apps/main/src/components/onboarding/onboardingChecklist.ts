import {
  ShieldCheck,
  CreditCard,
  Truck,
  Users,
  UserPlus,
  ClipboardList,
  Car,
  BarChart3,
  Activity,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";
import type { DemoStakeholderType } from "@/stores/authStore";

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
    { id: "start-kyc", label: "Start KYC", to: "/admin/settings?tab=kyc" },
  ],
};

const SUBSCRIPTION_GROUP: OnboardingGroup = {
  id: "subscription",
  title: "Activate subscription",
  hint: "Enable billing and access to platform features",
  icon: CreditCard,
  actions: [
    { id: "make-payment", label: "Make Payment", to: "", action: "subscription" },
  ],
};

/**
 * Returns a role-aware list of suggested first actions. KYC + Subscription
 * are universal. The third group depends on the user's stakeholder/role.
 */
export function getOnboardingGroups(
  role: UserRole | undefined,
  stakeholder: DemoStakeholderType
): OnboardingGroup[] {
  // Subscription step intentionally removed — KYC is now the first step.
  void SUBSCRIPTION_GROUP;
  const groups: OnboardingGroup[] = [KYC_GROUP];

  // Enterprise Admin
  if (stakeholder === "ENTERPRISE") {
    groups.push({
      id: "fleet-setup-enterprise",
      title: "Set up your operational structure",
      hint: "Build out your fleet and invite the team that runs it",
      icon: Truck,
      actions: [
        { id: "create-fleet", label: "Create Fleet", to: "/enterprise" },
        { id: "add-managers", label: "Add Fleet Managers", to: "/admin/users" },
        { id: "invite-dispatchers", label: "Invite Dispatchers", to: "/admin/users" },
      ],
    });
    return groups;
  }

  // Operations Manager
  if (role === "operations_manager") {
    groups.push({
      id: "ops-overview",
      title: "Stay on top of operations",
      hint: "See how your fleet is performing day to day",
      icon: BarChart3,
      actions: [
        { id: "view-analytics", label: "View Analytics", to: "/admin/analytics" },
        { id: "monitor-performance", label: "Monitor Performance", to: "/admin/dashboard" },
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
        { id: "create-jobs", label: "Create Jobs", to: "/admin/jobs" },
        { id: "assign-drivers", label: "Assign Drivers", to: "/admin/jobs" },
      ],
    });
    return groups;
  }

  // Aggregator
  if (stakeholder === "AGGREGATOR") {
    groups.push({
      id: "aggregator-setup",
      title: "Build your network",
      hint: "Bring partners on board and define how you operate",
      icon: Users,
      actions: [
        { id: "add-members", label: "Add Network Members", to: "/aggregator" },
        { id: "set-zones", label: "Set Service Zones", to: "/aggregator" },
      ],
    });
    return groups;
  }

  // Owner Operator
  if (stakeholder === "OWNER_OPERATOR") {
    groups.push({
      id: "owner-operator-setup",
      title: "Set up your trucks",
      hint: "Register vehicles and upload required documents",
      icon: Car,
      actions: [
        { id: "add-vehicles", label: "Add Vehicles", to: "/owner-operator/vehicles" },
        { id: "upload-docs", label: "Upload Documents", to: "/owner-operator/documents" },
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
      { id: "add-vehicles", label: "Add Vehicles", to: "/admin/fleet" },
      { id: "assign-drivers", label: "Assign Drivers", to: "/admin/drivers" },
      { id: "invite-dispatchers", label: "Invite Dispatchers", to: "/admin/users" },
    ],
  });

  return groups;
}
