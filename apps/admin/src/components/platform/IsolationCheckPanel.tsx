import type { ColumnDef } from "@tanstack/react-table";
import { formatDateInTimezone } from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  History,
  Loader2,
  Play,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  XCircle,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { Label } from "@/components/shadcn/label";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,

} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { usePreferences } from "@/contexts/PreferencesContext";

type Tenant = {
  id: string;
  name: string;
};

const MOCK_TENANTS: Tenant[] = [
  {
    id: "tenant-1",
    name: "ABC Logistics",
  },
  {
    id: "tenant-2",
    name: "XYZ Transport",
  },
  {
    id: "tenant-3",
    name: "Quick Movers",
  },
  {
    id: "tenant-4",
    name: "Metro Couriers",
  },
  {
    id: "tenant-5",
    name: "Swift Delivery",
  },
];

const TEST_ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/vehicles",
    resource: "Vehicle list",
  },
  {
    method: "GET",
    path: "/api/v1/drivers",
    resource: "Driver list",
  },
  {
    method: "GET",
    path: "/api/v1/sims",
    resource: "SIM inventory",
  },
  {
    method: "GET",
    path: "/api/v1/jobs",
    resource: "Job records",
  },
  {
    method: "GET",
    path: "/api/v1/invoices",
    resource: "Invoices",
  },
  {
    method: "GET",
    path: "/api/v1/geofences",
    resource: "Geofences",
  },
  {
    method: "GET",
    path: "/api/v1/telemetry",
    resource: "Telemetry stream",
  },
  {
    method: "POST",
    path: "/api/v1/jobs/dispatch",
    resource: "Dispatch job",
  },
  {
    method: "PATCH",
    path: "/api/v1/vehicles/:id",
    resource: "Update vehicle",
  },
  {
    method: "DELETE",
    path: "/api/v1/sims/:id",
    resource: "Delete SIM",
  },
];

type TestResult = {
  endpoint: string;
  method: string;
  resource: string;
  status: number;
  outcome: "pass" | "fail";
  durationMs: number;
};

type IsolationReport = {
  id: string;
  tenantA: Tenant;
  tenantB: Tenant;
  startedAt: string;
  completedAt: string;
  trigger: "manual" | "onboarding" | "support_ticket";
  results: TestResult[];
  passed: number;
  failed: number;
  overall: "pass" | "fail";
};

const PAST_REPORTS: IsolationReport[] = [
  {
    id: "ICR-2024-1208-01",
    tenantA: MOCK_TENANTS[0],
    tenantB: MOCK_TENANTS[1],
    startedAt: "2024-12-08T09:14:00Z",
    completedAt: "2024-12-08T09:14:08Z",
    trigger: "onboarding",
    results: [],
    passed: 10,
    failed: 0,
    overall: "pass",

  },
  {
    id: "ICR-2024-1205-02",
    tenantA: MOCK_TENANTS[2],
    tenantB: MOCK_TENANTS[3],
    startedAt: "2024-12-05T16:42:00Z",
    completedAt: "2024-12-05T16:42:09Z",
    trigger: "support_ticket",
    results: [],
    passed: 10,
    failed: 0,
    overall: "pass",

  },
  {
    id: "ICR-2024-1130-03",
    tenantA: MOCK_TENANTS[1],
    tenantB: MOCK_TENANTS[4],
    startedAt: "2024-11-30T11:02:00Z",
    completedAt: "2024-11-30T11:02:11Z",
    trigger: "manual",
    results: [],
    passed: 10,
    failed: 0,
    overall: "pass",

  },
];

export function IsolationCheckPanel() {
  const { timezone } = usePreferences();
  const [
    tenantAId,
    setTenantAId,
  ] = useState<string>("");
  const [
    tenantBId,
    setTenantBId,
  ] = useState<string>("");
  const [
    trigger,
    setTrigger,
  ] = useState<"manual" | "onboarding" | "support_ticket">("manual");
  const [
    running,
    setRunning,
  ] = useState(false);
  const [
    progress,
    setProgress,
  ] = useState<TestResult[]>([]);
  const [
    report,
    setReport,
  ] = useState<IsolationReport | null>(null);
  const [
    history,
    setHistory,
  ] = useState<IsolationReport[]>(PAST_REPORTS);

  const tenantA = useMemo(
    () => MOCK_TENANTS.find(t => t.id === tenantAId),
    [tenantAId],
  );
  const tenantB = useMemo(
    () => MOCK_TENANTS.find(t => t.id === tenantBId),
    [tenantBId],
  );

  const canRun = tenantA && tenantB && tenantA.id !== tenantB.id && !running;

  const runCheck = async () => {
    if (!tenantA || !tenantB)
      return;
    if (tenantA.id === tenantB.id) {
      toast.error("Choose two different tenants");
      return;
    }

    setRunning(true);
    setProgress([]);
    setReport(null);

    const startedAt = new Date().toISOString();
    const results: TestResult[] = [];

    for (const ep of TEST_ENDPOINTS) {
      await new Promise(r => setTimeout(
        r,
        280,
      ));
      // Simulated cross-tenant attempt — every well-isolated endpoint must return 403
      const status = 403;
      const outcome: "pass" | "fail" = status === 403 ? "pass" : "fail";
      const result: TestResult = {
        endpoint: ep.path,
        method: ep.method,
        resource: ep.resource,
        status,
        outcome,
        durationMs: 180 + Math.floor(Math.random() * 120),

      };
      results.push(result);
      setProgress([...results]);
    }

    const completedAt = new Date().toISOString();
    const passed = results.filter(r => r.outcome === "pass").length;
    const failed = results.length - passed;

    const newReport: IsolationReport = {
      id: `ICR-${Date.now()}`,
      tenantA,
      tenantB,
      startedAt,
      completedAt,
      trigger,
      results,
      passed,
      failed,
      overall: failed === 0 ? "pass" : "fail",

    };

    setReport(newReport);
    setHistory(h => [
      newReport,
      ...h,
    ]);
    setRunning(false);

    toast.success(
      newReport.overall === "pass"
        ? `Isolation verified: ${passed}/${results.length} endpoints blocked`
        : `Leakage detected: ${failed} endpoint(s) failed`,
    );
  };

  const progressColumns: ColumnDef<TestResult>[] = useMemo(
    () => [
      {
        id: "method",
        header: "Method",
        meta: { className: "w-20" },
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="font-mono text-xs"
          >
            {row.original.method}
          </Badge>
        ),
      },
      {
        id: "endpoint",
        header: "Endpoint",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.endpoint}</span>,
      },
      {
        id: "resource",
        header: "Resource",
        cell: ({ row }) => <span className="text-sm">{row.original.resource}</span>,
      },
      {
        id: "status",
        header: "Status",
        meta: { className: "w-24" },
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === 403 ? "secondary" : "destructive"}
            className="font-mono"
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "result",
        header: "Result",
        meta: { className: "w-24" },
        cell: ({ row }) => row.original.outcome === "pass"
          ? (
              <span className="inline-flex items-center gap-1 text-success text-sm">
                <CheckCircle2 className="h-4 w-4" />
                {" "}
                Blocked
              </span>
            )
          : (
              <span className="inline-flex items-center gap-1 text-destructive text-sm">
                <XCircle className="h-4 w-4" />
                {" "}
                Leak
              </span>
            ),
      },
    ],
    [],
  );

  const exportReport = (r: IsolationReport) => {
    const lines: string[] = [];
    lines.push(`Tenant Isolation Report ${r.id}`);
    lines.push(`Tenant A (caller): ${r.tenantA.name} (${r.tenantA.id})`);
    lines.push(`Tenant B (target): ${r.tenantB.name} (${r.tenantB.id})`);
    lines.push(`Trigger: ${r.trigger}`);
    lines.push(`Started: ${r.startedAt}`);
    lines.push(`Completed: ${r.completedAt}`);
    lines.push(`Overall: ${r.overall.toUpperCase()} (${r.passed}/${r.results.length} blocked)`);
    lines.push("");
    lines.push("Method,Endpoint,Resource,Status,Outcome,Duration(ms)");
    r.results.forEach((res) => {
      lines.push(
        `${res.method},${res.endpoint},${res.resource},${res.status},${res.outcome},${res.durationMs}`,
      );
    });
    const blob = new Blob(
      [lines.join("\n")],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  const historyColumns: ColumnDef<IsolationReport>[] = useMemo(
    () => [
      {
        id: "id",
        header: "Report ID",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
      },
      {
        id: "tenants",
        header: "Tenant A → Tenant B",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.tenantA.name}
            {" "}
            →
            {row.original.tenantB.name}
          </span>
        ),
      },
      {
        id: "trigger",
        header: "Trigger",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="capitalize"
          >
            {row.original.trigger.replace(
              "_",
              " ",
            )}
          </Badge>
        ),
      },
      {
        id: "runAt",
        header: "Run At",
        cell: ({ row }) => (
          <span className="text-sm">
            {formatDateInTimezone(
              row.original.completedAt,
              timezone,
              {
                dateStyle: "medium",
                timeStyle: "short",
              },
            )}
          </span>
        ),
      },
      {
        id: "result",
        header: "Result",
        cell: ({ row }) => {
          const r = row.original;
          return r.overall === "pass"
            ? (
                <Badge className="bg-success/10 text-success hover:bg-success/15 border-success/20">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  {" "}
                  Pass (
                  {r.passed}
                  /
                  {r.results.length || 10}
                  )
                </Badge>
              )
            : (
                <Badge variant="destructive">
                  <ShieldAlert className="mr-1 h-3 w-3" />
                  {" "}
                  Fail (
                  {r.failed}
                  {" "}
                  leak
                  {r.failed === 1 ? "" : "s"}
                  )
                </Badge>
              );
        },
      },
      {
        id: "action",
        header: "Action",
        enableSorting: false,
        meta: { className: "text-right" },
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exportReport(row.original)}
              disabled={row.original.results.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [timezone],
  );

  return (
    <div className="space-y-6">
      {/* Intro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Tenant Isolation Verification
          </CardTitle>
          <CardDescription>
            Run automated cross-tenant access attempts to confirm no data leakage between two
            tenants. Every endpoint should return 403 Forbidden. Results are written to the platform
            audit log for compliance evidence.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Run check */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Isolation Check</CardTitle>
          <CardDescription>
            Tenant A's credentials will be used to attempt access to Tenant B's resources.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_1fr_auto]">
            <div className="space-y-2">
              <Label required>Tenant A (caller)</Label>
              <Select
                value={tenantAId}
                onValueChange={setTenantAId}
                disabled={running}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant A" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_TENANTS.map(t => (
                    <SelectItem
                      key={t.id}
                      value={t.id}
                      disabled={t.id === tenantBId}
                    >
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="hidden md:flex items-end pb-2">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label required>Tenant B (target)</Label>
              <Select
                value={tenantBId}
                onValueChange={setTenantBId}
                disabled={running}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant B" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_TENANTS.map(t => (
                    <SelectItem
                      key={t.id}
                      value={t.id}
                      disabled={t.id === tenantAId}
                    >
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select
                value={trigger}
                onValueChange={(v: "manual" | "onboarding" | "support_ticket") => setTrigger(v)}
                disabled={running}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="onboarding">Tenant Onboarding</SelectItem>
                  <SelectItem value="support_ticket">Security Ticket</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={runCheck}
                disabled={!canRun}
                className="w-full md:w-auto"
              >
                {running
                  ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running…
                      </>
                    )
                  : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Run Check
                      </>
                    )}
              </Button>
            </div>
          </div>

          {(running || progress.length > 0) && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Progress</Label>
                  <span className="text-sm text-muted-foreground">
                    {progress.length}
                    {" "}
                    /
                    {TEST_ENDPOINTS.length}
                    {" "}
                    endpoints tested
                  </span>
                </div>
                <ScrollArea className="h-[260px] rounded-md border">
                  <DataTable
                    columns={progressColumns}
                    data={progress}
                  />
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Latest report */}
      {report && (
        <Card
          className={
            report.overall === "pass"
              ? "border-success/40"
              : "border-destructive/40"
          }
        >
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                {report.overall === "pass"
                  ? (
                      <ShieldCheck className="h-6 w-6 text-success" />
                    )
                  : (
                      <ShieldX className="h-6 w-6 text-destructive" />
                    )}
                <div>
                  <CardTitle className="text-base">
                    {report.overall === "pass"
                      ? "Isolation Verified"
                      : "Cross-Tenant Leakage Detected"}
                  </CardTitle>
                  <CardDescription>
                    Report
                    {" "}
                    {report.id}
                    {" "}
                    ·
                    {" "}
                    {formatDateInTimezone(
                      report.completedAt,
                      timezone,
                      {
                        dateStyle: "medium",
                        timeStyle: "short",

                      },
                    )}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport(report)}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-3">
              <Stat
                label="Caller (Tenant A)"
                value={report.tenantA.name}
              />
              <Stat
                label="Target (Tenant B)"
                value={report.tenantB.name}
              />
              <Stat
                label="Endpoints Blocked"
                value={`${report.passed} / ${report.results.length}`}
              />
              <Stat
                label="Overall"
                value={report.overall === "pass" ? "PASS" : "FAIL"}
                tone={report.overall === "pass" ? "success" : "destructive"}
              />
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Stored in audit log under
              {" "}
              <code className="font-mono">tenant_isolation_check</code>
              {" "}
              with trigger
              <Badge
                variant="outline"
                className="ml-1"
              >
                {report.trigger}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5" />
            Recent Isolation Reports
          </CardTitle>
          <CardDescription>
            Auto-recorded for every onboarding and security-related support ticket.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={historyColumns}
            data={history}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,

}: {
  label: string;
  value: string;
  tone?: "success" | "destructive";
}) {
  const valueClass
    = tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold break-words ${valueClass}`}>{value}</div>
    </div>
  );
}
