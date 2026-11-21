import type { PermissionDef } from "@/features/settings/utils/platformPermissions";
import {
  Check, Eye, Search, Shield, X,
} from "lucide-react";
import {
  Fragment, useMemo, useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { usePlatformRolesStore } from "@/features/settings/stores/platformRolesStore";
import { PERMISSION_DOMAINS } from "@/features/settings/utils/platformPermissions";
import { cn } from "@/lib/utils";

type Level = "full" | "view" | "none";

type MatrixRow = {
  domain: string;
  permission: PermissionDef;
  isRead: boolean;
};

function buildRows(): MatrixRow[] {
  const rows: MatrixRow[] = [];
  for (const domain of PERMISSION_DOMAINS) {
    for (const perm of domain.permissions) {
      const action = perm.key.split(".").pop() ?? "";
      rows.push({
        domain: domain.label, permission: perm, isRead: action === "read",
      });
    }
  }
  return rows;
}

function levelFor(row: MatrixRow, permissions: string[]): Level {
  if (!permissions.includes(row.permission.key))
    return "none";
  return row.isRead ? "view" : "full";
}

const LEVEL_META: Record<Level, {
  icon: typeof Check; label: string; className: string;
}> = {
  full: {
    icon: Check, label: "Granted — role can perform this action", className: "bg-success/10 text-success",
  },
  view: {
    icon: Eye, label: "View only — read access, no changes", className: "bg-warning/10 text-warning",
  },
  none: {
    icon: X, label: "Not granted", className: "bg-muted text-muted-foreground",
  },
};

function LevelCell({ level }: { level: Level }) {
  const meta = LEVEL_META[level];
  const Icon = meta.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "mx-auto flex h-7 w-7 items-center justify-center rounded-lg",
            meta.className,
          )}
          aria-label={meta.label}
        >
          <Icon className="h-4 w-4" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{meta.label}</TooltipContent>
    </Tooltip>
  );
}

/** "What each role can do" — fleetflow's `PlatformRolesMatrix`, reading the local roles store. */
export function PlatformRolesMatrix() {
  const roles = usePlatformRolesStore(s => s.roles);
  const [
    search,
    setSearch,
  ] = useState("");

  const rows = useMemo(
    () => buildRows(),
    [],
  );
  const filtered = useMemo(
    () => {
      const q = search.trim().toLowerCase();
      if (!q)
        return rows;
      return rows.filter(
        r =>
          r.permission.label.toLowerCase().includes(q)
          || r.domain.toLowerCase().includes(q),
      );
    },
    [
      rows,
      search,
    ],
  );

  const grouped = useMemo(
    () => {
      const map = new Map<string, MatrixRow[]>();
      for (const row of filtered) {
        const list = map.get(row.domain) ?? [];
        list.push(row);
        map.set(
          row.domain,
          list,
        );
      }
      return Array.from(map.entries());
    },
    [filtered],
  );

  return (
    <Card className="surface-sleek">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              What each role can do
            </CardTitle>
            <CardDescription>
              Every platform permission and whether each role has it. Hover a cell for details.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {([
              "full",
              "view",
              "none",
            ] as Level[]).map((lvl) => {
              const meta = LEVEL_META[lvl];
              const Icon = meta.icon;
              return (
                <span
                  key={lvl}
                  className="flex items-center gap-1.5 text-muted-foreground"
                >
                  <span className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md",
                    meta.className,
                  )}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  {lvl === "full" ? "Can do" : lvl === "view" ? "View only" : "No access"}
                </span>
              );
            })}
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
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={150}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium text-muted-foreground">
                    Permission
                  </th>
                  {roles.map(role => (
                    <th
                      key={role.key}
                      className="px-3 py-2 text-center align-bottom"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium">{role.label}</span>
                        {!role.builtIn && (
                          <Badge
                            variant="outline"
                            className="rounded-full text-[10px]"
                          >
                            Custom
                          </Badge>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grouped.map(([
                  domain,
                  domainRows,
                ]) => (
                  <Fragment key={domain}>
                    <tr>
                      <td
                        colSpan={roles.length + 1}
                        className="sticky left-0 bg-muted/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {domain}
                      </td>
                    </tr>
                    {domainRows.map(row => (
                      <tr
                        key={row.permission.key}
                        className="border-t border-border/60"
                      >
                        <td className="sticky left-0 z-10 bg-card px-3 py-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-medium">{row.permission.label}</span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="max-w-xs"
                            >
                              {row.permission.description}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        {roles.map(role => (
                          <td
                            key={role.key}
                            className="px-3 py-2"
                          >
                            <LevelCell level={levelFor(
                              row,
                              role.permissions,
                            )}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
                {grouped.length === 0 && (
                  <tr>
                    <td
                      colSpan={roles.length + 1}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      No permissions match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
