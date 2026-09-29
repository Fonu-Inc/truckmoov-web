import type {
  DashboardJob, DashboardSection, InstallerDashboard, InstallerJobStatus,
} from "@truckmoov/api/auth";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { ChartConfig } from "@/components/shadcn/chart";
import {
  useAcceptInstallerJob,
  useInstallerDashboard,
  useInstallerDisplayPreferences,
  useInstallerNotifications,
  useInstallerOptions,
} from "@truckmoov/api/auth";
import {
  formatDateOnlyInTimezone,
  formatMonthYear,
  formatRelative,
  formatTimeInTimezone,
} from "@truckmoov/app-core/utils/time-utils";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Hourglass,
  Inbox,
  Lightbulb,
  Percent,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
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
import { RejectOfferForm } from "@/features/jobs/components/forms/RejectOfferForm";

// Display Preferences default (TRU-FE-21) until the installer picks another zone.
const DEFAULT_ZONE = "Africa/Lagos";

const STATUS_LABEL: Record<InstallerJobStatus, string> = {
  unassigned: "Unassigned",
  assigned: "Offer",
  scheduled: "Scheduled",
  in_progress: "In progress",
  overdue: "Overdue",
  issue_reported: "Issue reported",
  completed: "Completed",
  cancelled: "Cancelled",
};

const ACTIVITY_LABEL: Record<InstallerDashboard["recentActivity"][number]["type"], string> = {
  offered: "New offer",
  accepted: "Accepted",
  started: "Started",
  issue_reported: "Issue reported",
  completed: "Completed",
  cancelled: "Cancelled",
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
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm text-muted-foreground">Unable to load your dashboard.</p>
          <Button
            variant="link"
            onClick={() => dashboard.refetch()}
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const data = dashboard.data?.data;
  const loading = dashboard.isLoading;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Jobs"
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
          icon={Hourglass}
          variant="warning"
          loading={loading}
        />
        <StatCard
          title="Success Rate"
          value={`${data?.counters.successRate ?? 0}%`}
          icon={Percent}
          loading={loading}
        />
      </div>

      <JobSection
        title="New Offers"
        icon={Inbox}
        section={data?.offers}
        loading={loading}
        zone={zone}
        empty="No offers waiting. New installation jobs offered to you appear here."
        renderActions={job => (
          <OfferActions
            job={job}
            onReject={() => setRejecting(job)}
          />
        )}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <JobSection
          title="Today's Jobs"
          icon={CalendarClock}
          section={data?.todaysJobs}
          loading={loading}
          zone={zone}
          empty="No installations scheduled for today."
        />
        <JobSection
          title="Upcoming Jobs"
          icon={ClipboardList}
          section={data?.upcomingJobs}
          loading={loading}
          zone={zone}
          empty="Nothing scheduled from tomorrow onward."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={activityChartConfig}
              className="h-[260px] w-full"
            >
              <BarChart data={(data?.activityOverTime ?? []).map(m => ({
                ...m,
                // Mid-month so no time zone can tip the label into the previous month.
                label: formatMonthYear(`${m.month}-15`),
              }))}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="completed"
                  fill="var(--color-completed)"
                  radius={4}
                />
                <Bar
                  dataKey="inProgress"
                  fill="var(--color-inProgress)"
                  radius={4}
                />
                <Bar
                  dataKey="scheduled"
                  fill="var(--color-scheduled)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.recentActivity.length
              ? data.recentActivity.map(a => (
                  <div
                    key={`${a.jobId}-${a.type}-${a.occurredAt}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>
                      <span className="font-medium">{ACTIVITY_LABEL[a.type]}</span>
                      <span className="text-muted-foreground">
                        {" · "}
                        {a.jobNumber}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(a.occurredAt)}</span>
                  </div>
                ))
              : <EmptyText loading={loading}>No activity yet.</EmptyText>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <NotificationsPreview />
        <FieldTips />
      </div>

      <RejectOfferForm
        offer={rejecting}
        onClose={() => setRejecting(null)}
      />
    </div>
  );
}

function JobSection({
  title, icon: Icon, section, loading, zone, empty, renderActions,
}: {
  title: string;
  icon: LucideIcon;
  section?: DashboardSection;
  loading: boolean;
  zone: string;
  empty: string;
  renderActions?: (job: DashboardJob) => ReactNode;
}) {
  const navigate = useNavigate();
  const more = section ? section.total - section.items.length : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        {!!section?.total && <Badge variant="secondary">{section.total}</Badge>}
      </CardHeader>
      <CardContent className="space-y-3">
        {section?.items.length
          ? section.items.map(job => (
              <div
                key={job.jobId}
                className="space-y-3 rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{job.jobNumber}</span>
                      <Badge variant="outline">{STATUS_LABEL[job.status]}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm">{job.companyName}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {[
                        job.address,
                        job.city,
                        job.state,
                      ].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  {renderActions?.(job) ?? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/jobs/${job.jobId}`)}
                    >
                      View Job
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Tile
                    label="Date"
                    value={formatDateOnlyInTimezone(
                      job.scheduledAt,
                      zone,
                    )}
                  />
                  <Tile
                    label="Time slot"
                    value={`${formatTimeInTimezone(
                      job.scheduledAt,
                      zone,
                    )} – ${formatTimeInTimezone(
                      job.scheduledUntil,
                      zone,
                    )}`}
                  />
                  <Tile
                    label="Site contact"
                    value={`${job.siteContactName} · ${job.siteContactPhone}`}
                  />
                </div>
              </div>
            ))
          : <EmptyText loading={loading}>{empty}</EmptyText>}
        {more > 0 && (
          <p className="text-xs text-muted-foreground">
            +
            {more}
            {" "}
            more
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function OfferActions({
  job, onReject,
}: {
  job: DashboardJob;
  onReject: () => void;
}) {
  const accept = useAcceptInstallerJob();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={onReject}
        disabled={accept.isPending}
      >
        Reject
      </Button>
      <Button
        size="sm"
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
    </div>
  );
}

function NotificationsPreview() {
  const navigate = useNavigate();
  const notifications = useInstallerNotifications(3);
  const page = notifications.data?.data;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          Notifications
          {!!page?.unreadCount && <Badge>{page.unreadCount}</Badge>}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/notifications")}
        >
          View all
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {page?.items.length
          ? page.items.map(n => (
              <div
                key={n.id}
                className="rounded-xl border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={n.read ? "text-sm" : "text-sm font-medium"}>{n.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(n.createdAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{n.message}</p>
              </div>
            ))
          : <EmptyText loading={notifications.isLoading}>No notifications yet.</EmptyText>}
      </CardContent>
    </Card>
  );
}

function FieldTips() {
  const tips = useInstallerOptions().data?.data.fieldTips ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
          Field Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {tips.map(tip => <li key={tip}>{tip}</li>)}
        </ul>
      </CardContent>
    </Card>
  );
}

function EmptyText({
  loading, children,
}: {
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">
      {loading ? "Loading…" : children}
    </p>
  );
}

function Tile({
  label, value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border p-2">
      <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="truncate text-xs font-medium">{value}</p>
    </div>
  );
}
