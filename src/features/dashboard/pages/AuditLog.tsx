import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

type ActionType = "created" | "updated" | "deleted" | "assigned" | "resolved";
type EntityType = "Job" | "Vehicle" | "Driver" | "Device" | "Document" | "Alert";

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actionType: ActionType;
  entityType: EntityType;
  entityId: string;
  description: string;
}

const AUDIT_DATA: AuditEntry[] = [
  {
    id: "AUD-1001",
    timestamp: "2026-03-31T08:41:12Z",
    actor: "Chukwuemeka Obi",
    actionType: "assigned",
    entityType: "Job",
    entityId: "TMV-1032",
    description: "Job TMV-1032 assigned to driver DRV-1023.",
  },
  {
    id: "AUD-1002",
    timestamp: "2026-03-31T08:35:04Z",
    actor: "Adebayo Rauf",
    actionType: "updated",
    entityType: "Vehicle",
    entityId: "TMV-401",
    description: "Vehicle status updated to 'active'.",
  },
  {
    id: "AUD-1003",
    timestamp: "2026-03-31T08:22:51Z",
    actor: "Fatima Usman",
    actionType: "created",
    entityType: "Document",
    entityId: "DOC-8812",
    description: "Insurance certificate uploaded for vehicle TMV-233.",
  },
  {
    id: "AUD-1004",
    timestamp: "2026-03-31T08:10:30Z",
    actor: "Yusuf Lawal",
    actionType: "resolved",
    entityType: "Alert",
    entityId: "ALT-402",
    description: "Geofence deviation alert resolved for TMV-509.",
  },
  {
    id: "AUD-1005",
    timestamp: "2026-03-30T17:55:19Z",
    actor: "Ngozi Eze",
    actionType: "deleted",
    entityType: "Driver",
    entityId: "DRV-0091",
    description: "Driver record removed (resigned).",
  },
  {
    id: "AUD-1006",
    timestamp: "2026-03-30T16:44:08Z",
    actor: "Bayo Adeleke",
    actionType: "created",
    entityType: "Job",
    entityId: "TMV-1028",
    description: "New dispatch job created for Apapa → Ikeja route.",
  },
  {
    id: "AUD-1007",
    timestamp: "2026-03-30T14:30:22Z",
    actor: "Chukwuemeka Obi",
    actionType: "updated",
    entityType: "Device",
    entityId: "DEV-7721",
    description: "GPS device SIM card replaced on TMV-118.",
  },
  {
    id: "AUD-1008",
    timestamp: "2026-03-30T11:18:45Z",
    actor: "Fatima Usman",
    actionType: "assigned",
    entityType: "Vehicle",
    entityId: "TMV-772",
    description: "Vehicle TMV-772 assigned to driver DRV-0044.",
  },
  {
    id: "AUD-1009",
    timestamp: "2026-03-29T15:02:11Z",
    actor: "Adebayo Rauf",
    actionType: "resolved",
    entityType: "Alert",
    entityId: "ALT-388",
    description: "Delayed delivery alert resolved — job TMV-1019 delivered.",
  },
  {
    id: "AUD-1010",
    timestamp: "2026-03-29T09:47:33Z",
    actor: "Yusuf Lawal",
    actionType: "created",
    entityType: "Driver",
    entityId: "DRV-1028",
    description: "New driver profile created and activated.",
  },
];

const ACTION_STYLES: Record<ActionType, string> = {
  created: "bg-success/10 text-success border-success/30",
  updated: "bg-primary/10 text-primary border-primary/30",
  deleted: "bg-destructive/10 text-destructive border-destructive/30",
  assigned: "bg-warning/10 text-warning border-warning/30",
  resolved: "bg-muted text-muted-foreground border-border",
};

function formatTimestamp(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

const COLUMNS: ColumnDef<AuditEntry>[] = [
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatTimestamp(row.original.timestamp)}
      </span>
    ),
  },
  {
    accessorKey: "actor",
    header: "Actor",
    cell: ({ row }) => <span className="text-sm font-medium">{row.original.actor}</span>,
  },
  {
    accessorKey: "actionType",
    header: "Action",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn("capitalize", ACTION_STYLES[row.original.actionType])}
      >
        {row.original.actionType}
      </Badge>
    ),
  },
  {
    accessorKey: "entityType",
    header: "Entity",
    cell: ({ row }) => (
      <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
        {row.original.entityType}
      </span>
    ),
  },
  {
    accessorKey: "entityId",
    header: "ID",
    cell: ({ row }) => (
      <span className="text-xs font-mono text-muted-foreground">{row.original.entityId}</span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <span className="text-sm">{row.original.description}</span>,
  },
];

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionType | "all">("all");
  const [entityFilter, setEntityFilter] = useState<EntityType | "all">("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return AUDIT_DATA.filter((entry) => {
      const matchesAction = actionFilter === "all" || entry.actionType === actionFilter;
      const matchesEntity = entityFilter === "all" || entry.entityType === entityFilter;
      const matchesSearch =
        !query ||
        entry.actor.toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query) ||
        entry.entityId.toLowerCase().includes(query);
      return matchesAction && matchesEntity && matchesSearch;
    });
  }, [search, actionFilter, entityFilter]);

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity & Audit Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search actor, entity ID, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select
              value={actionFilter}
              onValueChange={(v) => setActionFilter(v as ActionType | "all")}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={entityFilter}
              onValueChange={(v) => setEntityFilter(v as EntityType | "all")}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                <SelectItem value="Job">Job</SelectItem>
                <SelectItem value="Vehicle">Vehicle</SelectItem>
                <SelectItem value="Driver">Driver</SelectItem>
                <SelectItem value="Device">Device</SelectItem>
                <SelectItem value="Document">Document</SelectItem>
                <SelectItem value="Alert">Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={COLUMNS}
            data={filtered}
            noResultStatement="No audit entries match the current filters."
          />
        </CardContent>
      </Card>
    </section>
  );
}
