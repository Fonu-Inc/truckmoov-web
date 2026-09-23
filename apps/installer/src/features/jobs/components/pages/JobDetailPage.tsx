import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Trash2,
  Upload,
} from "lucide-react";
import {
  useRef,
  useState,
} from "react";
import {
  useNavigate, useParams,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Label } from "@/components/shadcn/label";
import { Progress } from "@/components/shadcn/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { Textarea } from "@/components/shadcn/textarea";
import { InstallationReportCard } from "@/features/jobs/components/ui/InstallationReportCard";
import { JobStatusBadge } from "@/features/jobs/components/ui/JobStatusBadge";
import {
  CHECKLIST_TOTAL,
  checklistProgress,
  EVIDENCE_CATEGORIES,
  INSTALLATION_CHECKLIST,
  installerName,
  ISSUE_TYPES,
} from "@/features/jobs/demoData";
import {
  useJobsStore,
  useMyJobs,
} from "@/features/jobs/stores/jobsStore";

const STARTABLE = [
  "accepted",
  "scheduled",
];

export default function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const installer = useJobsStore(s => s.installer);
  const myJobs = useMyJobs();
  const startJob = useJobsStore(s => s.startJob);
  const completeJob = useJobsStore(s => s.completeJob);
  const toggleChecklistItem = useJobsStore(s => s.toggleChecklistItem);
  const setInstallerNotes = useJobsStore(s => s.setInstallerNotes);
  const addEvidence = useJobsStore(s => s.addEvidence);
  const removeEvidence = useJobsStore(s => s.removeEvidence);
  const reportIssue = useJobsStore(s => s.reportIssue);

  const job = myJobs.find(j => j.id === jobId);

  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const issuePhotoRef = useRef<HTMLInputElement>(null);
  const [
    evidenceCategory,
    setEvidenceCategory,
  ] = useState<string>(EVIDENCE_CATEGORIES[0]);
  const [
    issueOpen,
    setIssueOpen,
  ] = useState(false);
  const [
    issue,
    setIssue,
  ] = useState({
    type: "", description: "",
  });
  const [
    issuePhotos,
    setIssuePhotos,
  ] = useState<{
    name: string; dataUrl: string;
  }[]>([]);
  const [
    completeOpen,
    setCompleteOpen,
  ] = useState(false);
  const [
    confirmed,
    setConfirmed,
  ] = useState(false);

  if (!job) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-sm font-medium">Installation job not found</p>
          <p className="text-xs text-muted-foreground">
            This job is not assigned to you, or it no longer exists.
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate("/jobs")}
          >
            Back to My Installation Jobs
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { done } = checklistProgress(job);
  const allDone = done === CHECKLIST_TOTAL;
  const locked = job.status === "completed";

  const startOfToday = new Date();
  startOfToday.setHours(
    0,
    0,
    0,
    0,
  );
  const scheduledAt = new Date(job.scheduledDate);
  const scheduledDayReached
    = Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= startOfToday.getTime();

  const units = [
    {
      vehicle: job.vehicle, device: job.device, sim: job.sim,
    },
  ];

  const handleFiles = (files: FileList | null) => {
    if (!files?.length)
      return;
    Array.from(files).forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = () => {
        addEvidence(
          job.id,
          {
            id: `evidence-${Date.now()}-${i}`,
            category: evidenceCategory,
            name: file.name,
            dataUrl: String(reader.result),
            uploadedAt: new Date().toISOString(),
          },
        );
      };
      reader.readAsDataURL(file);
    });
    toast.success("Evidence uploaded.");
  };

  const handleIssueFiles = (files: FileList | null) => {
    if (!files?.length)
      return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setIssuePhotos(prev => [
          ...prev,
          {
            name: file.name, dataUrl: String(reader.result),
          },
        ]);
      reader.readAsDataURL(file);
    });
  };

  const submitIssue = () => {
    if (!issue.type) {
      toast.error("Select an issue type.");
      return;
    }
    if (issue.description.trim().length < 10) {
      toast.error("Describe the issue in a little more detail.");
      return;
    }
    reportIssue(
      job.id,
      issue.type,
      issue.description,
      issuePhotos.map((p, i) => ({
        id: `issue-photo-${Date.now()}-${i}`,
        category: "Issue evidence",
        name: p.name,
        dataUrl: p.dataUrl,
        uploadedAt: new Date().toISOString(),
      })),
    );
    setIssueOpen(false);
    setIssue({
      type: "", description: "",
    });
    setIssuePhotos([]);
    toast.success("Issue reported successfully.");
  };

  const submitInstallation = () => {
    completeJob(job.id);
    setCompleteOpen(false);
    setConfirmed(false);
    toast.success("Installation completed successfully.");
  };

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
            <JobStatusBadge status={job.status} />
            {STARTABLE.includes(job.status) && (
              <Button
                disabled={!scheduledDayReached}
                onClick={() => startJob(job.id)}
              >
                Start Installation
              </Button>
            )}
            {!locked && (
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
            {job.id}
          </h2>
          <p className="text-sm text-muted-foreground">
            {job.customer.name}
            {" · "}
            {job.vehicle.registration}
          </p>
        </div>

        {STARTABLE.includes(job.status) && !scheduledDayReached && (
          <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
            This installation is scheduled for
            {" "}
            {job.scheduledDate}
            {" at "}
            {job.scheduledTime}
            . You can start it on the scheduled day.
          </p>
        )}

        {job.issue && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-base text-destructive">
                Reported issue ·
                {" "}
                {job.issue.type}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {job.issue.description}
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <Section title="Customer & Site Details">
            <Info
              label="Customer name"
              value={job.customer.name}
            />
            <Info
              label="Customer type"
              value={job.customer.type}
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
              value={`${job.customer.address}, ${job.customer.city}, ${job.customer.state}`}
            />
            <Info
              label="Scheduled"
              value={`${job.scheduledDate} at ${job.scheduledTime}`}
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
                  {units.length}
                  {" unit"}
                  {units.length === 1 ? "" : "s"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {units.map((unit, idx) => (
                <div
                  key={unit.vehicle.registration}
                  className="space-y-4 rounded-2xl border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      Unit
                      {" "}
                      {idx + 1}
                      {" · "}
                      {unit.vehicle.registration}
                    </p>
                    <Badge
                      variant="outline"
                      className="rounded-full"
                    >
                      {unit.device.manufacturer}
                      {" "}
                      {unit.device.model}
                    </Badge>
                  </div>

                  <SubSection title="1. Vehicle fitment">
                    <Info
                      label="Registration number"
                      value={unit.vehicle.registration}
                    />
                    <Info
                      label="Vehicle type"
                      value={unit.vehicle.type}
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
                      value={unit.vehicle.color}
                    />
                    <Info
                      label="Engine capacity"
                      value={unit.vehicle.engineCapacity}
                    />
                    <Info
                      label="ODO reading"
                      value={unit.vehicle.odometer}
                    />
                  </SubSection>

                  <SubSection title="2. Device to fit in this vehicle">
                    <Info
                      label="Device ID"
                      value={unit.device.id}
                    />
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
                      value={unit.device.type}
                    />
                    <Info
                      label="Device status"
                      value={unit.device.status}
                    />
                  </SubSection>

                  <SubSection title="3. SIM installation in device">
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
                          </>
                        )
                      : (
                          <p className="text-sm text-muted-foreground">
                            No SIM is attached to this unit.
                          </p>
                        )}
                  </SubSection>

                  <SubSection title="4. SIM activation & connectivity">
                    {unit.sim
                      ? (
                          <>
                            <Info
                              label="Activation status"
                              value={unit.sim.activation}
                            />
                            <Info
                              label="Network"
                              value={unit.sim.carrier}
                            />
                          </>
                        )
                      : (
                          <p className="text-sm text-muted-foreground">
                            Nothing to activate for this unit.
                          </p>
                        )}
                  </SubSection>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

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
                {done}
                /
                {CHECKLIST_TOTAL}
                {" completed"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Progress value={(done / CHECKLIST_TOTAL) * 100} />
            {INSTALLATION_CHECKLIST.map(section => (
              <div
                key={section.id}
                className="space-y-2"
              >
                <p className="text-sm font-semibold">{section.title}</p>
                {section.items.map(item => (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm"
                  >
                    <Checkbox
                      checked={!!job.checklist[item.id]}
                      disabled={locked}
                      onCheckedChange={() => toggleChecklistItem(
                        job.id,
                        item.id,
                      )}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installation Evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] space-y-1.5">
                <Label>Evidence category</Label>
                <Select
                  value={evidenceCategory}
                  onValueChange={setEvidenceCategory}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVIDENCE_CATEGORIES.map(c => (
                      <SelectItem
                        key={c}
                        value={c}
                      >
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                disabled={locked}
                onClick={() => cameraRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                {" "}
                Take Photo
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={locked}
                onClick={() => uploadRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {" "}
                Upload Photo
              </Button>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={e => handleFiles(e.target.files)}
              />
              <input
                ref={uploadRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={e => handleFiles(e.target.files)}
              />
            </div>

            {job.evidence.length === 0
              ? (
                  <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No evidence uploaded yet.
                  </p>
                )
              : (
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {job.evidence.map(e => (
                      <div
                        key={e.id}
                        className="overflow-hidden rounded-xl border"
                      >
                        <img
                          src={e.dataUrl}
                          alt={e.name}
                          className="h-32 w-full object-cover"
                        />
                        <div className="space-y-1 p-2">
                          <p className="truncate text-xs font-medium">{e.category}</p>
                          <p className="truncate text-xs text-muted-foreground">{e.name}</p>
                          {!locked && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 px-2 text-destructive"
                              onClick={() => removeEvidence(
                                job.id,
                                e.id,
                              )}
                            >
                              <Trash2 className="h-3 w-3" />
                              {" "}
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

            <Separator />

            <div className="space-y-1.5">
              <Label>Installer notes</Label>
              <Textarea
                value={job.installerNotes}
                disabled={locked}
                onChange={e => setInstallerNotes(
                  job.id,
                  e.target.value,
                )}
                placeholder="Add notes about the installation"
                rows={3}
              />
            </div>
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
                value={job.customer.name}
              />
              <Info
                label="Vehicle"
                value={job.vehicle.registration}
              />
              <Info
                label="Device"
                value={`${job.device.manufacturer} ${job.device.model}`}
              />
              <Info
                label="Installation date"
                value={job.scheduledDate}
              />
              <Info
                label="Installer"
                value={installerName(installer)}
              />
              <Info
                label="Checklist"
                value={`${done}/${CHECKLIST_TOTAL} completed`}
              />
              <Info
                label="Evidence"
                value={`${job.evidence.length} file(s)`}
              />
              <Info
                label="Notes"
                value={job.installerNotes || "—"}
              />
            </div>
            {locked
              ? (
                  <div className="flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    {" "}
                    Installation completed successfully.
                  </div>
                )
              : (
                  <Button
                    disabled={!allDone || job.status !== "in_progress"}
                    onClick={() => setCompleteOpen(true)}
                  >
                    Complete Installation
                  </Button>
                )}
            {!locked && (!allDone || job.status !== "in_progress") && (
              <p className="text-xs text-muted-foreground">
                Start the installation and complete every checklist item to finish the job.
              </p>
            )}
          </CardContent>
        </Card>

        {locked && (
          <InstallationReportCard
            job={job}
            installerLabel={installerName(installer)}
          />
        )}
      </div>

      {/* Report issue */}
      <Dialog
        open={issueOpen}
        onOpenChange={setIssueOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an Installation Issue</DialogTitle>
            <DialogDescription>
              The job moves into an exception state so the system and Platform Admin can act.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Issue type</Label>
              <Select
                value={issue.type}
                onValueChange={v => setIssue({
                  ...issue, type: v,
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an issue type" />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map(t => (
                    <SelectItem
                      key={t}
                      value={t}
                    >
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Describe the issue</Label>
              <Textarea
                rows={5}
                value={issue.description}
                onChange={e => setIssue({
                  ...issue, description: e.target.value,
                })}
                placeholder="Describe what happened on site"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Evidence</Label>
              <input
                ref={issuePhotoRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleIssueFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => issuePhotoRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {" "}
                Upload Photo
              </Button>
              {issuePhotos.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {issuePhotos.map((p, i) => (
                    <div
                      key={p.name}
                      className="relative"
                    >
                      <img
                        src={p.dataUrl}
                        alt={p.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setIssuePhotos(issuePhotos.filter((_, x) => x !== i))}
                        className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive px-1.5 text-[10px] leading-4 text-destructive-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIssueOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={submitIssue}>Submit Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion confirmation */}
      <AlertDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit installation</AlertDialogTitle>
            <AlertDialogDescription>
              Review the summary before submitting. This updates the job status across the
              platform.
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
            <AlertDialogCancel onClick={() => setConfirmed(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!confirmed}
              onClick={submitInstallation}
            >
              Submit Installation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
