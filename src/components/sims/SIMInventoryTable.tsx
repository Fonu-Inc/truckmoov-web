import { SIMCardExtended } from "@/hooks/useIOTSIMs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "lucide-react";

interface DeviceInfo {
  id: string;
  imei: string;
}

interface Props {
  sims: SIMCardExtended[];
  getDeviceInfo: (deviceId?: string) => DeviceInfo | null;
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-primary" />
          SIM Cards ({sims.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">SIM</th>
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
                        <div>
                          <p className="font-mono text-sm">{sim.iccid.slice(-8)}</p>
                          <p className="text-xs text-muted-foreground">ICCID: ...{sim.iccid.slice(-8)}</p>
                        </div>
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
