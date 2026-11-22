import type { ReactNode } from "react";
import type {
  SimLookups,
  SimRow,
} from "./simInventoryShared";
import { useQuery } from "@tanstack/react-query";
import { getSystemSimQueryOptions } from "@truckmoov/api/auth";
import {
  formatDate, formatRelative,
} from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowUpDown,
  Pencil,
  Wifi,
} from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog as Sheet,
  DialogContent as SheetContent,
  DialogDescription as SheetDescription,
  DialogHeader as SheetHeader,
  DialogTitle as SheetTitle,
} from "@/components/shadcn/dialog";
import { Progress } from "@/components/shadcn/progress";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import {
  SimSignalIcon,
  SimStatusBadge,
} from "./SimInventoryBadges";
import {
  EMPTY_VALUE,
  formatNgn,
  getUsagePercentage,
  mapSimToRow,
  PLAN_LABELS,
} from "./simInventoryShared";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function UsageBar({
  label,
  usage,
  limit,
  unit,
}: {
  label: string;
  usage: number;
  limit: number;
  unit?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span>{label}</span>
        <span>
          {usage}
          {" / "}
          {limit}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <Progress
        value={getUsagePercentage(
          usage,
          limit,
        )}
        className="h-2"
      />
    </div>
  );
}

export type SimDetailsSheetProps = {
  sim: SimRow | null;
  lookups: SimLookups;
  onOpenChange: (open: boolean) => void;
  onEdit: (sim: SimRow) => void;
  onAssign: (sim: SimRow) => void;
};

export function SimDetailsSheet({
  sim,
  lookups,
  onOpenChange,
  onEdit,
  onAssign,
}: SimDetailsSheetProps) {
  const detailQuery = useQuery({
    ...getSystemSimQueryOptions(sim?.id ?? ""),
    enabled: Boolean(sim),
  });
  const lastActivity = detailQuery.data?.data?.lastActivity ?? null;
  const expiryDate = detailQuery.data?.data?.expiryDate ?? null;
  const details = useMemo(
    () => detailQuery.data?.data ? mapSimToRow(
      detailQuery.data.data,
      lookups,
    ) : sim,
    [
      detailQuery.data,
      lookups,
      sim,
    ],
  );

  return (
    <Sheet
      open={Boolean(sim)}
      onOpenChange={onOpenChange}
    >
      <SheetContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Wifi className="h-6 w-6 text-primary" />
            </div>
            SIM Details
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            {details && <SimStatusBadge status={details.status} />}
            <Badge variant="outline">{details?.carrier}</Badge>
            {details?.roaming && (
              <Badge className="bg-warning/10 text-warning">Roaming</Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        {details && (
          <ScrollArea className="h-[calc(100vh-180px)] mt-6">
            <div className="space-y-6 pr-4">
              <Section title="SIM Information">
                <Field label="ICCID"><span className="font-mono">{details.iccid}</span></Field>
                <Field label="Phone Number">{details.msisdn ?? EMPTY_VALUE}</Field>
                <Field label="IMSI"><span className="font-mono">{details.imsi ?? EMPTY_VALUE}</span></Field>
                <Field label="Plan">{PLAN_LABELS[details.plan] ?? details.plan}</Field>
              </Section>

              <Separator />

              <Section title="Assignment">
                <Field label="Tenant">{details.tenant || "Unassigned"}</Field>
                <Field label="Device">
                  {details.deviceId ? details.deviceId.slice(
                    0,
                    8,
                  ) : "None"}
                </Field>
                <Field label="Device IMEI"><span className="font-mono">{details.deviceImei || EMPTY_VALUE}</span></Field>
              </Section>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Usage</h4>
                <div className="space-y-4">
                  <UsageBar
                    label="Data Usage"
                    usage={details.dataUsage}
                    limit={details.dataLimit}
                    unit="MB"
                  />
                  {details.smsLimit > 0 && (
                    <UsageBar
                      label="SMS Usage"
                      usage={details.smsUsage}
                      limit={details.smsLimit}
                    />
                  )}
                </div>
              </div>

              <Separator />

              <Section title="Connection">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Signal Strength</span>
                  <div className="flex items-center gap-2">
                    <SimSignalIcon
                      strength={details.signalStrength}
                      status={details.status}
                    />
                    <span>{details.signalStrength === null ? EMPTY_VALUE : `${details.signalStrength}%`}</span>
                  </div>
                </div>
                <Field label="Network Type">{details.networkType ?? EMPTY_VALUE}</Field>
                <Field label="Last Activity">{lastActivity ? formatRelative(lastActivity) : "Never"}</Field>
              </Section>

              <Separator />

              <Section title="Billing">
                <Field label="Monthly Cost"><span className="font-medium">{formatNgn(details.monthlyCost)}</span></Field>
                <Field label="Activation Date">
                  {formatDate(
                    details.activationDate,
                    "Not activated",
                  )}
                </Field>
                <Field label="Expiry Date">{formatDate(expiryDate)}</Field>
              </Section>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => onAssign(details)}
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {details.tenantId ? "Reassign" : "Assign"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onEdit(details)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
