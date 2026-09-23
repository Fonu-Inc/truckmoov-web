import type { InstallationJob } from "@/features/jobs/demoData";
import { Download } from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  CHECKLIST_TOTAL,
  checklistProgress,
} from "@/features/jobs/demoData";
import { buildInstallationReportHtml } from "@/features/jobs/utils/installationReport";

export function InstallationReportCard({
  job,
  installerLabel,
}: {
  job: InstallationJob;
  installerLabel: string;
}) {
  const { done } = checklistProgress(job);

  const download = () => {
    const blob = new Blob(
      [
        buildInstallationReportHtml(
          job,
          installerLabel,
        ),
      ],
      { type: "text/html" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `installation-report-${job.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>Installation Report</CardTitle>
        <Button
          variant="outline"
          className="gap-2"
          onClick={download}
        >
          <Download className="h-4 w-4" />
          {" "}
          Download Report
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Work order"
            value={job.id}
          />
          <Field
            label="Customer"
            value={job.customer.name}
          />
          <Field
            label="Installer"
            value={installerLabel}
          />
          <Field
            label="Installation date"
            value={
              job.completedAt
                ? new Date(job.completedAt).toLocaleString()
                : `${job.scheduledDate} ${job.scheduledTime}`
            }
          />
          <Field
            label="Vehicles"
            value={`1 · ${job.vehicle.registration}`}
          />
          <Field
            label="Devices"
            value={`1 · ${job.device.imei}`}
          />
          <Field
            label="Checklist"
            value={`${done}/${CHECKLIST_TOTAL} completed`}
          />
          <Field
            label="Photos"
            value={`${job.evidence.length} captured`}
          />
          <Field
            label="Completion status"
            value={(
              <Badge
                variant="secondary"
                className="rounded-full"
              >
                {job.status === "completed" ? "Completed" : "Pending completion"}
              </Badge>
            )}
          />
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Issues / remarks
          </p>
          <p className="mt-1 text-sm">
            {job.issue
              ? `${job.issue.type}: ${job.issue.description}`
              : job.installerNotes || "No issues reported."}
          </p>
        </div>
        {job.evidence.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {job.evidence.map(e => (
              <div
                key={e.id}
                className="overflow-hidden rounded-xl border"
              >
                <img
                  src={e.dataUrl}
                  alt={e.name}
                  className="h-28 w-full object-cover"
                />
                <p className="truncate p-2 text-xs text-muted-foreground">{e.category}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({
  label, value,
}: {
  label: string; value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 break-words text-sm font-medium">{value || "—"}</div>
    </div>
  );
}
