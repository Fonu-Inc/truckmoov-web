import type { ColumnDef } from "@tanstack/react-table";
import type {
  InstallerChecklistItem, InstallerJobDetail,
} from "@truckmoov/api/auth";
import type {
  ElementType, MutableRefObject, ReactNode,
} from "react";
import type { JobVerification } from "@/features/jobs/hooks/useJobVerification";
import type { JobEvidence } from "@/features/jobs/utils/evidenceUpload";
import {
  getInstallerEvidenceLink,
  useAcceptInstallerJob,
  useCompleteInstallerJob,
  useDeleteInstallerEvidence,
  useInstallerDisplayPreferences,
  useInstallerJob,
  useInstallerOptions,
  useInstallerSupportTicket,
  useSetInstallerChecklistItem,
  useStartInstallerJob,
  useUploadInstallerEvidence,
} from "@truckmoov/api/auth";
import { downloadBlob } from "@truckmoov/app-core/utils/general-utils";
import {
  formatDateInTimezone,
  formatTime12InTimezone,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  SignalHigh,
  Trash2,
  Truck,
  Upload,
  X,
} from "lucide-react";
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router";
import { toast } from "sonner";
import { QueryState } from "@/components/QueryState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Progress } from "@/components/shadcn/progress";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { RejectOfferForm } from "@/features/jobs/components/forms/RejectOfferForm";
import { ReportIssueForm } from "@/features/jobs/components/forms/ReportIssueForm";
import { DeviceVerificationCell } from "@/features/jobs/components/ui/DeviceVerificationCell";
import { InstallerJobStatusBadge } from "@/features/jobs/components/ui/InstallerJobStatusBadge";
import { JobNotesField } from "@/features/jobs/components/ui/JobNotesField";
import { useJobVerification } from "@/features/jobs/hooks/useJobVerification";
import {
  DEFAULT_EVIDENCE_CATEGORY,
  EVIDENCE_TYPES,
  evidenceCoverage,
  evidenceErrorMessage,
  evidenceFileKey,
  MAX_EVIDENCE_BYTES,
  removeErrorMessage,
} from "@/features/jobs/utils/evidenceUpload";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";

type Unit = InstallerJobDetail["units"][number];

const deviceLabel = (u: Unit) => u.device ? (u.device.name ?? `${u.device.manufacturer} ${u.device.model}`.trim()) : "-";

const deviceName = (u: Unit) => u.device?.name ?? "Unnamed device";

const VerificationContext = createContext<JobVerification | null>(null);

const DEVICE_COLUMNS: ColumnDef<Unit>[] = [
  {
    header: "Device",
    meta: { className: "font-medium" },
    cell: ({ row }) => deviceName(row.original),
  },
  {
    header: "IMEI",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.device?.imei}</span>,
  },
  {
    header: "Manufacturer",
    cell: ({ row }) => row.original.device?.manufacturer,
  },
  {
    header: "Model",
    cell: ({ row }) => row.original.device?.model,
  },
  {
    header: "Verification",
    cell: ({ row }) => <UnitVerification unit={row.original} />,
  },
  {
    header: "SIM",
    cell: ({ row }) => {
      const sim = row.original.sim;
      return sim
        ? (
            <div className="text-xs">
              <span className="font-mono">{sim.iccid}</span>
              <p className="text-muted-foreground">
                {[
                  sim.msisdn,
                  sim.carrier,
                ].filter(Boolean).join(" · ")}
              </p>
            </div>
          )
        : <span className="text-muted-foreground">No SIM linked to this device yet</span>;
    },
  },
  {
    header: "Vehicle",
    cell: ({ row }) => row.original.vehicle?.registrationNumber ?? "-",
  },
];

const SIM_COLUMNS: ColumnDef<Unit>[] = [
  {
    header: "ICCID",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.sim?.iccid}</span>,
  },
  {
    header: "IMSI",
    cell: ({ row }) => row.original.sim?.imsi ?? "-",
  },
  {
    header: "Phone number",
    cell: ({ row }) => row.original.sim?.msisdn ?? "-",
  },
  {
    header: "Carrier",
    cell: ({ row }) => row.original.sim?.carrier,
  },
  {
    header: "Device attached",
    cell: ({ row }) => deviceLabel(row.original),
  },
  {
    header: "Vehicle",
    cell: ({ row }) => row.original.vehicle?.registrationNumber ?? "-",
  },
];

// Display Preferences default (TRU-FE-21) until the installer picks another zone.
const DEFAULT_ZONE = "Africa/Lagos";
/** Statuses where an issue can no longer be raised; the server's 409 is the real gate. */
const NO_REPORT = [
  "completed",
  "cancelled",
  "issue_reported",
];

/** Why a gated item cannot be ticked yet, from data already on the job; null once the gate is open. */
function gateReason(job: InstallerJobDetail, item: InstallerChecklistItem): string | null {
  if (item.gated === "device_communicating") {
    if (!job.units.length || job.units.some(u => !u.device))
      return "Waiting for a device to be bound to every unit.";
    if (job.units.some(u => u.device?.verificationStatus !== "verified"))
      return "Verify the device in the Devices tab first (it must be verified and communicating).";
  }
  if (item.gated === "evidence") {
    const {
      covered, total, met,
    } = evidenceCoverage(
      job.units,
      job.evidence,
    );
    if (!met)
      return `Upload at least one photo for each vehicle first (${covered} of ${total} vehicles covered)`;
  }
  return null;
}

/**
 * GET /auth/installer/jobs/:jobId, laid out as appdemo's installer job page.
 * Every button is driven by `job.actions` (TRU-FE-20) — nothing here decides
 * from `status` what the installer may do.
 */
export default function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const jobQuery = useInstallerJob(jobId);
  const zone = useInstallerDisplayPreferences().data?.data.timezone ?? DEFAULT_ZONE;

  const accept = useAcceptInstallerJob();
  const start = useStartInstallerJob();
  const complete = useCompleteInstallerJob();

  const [
    issueOpen,
    setIssueOpen,
  ] = useState(false);
  const [
    rejectOpen,
    setRejectOpen,
  ] = useState(false);
  const [
    completeOpen,
    setCompleteOpen,
  ] = useState(false);
  const [
    confirmed,
    setConfirmed,
  ] = useState(false);
  const [
    finishing,
    setFinishing,
  ] = useState(false);
  const notesFlushRef = useRef<(() => Promise<boolean>) | null>(null);

  if (jobQuery.isLoading) {
    return (
      <div
        className="space-y-6"
        aria-busy="true"
        aria-label="Loading job"
      >
        <div className="flex justify-between">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-48 rounded-xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const job = jobQuery.data?.data;
  if (!job) {
    const notFound = jobQuery.error?.statusCode === 404;
    return (
      <Card className="surface-sleek rounded-2xl">
        <CardContent className="py-16 text-center">
          <p className="text-sm font-medium">{notFound ? "Installation job not found" : "Unable to load this job"}</p>
          <p className="text-xs text-muted-foreground">
            {notFound ? "This job is not assigned to you, or it no longer exists." : jobQuery.error?.message}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {!notFound && (
              <Button
                variant="outline"
                onClick={() => jobQuery.refetch()}
              >
                Try again
              </Button>
            )}
            <Button onClick={() => navigate("/jobs")}>Back to jobs</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { actions } = job;
  const run = (label: string, mutation: typeof start | typeof accept | typeof complete, done: string) =>
    mutation.mutate(
      { jobId: job.id },
      {
        onSuccess: () => toast.success(done),
        onError: error => toast.error(error.statusCode === 409 && /changed while/i.test(error.message)
          ? "This job changed. It has been reloaded."
          : error.message || `${label} failed.`),
      },
    );

  // A pending note is saved first: the completion summary reads the saved copy.
  async function submit() {
    setFinishing(true);
    const saved = await notesFlushRef.current?.() ?? true;
    setFinishing(false);
    if (saved) {
      run(
        "Complete",
        complete,
        "Installation completed.",
      );
    }
  }

  const time = formatTime12InTimezone(
    job.customer.scheduledAt,
    zone,
  );
  const waiting = job.status === "assigned" || job.status === "scheduled";

  return (
    <>
      <div className="space-y-6">
        {/* `/jobs/:jobId` shares the "Installation Jobs" title — this row is the page's own heading. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => navigate("/jobs")}
          >
            <ArrowLeft className="h-4 w-4" />
            {" "}
            Back to jobs
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <InstallerJobStatusBadge status={job.status} />
            {actions.canAccept && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setRejectOpen(true)}
                  disabled={accept.isPending}
                >
                  Reject
                </Button>
                <Button
                  loading={accept.isPending}
                  onClick={() => run(
                    "Accept",
                    accept,
                    "Job accepted. It is now scheduled.",
                  )}
                >
                  Accept
                </Button>
              </>
            )}
            {(job.status === "scheduled" || job.status === "overdue") && (
              <Button
                loading={start.isPending}
                disabled={!actions.canStart}
                onClick={() => run(
                  "Start",
                  start,
                  "Installation started.",
                )}
              >
                Start Installation
              </Button>
            )}
            {!NO_REPORT.includes(job.status) && !actions.canAccept && !waiting && (
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => setIssueOpen(true)}
              >
                <AlertTriangle className="h-4 w-4" />
                {" "}
                Report Issue
              </Button>
            )}
          </div>
        </div>

        {waiting && (
          <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
            {`Installation Job Scheduled for: ${job.customer.scheduledDate}, ${time}.`}
          </p>
        )}

        {job.status === "completed"
          ? (
              <div className="space-y-6">
                {job.feedback && (
                  <SleekCard title="Customer Feedback">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Info
                        label="Rating"
                        value={`${job.feedback.rating}/5`}
                      />
                      <Info
                        label="Comment"
                        value={job.feedback.comment ?? "-"}
                      />
                    </div>
                  </SleekCard>
                )}
                <InstallationReport
                  job={job}
                  time={time}
                />
              </div>
            )
          : (
              <div className="space-y-6">
                {job.issues[0] && <IssueCard ticketId={job.issues[0].ticketId} />}

                <SleekCard title="Customer & Site Details">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Info
                      label="Company"
                      value={job.customer.customerName}
                    />
                    <Info
                      label="Customer type"
                      value={job.customer.customerType}
                    />
                    <Info
                      label="Phone number"
                      value={job.customer.phone}
                    />
                    <Info
                      label="Email"
                      value={job.customer.email}
                    />
                    <Info
                      label="Installation address"
                      value={job.customer.address}
                    />
                    <Info
                      label="Installation date"
                      value={job.customer.scheduledDate}
                    />
                    <Info
                      label="Installation time"
                      value={time}
                    />
                  </div>
                </SleekCard>

                <SleekCard title="Installation Units">
                  <UnitsTabs job={job} />
                </SleekCard>

                {!waiting && (
                  <>
                    <ChecklistCard job={job} />
                    <EvidenceCard
                      job={job}
                      zone={zone}
                      notesFlushRef={notesFlushRef}
                    />
                    <Card className="surface-sleek rounded-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                        <p className="text-sm text-muted-foreground">
                          {actions.canComplete
                            ? "Every checklist item is done. Submit to finish the installation."
                            : "Complete every checklist item to finish the installation."}
                        </p>
                        <Button
                          disabled={!actions.canComplete}
                          onClick={() => setCompleteOpen(true)}
                        >
                          Complete Installation
                        </Button>
                      </div>
                    </Card>
                  </>
                )}
              </div>
            )}
      </div>

      <ReportIssueForm
        jobId={job.id}
        open={issueOpen}
        onOpenChange={setIssueOpen}
      />

      <RejectOfferForm
        offer={rejectOpen
          ? {
              jobId: job.id, jobNumber: job.jobNumber,
            }
          : null}
        onClose={() => setRejectOpen(false)}
        onRejected={() => navigate(
          "/jobs",
          { replace: true },
        )}
      />

      <AlertDialog
        open={completeOpen}
        onOpenChange={(o) => {
          setCompleteOpen(o);
          if (!o)
            setConfirmed(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit installation</AlertDialogTitle>
            <AlertDialogDescription>
              Review the summary before submitting. This hands the devices over to the customer's fleet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <Info
              label="Vehicles · Devices"
              value={`${job.completion.vehicles} · ${job.completion.devices}`}
            />
            <Info
              label="Checklist"
              value={job.completion.checklist}
            />
            <Info
              label="Evidence"
              value={`${job.completion.evidenceCount} file(s)`}
            />
            <Info
              label="Installer"
              value={job.completion.installer}
            />
          </div>
          <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
            <Checkbox
              checked={confirmed}
              onCheckedChange={v => setConfirmed(!!v)}
              className="mt-0.5"
            />
            <span>
              I confirm that the installation has been completed and the information provided
              is accurate.
              <span
                aria-hidden="true"
                className="ml-0.5 text-destructive"
              >
                *
              </span>
            </span>
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!confirmed || complete.isPending || finishing}
              onClick={() => void submit()}
            >
              Submit Installation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SleekCard({
  title, description, action, className, children,
}: {
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className="surface-sleek rounded-2xl">
      <CardHeader className="p-6 pb-4">
        {action
          ? (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="font-display text-xl">{title}</CardTitle>
                  {description && <CardDescription className="mt-1">{description}</CardDescription>}
                </div>
                {action}
              </div>
            )
          : (
              <>
                <CardTitle className={className ?? "font-display"}>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
              </>
            )}
      </CardHeader>
      <CardContent className="p-6 pt-0">{children}</CardContent>
    </Card>
  );
}

/** The job's newest issue, read from its support ticket (GET support/tickets/:id). */
function IssueCard({ ticketId }: { ticketId: string }) {
  const zone = useInstallerDisplayPreferences().data?.data.timezone ?? DEFAULT_ZONE;
  const ticketQuery = useInstallerSupportTicket(ticketId);
  const ticket = ticketQuery.data?.data;
  const categories = useInstallerOptions().data?.data.supportCategories ?? [];
  const area = categories.find(c => c.key === ticket?.category)?.chips?.find(c => c.key === ticket?.issueCode)?.label;

  return (
    <SleekCard
      title="Issue Reported"
      className="font-display text-destructive"
    >
      <QueryState
        query={ticketQuery}
        errorMessage="Unable to load the reported issue."
        skeleton={(
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              0,
              1,
              2,
              3,
            ].map(i => (
              <Skeleton
                key={i}
                className="h-16 rounded-xl"
              />
            ))}
          </div>
        )}
      >
        {ticket && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Info
              label="Issue type"
              value={ticket.categoryLabel}
            />
            <Info
              label="Affected area"
              value={area}
            />
            <Info
              label="Reported by"
              value={`${ticket.reporter} · Installer`}
            />
            <Info
              label="Date reported"
              value={formatDateInTimezone(
                ticket.createdAt,
                zone,
              )}
            />
            <div className="sm:col-span-2">
              <Info
                label="Issue description"
                value={ticket.description}
              />
            </div>
            <div className="sm:col-span-2">
              <Info
                label="Attached evidence"
                value={`${ticket.attachments.length} file(s)`}
              />
            </div>
          </div>
        )}
      </QueryState>
    </SleekCard>
  );
}

function UnitVerification({ unit }: { unit: Unit }) {
  const v = useContext(VerificationContext)!;
  return (
    <DeviceVerificationCell
      status={v.statusOf(unit)}
      reason={v.reasonOf(unit)}
      controls={v.active}
      beforeStart={v.beforeStart}
      busy={v.verifying || v.checking}
      onVerify={v.verify}
      onCheck={v.checkStatus}
    />
  );
}

function UnitsTabs({ job }: { job: InstallerJobDetail }) {
  const { units } = job;
  const verification = useJobVerification(job);
  const [
    openIndex,
    setOpenIndex,
  ] = useState<number | null>(null);
  const open = units.find(u => u.index === openIndex) ?? null;
  const vehicleColumns = useMemo<ColumnDef<Unit>[]>(
    () => [
      {
        header: "Registration",
        meta: { className: "font-medium" },
        cell: ({ row }) => row.original.vehicle?.registrationNumber,
      },
      {
        header: "Make / Model",
        meta: { className: "whitespace-nowrap" },
        cell: ({ row }) => `${row.original.vehicle?.make} ${row.original.vehicle?.model}`,
      },
      {
        header: "Type",
        cell: ({ row }) => row.original.vehicle?.vehicleType,
      },
      {
        header: "Device to fit",
        cell: ({ row }) => deviceLabel(row.original),
      },
      {
        id: "details",
        header: "Details",
        meta: { className: "text-right" },
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpenIndex(row.original.index)}
          >
            <Eye className="mr-1.5 h-4 w-4" />
            {" "}
            View details
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <VerificationContext.Provider value={verification}>
      {verification.active && verification.error && (
        <p
          role="alert"
          className="mb-3 text-sm text-destructive"
        >
          {verification.error}
        </p>
      )}
      <Tabs defaultValue="vehicles">
        <TabsList className="grid w-full grid-cols-3 sm:inline-grid sm:w-auto">
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="sims">SIMs</TabsTrigger>
        </TabsList>
        <TabsContent
          value="vehicles"
          className="mt-4"
        >
          <div className="overflow-x-auto rounded-xl border">
            <DataTable
              columns={vehicleColumns}
              data={units.filter(u => u.vehicle)}
              emptyState="No vehicles attached to this job."
            />
          </div>
        </TabsContent>
        <TabsContent
          value="devices"
          className="mt-4"
        >
          <div className="overflow-x-auto rounded-xl border">
            <DataTable
              columns={DEVICE_COLUMNS}
              data={units.filter(u => u.device)}
              emptyState="No devices bound yet. The platform binds them before the installation can start."
            />
          </div>
        </TabsContent>
        <TabsContent
          value="sims"
          className="mt-4"
        >
          <div className="overflow-x-auto rounded-xl border">
            <DataTable
              columns={SIM_COLUMNS}
              data={units.filter(u => u.sim)}
              emptyState="No SIMs attached to this job."
            />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!open}
        onOpenChange={o => !o && setOpenIndex(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{open?.vehicle?.registrationNumber}</DialogTitle>
            <DialogDescription>Vehicle and the device to be fitted in it.</DialogDescription>
          </DialogHeader>
          {open && (
            <div className="space-y-5">
              <section>
                <p className="text-sm font-semibold">Vehicle details</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <Tile
                    label="Registration number"
                    value={open.vehicle?.registrationNumber}
                  />
                  <Tile
                    label="Vehicle type"
                    value={open.vehicle?.vehicleType}
                  />
                  <Tile
                    label="Make"
                    value={open.vehicle?.make}
                  />
                  <Tile
                    label="Model"
                    value={open.vehicle?.model}
                  />
                  <Tile
                    label="Year"
                    value={open.vehicle?.year}
                  />
                  <Tile
                    label="Colour"
                    value={open.vehicle?.colour}
                  />
                  <Tile
                    label="Chassis number"
                    value={open.vehicle?.chassisNumber}
                  />
                  <Tile
                    label="Engine number"
                    value={open.vehicle?.engineNumber}
                  />
                  <Tile
                    label="Engine capacity"
                    value={open.vehicle?.engineCapacity}
                  />
                  <Tile
                    label="Odometer reading"
                    value={open.vehicle?.odometer != null ? `${open.vehicle.odometer.toLocaleString()} km` : null}
                  />
                </div>
              </section>
              <section>
                <p className="text-sm font-semibold">Device Attached</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <Tile
                    label="Device name"
                    value={open.device ? deviceName(open) : null}
                  />
                  <Tile
                    label="IMEI"
                    value={open.device?.imei}
                  />
                  <Tile
                    label="Manufacturer"
                    value={open.device?.manufacturer}
                  />
                  <Tile
                    label="Model"
                    value={open.device?.model}
                  />
                  <Tile
                    label="Verification"
                    value={open.device
                      ? (
                          <UnitVerification unit={open} />
                        )
                      : null}
                  />
                  <Tile
                    label="SIM ICCID"
                    value={open.sim?.iccid}
                  />
                  <Tile
                    label="SIM phone number"
                    value={open.sim?.msisdn}
                  />
                  <Tile
                    label="SIM carrier"
                    value={open.sim?.carrier}
                  />
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </VerificationContext.Provider>
  );
}

function ChecklistCard({ job }: { job: InstallerJobDetail }) {
  const tick = useSetInstallerChecklistItem();
  const {
    completed, total,
  } = job.checklist;

  return (
    <SleekCard
      title={(
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span>Installation Checklist</span>
          <Badge
            variant="secondary"
            className="rounded-full"
          >
            {`Installation Progress: ${completed}/${total} completed`}
          </Badge>
        </span>
      )}
    >
      <div className="space-y-5">
        <Progress
          value={total ? (completed / total) * 100 : 0}
          className="h-2"
        />
        {!job.actions.canTick && (
          <p className="text-xs text-muted-foreground">The checklist opens once the installation is started.</p>
        )}
        {job.checklist.groups.map(group => (
          <div
            key={group.key}
            className="space-y-2"
          >
            <p className="text-sm font-semibold">{group.label}</p>
            {group.items.map((item) => {
              const reason = item.checked ? null : gateReason(
                job,
                item,
              );
              const inFlight = tick.isPending && tick.variables?.itemKey === item.key;
              const blocked = !job.actions.canTick || !!reason;
              return (
                <label
                  key={item.key}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${blocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                >
                  <Checkbox
                    checked={item.checked}
                    disabled={blocked || inFlight}
                    aria-describedby={reason ? `gate-${item.key}` : undefined}
                    onCheckedChange={v => tick.mutate(
                      {
                        jobId: job.id,
                        itemKey: item.key,
                        data: { checked: !!v },
                      },
                      {
                        onError: error => toast.error(error.statusCode === 409 && /changed while/i.test(error.message)
                          ? "This job changed. It has been reloaded."
                          : "Could not update the checklist. Try again."),
                      },
                    )}
                  />
                  <span>
                    {item.label}
                    {reason && (
                      <span
                        id={`gate-${item.key}`}
                        className="block text-xs text-muted-foreground"
                      >
                        {reason}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </SleekCard>
  );
}

type PendingPhoto = {
  file: File;
  vehicleId: string;
  category: string;
  message?: string;
};

/**
 * Evidence is per vehicle: each vehicle has its own picker, count and list. With one category
 * (today) "Attach Photos" opens the picker straight away, with several it asks first.
 */
function EvidenceCard({
  job, zone, notesFlushRef,
}: {
  job: InstallerJobDetail;
  zone: string;
  notesFlushRef: MutableRefObject<(() => Promise<boolean>) | null>;
}) {
  const upload = useUploadInstallerEvidence();
  const remove = useDeleteInstallerEvidence();
  const {
    confirm, confirmDialog,
  } = useConfirmAction();
  const categories = useInstallerOptions().data?.data.evidenceCategories ?? [];
  const defaultCategory = categories[0]?.key ?? DEFAULT_EVIDENCE_CATEGORY;
  const fileRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef("");
  const vehicleRef = useRef("");
  const sendingRef = useRef(false);
  const canUpload = job.actions.canUploadEvidence;

  const [
    failed,
    setFailed,
  ] = useState<PendingPhoto[]>([]);
  const [
    sendingVehicle,
    setSendingVehicle,
  ] = useState<string | null>(null);
  const sending = sendingVehicle !== null;

  // One request per photo, in turn, so each photo gets its own result.
  async function send(items: PendingPhoto[]) {
    if (sendingRef.current)
      return;
    const keyOf = (item: PendingPhoto) => `${item.vehicleId}:${evidenceFileKey(item.file)}`;
    const unique = new Map(items.map(item => [
      keyOf(item),
      item,
    ]));
    const valid = [...unique.values()].filter(({ file }) => {
      if (!EVIDENCE_TYPES.includes(file.type)) {
        toast.error(`${file.name}: use a JPG, PNG or WebP photo.`);
        return false;
      }
      if (file.size > MAX_EVIDENCE_BYTES) {
        toast.error(`${file.name}: the photo must be 10 MB or smaller.`);
        return false;
      }
      return true;
    });
    if (!valid.length)
      return;
    sendingRef.current = true;
    setSendingVehicle(valid[0].vehicleId);
    const failures: PendingPhoto[] = [];
    for (const item of valid) {
      try {
        await upload.mutateAsync({
          jobId: job.id,
          vehicleId: item.vehicleId,
          file: item.file,
          category: item.category || defaultCategory,
        });
      }
      catch (error) {
        failures.push({
          ...item,
          message: evidenceErrorMessage((error as { statusCode?: number }).statusCode),
        });
      }
    }
    sendingRef.current = false;
    setSendingVehicle(null);
    // Every file in this batch is settled: it either uploaded or is back in the queue once.
    setFailed(prev => [
      ...prev.filter(p => !unique.has(keyOf(p))),
      ...failures,
    ]);
    const uploaded = valid.length - failures.length;
    if (!failures.length)
      toast.success(uploaded === 1 ? "Evidence uploaded." : `${uploaded} photos uploaded.`);
    else
      toast.error(`${uploaded} of ${valid.length} uploaded. ${failures.map(f => `${f.file.name}: ${f.message}`).join(" ")} Retry below.`);
  }

  async function view(evidenceId: string) {
    try {
      // The link is short-lived, so fetch it on click rather than with the job.
      const { data } = await getInstallerEvidenceLink({
        jobId: job.id, evidenceId,
      });
      window.open(
        data.url,
        "_blank",
        "noopener",
      );
    }
    catch (error) {
      toast.error((error as { message?: string }).message ?? "Could not open the photo.");
    }
  }

  function askRemove(evidenceId: string) {
    const before = evidenceCoverage(
      job.units,
      job.evidence,
    );
    const after = evidenceCoverage(
      job.units,
      job.evidence.filter(e => e.id !== evidenceId),
    );
    confirm({
      title: "Remove this photo?",
      description: before.met && !after.met
        ? "It cannot be undone. It is the last photo for this vehicle, so \"Capture installation evidence\" will be unticked."
        : "It cannot be undone.",
      confirmLabel: "Remove",
      onConfirm: async () => {
        try {
          await remove.mutateAsync({
            jobId: job.id, evidenceId,
          });
          toast.success("Photo removed");
        }
        catch (error) {
          toast.error(removeErrorMessage((error as { statusCode?: number }).statusCode));
        }
      },
    });
  }

  const vehicleUnits = job.units.filter(u => u.vehicleId);
  const legacy = job.evidence.filter(e => !e.vehicleId);
  const plateOf = (vehicleId: string) => job.units.find(u => u.vehicleId === vehicleId)?.vehicle?.registrationNumber ?? "vehicle";

  function pick(vehicleId: string, category = "") {
    vehicleRef.current = vehicleId;
    categoryRef.current = category;
    fileRef.current?.click();
  }

  function photoTiles(items: JobEvidence[]) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(e => (
          <div
            key={e.id}
            className="space-y-1 rounded-xl border p-3"
          >
            <p className="truncate text-sm font-medium">{e.label}</p>
            <p className="truncate text-xs text-muted-foreground">{e.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateInTimezone(
                e.createdAt,
                zone,
              )}
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2"
                aria-label={`View photo ${e.fileName}`}
                onClick={() => view(e.id)}
              >
                <ExternalLink className="h-3 w-3" />
                View photo
              </Button>
              {canUpload && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-destructive hover:text-destructive"
                  disabled={remove.isPending}
                  aria-label={`Remove photo ${e.fileName}`}
                  onClick={() => askRemove(e.id)}
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <SleekCard
      title="Installation Evidence"
      description="Upload photos of the completed fitting for each vehicle."
    >
      <div className="space-y-3">
        <input
          ref={fileRef}
          type="file"
          accept={EVIDENCE_TYPES.join(",")}
          multiple
          hidden
          disabled={sending}
          onChange={(e) => {
            const category = categoryRef.current || defaultCategory;
            const vehicleId = vehicleRef.current;
            categoryRef.current = "";
            vehicleRef.current = "";
            if (vehicleId) {
              void send(Array.from(
                e.target.files ?? [],
                file => ({
                  file, category, vehicleId,
                }),
              ));
            }
            e.target.value = "";
          }}
        />
        {vehicleUnits.map((u) => {
          const vehicleId = u.vehicleId as string;
          const own = job.evidence.filter(e => e.vehicleId === vehicleId);
          const attachButton = (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={!canUpload || sending}
              loading={sendingVehicle === vehicleId}
              aria-label={`Attach photos for ${plateOf(vehicleId)}`}
              onClick={categories.length > 1 ? undefined : () => pick(vehicleId)}
            >
              <Upload className="h-4 w-4" />
              {" "}
              Attach photos
            </Button>
          );
          return (
            <div
              key={u.index}
              className="space-y-3 rounded-xl border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{u.vehicle?.registrationNumber ?? `Unit ${u.index + 1}`}</p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      u.vehicle && `${u.vehicle.make} ${u.vehicle.model}`,
                      `${own.length} photo(s)`,
                    ].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {categories.length > 1
                  ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>{attachButton}</DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Photo of…</DropdownMenuLabel>
                          {categories.map(c => (
                            <DropdownMenuItem
                              key={c.key}
                              onSelect={() => pick(
                                vehicleId,
                                c.key,
                              )}
                            >
                              {c.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  : attachButton}
              </div>
              {own.length > 0 && photoTiles(own)}
            </div>
          );
        })}

        {legacy.length > 0 && (
          <div className="space-y-3 rounded-xl border p-4">
            <p className="text-sm font-semibold">Earlier photos</p>
            <p className="text-xs text-muted-foreground">Uploaded before photos were kept per vehicle. They count for every vehicle.</p>
            {photoTiles(legacy)}
          </div>
        )}

        {failed.length > 0 && !sending && (
          <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>Not uploaded</span>
              <Button
                size="sm"
                variant="outline"
                disabled={!canUpload}
                onClick={() => void send(failed)}
              >
                Retry
              </Button>
            </div>
            <ul className="space-y-1">
              {failed.map(f => (
                <li
                  key={`${f.vehicleId}:${evidenceFileKey(f.file)}`}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{f.file.name}</span>
                    <span className="block text-xs text-muted-foreground">{`${plateOf(f.vehicleId)}: ${f.message}`}</span>
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove ${f.file.name} from the queue`}
                    onClick={() => setFailed(prev => prev.filter(p => p !== f))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <JobNotesField
          job={job}
          flushRef={notesFlushRef}
        />
      </div>
      {confirmDialog}
    </SleekCard>
  );
}

/** Completed jobs: appdemo's "Installation report" summary. */
function InstallationReport({
  job, time,
}: {
  job: InstallerJobDetail;
  time: string;
}) {
  const c = job.customer;
  const devices = job.units.filter(u => u.device).length;
  const sims = job.units.filter(u => u.sim).length;
  const items = job.checklist.groups.flatMap(g => g.items);

  const fields: [string, ReactNode][] = [
    [
      "Company",
      c.customerName,
    ],
    [
      "Site Contact Phone No.",
      c.phone,
    ],
    [
      "Site Contact Email",
      c.email,
    ],
    [
      "Installation location",
      c.address,
    ],
    [
      "Installation date",
      c.scheduledDate,
    ],
    [
      "Installation time",
      time,
    ],
    [
      "Vehicles · Devices",
      `${job.completion.vehicles} · ${job.completion.devices}`,
    ],
  ];

  function download() {
    // ponytail: client-side text report from the job payload — swap for a server PDF if one lands.
    const lines = [
      `Installation report: ${job.jobNumber}`,
      "",
      ...fields.map(([
        k,
        v,
      ]) => `${k}: ${typeof v === "string" ? v : "-"}`),
      `Installer: ${job.completion.installer}`,
      `Checklist: ${job.completion.checklist}`,
      `Evidence: ${job.completion.evidenceCount} file(s)`,
      "",
      "Units:",
      ...job.units.map(u => `- ${u.vehicle?.registrationNumber ?? `Unit ${u.index + 1}`} · ${u.device ? `${u.device.manufacturer} ${u.device.model} (${u.device.imei})` : "no device"} · ${u.sim ? `SIM ${u.sim.iccid}` : "no SIM"}`),
    ];
    downloadBlob(
      new Blob(
        [lines.join("\n")],
        { type: "text/plain" },
      ),
      `installation-report-${job.jobNumber}.txt`,
    );
  }

  return (
    <SleekCard
      title="Installation report"
      description="Summary of the completed installation."
      action={(
        <Button
          size="sm"
          variant="outline"
          onClick={download}
        >
          <Download className="h-4 w-4" />
          {" "}
          Download Report
        </Button>
      )}
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <ReportStat
            icon={Truck}
            label="Vehicles fitted"
            value={job.units.filter(u => u.vehicle).length}
          />
          <ReportStat
            icon={Cpu}
            label="Devices installed"
            value={devices}
          />
          <ReportStat
            icon={SignalHigh}
            label="IoT SIMs activated"
            value={sims}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(([
            label,
            value,
          ]) => (
            <Info
              key={label}
              label={label}
              value={value}
            />
          ))}
        </div>
        <UnitsTabs job={job} />
        <div className="rounded-xl border p-4">
          <p className="text-sm font-semibold">Installation checklist</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {items.map(i => (
              <li
                key={i.key}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {" "}
                {i.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SleekCard>
  );
}

function ReportStat({
  icon: Icon, label, value,
}: {
  icon: ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function Info({
  label, value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 break-words text-sm font-medium">{value || "-"}</div>
    </div>
  );
}

function Tile({
  label, value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 break-words text-sm font-medium">{value || "-"}</div>
    </div>
  );
}
