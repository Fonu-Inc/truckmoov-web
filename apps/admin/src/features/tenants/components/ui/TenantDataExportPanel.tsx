import type { SystemTenantExport, SystemTenantExportScope } from "@truckmoov/api/auth";
import {
  downloadSystemTenantExport,
  getSystemTenantExportsQueryOptions,
  SYSTEM_TENANT_EXPORT_SCOPES,
  useRequestSystemTenantExport,
} from "@truckmoov/api/auth";
import { formatDayMonthTime } from "@truckmoov/app-core/utils/time-utils";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Loader2, Package } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { ListSkeleton } from "@/components/ui/skeletons";

const SCOPE_LABELS: Record<SystemTenantExportScope, string> = {
  vehicles: "Vehicles",
  drivers: "Drivers",
  devices: "Devices",
  sims: "SIMs",
  users: "Users",
  invoices: "Invoices",
  all: "Everything (one zip)",
};

const KB = 1024;

function fileSize(bytes: number | null) {
  if (bytes === null)
    return "";
  return bytes < KB * KB ? `${Math.max(1, Math.round(bytes / KB))} KB` : `${(bytes / KB / KB).toFixed(1)} MB`;
}

function countsText(counts: Record<string, number>) {
  return Object.entries(counts).map(([scope, rows]) => `${rows} ${scope}`).join(", ");
}

function statusBadge(job: SystemTenantExport) {
  if (job.status === "failed")
    return <Badge variant="destructive">Failed</Badge>;
  if (job.status === "pending")
    return <Badge variant="secondary">Building</Badge>;
  if (job.expired)
    return <Badge variant="outline">Expired</Badge>;
  return <Badge className="bg-success/10 text-success border-success/30">Ready</Badge>;
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function failureMessage(error: unknown, fallback: string) {
  return (error as { message?: string })?.message ?? fallback;
}

function ExportRow({ tenantId, job }: { tenantId: string; job: SystemTenantExport }) {
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      const blob = await downloadSystemTenantExport({ id: tenantId, exportId: job.id });
      saveBlob(blob, job.fileName ?? `export-${job.scope}`);
    }
    catch (error) {
      toast.error(failureMessage(error, "The file could not be downloaded"));
    }
    finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="p-3 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium">{SCOPE_LABELS[job.scope]}</p>
          {job.status === "ready" && (
            <p className="text-xs text-muted-foreground">
              {[countsText(job.rowCounts), fileSize(job.fileBytes)].filter(Boolean).join(" · ")}
            </p>
          )}
          {job.error && <p className="text-xs text-destructive">{job.error}</p>}
          <p className="text-[11px] text-muted-foreground">
            {`Requested ${formatDayMonthTime(job.createdAt)}${job.requestedByName ? ` by ${job.requestedByName}` : ""}`}
            {` · Available until ${formatDayMonthTime(job.expiresAt)}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {statusBadge(job)}
        {job.downloadable && (
          <Button
            size="sm"
            variant="outline"
            onClick={download}
            disabled={downloading}
            className="gap-2"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download
          </Button>
        )}
      </div>
    </Card>
  );
}

export function TenantDataExportPanel({ tenantId }: { tenantId: string }) {
  const [scope, setScope] = useState<SystemTenantExportScope>("all");
  const request = useRequestSystemTenantExport();
  const exportsQuery = useQuery({ ...getSystemTenantExportsQueryOptions(tenantId), enabled: !!tenantId });
  const jobs = exportsQuery.data?.data?.items ?? [];

  const requestExport = async () => {
    try {
      const result = await request.mutateAsync({ id: tenantId, data: { scope } });
      if (result.data.status === "ready")
        toast.success("Export ready to download");
      else
        toast.error(result.data.error ?? "The export could not be built");
    }
    catch (error) {
      toast.error(failureMessage(error, "The export could not be requested"));
    }
  };

  return (
    <div className="space-y-4 pr-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">Export this tenant's data</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Builds CSV files from the tenant's records. The files are kept for 7 days and can only be downloaded
          here, by a signed-in system admin.
        </p>
        <div className="flex gap-2">
          <Select
            value={scope}
            onValueChange={value => setScope(value as SystemTenantExportScope)}
          >
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYSTEM_TENANT_EXPORT_SCOPES.map(option => (
                <SelectItem
                  key={option}
                  value={option}
                >
                  {SCOPE_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={requestExport}
            disabled={request.isPending}
            className="gap-2"
          >
            {request.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Request export
          </Button>
        </div>
      </Card>

      <h4 className="font-medium text-sm text-muted-foreground">
        {`Exports (${jobs.length})`}
      </h4>
      {exportsQuery.isLoading
        ? <ListSkeleton rows={3} />
        : jobs.length === 0
          ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                No exports requested for this tenant yet.
              </Card>
            )
          : (
              <div className="space-y-2">
                {jobs.map(job => (
                  <ExportRow
                    key={job.id}
                    tenantId={tenantId}
                    job={job}
                  />
                ))}
              </div>
            )}
    </div>
  );
}
