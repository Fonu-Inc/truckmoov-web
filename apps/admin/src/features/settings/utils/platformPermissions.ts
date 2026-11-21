/**
 * Platform admin RBAC permission catalog — ported from fleetflow's
 * `lib/platformPermissions.ts` for Settings → Team & Access.
 *
 * Permission key shape: truckmoov::iam.admin.<resource>.<action>
 * Keys are grouped by domain for the role editor / permission picker UI.
 *
 * Nothing on the API reads these keys yet: roles and per-user grants live in
 * the local `usePlatformRolesStore` (features/settings/stores/platformRolesStore.ts).
 */

export const PERMISSION_PREFIX = "truckmoov::iam.admin";

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

function p(resource: string, action: string): string {
  return `${PERMISSION_PREFIX}.${resource}.${action}`;
}

// ponytail: mock data from fleetflow parity port — wire to packages/api
export const PERMISSION_DOMAINS: PermissionDomain[] = [
  {
    id: "tenants",
    label: "Tenants & Onboarding",
    description: "Tenant accounts, KYC review and lifecycle actions",
    permissions: [
      {
        key: p(
          "tenants",
          "read",
        ), label: "View tenants", description: "See tenant accounts and their details",
      },
      {
        key: p(
          "tenants",
          "create",
        ), label: "Onboard tenants", description: "Create new tenant accounts",
      },
      {
        key: p(
          "tenants",
          "update",
        ), label: "Edit tenants", description: "Change tenant details and configuration",
      },
      {
        key: p(
          "tenants",
          "suspend",
        ), label: "Suspend / terminate tenants", description: "Change a tenant's operational status",
      },
      {
        key: p(
          "kyc",
          "read",
        ), label: "View KYC submissions", description: "Open submitted documents and business details",
      },
      {
        key: p(
          "kyc",
          "approve",
        ), label: "Approve / reject KYC", description: "Decide on tenant applications",
      },
    ],
  },
  {
    id: "connectivity",
    label: "Connectivity",
    description: "IoT SIMs, devices and M2M data bundles",
    permissions: [
      {
        key: p(
          "sims",
          "read",
        ), label: "View SIMs", description: "See SIM inventory and status",
      },
      {
        key: p(
          "sims",
          "manage",
        ), label: "Manage SIMs", description: "Activate, assign and suspend SIMs",
      },
      {
        key: p(
          "devices",
          "read",
        ), label: "View devices", description: "See device inventory and health",
      },
      {
        key: p(
          "devices",
          "manage",
        ), label: "Manage devices", description: "Register, edit and decommission devices",
      },
      {
        key: p(
          "bundles",
          "read",
        ), label: "View data bundles", description: "See M2M bundle allocations and usage",
      },
      {
        key: p(
          "bundles",
          "manage",
        ), label: "Manage data bundles", description: "Allocate, top up and expire bundles",
      },
      {
        key: p(
          "provisioning",
          "approve",
        ), label: "Approve provisioning requests", description: "Fulfil device and SIM requests",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing & Subscriptions",
    description: "Plans, invoices, wallets and quota upgrades",
    permissions: [
      {
        key: p(
          "plans",
          "read",
        ), label: "View plans", description: "See subscription plans and pricing",
      },
      {
        key: p(
          "plans",
          "manage",
        ), label: "Manage plans", description: "Create and edit plans and quotas",
      },
      {
        key: p(
          "invoices",
          "read",
        ), label: "View invoices", description: "See tenant invoices and payment history",
      },
      {
        key: p(
          "invoices",
          "manage",
        ), label: "Manage invoices", description: "Issue, void and reconcile invoices",
      },
      {
        key: p(
          "wallets",
          "manage",
        ), label: "Manage wallets", description: "Adjust balances and credit limits",
      },
      {
        key: p(
          "upgrades",
          "approve",
        ), label: "Approve slot upgrades", description: "Grant additional vehicle or user slots",
      },
    ],
  },
  {
    id: "support",
    label: "Support",
    description: "Tickets, incidents and tenant communications",
    permissions: [
      {
        key: p(
          "tickets",
          "read",
        ), label: "View tickets", description: "Read support tickets and conversations",
      },
      {
        key: p(
          "tickets",
          "manage",
        ), label: "Manage tickets", description: "Respond, escalate, resolve and close",
      },
      {
        key: p(
          "communications",
          "send",
        ), label: "Send communications", description: "Broadcast messages to tenants",
      },
    ],
  },
  {
    id: "security",
    label: "Audit & Compliance",
    description: "Unified audit log, security events and audit exports",
    permissions: [
      {
        key: p(
          "security",
          "read",
        ), label: "View security events", description: "Sign-in and security activity in the audit log",
      },
      {
        key: p(
          "audit",
          "read",
        ), label: "View audit trail", description: "Cross-tenant audit history",
      },
      {
        key: p(
          "audit",
          "export",
        ), label: "Export audit trail", description: "Download audit records",
      },
    ],
  },
  {
    id: "platform",
    label: "Platform Administration",
    description: "Team, roles and global settings",
    permissions: [
      {
        key: p(
          "dashboard",
          "read",
        ), label: "View platform dashboard", description: "Platform-wide overview and KPIs",
      },
      {
        key: p(
          "team",
          "read",
        ), label: "View platform team", description: "See internal staff and invitations",
      },
      {
        key: p(
          "team",
          "manage",
        ), label: "Manage platform team", description: "Invite and remove team members",
      },
      {
        key: p(
          "roles",
          "manage",
        ), label: "Manage roles & permissions", description: "Create roles and grant permissions",
      },
      {
        key: p(
          "settings",
          "read",
        ), label: "View platform settings", description: "Read global configuration",
      },
      {
        key: p(
          "settings",
          "manage",
        ), label: "Manage platform settings", description: "Change global configuration",
      },
    ],
  },
];

export type PlatformRole = {
  key: string;
  label: string;
  description: string;
  /** Built-in roles ship with the platform and cannot be deleted. */
  builtIn: boolean;
  permissions: PermissionKey[];
};

function K(resource: string, action: string) {
  return p(
    resource,
    action,
  );
}

// ponytail: mock data from fleetflow parity port — wire to packages/api
export const BUILT_IN_ROLES: PlatformRole[] = [
  {
    key: "order_manager",
    label: "Order Manager",
    description: "Activates devices and SIM cards for customer orders.",
    builtIn: true,
    permissions: [
      K(
        "dashboard",
        "read",
      ),
      K(
        "tenants",
        "read",
      ),
      K(
        "sims",
        "read",
      ),
      K(
        "sims",
        "manage",
      ),
      K(
        "devices",
        "read",
      ),
      K(
        "devices",
        "manage",
      ),
      K(
        "bundles",
        "read",
      ),
      K(
        "bundles",
        "manage",
      ),
      K(
        "provisioning",
        "approve",
      ),
      K(
        "tickets",
        "read",
      ),
      K(
        "audit",
        "read",
      ),
    ],
  },
  {
    key: "billing_manager",
    label: "Billing & Subscriptions",
    description: "Manages plans, subscriptions, invoices, wallets and slot upgrades.",
    builtIn: true,
    permissions: [
      K(
        "dashboard",
        "read",
      ),
      K(
        "tenants",
        "read",
      ),
      K(
        "plans",
        "read",
      ),
      K(
        "plans",
        "manage",
      ),
      K(
        "invoices",
        "read",
      ),
      K(
        "invoices",
        "manage",
      ),
      K(
        "wallets",
        "manage",
      ),
      K(
        "upgrades",
        "approve",
      ),
      K(
        "bundles",
        "read",
      ),
      K(
        "audit",
        "read",
      ),
    ],
  },
  {
    key: "support_agent",
    label: "Support Agent",
    description: "Handles support tickets and tenant incidents. Read-only elsewhere.",
    builtIn: true,
    permissions: [
      K(
        "dashboard",
        "read",
      ),
      K(
        "tenants",
        "read",
      ),
      K(
        "sims",
        "read",
      ),
      K(
        "devices",
        "read",
      ),
      K(
        "tickets",
        "read",
      ),
      K(
        "tickets",
        "manage",
      ),
      K(
        "communications",
        "send",
      ),
      K(
        "invoices",
        "read",
      ),
    ],
  },
  {
    key: "security_officer",
    label: "Security & Compliance",
    description: "Reviews security events, blocked IPs and the platform audit trail.",
    builtIn: true,
    permissions: [
      K(
        "dashboard",
        "read",
      ),
      K(
        "tenants",
        "read",
      ),
      K(
        "kyc",
        "read",
      ),
      K(
        "security",
        "read",
      ),
      K(
        "audit",
        "read",
      ),
      K(
        "audit",
        "export",
      ),
      K(
        "settings",
        "read",
      ),
      K(
        "tickets",
        "read",
      ),
    ],
  },
];

export function slugifyRoleKey(label: string): string {
  return (
    label
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        "_",
      )
      .replace(
        /^_+|_+$/g,
        "",
      ) || "custom_role"
  );
}
