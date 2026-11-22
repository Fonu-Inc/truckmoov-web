import { useTenantStorageUsage } from "@truckmoov/api/auth";
import { formatBytes } from "@truckmoov/app-core/utils/general-utils";
import {
  AlertTriangle, HardDrive,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { Skeleton } from "@/components/shadcn/skeleton";

export function StorageUsageCard({ className }: { className?: string }) {
  const navigate = useNavigate();
  const {
    data, isLoading,
  } = useTenantStorageUsage();
  const usedBytes = data?.data.usedBytes ?? 0;
  const limitBytes = data?.data.limitBytes ?? null;
  const planName = data?.data.planName ?? null;
  const percentage = limitBytes ? Math.min(
    100,
    (usedBytes / limitBytes) * 100,
  ) : 0;
  const limitLabel = limitBytes !== null ? formatBytes(limitBytes) : "unlimited";

  const near = limitBytes !== null && percentage >= 80 && percentage < 100;
  const over = limitBytes !== null && percentage >= 100;

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
        {planName && (
          <Badge
            variant="secondary"
            className="text-[10px] uppercase tracking-wide"
          >
            {planName}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading
          ? (
              <Skeleton className="h-16 w-full" />
            )
          : (
              <>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <div className="text-2xl font-semibold leading-none">
                      {formatBytes(usedBytes)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      used of
                      {" "}
                      {limitLabel}
                    </div>
                  </div>
                  {limitBytes !== null && (
                    <div className="text-right">
                      <div className={`text-sm font-medium ${over ? "text-destructive" : near ? "text-warning" : "text-muted-foreground"}`}>
                        {percentage.toFixed(0)}
                        %
                      </div>
                    </div>
                  )}
                </div>
                {limitBytes !== null && (
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
                        ? `You're over the ${limitLabel} storage limit for ${planName ?? "your plan"}. Upgrade to add more.`
                        : `You've used ${percentage.toFixed(0)}% of your ${limitLabel} storage. Consider upgrading soon.`}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => navigate("/subscription")}
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
