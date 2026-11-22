import type { InstallationConfirmation } from "@truckmoov/api/auth";
import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getInstallationStatusQueryOptions, useConfirmInstallation,
} from "@truckmoov/api/auth";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  Calendar, Check, Clock, Cpu, Loader2, Mail, MapPin, Phone,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent,
} from "@/components/shadcn/card";
import { WelcomeDialog } from "@/features/get-started/components/ui/WelcomeDialog";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    key: "confirmed", label: "Installation schedule confirmed",
  },
  {
    key: "assigned", label: "Installer assigned",
  },
  {
    key: "in_progress", label: "Installation in progress",
  },
  {
    key: "completed", label: "Installation completed",
  },
];

// Installation order status → how many STEPS are done.
const STEPS_DONE: Record<string, number> = {
  unassigned: 1,
  assigned: 2,
  scheduled: 2,
  in_progress: 3,
  overdue: 2,
  issue_reported: 3,
  completed: 4,
};

const STATUS_LABEL: Record<string, string> = {
  unassigned: "Awaiting installer",
  assigned: "Installer assigned",
  scheduled: "Installer assigned",
  in_progress: "Installation in progress",
  overdue: "Overdue",
  issue_reported: "Issue reported",
  completed: "Installation completed",
  cancelled: "Cancelled",
};

function Detail({
  icon: Icon, label, value,
}: {
  icon: LucideIcon; label: string; value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function GetStartedPage() {
  const statusQuery = useQuery({
    ...getInstallationStatusQueryOptions(),
    refetchInterval: 60 * 1000,
  });
  const confirm = useConfirmInstallation();
  const [
    result,
    setResult,
  ] = useState<InstallationConfirmation | null>(null);

  if (statusQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (statusQuery.isError)
    return <p className="py-20 text-center text-sm text-destructive">{statusQuery.error.message}</p>;

  const {
    order, installer, progress,
  } = statusQuery.data!.data;
  const stage = progress.find(step => step.current)?.stage;
  const fleetReady = stage === "fleet_ready";
  const done = order ? STEPS_DONE[order.status] ?? 0 : 0;
  const statusLabel = fleetReady
    ? "Fleet live"
    : order ? STATUS_LABEL[order.status] ?? order.status.replace(
      /_/g,
      " ",
    ) : "Not scheduled";

  const onConfirm = () => confirm.mutate(
    undefined,
    {
      onSuccess: (res) => {
        setResult(res.data);
        if (res.data.stage === "fleet_ready")
          toast.success(res.message);
        else
          toast.error(res.message);
      },
      onError: error => toast.error(error.message),
    },
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <WelcomeDialog />
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <Badge
          variant="secondary"
          className="mb-3 rounded-full"
        >
          {fleetReady ? "Setup complete" : "Setup in progress"}
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome to Fleet Pro</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {fleetReady
            ? "Every device is reporting. Your fleet is live."
            : "Your fleet setup is underway. Track your installation status from here."}
        </p>
        {fleetReady && (
          <Button
            asChild
            className="mt-4"
          >
            <Link to="/">Go to Overview</Link>
          </Button>
        )}
      </div>

      {!order
        ? (
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardContent className="p-5 text-sm text-muted-foreground">
                We'll confirm your installation date soon. You can watch each step here once it's booked.
              </CardContent>
            </Card>
          )
        : (
            <>
              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-medium tracking-tight">Installation status</h2>
                    <Badge
                      variant="outline"
                      className="rounded-full text-xs font-normal"
                    >
                      {statusLabel}
                    </Badge>
                  </div>
                  <ol className="flex items-start">
                    {STEPS.map((step, i) => {
                      const isDone = i < done;
                      const active = i === done && order.status !== "cancelled";
                      return (
                        <li
                          key={step.key}
                          className={cn(
                            "flex items-start",
                            i < STEPS.length - 1 && "flex-1",
                          )}
                        >
                          <div className="flex flex-col items-center gap-1.5">
                            <span
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-500",
                                isDone
                                  ? "border-success bg-success text-success-foreground"
                                  : active
                                    ? "border-primary text-primary"
                                    : "border-border text-muted-foreground",
                              )}
                            >
                              {isDone ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                            </span>
                            <span className={cn(
                              "text-center text-xs",
                              isDone ? "font-medium text-foreground" : "text-muted-foreground",
                            )}
                            >
                              {step.label}
                            </span>
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className="mx-2 mt-3 h-px flex-1 overflow-hidden rounded-full bg-border">
                              <div className={cn(
                                "h-full rounded-full bg-success transition-all duration-1000 ease-out",
                                i + 1 < done ? "w-full" : "w-0",
                              )}
                              />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/30 px-5 py-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Installation order</p>
                    <p className="text-base font-semibold">{order.orderNumber}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="rounded-full"
                  >
                    {statusLabel}
                  </Badge>
                </div>
                <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                  <Detail
                    icon={Calendar}
                    label="Installation date"
                    value={formatWithPattern(
                      order.scheduledAt,
                      "EEE, MMM d, yyyy",
                    )}
                  />
                  <Detail
                    icon={Clock}
                    label="Installation time"
                    value={order.timeSlotLabel}
                  />
                  <Detail
                    icon={MapPin}
                    label="Location"
                    value={order.location}
                  />
                  <Detail
                    icon={Phone}
                    label="Site contact"
                    value={`${order.siteContactName} · ${order.siteContactPhone}`}
                  />
                  <Detail
                    icon={Cpu}
                    label="Devices"
                    value={`${order.deviceCount} device${order.deviceCount === 1 ? "" : "s"}`}
                  />
                  {order.completedAt && (
                    <Detail
                      icon={Check}
                      label="Completed"
                      value={formatWithPattern(
                        order.completedAt,
                        "MMM d, yyyy 'at' HH:mm",
                      )}
                    />
                  )}
                </CardContent>

                {installer && (
                  <div className="border-t border-border/60 bg-primary/5 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {installer.photoUrl
                        ? (
                            <img
                              src={installer.photoUrl}
                              alt=""
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          )
                        : (
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-base font-semibold text-primary">
                              {installer.fullName.split(" ").map(p => p[0]).join("")}
                            </span>
                          )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Installer assigned</p>
                        <p className="text-base font-semibold text-foreground">{installer.fullName}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Detail
                        icon={Phone}
                        label="Phone number"
                        value={installer.phoneNumber}
                      />
                      <Detail
                        icon={Mail}
                        label="Email address"
                        value={installer.email}
                      />
                    </div>
                  </div>
                )}
              </Card>

              {stage === "connectivity_verification" && (
                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-medium tracking-tight">Confirm your installation</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          We check every fitted device is reporting before your fleet goes live.
                        </p>
                      </div>
                      <Button
                        onClick={onConfirm}
                        disabled={confirm.isPending}
                      >
                        {confirm.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Check devices
                      </Button>
                    </div>
                    {result && result.failures.length > 0 && (
                      <ul className="space-y-1 text-sm">
                        {result.failures.map(failure => (
                          <li
                            key={failure.deviceId}
                            className="text-destructive"
                          >
                            {failure.imei ?? failure.deviceId}
                            {failure.model && ` (${failure.model})`}
                            {" — "}
                            {failure.reason}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
    </div>
  );
}
