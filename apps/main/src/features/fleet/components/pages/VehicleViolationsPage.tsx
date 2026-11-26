import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  useDrivers, useVehicles, useViolations,
} from "@truckmoov/api/fleet";
import {
  Repeat, ShieldAlert, TriangleAlert, Truck,
} from "lucide-react";
import {
  useCallback, useMemo, useState,
} from "react";
import { Skeleton } from "@/components/shadcn/skeleton";
import { VehicleViolationsTab } from "@/features/fleet/components/ui/violations/VehicleViolationsTab";
import { ViolationEventsTab } from "@/features/fleet/components/ui/violations/ViolationEventsTab";
import { ViolationRulesTab } from "@/features/fleet/components/ui/violations/ViolationRulesTab";
import { CARD_CLASS } from "@/features/fleet/components/ui/violations/violationsUi";
import { PageHeader } from "@/shared/components/layout/PageHeader";

const TAB_TRIGGER_CLASS = "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
const TAB_CONTENT_CLASS = "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function Kpi({
  icon: Icon, label, value, tint,
}: {
  icon: React.ElementType; label: string; value: string | null; tint: "primary" | "destructive" | "warning" | "accent";
}) {
  const chip = {
    primary: "bg-primary/10",
    destructive: "bg-destructive/10",
    warning: "bg-warning/10",
    accent: "bg-accent/10",
  }[tint];
  const icon = {
    primary: "text-primary",
    destructive: "text-destructive",
    warning: "text-warning",
    accent: "text-accent",
  }[tint];
  return (
    <div className={CARD_CLASS}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${chip} shrink-0`}>
            <Icon className={`h-5 w-5 ${icon}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            {value === null
              ? <Skeleton className="mt-1 h-7 w-12" />
              : <p className="text-xl font-bold mt-1 truncate">{value}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/** `/fleet/violations` — the design app's Violations tab. */
export default function VehicleViolationsPage() {
  const violationsQuery = useViolations({ entity: "vehicles" });
  const vehiclesQuery = useVehicles();
  const driversQuery = useDrivers();
  const [
    tab,
    setTab,
  ] = useState("rules");
  const [
    eventsSearch,
    setEventsSearch,
  ] = useState("");

  const summary = violationsQuery.data?.data;
  const subjects = useMemo(
    () => summary?.subjects ?? [],
    [summary?.subjects],
  );
  const items = useMemo(
    () => summary?.items ?? [],
    [summary?.items],
  );

  const vehiclesById = useMemo(
    () => new Map((vehiclesQuery.data?.data ?? []).map(v => [
      v.id,
      v,
    ])),
    [vehiclesQuery.data?.data],
  );
  const driversById = useMemo(
    () => new Map((driversQuery.data?.data ?? []).map(d => [
      d.id,
      d.name,
    ])),
    [driversQuery.data?.data],
  );

  const vehicle = useCallback(
    (id: string) => {
      const v = vehiclesById.get(id);
      return {
        name: v
          ? [
              v.make,
              v.model,
            ].filter(Boolean).join(" ") || "-"
          : "-",
        plate: v?.plateNumber || v?.registrationNumber || id,
      };
    },
    [vehiclesById],
  );
  const vehiclePlate = useCallback(
    (id: string | null) => (id ? vehicle(id).plate : "-"),
    [vehicle],
  );
  const driverName = useCallback(
    (id: string | null) => (id && driversById.get(id)) || "-",
    [driversById],
  );

  const loading = violationsQuery.isLoading;
  const queryState = {
    isLoading: loading,
    isError: violationsQuery.isError,
    onRetry: () => void violationsQuery.refetch(),
  };

  return (
    <>
      <PageHeader
        title="Vehicle Violations"
        description="Recorded driving incidents, affected Drivers, and their current status."
      />
      <div className="mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Kpi
              icon={TriangleAlert}
              label="Total Violations"
              value={loading ? null : `${summary?.total ?? 0}`}
              tint="primary"
            />
            <Kpi
              icon={ShieldAlert}
              label="Critical Violations"
              value={loading ? null : `${summary?.criticalCount ?? 0}`}
              tint="destructive"
            />
            <Kpi
              icon={Truck}
              label="Vehicles With Violations"
              value={loading ? null : `${summary?.subjectsWithViolations ?? 0}`}
              tint="warning"
            />
            <Kpi
              icon={Repeat}
              label="Repeat Violations"
              value={loading ? null : `${summary?.repeatOffenders ?? 0}`}
              tint="accent"
            />
          </div>

          <TabsPrimitive.Root
            value={tab}
            onValueChange={setTab}
          >
            <TabsPrimitive.List className="inline-flex items-center justify-center rounded-xl p-1 text-muted-foreground bg-muted/50 flex-wrap h-auto">
              <TabsPrimitive.Trigger
                value="rules"
                className={TAB_TRIGGER_CLASS}
              >
                Violation Rules
              </TabsPrimitive.Trigger>
              <TabsPrimitive.Trigger
                value="vehicles"
                className={TAB_TRIGGER_CLASS}
              >
                Vehicle Violations
              </TabsPrimitive.Trigger>
              <TabsPrimitive.Trigger
                value="events"
                className={TAB_TRIGGER_CLASS}
              >
                Violation Events
              </TabsPrimitive.Trigger>
            </TabsPrimitive.List>
            <TabsPrimitive.Content
              value="rules"
              className={`${TAB_CONTENT_CLASS} mt-4`}
            >
              <ViolationRulesTab entity="vehicles" />
            </TabsPrimitive.Content>
            <TabsPrimitive.Content
              value="vehicles"
              className={`${TAB_CONTENT_CLASS} space-y-6 mt-4`}
            >
              <VehicleViolationsTab
                subjects={subjects}
                items={items}
                vehicle={vehicle}
                {...queryState}
                onViewDetails={(plate) => {
                  setEventsSearch(plate);
                  setTab("events");
                }}
              />
            </TabsPrimitive.Content>
            <TabsPrimitive.Content
              value="events"
              className={`${TAB_CONTENT_CLASS} mt-4`}
            >
              <ViolationEventsTab
                items={items}
                driverName={driverName}
                vehiclePlate={vehiclePlate}
                search={eventsSearch}
                onSearchChange={setEventsSearch}
                {...queryState}
              />
            </TabsPrimitive.Content>
          </TabsPrimitive.Root>
        </div>
      </div>
    </>
  );
}
