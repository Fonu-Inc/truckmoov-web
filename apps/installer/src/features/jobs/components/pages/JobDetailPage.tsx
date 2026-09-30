import type {
  InstallerChecklistItem, InstallerJobDetail,
} from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import {
  getInstallerEvidenceLink,
  useAcceptInstallerJob,
  useCompleteInstallerJob,
  useInstallerDisplayPreferences,
  useInstallerJob,
  useInstallerOptions,
  useSaveInstallerJobNotes,
  useSetInstallerChecklistItem,
  useStartInstallerJob,
  useUploadInstallerEvidence,
} from "@truckmoov/api/auth";
import { debounce } from "@truckmoov/app-core/utils/general-utils";
import {
  formatDateInTimezone,
  formatDateOnlyInTimezone,
  formatTimeInTimezone,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ExternalLink,
  Upload,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router";
import { toast } from "sonner";
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
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Label } from "@/components/shadcn/label";
import { Progress } from "@/components/shadcn/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { RejectOfferForm } from "@/features/jobs/components/forms/RejectOfferForm";
import { ReportIssueForm } from "@/features/jobs/components/forms/ReportIssueForm";
import { InstallerJobStatusBadge } from "@/features/jobs/components/ui/InstallerJobStatusBadge";

// Display Preferences default (TRU-FE-21) until the installer picks another zone.
const DEFAULT_ZONE = "Africa/Lagos";
const NOTES_MAX = 2000;
const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;
const EVIDENCE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
/** Statuses where an issue can still be raised; the server's 409 is the real gate. */
const CLOSED = [
  "completed",
  "cancelled",
];

const GATE_HINT: Record<NonNullable<InstallerChecklistItem["gated"]>, string> = {
  device_communicating: "Available once every device on the job is verified and communicating.",
  evidence: "Available once at least one evidence photo is uploaded.",
};

/**
 * GET /auth/installer/jobs/:jobId. Every button is driven by `job.actions`
 * (TRU-FE-20) — nothing here decides from `status` what the installer may do.
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

  if (jobQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">Loading job…</CardContent>
      </Card>
    );
  }

  const job = jobQuery.data?.data;
  if (!job) {
    const notFound = jobQuery.error?.statusCode === 404;
    return (
      <Card>
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
            <Button onClick={() => navigate("/jobs")}>Back to My Installation Jobs</Button>
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

  const slot = `${formatDateOnlyInTimezone(
    job.customer.scheduledAt,
    zone,
  )}, ${formatTimeInTimezone(
    job.customer.scheduledAt,
    zone,
  )} – ${formatTimeInTimezone(
    job.customer.scheduledUntil,
    zone,
  )}`;

  return (
    <>
      <div className="space-y-6">
        {/* `/jobs/:jobId` is off the nav, so it has no top-bar title — this row
            is the page's own heading. */}
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
                  variant="outline"
                  onClick={() => setRejectOpen(true)}
                  disabled={accept.isPending}
                >
                  Reject offer
                </Button>
                <Button
                  loading={accept.isPending}
                  onClick={() => run(
                    "Accept",
                    accept,
                    "Job accepted. It is now scheduled.",
                  )}
                >
                  Accept offer
                </Button>
              </>
            )}
            {actions.canStart && (
              <Button
                loading={start.isPending}
                onClick={() => run(
                  "Start",
                  start,
                  "Installation started.",
                )}
              >
                Start Installation
              </Button>
            )}
            {!CLOSED.includes(job.status) && !actions.canAccept && (
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

        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Installation Profile ·
            {" "}
            {job.jobNumber}
          </h2>
          <p className="text-sm text-muted-foreground">
            {job.customer.customerName}
            {job.units[0]?.vehicle && ` · ${job.units[0].vehicle.registrationNumber}`}
          </p>
        </div>

        {job.issues.length > 0 && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Reported issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {job.issues.map(i => (
                <div
                  key={i.ticketId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm"
                >
                  <span className="font-medium">{i.displayId}</span>
                  <span className="text-muted-foreground">
                    {formatDateInTimezone(
                      i.createdAt,
                      zone,
                    )}
                  </span>
                  <Badge variant="outline">{i.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Section title="Customer & Site Details">
          <Info
            label="Customer name"
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
            label="Scheduled"
            value={slot}
          />
        </Section>

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
              <span>Submitted Installation Units</span>
              <Badge
                variant="secondary"
                className="rounded-full"
              >
                {job.units.length}
                {" unit"}
                {job.units.length === 1 ? "" : "s"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {job.units.map(unit => (
              <UnitCard
                key={unit.index}
                unit={unit}
              />
            ))}
          </CardContent>
        </Card>

        <ChecklistCard job={job} />

        <Card>
          <CardHeader>
            <CardTitle>Installation Evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EvidenceSection
              job={job}
              zone={zone}
            />
            <NotesField job={job} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installation Completion Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Info
                label="Customer"
                value={job.completion.customer}
              />
              <Info
                label="Vehicle"
                value={job.completion.vehicle}
              />
              <Info
                label="Device"
                value={job.completion.device}
              />
              <Info
                label="Vehicles"
                value={job.completion.vehicles}
              />
              <Info
                label="Devices"
                value={job.completion.devices}
              />
              <Info
                label="Installation date"
                value={job.completion.installationDate}
              />
              <Info
                label="Installer"
                value={job.completion.installer}
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
                label="Notes"
                value={job.completion.notes}
              />
            </div>
            {job.status === "completed" && (
              <div className="flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                {" "}
                Installation completed successfully.
              </div>
            )}
            {actions.canComplete && (
              <Button onClick={() => setCompleteOpen(true)}>Complete Installation</Button>
            )}
          </CardContent>
        </Card>
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
          <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
            <Checkbox
              checked={confirmed}
              onCheckedChange={v => setConfirmed(!!v)}
              className="mt-0.5"
            />
            I confirm that the installation has been completed and the information provided
            is accurate.
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!confirmed || complete.isPending}
              onClick={() => run(
                "Complete",
                complete,
                "Installation completed.",
              )}
            >
              Submit Installation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function UnitCard({ unit }: { unit: InstallerJobDetail["units"][number] }) {
  return (
    <div className="space-y-4 rounded-2xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          Unit
          {" "}
          {unit.index + 1}
          {unit.vehicle && ` · ${unit.vehicle.registrationNumber}`}
        </p>
        {unit.device && (
          <Badge
            variant="outline"
            className="rounded-full"
          >
            {unit.device.manufacturer}
            {" "}
            {unit.device.model}
          </Badge>
        )}
      </div>

      <SubSection title="1. Vehicle fitment">
        {unit.vehicle
          ? (
              <>
                <Info
                  label="Registration number"
                  value={unit.vehicle.registrationNumber}
                />
                <Info
                  label="Vehicle type"
                  value={unit.vehicle.vehicleType}
                />
                <Info
                  label="Make"
                  value={unit.vehicle.make}
                />
                <Info
                  label="Model"
                  value={unit.vehicle.model}
                />
                <Info
                  label="Year"
                  value={unit.vehicle.year}
                />
                <Info
                  label="Engine number"
                  value={unit.vehicle.engineNumber}
                />
                <Info
                  label="Chassis number"
                  value={unit.vehicle.chassisNumber}
                />
                <Info
                  label="Colour"
                  value={unit.vehicle.colour}
                />
                <Info
                  label="Engine capacity"
                  value={unit.vehicle.engineCapacity}
                />
                <Info
                  label="ODO reading"
                  value={unit.vehicle.odometer}
                />
              </>
            )
          : <Empty>No vehicle is attached to this unit.</Empty>}
      </SubSection>

      <SubSection title="2. Device to fit in this vehicle">
        {unit.device
          ? (
              <>
                <Info
                  label="IMEI"
                  value={unit.device.imei}
                />
                <Info
                  label="Manufacturer"
                  value={unit.device.manufacturer}
                />
                <Info
                  label="Device model"
                  value={unit.device.model}
                />
                <Info
                  label="Device type"
                  value={unit.device.deviceType}
                />
                <Info
                  label="Device status"
                  value={unit.device.statusLabel}
                />
                <Info
                  label="Verification"
                  value={unit.device.verificationStatus}
                />
              </>
            )
          : <Empty>No device bound yet. The platform binds it before the installation can start.</Empty>}
      </SubSection>

      <SubSection title="3. SIM installation & connectivity">
        {unit.sim
          ? (
              <>
                <Info
                  label="ICCID"
                  value={unit.sim.iccid}
                />
                <Info
                  label="IMSI"
                  value={unit.sim.imsi}
                />
                <Info
                  label="Phone number"
                  value={unit.sim.msisdn}
                />
                <Info
                  label="Carrier"
                  value={unit.sim.carrier}
                />
                <Info
                  label="Activation status"
                  value={unit.sim.activationStatus}
                />
                <Info
                  label="Network"
                  value={unit.sim.network}
                />
              </>
            )
          : <Empty>No SIM is attached to this unit.</Empty>}
      </SubSection>
    </div>
  );
}

function ChecklistCard({ job }: { job: InstallerJobDetail }) {
  const tick = useSetInstallerChecklistItem();
  const {
    completed, total,
  } = job.checklist;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>Installation Checklist</span>
          <Badge
            variant="secondary"
            className="rounded-full"
          >
            Installation Progress —
            {" "}
            {completed}
            /
            {total}
            {" completed"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Progress value={total ? (completed / total) * 100 : 0} />
        {!job.actions.canTick && job.status !== "completed" && (
          <p className="text-xs text-muted-foreground">The checklist opens once the installation is started.</p>
        )}
        {job.checklist.groups.map(group => (
          <div
            key={group.key}
            className="space-y-2"
          >
            <p className="text-sm font-semibold">{group.label}</p>
            {group.items.map(item => (
              <label
                key={item.key}
                className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm"
              >
                <Checkbox
                  className="mt-0.5"
                  checked={item.checked}
                  disabled={!job.actions.canTick || tick.isPending}
                  onCheckedChange={v => tick.mutate(
                    {
                      jobId: job.id,
                      itemKey: item.key,
                      data: { checked: !!v },
                    },
                    // Gate refusals ("Upload at least one evidence photo…") come back as 409 — show them as-is.
                    { onError: error => toast.error(error.message) },
                  )}
                />
                <span>
                  {item.label}
                  {item.gated && !item.checked && (
                    <span className="block text-xs text-muted-foreground">{GATE_HINT[item.gated]}</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EvidenceSection({
  job, zone,
}: {
  job: InstallerJobDetail;
  zone: string;
}) {
  const upload = useUploadInstallerEvidence();
  const categories = useInstallerOptions().data?.data.evidenceCategories ?? [];
  const [
    category,
    setCategory,
  ] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const chosen = category || categories[0]?.key || "";

  function send(file: File | undefined) {
    if (!file)
      return;
    if (!EVIDENCE_TYPES.includes(file.type)) {
      toast.error("Use a JPG, PNG or WebP photo.");
      return;
    }
    if (file.size > MAX_EVIDENCE_BYTES) {
      toast.error("The photo must be 10 MB or smaller.");
      return;
    }
    upload.mutate(
      {
        jobId: job.id,
        category: chosen,
        file,
      },
      {
        onSuccess: () => toast.success("Evidence uploaded."),
        onError: error => toast.error(error.message),
      },
    );
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

  return (
    <>
      {job.actions.canUploadEvidence && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] space-y-1.5">
            <Label>Evidence category</Label>
            <Select
              value={chosen}
              onValueChange={setCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem
                    key={c.key}
                    value={c.key}
                  >
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            disabled={!chosen || upload.isPending}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
            {" "}
            Take Photo
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            disabled={!chosen}
            loading={upload.isPending}
            onClick={() => uploadRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {" "}
            Upload Photo
          </Button>
          {[
            cameraRef,
            uploadRef,
          ].map((ref, i) => (
            <input
              key={i === 0 ? "camera" : "upload"}
              ref={ref}
              type="file"
              accept={EVIDENCE_TYPES.join(",")}
              capture={i === 0 ? "environment" : undefined}
              hidden
              onChange={(e) => {
                send(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          ))}
        </div>
      )}

      {job.evidence.length === 0
        ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No evidence uploaded yet.
            </p>
          )
        : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {job.evidence.map(e => (
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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 px-2"
                    onClick={() => view(e.id)}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View photo
                  </Button>
                </div>
              ))}
            </div>
          )}
    </>
  );
}

/** Autosaves through PATCH /notes after the installer pauses typing. */
function NotesField({ job }: { job: InstallerJobDetail }) {
  const { mutate: saveNotes } = useSaveInstallerJobNotes();
  const [
    notes,
    setNotes,
  ] = useState(job.notes ?? "");
  const [
    state,
    setState,
  ] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const saveLater = useMemo(
    () => debounce(
      (value: string) => {
        setState("saving");
        saveNotes(
          {
            jobId: job.id,
            data: { notes: value.trim() ? value : null },
          },
          {
            onSuccess: () => setState("saved"),
            onError: (error) => {
              setState("error");
              toast.error(error.message);
            },
          },
        );
      },
      800,
    ),
    [
      job.id,
      saveNotes,
    ],
  );
  useEffect(
    () => () => saveLater.cancel(),
    [saveLater],
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>Installer notes</Label>
        <span className="text-xs text-muted-foreground">
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "error" ? "Not saved" : ""}
        </span>
      </div>
      <Textarea
        value={notes}
        disabled={!job.actions.canEditNotes}
        maxLength={NOTES_MAX}
        onChange={(e) => {
          setNotes(e.target.value);
          saveLater(e.target.value);
        }}
        placeholder="Add notes about the installation"
        rows={3}
      />
      <p className="text-right text-xs text-muted-foreground">
        {notes.length}
        /
        {NOTES_MAX}
      </p>
    </div>
  );
}

function Section({
  title, children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

function SubSection({
  title, children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
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
      <div className="mt-0.5 break-words text-sm font-medium">{value || "—"}</div>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">{children}</p>;
}
