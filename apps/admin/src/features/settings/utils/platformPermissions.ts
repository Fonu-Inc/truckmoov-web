import type {
  CustomStaffRole, PredefinedStaffRole, StaffPermission,
} from "@truckmoov/api/auth";

/**
 * Settings → Team & Access permission model, built from the server: the admin
 * permission catalog (`GET /auth/system/roles/permissions`, keys shaped
 * `admin.<resource>.<read|manage>`) and the staff roles (`GET /auth/system/roles`).
 */

export type PermissionKey = string;

export type PermissionDef = {
  key: PermissionKey;
  label: string;
  description: string;
};

export type PermissionDomain = {
  id: string;
  label: string;
  description: string;
  permissions: PermissionDef[];
};

export type PlatformRole = {
  /** The predefined role name (e.g. `SUPER_ADMIN`) or the custom role's id. */
  key: string;
  label: string;
  description: string;
  /** Built-in roles ship with the platform and cannot be edited or deleted. */
  builtIn: boolean;
  permissions: PermissionKey[];
};

const RESOURCES: Record<string, {
  label: string; description: string;
}> = {
  dashboard: {
    label: "Dashboard", description: "Platform overview and metrics",
  },
  tenants: {
    label: "Tenants", description: "Tenant accounts and their lifecycle",
  },
  onboarding_review: {
    label: "Onboarding Review", description: "Reviewing new tenant applications",
  },
  upgrade_review: {
    label: "Upgrade Review", description: "Reviewing organisation upgrade requests",
  },
  plans: {
    label: "Plans", description: "Licence plans and pricing",
  },
  billing: {
    label: "Billing", description: "Quotations, invoices and payments",
  },
  devices: {
    label: "Devices", description: "Device inventory and provisioning",
  },
  sims: {
    label: "SIMs", description: "SIM inventory and bundles",
  },
  installers: {
    label: "Installers", description: "Installer accounts",
  },
  installations: {
    label: "Installations", description: "Installation jobs and assignments",
  },
  support: {
    label: "Support", description: "Support tickets",
  },
  messaging: {
    label: "Messaging", description: "Platform communications",
  },
  alerts: {
    label: "Alerts", description: "Platform alert routing and the alert inbox",
  },
  security: {
    label: "Security", description: "Security events and controls",
  },
  audit: {
    label: "Audit", description: "The audit log",
  },
  settings: {
    label: "Settings", description: "Platform settings",
  },
  integrations: {
    label: "Integrations", description: "Third-party integrations",
  },
  ai: {
    label: "AI", description: "AI features",
  },
  staff: {
    label: "Staff", description: "Platform team members and their roles",
  },
  governance: {
    label: "Governance", description: "Tenant permission governance",
  },
};

const ROLE_TEXT: Record<string, {
  label: string; description: string;
}> = {
  SUPER_ADMIN: {
    label: "Super Admin", description: "Every platform permission.",
  },
  SYSTEM_ADMIN: {
    label: "System Admin", description: "Runs the platform; cannot manage staff or governance.",
  },
  PLATFORM_ADMIN: {
    label: "Platform Admin", description: "Day-to-day operations: billing, support, alerts, installations.",
  },
  GOVERNANCE_OFFICER: {
    label: "Governance Officer", description: "Reviews tenant permissions and manages staff.",
  },
};

function titleCase(value: string): string {
  return value.replace(
    /_/g,
    " ",
  ).replace(
    /\b\w/g,
    c => c.toUpperCase(),
  );
}

function resourceOf(key: string): string {
  return key.split(".")[1] ?? key;
}

/** Groups the catalog by resource, in the order the resources are listed above. */
export function toPermissionDomains(catalog: StaffPermission[]): PermissionDomain[] {
  const byResource = new Map<string, PermissionDef[]>();
  for (const permission of catalog) {
    const resource = resourceOf(permission.key);
    const label = RESOURCES[resource]?.label ?? titleCase(resource);
    const action = permission.key.endsWith(".read") ? "View" : "Manage";
    const defs = byResource.get(resource) ?? [];
    defs.push({
      key: permission.key, label: `${action} ${label.toLowerCase()}`, description: permission.description,
    });
    byResource.set(
      resource,
      defs,
    );
  }
  const order = Object.keys(RESOURCES);
  return [...byResource.entries()]
    .sort(([a], [b]) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999))
    .map(([
      resource,
      permissions,
    ]) => ({
      id: resource,
      label: RESOURCES[resource]?.label ?? titleCase(resource),
      description: RESOURCES[resource]?.description ?? "",
      permissions: permissions.sort((a, b) => a.key.localeCompare(b.key)),
    }));
}

export function toPlatformRoles(predefined: PredefinedStaffRole[], custom: CustomStaffRole[]): PlatformRole[] {
  return [
    ...predefined.map(role => ({
      key: role.role,
      label: ROLE_TEXT[role.role]?.label ?? titleCase(role.role.toLowerCase()),
      description: ROLE_TEXT[role.role]?.description ?? "",
      builtIn: true,
      permissions: role.permissions,
    })),
    ...custom.map(role => ({
      key: role.id,
      label: role.name,
      description: role.description ?? "",
      builtIn: false,
      permissions: role.permissions,
    })),
  ];
}

export function roleLabel(roles: PlatformRole[], key: string): string {
  return roles.find(r => r.key === key)?.label ?? titleCase(key.toLowerCase());
}
