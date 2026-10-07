import type { ColumnDef } from "@tanstack/react-table";
import {
  Download,
  Edit,
  Eye,
  Link,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  Power,
  Search,
  SlidersHorizontal,
  Trash2,
  Unlink,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import { Progress } from "@/components/shadcn/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { cn } from "@/lib/utils";

// Local type alias (hook deleted)
type SIMCardExtended = {
  id: string;
  iccid: string;
  mobileNumber: string;
  networkOperator: string;
  status: string;
  deviceId?: string;
  dataUsage: number;
  dataLimit: number;
};

type DeviceInfo = {
  id: string;
  imei: string;
};

type Props = {
  sims: SIMCardExtended[];
  total: number;
  loading?: boolean;
  isFetching?: boolean;
  page: number;
  /** Server page size; omit to render without the pagination footer. */
  pageSize?: number;
  onPageChange: (page: number) => void;
  onExport: () => void;
  getDeviceInfo: (deviceId?: string) => DeviceInfo | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  operatorFilters: string[];
  onOperatorFiltersChange: (o: string[]) => void;
  operators: string[];
  onViewDetails: (sim: SIMCardExtended) => void;
  onEdit: (sim: SIMCardExtended) => void;
  onActivate: (simId: string) => void;
  onSuspend: (simId: string) => void;
  onResume: (simId: string) => void;
  onAssign: (sim: SIMCardExtended) => void;
  onUnassign: (simId: string) => void;
  onDelete: (simId: string) => void;
};

export function SIMInventoryTable({
  sims,
  total,
  loading,
  isFetching,
  page,
  pageSize,
  onPageChange,
  onExport,
  getDeviceInfo,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  operatorFilters,
  onOperatorFiltersChange,
  operators,
  onViewDetails,
  onEdit,
  onActivate,
  onSuspend,
  onResume,
  onAssign,
  onUnassign,
  onDelete,
}: Props) {
  const columns: ColumnDef<SIMCardExtended>[] = [
    {
      id: "simId",
      header: "SIM ID",
      enableSorting: false,
      cell: ({ row }) => (
        <span
          className="rounded bg-secondary px-2 py-1 font-mono text-xs"
          title={row.original.id}
        >
          {row.original.id.slice(
            0,
            8,
          )}
        </span>
      ),
    },
    {
      id: "iccid",
      header: "ICCID",
      enableSorting: false,
      cell: ({ row }) => {
        const sim = row.original;
        const live = sim.status === "active" || sim.status === "assigned";
        return (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                live
                  ? "bg-success/10"
                  : sim.status === "suspended"
                    ? "bg-warning/10"
                    : "bg-secondary",
              )}
            >
              <Wifi
                className={cn(
                  "h-5 w-5",
                  live
                    ? "text-success"
                    : sim.status === "suspended"
                      ? "text-warning"
                      : "text-muted-foreground",
                )}
              />
            </div>
            <span className="font-mono text-xs">{sim.iccid}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "mobileNumber",
      header: "Mobile Number",
      enableSorting: false,
      meta: { className: "font-medium" },
    },
    {
      accessorKey: "networkOperator",
      header: "Carrier",
      enableSorting: false,
      meta: { className: "text-sm" },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const { status } = row.original;
        return (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              status === "active" && "bg-success/10 text-success",
              status === "assigned" && "bg-primary/10 text-primary",
              status === "registered" && "bg-muted text-muted-foreground",
              status === "suspended" && "bg-warning/10 text-warning",
              status === "deactivated" && "bg-destructive/10 text-destructive",
            )}
          >
            {status}
          </span>
        );
      },
    },
    {
      id: "device",
      header: "Device",
      enableSorting: false,
      cell: ({ row }) => {
        const device = getDeviceInfo(row.original.deviceId);
        return device
          ? <span className="text-sm font-mono">{device.imei.slice(-6)}</span>
          : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      id: "usage",
      header: "Data Usage",
      enableSorting: false,
      cell: ({ row }) => {
        const sim = row.original;
        const usagePercent = (sim.dataUsage / sim.dataLimit) * 100;
        return (
          <div className="flex items-center gap-2 w-32">
            <Progress
              value={usagePercent}
              className={cn(
                "h-2",
                usagePercent > 90 && "[&>div]:bg-destructive",
                usagePercent > 75 && usagePercent <= 90 && "[&>div]:bg-warning",
              )}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {sim.dataUsage.toFixed(1)}
              /
              {sim.dataLimit}
              GB
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => {
        const sim = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(sim)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(sim)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {sim.status === "registered" && (
                <DropdownMenuItem onClick={() => onActivate(sim.id)}>
                  <Power className="mr-2 h-4 w-4" />
                  Activate SIM
                </DropdownMenuItem>
              )}
              {(sim.status === "active" || sim.status === "assigned") && (
                <DropdownMenuItem onClick={() => onSuspend(sim.id)}>
                  <Pause className="mr-2 h-4 w-4" />
                  Suspend SIM
                </DropdownMenuItem>
              )}
              {sim.status === "suspended" && (
                <DropdownMenuItem onClick={() => onResume(sim.id)}>
                  <Play className="mr-2 h-4 w-4" />
                  Resume SIM
                </DropdownMenuItem>
              )}
              {!sim.deviceId && sim.status === "active" && (
                <DropdownMenuItem onClick={() => onAssign(sim)}>
                  <Link className="mr-2 h-4 w-4" />
                  Assign to Device
                </DropdownMenuItem>
              )}
              {sim.deviceId && (
                <DropdownMenuItem onClick={() => onUnassign(sim.id)}>
                  <Unlink className="mr-2 h-4 w-4" />
                  Unassign Device
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(sim.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              SIM Cards (
              {total}
              )
            </CardTitle>
            <CardDescription className="mt-1">All IoT SIMs in your inventory — track status, carrier, data usage, and assigned device at a glance.</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={onExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ICCID, phone number, operator..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={onStatusFilterChange}
          >
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="relative"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filter
                {operatorFilters.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 px-1.5 text-[10px]"
                  >
                    {operatorFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-80 p-3 rounded-xl space-y-3 max-h-[70vh] overflow-y-auto"
            >
              <h4 className="text-xs font-medium text-foreground px-0.5">Only show SIMs by...</h4>
              <div className="space-y-1.5">
                <p className="text-xs font-medium">Network operator</p>
                <div className="space-y-1.5 pl-0.5">
                  {operators.map(op => (
                    <label
                      key={op}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <Checkbox
                        checked={operatorFilters.includes(op)}
                        onCheckedChange={(c) => {
                          onOperatorFiltersChange(
                            c
                              ? [
                                  ...operatorFilters,
                                  op,
                                ]
                              : operatorFilters.filter(x => x !== op),
                          );
                        }}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-xs">{op}</span>
                    </label>
                  ))}
                  {operators.length === 0 && (
                    <p className="text-xs text-muted-foreground">No operators</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  size="sm"
                  className="flex-1"
                >
                  Apply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onOperatorFiltersChange([])}
                >
                  Show All
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          {isFetching && !loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/50">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          <DataTable
            columns={columns}
            data={sims}
            isLoading={loading && sims.length === 0}
            rowClassName={() => "group transition-colors hover:bg-secondary/30"}
            emptyState={(
              <div className="flex flex-col items-center justify-center py-4">
                <Wifi className="h-12 w-12 mb-4 opacity-30" />
                <p>No SIM cards found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
            pagination={pageSize
              ? {
                  page,
                  pageSize,
                  total,
                  onPageChange,
                }
              : undefined}
          />
        </div>
      </CardContent>
    </Card>
  );
}
