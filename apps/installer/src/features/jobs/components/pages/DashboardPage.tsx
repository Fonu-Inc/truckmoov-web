import type { ReactNode } from "react";
import type { InstallationJobStatus } from "@/features/jobs/demoData";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { JobStatusBadge } from "@/features/jobs/components/ui/JobStatusBadge";
import { JOB_STATUS_LABEL } from "@/features/jobs/demoData";
import {
  useJobsStore,
  useMyJobs,
  useMyNotifications,
} from "@/features/jobs/stores/jobsStore";

const today = new Date().toISOString().slice(
  0,
  10,
);

const BREAKDOWN: InstallationJobStatus[] = [
  "accepted",
  "scheduled",
  "in_progress",
  "completed",
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const installer = useJobsStore(s => s.installer);
  const myJobs = useMyJobs();
  const myNotifications = useMyNotifications();

  const count = (s: InstallationJobStatus) => myJobs.filter(j => j.status === s).length;
  const todays = myJobs.filter(j => j.scheduledDate === today);
  const upcoming = myJobs.filter(j =>
    j.scheduledDate > today && [
      "accepted",
      "scheduled",
    ].includes(j.status));
  const issues = myJobs.filter(j => [
    "issue_reported",
    "unable_to_complete",
  ].includes(j.status)).length;

  const maxCount = Math.max(
    1,
    ...BREAKDOWN.map(count),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {installer.city}
          ,
          {" "}
          {installer.state}
          {" · "}
          {installer.id}
        </p>
        <Badge
          variant="outline"
          className="text-[10px]"
        >
          Demo data
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Newly Assigned"
          value={count("accepted")}
          icon={CheckSquare}
        />
        <StatCard
          title="Scheduled Today"
          value={todays.length}
          icon={CalendarClock}
        />
        <StatCard
          title="Upcoming"
          value={upcoming.length}
          icon={ClipboardList}
        />
        <StatCard
          title="In Progress"
          value={count("in_progress")}
          icon={Wrench}
          variant="warning"
        />
        <StatCard
          title="Completed"
          value={count("completed")}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Issues Reported"
          value={issues}
          icon={Bell}
          variant="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Jobs</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {todays.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground md:col-span-2">
              No installations scheduled for today.
            </p>
          )}
          {todays.map(j => (
            <div
              key={j.id}
              className="space-y-3 rounded-2xl border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{j.id}</p>
                <JobStatusBadge status={j.status} />
              </div>
              <p className="text-sm font-medium">{j.customer.name}</p>
              <p className="text-xs text-muted-foreground">
                {j.customer.address}
                ,
                {" "}
                {j.customer.city}
                ,
                {" "}
                {j.customer.state}
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Tile
                  label="Date / time"
                  value={`${j.scheduledDate} · ${j.scheduledTime}`}
                />
                <Tile
                  label="Vehicles"
                  value="1"
                />
                <Tile
                  label="Devices"
                  value="1"
                />
              </div>
              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={() => navigate(`/jobs/${j.id}`)}
              >
                View Job
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {BREAKDOWN.map(s => (
              <div
                key={s}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between text-sm">
                  <span>{JOB_STATUS_LABEL[s]}</span>
                  <span className="tabular-nums text-muted-foreground">{count(s)}</span>
                </div>
                <Progress value={(count(s) / maxCount) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Notifications</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/notifications")}
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {myNotifications.slice(
              0,
              5,
            ).map(n => (
              <div
                key={n.id}
                className="flex gap-3 rounded-xl border p-3"
              >
                <Bell className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </div>
              </div>
            ))}
            {myNotifications.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
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
    <div className="rounded-xl border p-2">
      <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="truncate text-xs font-medium">{value}</p>
    </div>
  );
}
