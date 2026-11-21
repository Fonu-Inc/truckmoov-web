import type { ColumnDef } from "@tanstack/react-table";
import type {
  FilterField, FilterValues,
} from "@/components/shadcn/table-toolbar";
import {
  Activity, Download, FilePen, FilePlus2, FileX2, ListChecks, Shield,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { ExportButton } from "@/components/shadcn/export-button";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import { cn } from "@/lib/utils";

type AuditAction = "create" | "update" | "delete";

type AuditLogEntry = {
  id: string;
  user: string;
  role: string;
  action: AuditAction;
  category: string;
  entity: string;
  details: string;
  timestamp: Date;
};

const HOUR = 60 * 60 * 1000;

// ponytail: mock data from fleetflow parity port — wire to packages/api
const auditLogEntries: AuditLogEntry[] = ([
  [
    "Chidi Nwankwo",
    "Tenant Admin",
    "create",
    "User",
    "Tunde Adebayo",
  ],
  [
    "Amina Yusuf",
    "Operations Manager",
    "update",
    "Fleet",
    "Fleet Group - Abuja",
  ],
  [
    "Tunde Adebayo",
    "Dispatcher",
    "delete",
    "Driver",
    "Emeka Eze",
  ],
  [
    "Ngozi Okafor",
    "Supervisor",
    "create",
    "Geozone",
    "Victoria Island Zone",
  ],
  [
    "Bola Adeyemi",
    "Operations Manager",
    "update",
    "Vehicle",
    "ABJ-118-XY",
  ],
  [
    "Emeka Eze",
    "Dispatcher",
    "delete",
    "Device",
    "IMEI 862470047920019",
  ],
  [
    "Fatima Bello",
    "Viewer Finance",
    "create",
    "Job",
    "Job #JB-1042",
  ],
  [
    "Chidi Nwankwo",
    "Tenant Admin",
    "update",
    "Maintenance",
    "Brake Service - ABJ-118-XY",
  ],
  [
    "Amina Yusuf",
    "Operations Manager",
    "delete",
    "Document",
    "Driver's License - Chidi Nwankwo",
  ],
  [
    "Tunde Adebayo",
    "Dispatcher",
    "create",
    "User",
    "Tunde Adebayo",
  ],
  [
    "Ngozi Okafor",
    "Supervisor",
    "update",
    "Fleet",
    "Fleet Group - Lagos",
  ],
  [
    "Bola Adeyemi",
    "Operations Manager",
    "delete",
    "Driver",
    "Emeka Eze",
  ],
] as const).map(([
  user,
  role,
  action,
  category,
  entity,
], i) => ({
  id: `audit-${i}`,
  user,
  role,
  action,
  category,
  entity,
  details: `${user} ${action}d ${category.toLowerCase()} record "${entity}"`,
  timestamp: new Date(Date.now() - i * 18 * HOUR),
}));

const CATEGORIES = [
  "User",
  "Fleet",
  "Driver",
  "Geozone",
  "Vehicle",
  "Device",
  "Job",
  "Maintenance",
  "Document",
];

const roleColors: Record<string, string> = {
  "Tenant Admin": "bg-info/15 text-info border-info/30",
  "Operations Manager": "bg-accent/15 text-accent border-accent/30",
  "Dispatcher": "bg-warning/15 text-warning border-warning/30",
  "Supervisor": "bg-warning/15 text-warning border-warning/30",
  "Viewer Finance": "bg-warning/15 text-warning border-warning/30",
};

const actionColors: Record<AuditAction, string> = {
  create: "bg-success/20 text-success border-success/30",
  update: "bg-primary/20 text-primary border-primary/30",
  delete: "bg-destructive/20 text-destructive border-destructive/30",
};

const filterFields: FilterField[] = [
  {
    type: "select", key: "category", label: "Category", options: CATEGORIES.map(c => ({
      value: c, label: c,
    })),
  },
  {
    type: "daterange", key: "timestamp", label: "Date & Time Range",
  },
];

const formatTimestamp = (d: Date) => d.toLocaleString("en-GB");

const columns: ColumnDef<AuditLogEntry>[] = [
  {
    accessorKey: "user", header: "User", enableSorting: false, meta: { className: "whitespace-normal font-medium" },
  },
  {
    accessorKey: "role",
    header: "Role",
    enableSorting: false,
    meta: { className: "whitespace-normal" },
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(
          "rounded-full px-2.5 gap-1 font-medium",
          roleColors[row.original.role],
        )}
      >
        <Shield className="h-3 w-3" />
        {row.original.role}
      </Badge>
    ),
  },
  {
    accessorKey: "action",
    header: "Action",
    enableSorting: false,
    meta: { className: "whitespace-normal" },
    cell: ({ row }) => (
      <Badge className={cn(
        "rounded-full px-2.5",
        actionColors[row.original.action],
      )}
      >
        {row.original.action}
      </Badge>
    ),
  },
  {
    accessorKey: "category", header: "Category", enableSorting: false, meta: { className: "whitespace-normal" },
  },
  {
    accessorKey: "entity", header: "Entity", enableSorting: false, meta: { className: "whitespace-normal" },
  },
  {
    accessorKey: "details", header: "Details", enableSorting: false, meta: { className: "text-sm text-muted-foreground max-w-md truncate" },
  },
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    enableSorting: false,
    meta: { className: "text-sm text-muted-foreground whitespace-nowrap" },
    cell: ({ row }) => formatTimestamp(row.original.timestamp),
  },
];

/** Settings → Audit Log. Routed directly from `shared/lib/route.tsx`. */
export function AuditLogPanel() {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("all");
  const [
    filters,
    setFilters,
  ] = useState<FilterValues>({});

  const filtered = useMemo(
    () => {
      const q = search.trim().toLowerCase();
      const category = filters.category;
      const range = filters.timestamp;
      return auditLogEntries.filter((e) => {
        if (q && ![
          e.user,
          e.entity,
          e.details,
        ].some(v => v.toLowerCase().includes(q))) {
          return false;
        }
        if (status !== "all" && e.action !== status)
          return false;
        if (category?.enabled && category.value && e.category !== category.value)
          return false;
        if (range?.enabled) {
          if (range.dateFrom && e.timestamp < new Date(`${range.dateFrom}T00:00:00`))
            return false;
          if (range.dateTo && e.timestamp > new Date(`${range.dateTo}T23:59:59.999`))
            return false;
        }
        return true;
      });
    },
    [
      search,
      status,
      filters,
    ],
  );

  const stats = [
    {
      label: "Total Events", value: auditLogEntries.length, icon: Activity, tint: "bg-primary/20", color: "text-primary",
    },
    {
      label: "Creates", value: auditLogEntries.filter(e => e.action === "create").length, icon: FilePlus2, tint: "bg-success/20", color: "text-success",
    },
    {
      label: "Updates", value: auditLogEntries.filter(e => e.action === "update").length, icon: FilePen, tint: "bg-primary/20", color: "text-primary",
    },
    {
      label: "Deletes", value: auditLogEntries.filter(e => e.action === "delete").length, icon: FileX2, tint: "bg-destructive/20", color: "text-destructive",
    },
  ];

  const hasActiveFilters = !!search || status !== "all" || Object.values(filters).some(f => f?.enabled);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card
            key={s.label}
            className="rounded-2xl surface-sleek bg-card/50 border-border/50"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                  s.tint,
                )}
                >
                  <s.icon className={cn(
                    "h-5 w-5",
                    s.color,
                  )}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold truncate">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl surface-sleek bg-card/50 border-border/50">
        <CardHeader className="space-y-1.5 p-6 pb-4 flex flex-row items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              {" "}
              Activity Log
            </CardTitle>
            <CardDescription className="mt-1.5">
              Recorded activity and changes, listed with their dates and details.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton
              rows={filtered}
              filename="audit-log"
              columns={[
                {
                  header: "User", accessor: "user",
                },
                {
                  header: "Role", accessor: "role",
                },
                {
                  header: "Action", accessor: "action",
                },
                {
                  header: "Category", accessor: "category",
                },
                {
                  header: "Entity", accessor: "entity",
                },
                {
                  header: "Details", accessor: "details",
                },
                {
                  header: "Timestamp", accessor: e => formatTimestamp(e.timestamp),
                },
              ]}
            />
            <Button
              variant="gradient"
              onClick={() => toast.success(`Report generated for ${filtered.length} entries`)}
            >
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by user, entity or details..."
            status={status}
            onStatusChange={setStatus}
            statusOptions={[
              {
                value: "all", label: "All actions",
              },
              {
                value: "create", label: "Create",
              },
              {
                value: "update", label: "Update",
              },
              {
                value: "delete", label: "Delete",
              },
            ]}
            filterEntity="events"
            filterFields={filterFields}
            filterValues={filters}
            onFiltersApply={setFilters}
          />
          <div className="rounded-md border border-border/50 overflow-x-auto">
            <DataTable
              columns={columns}
              data={filtered}
              hasActiveFilters={hasActiveFilters}
              emptyState="No audit events recorded yet."
              filteredEmptyState="No audit events match your filters."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
