import { useQuery } from "@tanstack/react-query";
import { HardDrive, AlertTriangle, FileText, Image as ImageIcon, ShieldCheck, Receipt, TrendingUp, Database, Archive } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";

const AVG = {
  waybill: 350 * 1024,
  pod: 600 * 1024,
  compliance: 250 * 1024,
};
const GB = 1024 * 1024 * 1024;

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const KB = bytes / 1024;
  if (KB < 1024) return `${KB.toFixed(1)} KB`;
  const MB = KB / 1024;
  if (MB < 1024) return `${MB.toFixed(1)} MB`;
  return `${(MB / 1024).toFixed(2)} GB`;
}

type Row = {
  key: string;
  label: string;
  icon: typeof FileText;
  count: number;
  bytes: number;
  color: string;
};

export function StoragePanel() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const tenantId = user?.tenantId;
  const currentPlan: any = null;
  const usedBytes = 0;
  const usedGB = 0;
  const limitGB: number | null = null;
  const percentage = 0;
  const usageLoading = false;

  const { data: breakdown, isLoading: breakdownLoading } = useQuery({
    queryKey: ["storage-breakdown", tenantId],
    enabled: false,
    queryFn: async () => {
      return null;
    },
  });

  const isLoading = usageLoading || breakdownLoading;
  const near = limitGB !== null && percentage >= 80 && percentage < 100;
  const over = limitGB !== null && percentage >= 100;
  const remainingGB = limitGB !== null ? Math.max(0, limitGB - usedGB) : null;
  const totalFiles = (breakdown?.rows ?? []).reduce((s, r) => s + r.count, 0);
  const largestCat = (breakdown?.rows ?? []).slice().sort((a, b) => b.bytes - a.bytes)[0];

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardDescription className="text-xs">Storage used</CardDescription>
              <CardTitle className="text-xl truncate">
                {isLoading ? <Skeleton className="h-6 w-24" /> : usedGB < 0.01 ? fmt(usedBytes) : `${usedGB.toFixed(2)} GB`}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            of {limitGB !== null ? `${limitGB} GB` : "unlimited"} on {currentPlan?.name ?? "current plan"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="h-10 w-10 rounded-md bg-success/10 flex items-center justify-center shrink-0">
              <Database className="h-5 w-5 text-success" />
            </div>
            <div className="min-w-0">
              <CardDescription className="text-xs">Remaining</CardDescription>
              <CardTitle className="text-xl truncate">
                {isLoading ? <Skeleton className="h-6 w-24" /> : remainingGB === null ? "∞" : `${remainingGB.toFixed(2)} GB`}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            {limitGB !== null ? `${(100 - percentage).toFixed(0)}% capacity free` : "No plan limit"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="h-10 w-10 rounded-md bg-warning/10 flex items-center justify-center shrink-0">
              <Archive className="h-5 w-5 text-warning" />
            </div>
            <div className="min-w-0">
              <CardDescription className="text-xs">Total files</CardDescription>
              <CardTitle className="text-xl truncate">
                {isLoading ? <Skeleton className="h-6 w-16" /> : totalFiles.toLocaleString()}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Across PODs, waybills, KYC & compliance
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="h-10 w-10 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="min-w-0">
              <CardDescription className="text-xs">Largest category</CardDescription>
              <CardTitle className="text-xl truncate">
                {isLoading || !largestCat ? <Skeleton className="h-6 w-24" /> : fmt(largestCat.bytes)}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground truncate">
            {largestCat?.label ?? "—"}
          </CardContent>
        </Card>
      </div>

      {/* Usage progress card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Plan storage</CardTitle>
              <CardDescription>
                Your {currentPlan?.name ?? "current"} plan includes {limitGB !== null ? `${limitGB} GB` : "unlimited"} of storage.
              </CardDescription>
            </div>
            {currentPlan?.name && (
              <Badge variant="secondary" className="uppercase tracking-wide text-[10px]">
                {currentPlan.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-semibold leading-none">
                    {usedGB < 0.01 ? fmt(usedBytes) : `${usedGB.toFixed(2)} GB`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    used of {limitGB !== null ? `${limitGB} GB` : "unlimited"}
                  </div>
                </div>
                {limitGB !== null && (
                  <div className={`text-2xl font-semibold ${over ? "text-destructive" : near ? "text-warning" : "text-muted-foreground"}`}>
                    {percentage.toFixed(0)}%
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
                <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-warning shrink-0" />
                  <div className="flex-1">
                    {over
                      ? `You're over the ${limitGB} GB storage limit on ${currentPlan?.name}. New uploads may be blocked — upgrade to add capacity.`
                      : `You've used ${percentage.toFixed(0)}% of your ${limitGB} GB storage. Consider upgrading soon to avoid disruption.`}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate("/settings?tab=subscription")}>
                    Upgrade plan
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>What's taking space</CardTitle>
          <CardDescription>Storage broken down by file category</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Files</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="w-[35%]">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(breakdown?.rows ?? []).map((r) => {
                  const Icon = r.icon;
                  const share = usedBytes > 0 ? (r.bytes / usedBytes) * 100 : 0;
                  return (
                    <TableRow key={r.key}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{r.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.count.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.bytes)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={share} className="h-2" />
                          <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                            {share.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ways to free up space</CardTitle>
          <CardDescription>Reduce storage before upgrading your plan</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border p-3 text-sm">
            <div className="font-medium mb-1">Archive completed jobs</div>
            <p className="text-xs text-muted-foreground">Older POD photos can be archived from the Jobs page once jobs are settled.</p>
          </div>
          <div className="rounded-md border p-3 text-sm">
            <div className="font-medium mb-1">Re-scan waybills at lower DPI</div>
            <p className="text-xs text-muted-foreground">Capture waybills via the mobile app — server-side compression keeps quality high.</p>
          </div>
          <div className="rounded-md border p-3 text-sm">
            <div className="font-medium mb-1">Remove expired compliance docs</div>
            <p className="text-xs text-muted-foreground">Outdated insurance, FRSC and roadworthiness scans can be safely deleted after renewal.</p>
          </div>
          <div className="rounded-md border p-3 text-sm">
            <div className="font-medium mb-1">Upgrade your plan</div>
            <p className="text-xs text-muted-foreground">Higher tiers include significantly more storage and longer retention windows.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


