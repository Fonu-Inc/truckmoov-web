import type { ColumnDef } from "@tanstack/react-table";
import type {
  FilterDraft, FilterField,
} from "@/components/shadcn/platform-filter-popover";
import {
  Battery, Fuel, Search, Zap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import {
  buildEmptyDraft, PlatformFilterPopover,
} from "@/components/shadcn/platform-filter-popover";
import { getDummyChargingSessions } from "@/lib/sustainabilityDummyData";

type SessionRow = {
  id: string;
  vehicleName: string;
  charging_station: string | null;
  start_soc_percent: number | null;
  end_soc_percent: number | null;
  energy_kwh: number | null;
  duration_minutes: number | null;
  charging_type: string | null;
};

const sessionColumns: ColumnDef<SessionRow>[] = [
  {
    accessorKey: "vehicleName",
    header: "Vehicle",
  },
  {
    accessorKey: "charging_station",
    header: "Station",
    cell: ({ row }) => row.original.charging_station || "-",
  },
  {
    id: "soc",
    header: "SOC",
    enableSorting: false,
    meta: { className: "text-right" },
    cell: ({ row }) => `${row.original.start_soc_percent?.toFixed(0)}% → ${row.original.end_soc_percent?.toFixed(0)}%`,
  },
  {
    accessorKey: "energy_kwh",
    header: "Energy",
    meta: { className: "text-right" },
    cell: ({ row }) => `${row.original.energy_kwh?.toFixed(1)} kWh`,
  },
  {
    accessorKey: "duration_minutes",
    header: "Duration",
    meta: { className: "text-right" },
    cell: ({ row }) => `${row.original.duration_minutes} min`,
  },
  {
    accessorKey: "charging_type",
    header: "Type",
    meta: { className: "text-right" },
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="text-xs"
      >
        {row.original.charging_type}
      </Badge>
    ),
  },
];

export default function EvFleetPage() {
  const evSessions: any = { data: [] };
  const vehicles: any[] = [];
  const evCount = 0;

  const sessionsFilterFields: FilterField[] = [
    {
      key: "energy", label: "Energy (kWh)", type: "range", fromPlaceholder: "Min", toPlaceholder: "Max",
    },
    {
      key: "duration", label: "Duration (min)", type: "range", fromPlaceholder: "Min", toPlaceholder: "Max",
    },
    {
      key: "type", label: "Charging Type", type: "select",
      options: [
        {
          value: "DC Fast", label: "DC Fast",
        },
        {
          value: "AC Level 2", label: "AC Level 2",
        },
        {
          value: "AC Level 1", label: "AC Level 1",
        },
      ],
    },
  ];
  const [
    sessionsSearch,
    setSessionsSearch,
  ] = useState("");
  const [
    sessionsFilters,
    setSessionsFilters,
  ] = useState<FilterDraft>(buildEmptyDraft(sessionsFilterFields));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Battery className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">EV Vehicles</p>
                <p className="text-xl font-bold">{evCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Charging Sessions</p>
                <p className="text-xl font-bold">{evSessions.data?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Fuel className="h-8 w-8 text-info" />
              <div>
                <p className="text-sm text-muted-foreground">Total Energy</p>
                <p className="text-xl font-bold">
                  {(evSessions.data?.reduce(
                    (s: number, e: any) => s + (Number(e.energy_kwh) || 0),
                    0,
                  ) || 0).toFixed(1)}
                  {" "}
                  kWh
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        {(() => {
          const sourceRows: SessionRow[] = evSessions.data && evSessions.data.length > 0
            ? evSessions.data.map((s: any) => ({
                id: s.id,
                vehicleName: vehicles?.find(v => v.id === s.vehicle_id)?.registrationNumber || s.vehicle_id.slice(
                  0,
                  8,
                ),
                charging_station: s.charging_station,
                start_soc_percent: s.start_soc_percent,
                end_soc_percent: s.end_soc_percent,
                energy_kwh: s.energy_kwh,
                duration_minutes: s.duration_minutes,
                charging_type: s.charging_type,
              }))
            : getDummyChargingSessions(12);

          const energyMin = sessionsFilters.energy?.enabled ? Number(sessionsFilters.energy.from) : null;
          const energyMax = sessionsFilters.energy?.enabled ? Number(sessionsFilters.energy.to) : null;
          const durMin = sessionsFilters.duration?.enabled ? Number(sessionsFilters.duration.from) : null;
          const durMax = sessionsFilters.duration?.enabled ? Number(sessionsFilters.duration.to) : null;
          const typeVal = sessionsFilters.type?.enabled ? sessionsFilters.type.value : null;
          const q = sessionsSearch.trim().toLowerCase();

          const filtered = sourceRows.filter((s) => {
            if (q && !`${s.vehicleName} ${s.charging_station ?? ""}`.toLowerCase().includes(q))
              return false;
            const e = Number(s.energy_kwh) || 0;
            if (energyMin != null && !Number.isNaN(energyMin) && e < energyMin)
              return false;
            if (energyMax != null && !Number.isNaN(energyMax) && e > energyMax)
              return false;
            const d = Number(s.duration_minutes) || 0;
            if (durMin != null && !Number.isNaN(durMin) && d < durMin)
              return false;
            if (durMax != null && !Number.isNaN(durMax) && d > durMax)
              return false;
            if (typeVal && s.charging_type !== typeVal)
              return false;
            return true;
          });

          return (
            <>
              <CardHeader className="space-y-1">
                <div className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Recent Charging Sessions</CardTitle>
                  <ExportButton
                    rows={filtered}
                    filename="charging-sessions"
                    columns={[
                      {
                        header: "Vehicle", accessor: r => r.vehicleName,
                      },
                      {
                        header: "Station", accessor: r => r.charging_station ?? "",
                      },
                      {
                        header: "Start SOC %", accessor: r => r.start_soc_percent ?? "",
                      },
                      {
                        header: "End SOC %", accessor: r => r.end_soc_percent ?? "",
                      },
                      {
                        header: "Energy (kWh)", accessor: r => r.energy_kwh ?? "",
                      },
                      {
                        header: "Duration (min)", accessor: r => r.duration_minutes ?? "",
                      },
                      {
                        header: "Type", accessor: r => r.charging_type ?? "",
                      },
                    ]}
                  />
                </div>
                <CardDescription className="text-xs">Latest EV charging activity across stations and vehicles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by vehicle or station..."
                      value={sessionsSearch}
                      onChange={e => setSessionsSearch(e.target.value)}
                      className="pl-8 h-9"
                    />
                  </div>
                  <PlatformFilterPopover
                    entity="charging sessions"
                    fields={sessionsFilterFields}
                    value={sessionsFilters}
                    onApply={setSessionsFilters}
                    onReset={() => setSessionsFilters(buildEmptyDraft(sessionsFilterFields))}
                  />
                </div>

                <div className="overflow-x-auto">
                  <DataTable
                    columns={sessionColumns}
                    data={filtered.slice(
                      0,
                      15,
                    )}
                    emptyState="No sessions match your filters"
                  />
                </div>
              </CardContent>
            </>
          );
        })()}
      </Card>
    </div>
  );
}
