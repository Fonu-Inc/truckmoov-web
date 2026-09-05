import {
  formatDayMonthTime,
  formatRelativeStrict,
  formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  History,
  Inbox,
  KeyRound,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/shadcn/alert";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";

type RequestStatus
  = | "pending"
    | "allocating"
    | "verifying"
    | "active"
    | "failed";

type NumberRequest = {
  id: string;
  tenantId: string;
  tenantName: string;
  displayName: string;
  category: string;
  description: string;
  submittedAt: string;
  contactEmail: string;
  status: RequestStatus;
  msisdn?: string;
  wabaId?: string;
  verifiedAt?: string;
  failureReason?: string;
  actor?: string;
};

type PoolNumber = {
  msisdn: string;
  state: "available" | "in_use" | "cooldown";
  cooldownUntil?: string;
};

const INITIAL_REQUESTS: NumberRequest[] = [
  {
    id: "WAR-001",
    tenantId: "tenant-1",
    tenantName: "ABC Logistics",
    displayName: "ABC Dispatch",
    category: "Logistics & Transportation",
    description: "Driver dispatch and route notifications.",
    submittedAt: "2026-04-25T09:14:00Z",
    contactEmail: "ops@abclogistics.ng",
    status: "pending",
  },
  {
    id: "WAR-002",
    tenantId: "tenant-3",
    tenantName: "Quick Movers",
    displayName: "Quick Movers Ops",
    category: "Logistics & Transportation",
    description: "Driver onboarding messages and shift assignments.",
    submittedAt: "2026-04-24T16:02:00Z",
    contactEmail: "fleet@quickmovers.ng",
    status: "pending",
  },
  {
    id: "WAR-003",
    tenantId: "tenant-5",
    tenantName: "Swift Delivery",
    displayName: "Swift Delivery HQ",
    category: "Logistics & Transportation",
    description: "Real-time pickup and proof-of-delivery flow.",
    submittedAt: "2026-04-23T11:38:00Z",
    contactEmail: "support@swiftdelivery.ng",
    status: "pending",
  },
];

const HISTORY_REQUESTS: NumberRequest[] = [
  {
    id: "WAR-997",
    tenantId: "tenant-2",
    tenantName: "XYZ Transport",
    displayName: "XYZ Dispatch",
    category: "Logistics & Transportation",
    description: "Long-haul driver coordination",
    submittedAt: "2026-04-12T10:00:00Z",
    contactEmail: "ops@xyztransport.ng",
    status: "active",
    msisdn: "+2348091000234",
    wabaId: "waba_8f2c1b7a",
    verifiedAt: "2026-04-12T10:18:00Z",
    actor: "platform@truckmoov.com",
  },
  {
    id: "WAR-998",
    tenantId: "tenant-4",
    tenantName: "Metro Couriers",
    displayName: "Metro Couriers",
    category: "Logistics & Transportation",
    description: "Last-mile dispatch",
    submittedAt: "2026-04-08T14:22:00Z",
    contactEmail: "metro@metrocouriers.ng",
    status: "active",
    msisdn: "+2348091000128",
    wabaId: "waba_3a91dbe2",
    verifiedAt: "2026-04-08T14:46:00Z",
    actor: "platform@truckmoov.com",
  },
];

const POOL: PoolNumber[] = [
  {
    msisdn: "+2348091000567",
    state: "available",
  },
  {
    msisdn: "+2348091000568",
    state: "available",
  },
  {
    msisdn: "+2348091000569",
    state: "available",
  },
  {
    msisdn: "+2348091000570",
    state: "available",
  },
  {
    msisdn: "+2348091000571",
    state: "available",
  },
  {
    msisdn: "+2348091000128",
    state: "in_use",
  },
  {
    msisdn: "+2348091000234",
    state: "in_use",
  },
  {
    msisdn: "+2348091000412",
    state: "cooldown",
    cooldownUntil: "2026-05-19T00:00:00Z",
  },
  {
    msisdn: "+2348091000418",
    state: "cooldown",
    cooldownUntil: "2026-05-12T00:00:00Z",
  },
];

export default function PlatformCommunications() {
  const [
    tab,
    setTab,
  ] = useState("pending");
  const [
    requests,
    setRequests,
  ] = useState<NumberRequest[]>(INITIAL_REQUESTS);
  const [
    history,
    setHistory,
  ] = useState<NumberRequest[]>(HISTORY_REQUESTS);
  const [
    provisionFor,
    setProvisionFor,
  ] = useState<NumberRequest | null>(null);

  const pendingCount = requests.filter(r => r.status === "pending").length;

  const handleProvisioned = (req: NumberRequest) => {
    setRequests(rs => rs.filter(r => r.id !== req.id));
    setHistory(h => [
      req,
      ...h,
    ]);
    setProvisionFor(null);
    setTab("history");
  };

  return (
    <>
      <div className="space-y-6">
        {/* KPI strip */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
          <Kpi
            icon={Inbox}
            label="Pending Requests"
            value={String(pendingCount)}
            tone="warning"
          />
          <Kpi
            icon={Phone}
            label="Active WhatsApp Numbers"
            value={String(history.filter(h => h.status === "active").length)}
            tone="success"
          />
          <Kpi
            icon={Sparkles}
            label="MSISDN Pool — Available"
            value={String(POOL.filter(p => p.state === "available").length)}
          />
          <Kpi
            icon={History}
            label="In Cooldown (30d)"
            value={String(POOL.filter(p => p.state === "cooldown").length)}
            tone="muted"
          />
        </div>

        <Tabs
          value={tab}
          onValueChange={setTab}
        >
          <TabsList>
            <TabsTrigger
              value="pending"
              className="gap-2"
            >
              <Inbox className="h-4 w-4" />
              Pending Requests
              {pendingCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1"
                >
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="pool"
              className="gap-2"
            >
              <Phone className="h-4 w-4" />
              {" "}
              Number Pool
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="gap-2"
            >
              <History className="h-4 w-4" />
              {" "}
              Provisioning History
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="pending"
            className="mt-4"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>WhatsApp Business Number Requests</CardTitle>
                    <CardDescription>
                      Allocate a number from the Telconix MTN MVNO pool and register
                      the WABA on Meta Business Manager.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {requests.length === 0
                  ? (
                      <div className="text-center py-12 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
                        No pending requests.
                      </div>
                    )
                  : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Display Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {requests.map(r => (
                            <TableRow key={r.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium text-sm">{r.tenantName}</div>
                                    <div className="text-xs text-muted-foreground font-mono">
                                      {r.id}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{r.displayName}</TableCell>
                              <TableCell className="text-sm">{r.category}</TableCell>
                              <TableCell className="text-sm max-w-xs truncate">
                                {r.description}
                              </TableCell>
                              <TableCell className="text-sm">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {formatDayMonthTime(r.submittedAt)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  onClick={() => setProvisionFor(r)}
                                >
                                  Provision
                                  {" "}
                                  <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="pool"
            className="mt-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>Telconix MTN MVNO Number Pool</CardTitle>
                <CardDescription>
                  Available, in-use, and cooldown MSISDNs. Numbers in cooldown cannot
                  be reissued for 30 days after release.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>MSISDN</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {POOL.map(p => (
                      <TableRow key={p.msisdn}>
                        <TableCell className="font-mono text-sm">{p.msisdn}</TableCell>
                        <TableCell>
                          <PoolBadge state={p.state} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.state === "cooldown" && p.cooldownUntil
                            ? `Available in ${formatRelativeStrict(p.cooldownUntil)}`
                            : p.state === "in_use"
                              ? "Assigned to a tenant WABA"
                              : "Ready to allocate"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="history"
            className="mt-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>Provisioning History</CardTitle>
                <CardDescription>
                  All completed and failed WhatsApp number provisioning events.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>MSISDN</TableHead>
                      <TableHead>WABA ID</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">
                          <div className="font-medium">{r.tenantName}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {r.id}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {r.msisdn ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {r.wabaId ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.verifiedAt
                            ? formatDayMonthTime(r.verifiedAt)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs">{r.actor ?? "—"}</TableCell>
                        <TableCell>
                          {r.status === "active"
                            ? (
                                <Badge className="bg-success/15 text-success border-success/30">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {" "}
                                  Active
                                </Badge>
                              )
                            : (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {" "}
                                  Failed
                                </Badge>
                              )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {provisionFor && (
        <ProvisionDialog
          request={provisionFor}
          onClose={() => setProvisionFor(null)}
          onComplete={handleProvisioned}
        />
      )}
    </>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Inbox;
  label: string;
  value: string;
  tone?: "warning" | "success" | "muted";
}) {
  const iconBg
    = tone === "warning"
      ? "bg-warning/15 text-warning"
      : tone === "success"
        ? "bg-success/15 text-success"
        : tone === "muted"
          ? "bg-muted text-muted-foreground"
          : "bg-primary/15 text-primary";
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground break-words">{label}</div>
          <div className="text-xl font-semibold break-words">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function PoolBadge({ state }: { state: PoolNumber["state"] }) {
  if (state === "available") {
    return (
      <Badge className="bg-success/15 text-success border-success/30">Available</Badge>
    );
  }
  if (state === "in_use")
    return <Badge variant="secondary">In Use</Badge>;
  return (
    <Badge className="bg-warning/15 text-warning border-warning/30">Cooldown</Badge>
  );
}

type Step
  = | "select"
    | "allocating"
    | "creating_waba"
    | "otp_sent"
    | "verifying"
    | "active"
    | "failed";

function ProvisionDialog({
  request,
  onClose,
  onComplete,
}: {
  request: NumberRequest;
  onClose: () => void;
  onComplete: (r: NumberRequest) => void;
}) {
  const available = useMemo(
    () => POOL.filter(p => p.state === "available"),
    [],
  );
  const [
    msisdn,
    setMsisdn,
  ] = useState<string>(available[0]?.msisdn ?? "");
  const [
    step,
    setStep,
  ] = useState<Step>("select");
  const [
    otp,
    setOtp,
  ] = useState("");
  const [
    generatedOtp,
    setGeneratedOtp,
  ] = useState("");
  const [wabaId] = useState(() => `waba_${Math.random().toString(16).slice(
    2,
    10,
  )}`);
  const [
    failure,
    setFailure,
  ] = useState<string | null>(null);

  const start = async () => {
    if (!msisdn) {
      toast.error("Select an MSISDN");
      return;
    }
    setFailure(null);
    setStep("allocating");
    await wait(800);
    setStep("creating_waba");
    await wait(1100);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setStep("otp_sent");
    toast.info(
      "OTP sent to allocated MSISDN",
      { description: `Forwarded to Meta WABA verification flow` },
    );
  };

  const verify = async () => {
    setStep("verifying");
    await wait(900);
    if (otp.trim() !== generatedOtp) {
      setFailure(
        "Meta verification failed: OTP mismatch. The code entered does not match the OTP sent to the allocated MSISDN.",
      );
      setStep("failed");
      return;
    }
    setStep("active");
    const completed: NumberRequest = {
      ...request,
      status: "active",
      msisdn,
      wabaId,
      verifiedAt: new Date().toISOString(),
      actor: "platform@truckmoov.com",
    };
    toast.success(
      `${request.tenantName} provisioned`,
      { description: `${msisdn} verified on Meta WABA. Tenant notified by email.` },
    );
    await wait(700);
    onComplete(completed);
  };

  const retry = () => {
    setOtp("");
    setFailure(null);
    setStep("otp_sent");
  };

  const escalate = () => {
    toast.success(
      "Escalated to Meta Support",
      { description: "Failure logged with WABA ID and audit trail entry created." },
    );
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Provision WhatsApp Number —
            {" "}
            {request.tenantName}
          </DialogTitle>
          <DialogDescription>
            Allocate a Telconix MTN MVNO number, register on Meta Business Manager,
            and complete OTP verification.
          </DialogDescription>
        </DialogHeader>

        {/* Request summary */}
        <div className="rounded-lg border bg-muted/40 p-3 text-xs grid grid-cols-2 gap-2">
          <SummaryRow
            label="Display name"
            value={request.displayName}
          />
          <SummaryRow
            label="Category"
            value={request.category}
          />
          <SummaryRow
            label="Tenant email"
            value={request.contactEmail}
          />
          <SummaryRow
            label="Submitted"
            value={formatDayMonthTime(request.submittedAt)}
          />
          <div className="col-span-2">
            <div className="text-muted-foreground">Description</div>
            <div className="font-medium">{request.description}</div>
          </div>
        </div>

        {/* Step body */}
        {step === "select" && (
          <div className="space-y-3">
            <Label>Allocate MSISDN from MTN MVNO pool</Label>
            <Select
              value={msisdn}
              onValueChange={setMsisdn}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an available number" />
              </SelectTrigger>
              <SelectContent>
                {available.map(p => (
                  <SelectItem
                    key={p.msisdn}
                    value={p.msisdn}
                  >
                    <span className="font-mono">{p.msisdn}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Cooldown numbers are excluded automatically.
            </p>
          </div>
        )}

        {(step === "allocating" || step === "creating_waba") && (
          <ProgressStep
            label={
              step === "allocating"
                ? "Reserving MSISDN on Telconix MVNO…"
                : `Creating WABA on Meta Business Manager (${wabaId})…`
            }
          />
        )}

        {(step === "otp_sent" || step === "verifying") && (
          <div className="space-y-3">
            <Alert>
              <KeyRound className="h-4 w-4" />
              <AlertTitle>
                OTP sent to
                {msisdn}
              </AlertTitle>
              <AlertDescription className="text-xs">
                The platform sent a 6-digit OTP to the allocated MSISDN and forwarded
                it to the Meta WABA verification flow. Confirm the code below to
                complete verification.
              </AlertDescription>
            </Alert>
            <div className="rounded border border-dashed p-2 text-center font-mono text-lg tracking-widest text-muted-foreground">
              demo OTP:
              {" "}
              {generatedOtp}
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                inputMode="numeric"
                disabled={step === "verifying"}
              />
            </div>
          </div>
        )}

        {step === "active" && (
          <Alert className="border-success/40">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertTitle>Verified</AlertTitle>
            <AlertDescription className="text-xs">
              {msisdn}
              {" "}
              is now active on WABA
              <span className="font-mono">{wabaId}</span>
              .
              Tenant notified by email.
            </AlertDescription>
          </Alert>
        )}

        {step === "failed" && failure && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Provisioning failed</AlertTitle>
            <AlertDescription className="text-xs">{failure}</AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Audit footer */}
        <div className="rounded-md bg-muted/40 p-3 text-xs space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            Audit trail (will be written on success)
          </div>
          <AuditLine
            label="MSISDN"
            value={msisdn || "—"}
          />
          <AuditLine
            label="WABA ID"
            value={wabaId}
          />
          <AuditLine
            label="Meta verified at"
            value={step === "active"
              ? formatWithPattern(
                  new Date(),
                  "PPpp",
                )
              : "pending"}
          />
          <AuditLine
            label="Actor"
            value="platform@truckmoov.com"
          />
        </div>

        <DialogFooter className="gap-2">
          {step === "select" && (
            <>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={start}
                disabled={!msisdn}
              >
                Allocate & Create WABA
              </Button>
            </>
          )}
          {step === "otp_sent" && (
            <>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={verify}
                disabled={otp.length !== 6}
              >
                <Mail className="h-4 w-4 mr-1" />
                {" "}
                Verify with Meta
              </Button>
            </>
          )}
          {step === "verifying" && (
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying with Meta…
            </Button>
          )}
          {step === "failed" && (
            <>
              <Button
                variant="outline"
                onClick={escalate}
              >
                Escalate to Meta Support
              </Button>
              <Button onClick={retry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                {" "}
                Retry
              </Button>
            </>
          )}
          {step === "active" && (
            <Button onClick={onClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function AuditLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function ProgressStep({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-4 text-sm">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      {label}
    </div>
  );
}

function wait(ms: number) {
  return new Promise(r => setTimeout(
    r,
    ms,
  ));
}
