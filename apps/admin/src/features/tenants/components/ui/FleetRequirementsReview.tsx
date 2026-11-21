import type { SystemOnboardingApplicationDetail } from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import {
  Cpu,
  Eye,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";

type FleetDetailItem = {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  rows: Array<[string, string]>;
  noDetails?: boolean;
};

const dash = (value: string | null | undefined) => value || "—";

/**
 * Vehicles submitted and the devices requested by the organization — fleetflow's
 * FleetRequirementsReview in its read-only form (the only form the application review uses).
 */
export function FleetRequirementsReview({
  vehicles: submittedVehicles,
  deviceRequests: submittedRequests,
}: Pick<SystemOnboardingApplicationDetail, "vehicles" | "deviceRequests">) {
  const [
    detail,
    setDetail,
  ] = useState<FleetDetailItem | null>(null);

  const vehicles: FleetDetailItem[] = submittedVehicles.map(v => ({
    id: v.id,
    title: `${v.make} ${v.model}`.trim(),
    subtitle: v.registrationNumber,
    badge: "Submitted",
    // ponytail: year, load capacity, engine/chassis numbers, colour, engine capacity, odometer,
    // purchase type and licence plan aren't on the application's vehicle rows yet.
    rows: [
      [
        "Registration number",
        dash(v.registrationNumber),
      ],
      [
        "Make",
        dash(v.make),
      ],
      [
        "Model",
        dash(v.model),
      ],
      [
        "Year",
        "—",
      ],
      [
        "Vehicle type",
        dash(v.vehicleType),
      ],
      [
        "Load capacity",
        "—",
      ],
      [
        "Engine number",
        "—",
      ],
      [
        "Chassis number",
        "—",
      ],
      [
        "Colour",
        "—",
      ],
      [
        "Engine capacity",
        "—",
      ],
      [
        "Odometer",
        "—",
      ],
      [
        "Purchase type",
        "—",
      ],
      [
        "Licence plan",
        "—",
      ],
    ],
  }));

  const deviceRequests: FleetDetailItem[] = submittedRequests.map(r => ({
    id: r.id,
    title: `${r.quantity} × device${r.quantity === 1 ? "" : "s"} requested`,
    subtitle: r.useCase ? `Use case: ${r.useCase}` : "Use case not specified",
    noDetails: true,
    rows: [
      [
        "Quantity of devices requested",
        String(r.quantity),
      ],
      [
        "Use case",
        r.useCase || "—",
      ],
      [
        "Notes",
        "—",
      ],
    ],
  }));

  const row = (item: FleetDetailItem, kind?: string) => (
    <div
      key={item.id}
      className="flex flex-col gap-3 rounded-xl border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {item.badge && (
          <Badge
            variant="outline"
            className="rounded-full text-[11px]"
          >
            {item.badge}
          </Badge>
        )}
        {/* ponytail: mock data from fleetflow parity port — wire to packages/api
            (no per-request decision on device requests; the reference shows "Pending review" until one is made). */}
        {kind && (
          <Badge
            variant="outline"
            className="rounded-full text-[11px]"
          >
            Pending review
          </Badge>
        )}
        {!item.noDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDetail(item)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View details
          </Button>
        )}
      </div>
    </div>
  );

  const section = (
    label: string,
    icon: ReactNode,
    items: FleetDetailItem[],
    empty: string,
    opts?: {
      kind?: string; hint?: string;
    },
  ) => (
    <div className="space-y-3 rounded-2xl border border-border/60 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">
            {opts?.hint ?? `${items.length} item${items.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>
      {items.length === 0
        ? <p className="text-sm text-muted-foreground">{empty}</p>
        : (
            <div className="space-y-2">
              {items.map(item => row(
                item,
                opts?.kind,
              ))}
            </div>
          )}
    </div>
  );

  return (
    <>
      <div className="space-y-4">
        {section(
          "Vehicles",
          <Truck className="h-4 w-4" />,
          vehicles,
          "No vehicles submitted.",
        )}
        {section(
          "Requested devices",
          <Cpu className="h-4 w-4" />,
          deviceRequests,
          "No devices requested.",
          {
            kind: "Device",
            hint: "Quantity requested and use case, as submitted by the customer.",
          },
        )}
      </div>

      <Dialog
        open={!!detail}
        onOpenChange={o => !o && setDetail(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.title}</DialogTitle>
            <DialogDescription>{detail?.subtitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {detail?.rows.map(([
              label,
              value,
            ]) => (
              <div
                key={label}
                className="flex justify-between gap-4 border-b border-border/40 py-2 text-sm last:border-0"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="text-right font-medium break-all">{value}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
