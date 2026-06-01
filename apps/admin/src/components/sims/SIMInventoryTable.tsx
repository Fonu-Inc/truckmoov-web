import { SIMCardExtended } from "@/hooks/useIOTSIMs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Badge } from "@/components/shadcn/badge";
import { Label } from "@/components/shadcn/label";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Progress } from "@/components/shadcn/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { ExportButton } from "@/components/shadcn/export-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Wifi,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Link,
  Unlink,
  Play,
  Pause,
  Power,
  Search,
  SlidersHorizontal,
} from "lucide-react";

interface DeviceInfo {
  id: string;
  imei: string;
}

interface Props {
  sims: SIMCardExtended[];
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
}

export function SIMInventoryTable({
  sims,
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
  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              SIM Cards ({sims.length})
            </CardTitle>
            <CardDescription className="mt-1">All IoT SIMs in your inventory — track status, carrier, data usage, and assigned device at a glance.</CardDescription>
          </div>
          <ExportButton
            filename="sim-cards"
            rows={sims}
            columns={[
              { header: "ICCID", accessor: "iccid" },
              { header: "Mobile Number", accessor: "mobileNumber" },
              { header: "Operator", accessor: "networkOperator" },
              { header: "Status", accessor: "status" },
              { header: "Device IMEI", accessor: (s: any) => getDeviceInfo(s.deviceId)?.imei ?? "" },
              { header: "Data Used (GB)", accessor: (s: any) => s.dataUsage },
              { header: "Data Limit (GB)", accessor: (s: any) => s.dataLimit },
            ]}
          />
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ICCID, phone number, operator..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
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
              <Button variant="outline" className="relative">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filter
                {operatorFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">{operatorFilters.length}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-80 p-3 rounded-xl space-y-3 max-h-[70vh] overflow-y-auto">
              <h4 className="text-xs font-medium text-foreground px-0.5">Only show SIMs by...</h4>
              <div className="space-y-1.5">
                <p className="text-xs font-medium">Network operator</p>
                <div className="space-y-1.5 pl-0.5">
                  {operators.map((op) => (
                    <label key={op} className="flex items-center gap-2 cursor-pointer select-none">
                      <Checkbox
                        checked={operatorFilters.includes(op)}
                        onCheckedChange={(c) => {
                          onOperatorFiltersChange(
                            c ? [...operatorFilters, op] : operatorFilters.filter((x) => x !== op)
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
                <Button size="sm" className="flex-1">Apply</Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onOperatorFiltersChange([])}>Show All</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">ICCID</th>
                <th className="pb-3 font-medium">Mobile Number</th>
                <th className="pb-3 font-medium">Operator</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Device</th>
                <th className="pb-3 font-medium">Data Usage</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sims.map((sim) => {
                const device = getDeviceInfo(sim.deviceId);
                const usagePercent = (sim.dataUsage / sim.dataLimit) * 100;
                return (
                  <tr key={sim.id} className="group transition-colors hover:bg-secondary/30">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            sim.status === "active" || sim.status === "assigned"
                              ? "bg-success/10"
                              : sim.status === "suspended"
                              ? "bg-warning/10"
                              : "bg-secondary"
                          )}
                        >
                          <Wifi
                            className={cn(
                              "h-5 w-5",
                              sim.status === "active" || sim.status === "assigned"
                                ? "text-success"
                                : sim.status === "suspended"
                                ? "text-warning"
                                : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <span className="font-mono text-xs">{sim.iccid}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="font-medium">{sim.mobileNumber}</span>
                    </td>
                    <td className="py-4 text-sm">{sim.networkOperator}</td>
                    <td className="py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium",
                          sim.status === "active" && "bg-success/10 text-success",
                          sim.status === "assigned" && "bg-primary/10 text-primary",
                          sim.status === "registered" && "bg-muted text-muted-foreground",
                          sim.status === "suspended" && "bg-warning/10 text-warning",
                          sim.status === "deactivated" && "bg-destructive/10 text-destructive"
                        )}
                      >
                        {sim.status}
                      </span>
                    </td>
                    <td className="py-4">
                      {device ? (
                        <span className="text-sm font-mono">{device.imei.slice(-6)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 w-32">
                        <Progress
                          value={usagePercent}
                          className={cn(
                            "h-2",
                            usagePercent > 90 && "[&>div]:bg-destructive",
                            usagePercent > 75 && usagePercent <= 90 && "[&>div]:bg-warning"
                          )}
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {sim.dataUsage.toFixed(1)}/{sim.dataLimit}GB
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {sims.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Wifi className="h-12 w-12 mb-4 opacity-30" />
              <p>No SIM cards found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}



