import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {Download, Package,
  Copy,
  RefreshCw,
  CheckCircle,
  Clock,
  Mail,
  FileText,
  ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, formatDistanceToNowStrict } from "date-fns";
import type { TenantData } from "@/hooks/useTenants";

interface Props {
  tenant: TenantData;
}

type ExportStatus =
  | "not_required"
  | "queued"
  | "processing"
  | "ready"
  | "expired"
  | "failed";

interface ExportArtifact {
  name: string;
  format: "CSV" | "PDF";
  records: number;
}

const ARTIFACTS: ExportArtifact[] = [
  { name: "vehicles.csv", format: "CSV", records: 47 },
  { name: "trips_last_30_days.csv", format: "CSV", records: 1284 },
  { name: "drivers.csv", format: "CSV", records: 52 },
  { name: "geofences.csv", format: "CSV", records: 18 },
  { name: "maintenance_records.csv", format: "CSV", records: 213 },
  { name: "fuel_records.csv", format: "CSV", records: 891 },
  { name: "invoices.csv", format: "CSV", records: 64 },
  { name: "invoices_bundle.pdf", format: "PDF", records: 64 },
  { name: "termination_summary.pdf", format: "PDF", records: 1 },
];

export function DataExportPanel({ tenant }: Props) {
  // Derive status from tenant lifecycle. In production this comes from a
  // tenant_data_exports table populated by the tenant-termination edge function.
  const status: ExportStatus = useMemo<ExportStatus>(() => {
    if (tenant.status === "terminated") return "ready";
    if (tenant.status === "suspended") return "queued";
    // Demo: surface a sample export bundle so platform admins can preview
    // the artifact list, link controls, and metadata even for active tenants.
    return "ready";
  }, [tenant.status]);

  const [progress] = useState(status === "processing" ? 42 : status === "ready" ? 100 : 0);

  const terminatedAt = useMemo(() => {
    // Fallback to "now" for demo. Real value comes from termination event.
    return new Date(Date.now() - 1000 * 60 * 60 * 6);
  }, []);
  const expiresAt = addDays(terminatedAt, 30);
  const downloadUrl = `https://exports.fleetpro.ng/t/${tenant.id}/${terminatedAt.getTime().toString(36)}`;

  const totalRecords = ARTIFACTS.reduce((s, a) => s + a.records, 0);

  const copyLink = () => {
    navigator.clipboard.writeText(downloadUrl);
    toast.success("Receipt link copied");
  };

  const resendEmail = () => {
    toast.success("Resent download link", {
      description: `Sent to ${tenant.email || "primary contact"}` });
  };

  const requeue = () => {
    toast.success("Export job re-queued", {
      description: "A fresh ZIP will be generated within 24 hours." });
  };

  return (
    <div className="space-y-4 pr-4">
      {/* Status header */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">NDPR Data Export</h4>
              <p className="text-xs text-muted-foreground">
                Auto-generated on tenant termination. Includes vehicles, 30 days
                of trips, drivers, geofences, maintenance, fuel, and invoices.
              </p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </Card>

      {status === "not_required" && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-success" />
          No export required while the tenant is active.
          <p className="text-xs mt-1">
            An export job will be queued automatically the moment this tenant is
            terminated.
          </p>
        </Card>
      )}

      {(status === "queued" || status === "processing") && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {status === "queued" ? "Queued for processing" : "Generating archive…"}
            </span>
            <span className="text-xs text-muted-foreground">
              ETA: within 24 hours of termination
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            A secure download link will be emailed to{" "}
            <span className="font-medium">{tenant.email || "the tenant's primary contact"}</span>{" "}
            once ready.
          </p>
        </Card>
      )}

      {status === "ready" && (
        <>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">
                  tenant-export-{tenant.id.slice(0, 8)}.zip
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {totalRecords.toLocaleString()} records · ~ 14.2 MB
              </span>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground">Generated</div>
                <div className="font-medium">
                  {format(terminatedAt, "MMM d, yyyy HH:mm")}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Link expires</div>
                <div className="font-medium">
                  {format(expiresAt, "MMM d, yyyy")} ·{" "}
                  <span className="text-warning">
                    in {formatDistanceToNowStrict(expiresAt)}
                  </span>
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Sent to</div>
                <div className="font-medium flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {tenant.email || "primary@tenant.example"}
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download ZIP
                </a>
              </Button>
              <Button size="sm" variant="outline" onClick={copyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button size="sm" variant="outline" onClick={resendEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Resend Email
              </Button>
              <Button size="sm" variant="ghost" onClick={requeue}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-queue
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Archive contents
            </h5>
            <div className="space-y-1.5">
              {ARTIFACTS.map((a) => (
                <div
                  key={a.name}
                  className="flex items-center justify-between text-xs py-1.5 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {a.format}
                    </Badge>
                    <span className="font-mono">{a.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {a.records.toLocaleString()} {a.records === 1 ? "record" : "records"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {status === "expired" && (
        <Card className="p-4 space-y-3 border-warning/40">
          <div className="flex items-center gap-2 text-warning">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Link expired</span>
          </div>
          <p className="text-xs text-muted-foreground">
            The 30-day download window has closed. Re-queue to regenerate the
            archive (subject to NDPR retention policy).
          </p>
          <Button size="sm" variant="outline" onClick={requeue}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-queue Export
          </Button>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ExportStatus }) {
  switch (status) {
    case "ready":
      return (
        <Badge className="bg-success/15 text-success border-success/30">
          <CheckCircle className="h-3 w-3 mr-1" /> Ready
        </Badge>
      );
    case "processing":
      return (
        <Badge className="bg-primary/15 text-primary border-primary/30">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Processing
        </Badge>
      );
    case "queued":
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" /> Queued
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-warning/15 text-warning border-warning/30">
          <Clock className="h-3 w-3 mr-1" /> Expired
        </Badge>
      );
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">Not required</Badge>;
  }
}
