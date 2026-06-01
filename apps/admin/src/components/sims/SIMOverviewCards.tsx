import { Card, CardContent } from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { Wifi, Signal, Pause } from "lucide-react";

interface Props {
  totalSIMs: number;
  activeSIMs: number;
  suspendedSIMs: number;
  totalDataUsage: number;
  totalDataLimit: number;
}

export function SIMOverviewCards({ totalSIMs, activeSIMs, suspendedSIMs, totalDataUsage, totalDataLimit }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total SIMs</p>
              <p className="text-2xl font-bold">{totalSIMs}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <Wifi className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active SIMs</p>
              <p className="text-2xl font-bold text-success">{activeSIMs}</p>
            </div>
            <div className="rounded-lg bg-success/10 p-3">
              <Signal className="h-6 w-6 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Suspended</p>
              <p className="text-2xl font-bold text-warning">{suspendedSIMs}</p>
            </div>
            <div className="rounded-lg bg-warning/10 p-3">
              <Pause className="h-6 w-6 text-warning" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Data Usage</p>
              <span className="text-xs text-muted-foreground">
                {totalDataUsage.toFixed(1)} / {totalDataLimit} GB
              </span>
            </div>
            <Progress value={totalDataLimit > 0 ? (totalDataUsage / totalDataLimit) * 100 : 0} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



