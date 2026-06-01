import { SIMCard, IoTDevice } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/shadcn/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Progress } from "@/components/shadcn/progress";
import { Wifi, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface SIMDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sim: SIMCard | null;
  device?: IoTDevice | null;
}

/**
 * Centered, focused SIM details modal.
 * (Component name retained for backwards compatibility with existing imports.)
 */
export function SIMDetailsSheet({ open, onOpenChange, sim, device }: SIMDetailsSheetProps) {
  if (!sim) return null;
  const usagePercent = (sim.dataUsage / sim.dataLimit) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Wifi className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <span className="block">{sim.mobileNumber}</span>
              <span className="text-sm font-normal text-muted-foreground">{sim.networkOperator}</span>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">SIM card details</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={cn("mt-1", sim.status === "active" || sim.status === "assigned" ? "bg-success hover:bg-success" : sim.status === "suspended" ? "bg-warning hover:bg-warning" : "bg-muted")}>{sim.status}</Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Data Usage</p>
                  <p className="font-medium">{sim.dataUsage.toFixed(1)} / {sim.dataLimit} GB</p>
                </div>
              </div>
              <Progress value={usagePercent} className={cn("mt-3 h-2", usagePercent > 90 && "[&>div]:bg-destructive", usagePercent > 75 && usagePercent <= 90 && "[&>div]:bg-warning")} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">SIM Information</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">ICCID</span><span className="font-mono text-xs">{sim.iccid}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">IMSI</span><span className="font-mono">{sim.imsi}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Operator</span><span>{sim.networkOperator}</span></div>
              {sim.fonuSimId && (
                <div className="flex justify-between"><span className="text-muted-foreground">Fonu SIM ID</span><span className="font-mono text-xs">{sim.fonuSimId}</span></div>
              )}
              {sim.fonuStatus && (
                <div className="flex justify-between"><span className="text-muted-foreground">Fonu Status</span><Badge variant="outline" className="text-xs">{sim.fonuStatus}</Badge></div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" />Assigned Device</CardTitle></CardHeader>
            <CardContent>
              {device ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary"><Cpu className="h-5 w-5 text-muted-foreground" /></div>
                  <div><p className="font-medium">{device.manufacturer} {device.model}</p><p className="text-xs text-muted-foreground font-mono">IMEI: {device.imei}</p></div>
                </div>
              ) : <p className="text-sm text-muted-foreground">No device assigned</p>}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
