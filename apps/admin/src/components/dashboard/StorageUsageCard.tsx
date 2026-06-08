import { HardDrive, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/shadcn/skeleton";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const KB = bytes / 1024;
  if (KB < 1024) return `${KB.toFixed(1)} KB`;
  const MB = KB / 1024;
  if (MB < 1024) return `${MB.toFixed(1)} MB`;
  const GB = MB / 1024;
  return `${GB.toFixed(2)} GB`;
}

export function StorageUsageCard({ className }: { className?: string }) {
  const navigate = useNavigate();
  const usedBytes = 0;
  const usedGB = 0;
  const limitGB: number | null = null;
  const percentage = 0;
  const isLoading = false;
  const currentPlan = null;

  const near = limitGB !== null && percentage >= 80 && percentage < 100;
  const over = limitGB !== null && percentage >= 100;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <HardDrive className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Storage</CardTitle>
            <CardDescription className="text-xs">
              Documents, waybills, POD & compliance files
            </CardDescription>
          </div>
        </div>
        {currentPlan?.name && (
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
            {currentPlan.name}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="text-2xl font-semibold leading-none">
                  {usedGB < 0.01 ? formatBytes(usedBytes) : `${usedGB.toFixed(2)} GB`}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  used of {limitGB !== null ? `${limitGB} GB` : "unlimited"}
                </div>
              </div>
              {limitGB !== null && (
                <div className="text-right">
                  <div className={`text-sm font-medium ${over ? "text-destructive" : near ? "text-warning" : "text-muted-foreground"}`}>
                    {percentage.toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
            {limitGB !== null && (
              <Progress
                value={percentage}
                className={over ? "[&>div]:bg-destructive" : near ? "[&>div]:bg-warning" : ""}
              />
            )}
            {(near || over) && (
              <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-2 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-warning shrink-0" />
                <div className="flex-1">
                  {over
                    ? `You're over the ${limitGB} GB storage limit for ${currentPlan?.name}. Upgrade to add more.`
                    : `You've used ${percentage.toFixed(0)}% of your ${limitGB} GB storage. Consider upgrading soon.`}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                  onClick={() => navigate("/settings?tab=billing")}
                >
                  Upgrade
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}



