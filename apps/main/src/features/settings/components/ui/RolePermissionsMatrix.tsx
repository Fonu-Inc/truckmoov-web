import {
  Check, Eye, Search, Shield, X,
} from "lucide-react";
import {
  Fragment, useMemo, useState,
} from "react";
import { Input } from "@/components/shadcn/input";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/shadcn/tooltip";

/**
 * Settings → Users: the design app's "What each role can do" matrix.
 *
 * The design app hardcodes this section, so it is copied verbatim: its
 * permission catalogue, its four built-in roles and each role's grants. It does
 * not read the backend's team roles (no endpoint returns per-role permissions).
 * A granted ".read" permission shows as "View only"; any other granted
 * permission shows as "Can do"; anything not granted shows as "No access".
 */

type Access = "full" | "read" | "none";

type Permission = {
  key: string; label: string; description: string;
};

const PERMISSION_GROUPS: {
  group: string; permissions: Permission[];
}[] = [
  {
    group: "Fleet & Vehicles",
    permissions: [
      {
        key: "vehicles.read", label: "View vehicles", description: "See the vehicle list and vehicle details",
      },
      {
        key: "vehicles.manage", label: "Manage vehicles", description: "Add, edit and retire vehicles",
      },
      {
        key: "maintenance.read", label: "View maintenance", description: "See service schedules and history",
      },
      {
        key: "maintenance.manage", label: "Manage maintenance", description: "Schedule and close service jobs",
      },
      {
        key: "fuel.read", label: "View fuel records", description: "See fuel usage and theft alerts",
      },
      {
        key: "fuel.manage", label: "Manage fuel records", description: "Record refuels and resolve alerts",
      },
    ],
  },
  {
    group: "Drivers",
    permissions: [
      {
        key: "drivers.read", label: "View drivers", description: "See driver profiles and status",
      },
      {
        key: "drivers.manage", label: "Manage drivers", description: "Add, edit and suspend drivers",
      },
      {
        key: "behaviour.read", label: "View driver behaviour", description: "Scores, fatigue and safety events",
      },
    ],
  },
  {
    group: "Operations & Dispatch",
    permissions: [
      {
        key: "map.read", label: "View live map", description: "Track vehicles in real time",
      },
      {
        key: "jobs.read", label: "View jobs", description: "See jobs, trips and their history",
      },
      {
        key: "jobs.manage", label: "Dispatch jobs", description: "Create, assign and close jobs",
      },
      {
        key: "geofences.read", label: "View geofences", description: "See zones and zone alerts",
      },
      {
        key: "geofences.manage", label: "Manage geofences", description: "Create and edit zones",
      },
    ],
  },
  {
    group: "Devices & Connectivity",
    permissions: [
      {
        key: "devices.read", label: "View devices", description: "See tracking devices and health",
      },
      {
        key: "devices.manage", label: "Manage devices", description: "Request devices and update assignments",
      },
      {
        key: "sims.read", label: "View SIMs", description: "See SIM cards and their status",
      },
      {
        key: "bundles.read", label: "View data bundles", description: "See bundle balances and expiry",
      },
      {
        key: "bundles.manage", label: "Manage data bundles", description: "Request and renew data bundles",
      },
    ],
  },
  {
    group: "Billing & Finance",
    permissions: [
      {
        key: "invoices.read", label: "View invoices", description: "See invoices and payment history",
      },
      {
        key: "invoices.manage", label: "Manage invoices", description: "Create, approve and send invoices",
      },
      {
        key: "wallet.read", label: "View wallet", description: "See balance and transactions",
      },
      {
        key: "wallet.manage", label: "Manage wallet", description: "Top up and allocate funds",
      },
      {
        key: "subscription.manage", label: "Manage subscription", description: "Change plan and request upgrades",
      },
    ],
  },
  {
    group: "Reports & Communication",
    permissions: [
      {
        key: "reports.read", label: "View reports", description: "Open dashboards and reports",
      },
      {
        key: "reports.export", label: "Export data", description: "Download reports and records",
      },
      {
        key: "messaging.read", label: "View messages", description: "Read the messaging centre",
      },
      {
        key: "messaging.send", label: "Send messages", description: "Message drivers and customers",
      },
    ],
  },
  {
    group: "Organisation Administration",
    permissions: [
      {
        key: "team.read", label: "View team", description: "See team members and invitations",
      },
      {
        key: "team.manage", label: "Manage team", description: "Invite, edit and remove team members",
      },
      {
        key: "roles.manage", label: "Manage roles & permissions", description: "Create roles and grant permissions",
      },
      {
        key: "settings.read", label: "View settings", description: "Read organisation configuration",
      },
      {
        key: "settings.manage", label: "Manage settings", description: "Change organisation configuration",
      },
    ],
  },
];

const MATRIX_ROLES: {
  key: string; label: string; permissions: Set<string>;
}[] = [
  {
    key: "operations_manager",
    label: "Operations Manager",
    permissions: new Set([
      "vehicles.read",
      "vehicles.manage",
      "maintenance.read",
      "maintenance.manage",
      "fuel.read",
      "fuel.manage",
      "drivers.read",
      "drivers.manage",
      "behaviour.read",
      "map.read",
      "jobs.read",
      "jobs.manage",
      "geofences.read",
      "geofences.manage",
      "devices.read",
      "sims.read",
      "bundles.read",
      "reports.read",
      "reports.export",
      "messaging.read",
      "messaging.send",
      "team.read",
      "settings.read",
    ]),
  },
  {
    key: "finance_officer",
    label: "Finance Officer",
    permissions: new Set([
      "invoices.read",
      "invoices.manage",
      "wallet.read",
      "wallet.manage",
      "subscription.manage",
      "bundles.read",
      "bundles.manage",
      "vehicles.read",
      "reports.read",
      "reports.export",
      "settings.read",
    ]),
  },
  {
    key: "maintenance_supervisor",
    label: "Maintenance Supervisor",
    permissions: new Set([
      "vehicles.read",
      "maintenance.read",
      "maintenance.manage",
      "fuel.read",
      "fuel.manage",
      "devices.read",
      "devices.manage",
      "drivers.read",
      "reports.read",
    ]),
  },
  {
    key: "viewer",
    label: "Viewer",
    permissions: new Set([
      "vehicles.read",
      "drivers.read",
      "behaviour.read",
      "map.read",
      "jobs.read",
      "geofences.read",
      "devices.read",
      "sims.read",
      "bundles.read",
      "invoices.read",
      "reports.read",
      "messaging.read",
    ]),
  },
];

function accessFor(granted: Set<string>, permissionKey: string): Access {
  if (!granted.has(permissionKey))
    return "none";
  return permissionKey.endsWith(".read") ? "read" : "full";
}

/** The design app's legend chips, verbatim. */
const LEGEND: {
  access: Access; label: string; detail: string; chip: string; icon: typeof Check;
}[] = [
  {
    access: "full", label: "Can do", detail: "Granted — role can perform this action", chip: "bg-success/10 text-success", icon: Check,
  },
  {
    access: "read", label: "View only", detail: "View only — read access, no changes", chip: "bg-warning/10 text-warning", icon: Eye,
  },
  {
    access: "none", label: "No access", detail: "Not granted", chip: "bg-muted text-muted-foreground", icon: X,
  },
];

const CARD_TITLE = "font-semibold tracking-tight text-foreground font-display flex items-center gap-2 text-base";

const LEGEND_BY_ACCESS = Object.fromEntries(LEGEND.map(l => [
  l.access,
  l,
])) as Record<Access, (typeof LEGEND)[number]>;

export function RolePermissionsMatrix() {
  const [
    search,
    setSearch,
  ] = useState("");

  const groups = useMemo(
    () => {
      const q = search.trim().toLowerCase();
      if (!q)
        return PERMISSION_GROUPS;
      return PERMISSION_GROUPS
        .map(g => ({
          ...g, permissions: g.permissions.filter(p => p.label.toLowerCase().includes(q)),
        }))
        .filter(g => g.permissions.length > 0);
    },
    [search],
  );

  return (
    <div className="rounded-2xl surface-sleek text-card-foreground surface-sleek">
      <div className="flex flex-col space-y-1.5 p-6 pb-4 gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className={CARD_TITLE}>
              <Shield className="h-4 w-4 text-primary" />
              What each role can do
            </h3>
            <p className="text-sm text-muted-foreground">Every permission in your organisation and whether each role has it. Hover a cell for details.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {LEGEND.map(l => (
              <span
                key={l.access}
                className="flex items-center gap-1.5 text-muted-foreground"
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-md ${l.chip}`}>
                  <l.icon className="h-3 w-3" />
                </span>
                {l.label}
              </span>
            ))}
          </div>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search a permission..."
            className="pl-9"
          />
        </div>
      </div>
      <div className="p-6 pt-0">
        <TooltipProvider delayDuration={150}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium text-muted-foreground">Permission</th>
                  {MATRIX_ROLES.map(role => (
                    <th
                      key={role.key}
                      className="px-3 py-2 text-center align-bottom"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium">{role.label}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map(g => (
                  <Fragment key={g.group}>
                    <tr>
                      <td
                        colSpan={MATRIX_ROLES.length + 1}
                        className="sticky left-0 bg-muted/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {g.group}
                      </td>
                    </tr>
                    {g.permissions.map(permission => (
                      <tr
                        key={permission.key}
                        className="border-t border-border/60"
                      >
                        <td className="sticky left-0 z-10 bg-card px-3 py-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-medium">{permission.label}</span>
                            </TooltipTrigger>
                            <TooltipContent side="right">{permission.description}</TooltipContent>
                          </Tooltip>
                        </td>
                        {MATRIX_ROLES.map((role) => {
                          const cell = LEGEND_BY_ACCESS[accessFor(
                            role.permissions,
                            permission.key,
                          )];
                          return (
                            <td
                              key={role.key}
                              className="px-3 py-2"
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg ${cell.chip}`}
                                    aria-label={cell.detail}
                                  >
                                    <cell.icon className="h-4 w-4" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>{cell.detail}</TooltipContent>
                              </Tooltip>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
