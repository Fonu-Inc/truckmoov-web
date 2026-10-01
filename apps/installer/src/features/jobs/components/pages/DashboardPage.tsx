import type {
  DashboardJob, DashboardSection, InstallerDashboard,
} from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import type { ChartConfig } from "@/components/shadcn/chart";
import {
  useAcceptInstallerJob,
  useInstallerDashboard,
  useInstallerDisplayPreferences,
} from "@truckmoov/api/auth";
import {
  formatMonthYear,
  formatRelative,
  formatScheduleInTimezone,
} from "@truckmoov/app-core/utils/time-utils";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";
import { QueryState } from "@/components/QueryState";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/shadcn/chart";
import { Skeleton } from "@/components/shadcn/skeleton";
import { RejectOfferForm } from "@/features/jobs/components/forms/RejectOfferForm";
import { InstallerJobStatusBadge } from "@/features/jobs/components/ui/InstallerJobStatusBadge";

// Display Preferences default (TRU-FE-21) until the installer picks another zone.
const DEFAULT_ZONE = "Africa/Lagos";

const ACTIVITY_LABEL: Record<InstallerDashboard["recentActivity"][number]["type"], string> = {
  offered: "Installation job offered",
  accepted: "Installation job accepted",
  started: "Installation started",
  issue_reported: "Issue reported",
  completed: "Installation completed",
  cancelled: "Installation cancelled",
};

const activityChartConfig = {
  completed: {
    label: "Completed", color: "hsl(var(--success))",
  },
  inProgress: {
    label: "In progress", color: "hsl(var(--warning))",
  },
  scheduled: {
    label: "Scheduled", color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const dashboard = useInstallerDashboard();
  const zone = useInstallerDisplayPreferences().data?.data.timezone ?? DEFAULT_ZONE;
  const [
    rejecting,
    setRejecting,
  ] = useState<DashboardJob | null>(null);

  if (dashboard.isError) {
    return (
      <Card className="surface-sleek rounded-2xl">
        <CardContent className="p-6">
          <QueryState
            query={dashboard}
            errorMessage="Unable to load your dashboard."
          >
            {null}
          </QueryState>
        </CardContent>
      </Card>
    );
  }

  const data = dashboard.data?.data;
  const loading = dashboard.isLoading;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          title="Total Installations"
          value={data?.counters.total ?? 0}
          icon={ClipboardList}
          loading={loading}
        />
        <StatCard
          title="Completed"
          value={data?.counters.completed ?? 0}
          icon={CheckCircle2}
          variant="success"
          loading={loading}
        />
        <StatCard
          title="Pending"
          value={data?.counters.pending ?? 0}
          icon={CalendarClock}
          variant="warning"
          loading={loading}
        />
        <StatCard
          title="Success Rate"
          value={`${data?.counters.successRate ?? 0}%`}
          icon={TrendingUp}
          variant="success"
          loading={loading}
        />
      </div>

      <JobSection
        title="New Installation Offers"
        description="Review the complete job before accepting or rejecting it."
        section={data?.offers}
        loading={loading}
        empty="No offers waiting. New installation jobs offered to you appear here."
        renderJob={job => (
          <OfferRow
            key={job.jobId}
            job={job}
            zone={zone}
            onReject={() => setRejecting(job)}
          />
        )}
      />

      <JobSection
        title="Today’s Installation Jobs"
        description="Installations scheduled for today."
        section={data?.todaysJobs}
        loading={loading}
        empty="No installations scheduled for today."
        renderJob={job => (
          <JobRow
            key={job.jobId}
            job={job}
            zone={zone}
          />
        )}
      />

      <JobSection
        title="Upcoming Installation Jobs"
        description="Accepted installations from tomorrow onward."
        section={data?.upcomingJobs}
        loading={loading}
        empty="Nothing scheduled from tomorrow onward."
        renderJob={job => (
          <JobRow
            key={job.jobId}
            job={job}
            zone={zone}
          />
        )}
      />

      <Card className="surface-sleek rounded-2xl">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="font-display">Installation Activity Over Time</CardTitle>
          <CardDescription>Completed, in-progress, and scheduled installation activity.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 h-[300px]">
          {loading
            ? <Skeleton className="h-full w-full rounded-xl" />
            : !data?.activityOverTime.some(m => m.completed || m.inProgress || m.scheduled)
                ? <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No installation activity in the last 6 months.</p>
                : (
                    <ChartContainer
                      config={activityChartConfig}
                      className="h-full w-full"
                    >
                      <LineChart data={(data?.activityOverTime ?? []).map(m => ({
                        ...m,
                        // Mid-month so no time zone can tip the label into the previous month.
                        label: formatMonthYear(`${m.month}-15`),
                      }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          width={28}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line
                          type="monotone"
                          dataKey="completed"
                          stroke="var(--color-completed)"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="inProgress"
                          stroke="var(--color-inProgress)"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="scheduled"
                          stroke="var(--color-scheduled)"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ChartContainer>
                  )}
        </CardContent>
      </Card>

      <Card className="surface-sleek rounded-2xl">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="font-display">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-0">
          {data?.recentActivity.length
            ? data.recentActivity.map(a => (
                <div
                  key={`${a.jobId}-${a.type}-${a.occurredAt}`}
                  className="flex gap-3 border-b py-3 last:border-0"
                >
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{ACTIVITY_LABEL[a.type]}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.jobNumber}
                      {" · "}
                      {formatRelative(a.occurredAt)}
                    </p>
                  </div>
                </div>
              ))
            : <EmptyText loading={loading}>No activity yet.</EmptyText>}
        </CardContent>
      </Card>

      <RejectOfferForm
        offer={rejecting}
        onClose={() => setRejecting(null)}
      />
    </div>
  );
}

function JobSection({
  title, description, section, loading, empty, renderJob,
}: {
  title: string;
  description: string;
  section?: DashboardSection;
  loading: boolean;
  empty: string;
  renderJob: (job: DashboardJob) => ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <Card className="surface-sleek rounded-2xl">
      <CardHeader className="p-6 pb-4 flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="font-display">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/jobs")}
        >
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-6 pt-0 grid gap-4 grid-cols-1">
        {section?.items.length
          ? section.items.map(renderJob)
          : <EmptyText loading={loading}>{empty}</EmptyText>}
      </CardContent>
    </Card>
  );
}

function jobLocation(job: DashboardJob, withState: boolean) {
  return [
    job.address,
    job.city,
    withState ? job.state : null,
  ].filter(Boolean).join(", ");
}

function OfferRow({
  job, zone, onReject,
}: {
  job: DashboardJob;
  zone: string;
  onReject: () => void;
}) {
  const navigate = useNavigate();
  const accept = useAcceptInstallerJob();

  return (
    <div className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{job.companyName}</p>
          </div>
          <InstallerJobStatusBadge status={job.status} />
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Site Contact">{job.siteContactName}</Field>
          <Field label="Phone">{job.siteContactPhone}</Field>
          {job.siteContactEmail && <Field label="Email">{job.siteContactEmail}</Field>}
          <Field label="Installation Location">
            {jobLocation(
              job,
              true,
            )}
          </Field>
          <Field label="Scheduled">
            <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            {formatScheduleInTimezone(
              job.scheduledAt,
              zone,
            )}
          </Field>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:w-40">
        <Button
          variant="outline"
          onClick={() => navigate(`/jobs/${job.jobId}`)}
        >
          View Details
        </Button>
        <Button
          loading={accept.isPending}
          onClick={() => accept.mutate(
            { jobId: job.jobId },
            {
              onSuccess: () => toast.success(
                `Job ${job.jobNumber} accepted.`,
                { description: "It is now scheduled." },
              ),
              onError: error => toast.error(error.statusCode === 409
                ? "This job changed. The dashboard has been refreshed."
                : error.message),
            },
          )}
        >
          Accept
        </Button>
        <Button
          variant="destructive"
          onClick={onReject}
          disabled={accept.isPending}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

function JobRow({
  job, zone,
}: {
  job: DashboardJob;
  zone: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{job.companyName}</p>
            <p className="text-xs text-muted-foreground">{job.jobNumber}</p>
          </div>
          <InstallerJobStatusBadge status={job.status} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Site Contact">{job.siteContactName}</Field>
          <Field label="Phone">{job.siteContactPhone}</Field>
          <Field label="Location">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            {jobLocation(
              job,
              false,
            )}
          </Field>
          <Field label="Scheduled">
            <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            {formatScheduleInTimezone(
              job.scheduledAt,
              zone,
            )}
          </Field>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:w-40">
        <Button
          variant="outline"
          size="xl"
          className="w-full px-4 text-sm"
          onClick={() => navigate(`/jobs/${job.jobId}`)}
        >
          View Details
        </Button>
      </div>
    </div>
  );
}

function Field({
  label, children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase text-muted-foreground">{label}</p>
      <p className="flex items-start gap-1.5 break-words text-sm">{children}</p>
    </div>
  );
}

/** Skeleton rows while the dashboard loads, else the section's empty copy. */
function EmptyText({
  loading, children,
}: {
  loading: boolean;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div
        className="space-y-3"
        aria-busy="true"
      >
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}
