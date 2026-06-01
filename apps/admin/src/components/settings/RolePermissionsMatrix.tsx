import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { Check, Eye, X, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/shadcn/badge";

/**
 * US-E02-002 — Role Permissions Summary.
 * Read-only matrix of which roles can access which capabilities.
 * Shown inside Settings → Users tab.
 */

type Access = "full" | "read" | "none";

const ROLES = [
  { key: "admin", label: "Fleet Manager", desc: "Full administrative control" },
  { key: "manager", label: "Operations Manager", desc: "Day-to-day operations" },
  { key: "dispatcher", label: "Dispatcher", desc: "Job assignment & tracking" },
  { key: "finance", label: "Finance Officer", desc: "Billing & invoices" },
  { key: "viewer", label: "Viewer", desc: "Read-only oversight" },
] as const;

type RoleKey = (typeof ROLES)[number]["key"];

const CAPABILITIES: { capability: string; access: Record<RoleKey, Access> }[] = [
  { capability: "View live map",       access: { admin: "full", manager: "full", dispatcher: "full", finance: "read", viewer: "read" } },
  { capability: "Dispatch jobs",       access: { admin: "full", manager: "full", dispatcher: "full", finance: "none", viewer: "none" } },
  { capability: "Manage geofences",    access: { admin: "full", manager: "full", dispatcher: "read", finance: "none", viewer: "read" } },
  { capability: "View reports",        access: { admin: "full", manager: "full", dispatcher: "read", finance: "full", viewer: "read" } },
  { capability: "Manage billing",      access: { admin: "full", manager: "none", dispatcher: "none", finance: "full", viewer: "none" } },
  { capability: "Manage team",         access: { admin: "full", manager: "none", dispatcher: "none", finance: "none", viewer: "none" } },
  { capability: "Manage vehicles",     access: { admin: "full", manager: "full", dispatcher: "read", finance: "read", viewer: "read" } },
  { capability: "Manage drivers",      access: { admin: "full", manager: "full", dispatcher: "read", finance: "read", viewer: "read" } },
  { capability: "Manage SIMs",         access: { admin: "full", manager: "read", dispatcher: "none", finance: "read", viewer: "none" } },
  { capability: "Manage data bundles", access: { admin: "full", manager: "read", dispatcher: "none", finance: "full", viewer: "none" } },
  { capability: "Send messages",       access: { admin: "full", manager: "full", dispatcher: "full", finance: "none", viewer: "none" } },
  { capability: "Export data",         access: { admin: "full", manager: "full", dispatcher: "read", finance: "full", viewer: "read" } },
];

function AccessCell({ value }: { value: Access }) {
  if (value === "full") {
    return (
      <div className="flex justify-center" aria-label="Full access">
        <Check className="h-4 w-4 text-success" />
      </div>
    );
  }
  if (value === "read") {
    return (
      <div className="flex justify-center" aria-label="Read-only">
        <Eye className="h-4 w-4 text-warning" />
      </div>
    );
  }
  return (
    <div className="flex justify-center" aria-label="No access">
      <X className="h-4 w-4 text-muted-foreground/40" />
    </div>
  );
}

export function RolePermissionsMatrix() {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Role Permissions Summary
        </CardTitle>
        <CardDescription>
          What each role can do across the platform. Permissions are fixed and apply to all team members assigned to a role.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-success" /> Full access
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-warning" /> Read-only
          </span>
          <span className="inline-flex items-center gap-1.5">
            <X className="h-3.5 w-3.5 text-muted-foreground/60" /> No access
          </span>
        </div>

        <div className="overflow-x-auto rounded-md border border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="min-w-[180px]">Capability</TableHead>
                {ROLES.map((r) => (
                  <TableHead key={r.key} className="text-center min-w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-medium">{r.label}</span>
                      <Badge variant="outline" className="text-[10px] font-normal">{r.desc}</Badge>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {CAPABILITIES.map((row) => (
                <TableRow key={row.capability} className="border-border/50">
                  <TableCell className="font-medium text-sm">{row.capability}</TableCell>
                  {ROLES.map((r) => (
                    <TableCell key={r.key}>
                      <AccessCell value={row.access[r.key]} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}



