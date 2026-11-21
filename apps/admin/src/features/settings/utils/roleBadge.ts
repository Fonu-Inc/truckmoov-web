/**
 * Fleetflow's role indicator colours (`lib/tenantPermissions.ts`
 * `roleIndicatorClasses` / `humaniseRoleKey`), used by `RoleBadge`.
 */
const ROLE_INDICATOR_CLASSES: string[] = [
  "bg-primary/15 text-primary border-primary/30",
  "bg-accent/15 text-accent border-accent/30",
  "bg-success/15 text-success border-success/30",
  "bg-warning/15 text-warning border-warning/30",
  "bg-info/15 text-info border-info/30",
  "bg-muted text-muted-foreground border-border",
];

const FIXED_ROLE_COLORS: Record<string, string> = {
  enterprise_admin: ROLE_INDICATOR_CLASSES[0],
  installer_admin: ROLE_INDICATOR_CLASSES[0],
  admin: ROLE_INDICATOR_CLASSES[0],
  operations_manager: ROLE_INDICATOR_CLASSES[1],
  manager: ROLE_INDICATOR_CLASSES[1],
  lead_installer: ROLE_INDICATOR_CLASSES[1],
  finance_officer: ROLE_INDICATOR_CLASSES[2],
  finance: ROLE_INDICATOR_CLASSES[2],
  field_installer: ROLE_INDICATOR_CLASSES[2],
  maintenance_supervisor: ROLE_INDICATOR_CLASSES[3],
  supervisor: ROLE_INDICATOR_CLASSES[3],
  viewer: ROLE_INDICATOR_CLASSES[5],
  installer_viewer: ROLE_INDICATOR_CLASSES[5],
};

/** Stable colour classes for a role indicator badge, including custom roles. */
export function roleIndicatorClasses(roleKey: string): string {
  const fixed = FIXED_ROLE_COLORS[roleKey];
  if (fixed)
    return fixed;
  let hash = 0;
  for (let i = 0; i < roleKey.length; i += 1)
    hash = (hash * 31 + roleKey.charCodeAt(i)) % 997;
  return ROLE_INDICATOR_CLASSES[hash % (ROLE_INDICATOR_CLASSES.length - 1)];
}

/** Human label for a role key when the role is not in the store. */
export function humaniseRoleKey(roleKey: string): string {
  return roleKey
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
