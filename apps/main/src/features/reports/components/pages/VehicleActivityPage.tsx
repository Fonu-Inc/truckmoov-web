import type { QueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type {
  ReportVehicleTrip, VehicleActivityQuery,
} from "@truckmoov/api/fleet";
import {
  useQuery, useQueryClient,
} from "@tanstack/react-query";
import { getVehicleActivityQueryOptions } from "@truckmoov/api/fleet";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  CheckCircle, CreditCard, MapPin, Route, Search,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/shadcn/badge";
import { DataTable } from "@/components/shadcn/data-table";
import { Input } from "@/components/shadcn/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";

import { useCurrency } from "@/contexts/CurrencyContext";
import { useDebouncedValue } from "@/features/data-bundle/utils/dataBundle";
import { exportToCSV } from "@/features/reports/utils/reportsUtils";
import {
  SectionCard, SummaryStat,
} from "../ui/ReportsShared";

const PAGE_SIZE = 50;
const EXPORT_PAGE_SIZE = 200;

// Server-paged: sorting one page would mislead, so every column opts out.
const TRIP_COLUMNS: ColumnDef<ReportVehicleTrip>[] = [
  {
    accessorKey: "reference",
    header: "Reference",
    enableSorting: false,
    cell: ({ row }) => <span className="font-medium">{row.original.reference}</span>,
  },
  {
    accessorKey: "date",
    header: "Date",
    enableSorting: false,
    meta: { className: "text-sm text-muted-foreground" },
    cell: ({ row }) => formatWithPattern(
      row.original.date,
      "dd MMM yyyy",
    ),
  },
  {
    accessorKey: "vehicle",
    header: "Vehicle",
    enableSorting: false,
    cell: ({ row }) => row.original.vehicle ?? "Unassigned",
  },
  {
    accessorKey: "driver",
    header: "Driver",
    enableSorting: false,
    cell: ({ row }) => row.original.driver ?? "Unassigned",
  },
  {
    id: "route",
    header: "Route",
    enableSorting: false,
    meta: { className: "max-w-[280px] truncate text-sm" },
    cell: ({ row }) => `${row.original.from ?? "—"} → ${row.original.to ?? "—"}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => (
      <Badge
        variant="secondary"
        className="rounded-full capitalize"
      >
        {row.original.status.replace(
          "_",
          " ",
        )}
      </Badge>
    ),
  },
];

async function fetchAllTrips(queryClient: QueryClient, params: VehicleActivityQuery["params"]): Promise<ReportVehicleTrip[]> {
  const trips: ReportVehicleTrip[] = [];
  for (let page = 1; ; page++) {
    const { data } = await queryClient.fetchQuery(getVehicleActivityQueryOptions({
      params: {
        ...params, page, limit: EXPORT_PAGE_SIZE,
      },
    }));
    trips.push(...data.items);
    if (trips.length >= data.total || data.items.length === 0)
      return trips;
  }
}

async function exportTrips(queryClient: QueryClient, params: VehicleActivityQuery["params"]) {
  const trips = await fetchAllTrips(
    queryClient,
    params,
  );
  exportToCSV(
    "vehicle_activity",
    [
      "Reference",
      "Date",
      "Vehicle",
      "Driver",
      "From",
      "To",
      "Status",
    ],
    trips.map(t => [
      t.reference,
      formatWithPattern(
        t.date,
        "yyyy-MM-dd",
      ),
      t.vehicle ?? "Unassigned",
      t.driver ?? "Unassigned",
      t.from ?? "\u2014",
      t.to ?? "\u2014",
      t.status,
    ]),
  );
}

export default function VehicleActivityPage() {
  const { format: formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const [
    page,
    setPage,
  ] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim());
  const params = {
    search: debouncedSearch || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  };
  const activityQuery = useQuery(getVehicleActivityQueryOptions({
    params: {
      ...params, page, limit: PAGE_SIZE,
    },
  }));
  const activity = activityQuery.data?.data;
  const totals = activity?.totals;

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const changeStatus = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryStat
          icon={Route}
          label="Total trips"
          value={`${totals?.trips ?? 0}`}
          hint="All recorded movements"
          loading={activityQuery.isPending}
        />
        <SummaryStat
          icon={CheckCircle}
          label="Completed trips"
          value={`${totals?.completed ?? 0}`}
          hint={`${totals?.open ?? 0} open`}
          loading={activityQuery.isPending}
        />
        <SummaryStat
          icon={MapPin}
          label="Locations served"
          value={`${totals?.locationsServed ?? 0}`}
          hint="Unique delivery points"
          loading={activityQuery.isPending}
        />
        <SummaryStat
          icon={CreditCard}
          label="Trip value"
          value={formatCurrency(totals?.tripValueNgn ?? 0)}
          hint="All trips"
          loading={activityQuery.isPending}
        />
      </div>

      <SectionCard
        title="Vehicle movements"
        description="Trips and operational activity per vehicle"
        toolbar={(
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference, vehicle, driver or route..."
                value={search}
                onChange={e => changeSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={changeStatus}
            >
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(activity?.statuses ?? []).map(o => (
                  <SelectItem
                    key={o}
                    value={o}
                    className="capitalize"
                  >
                    {String(o).replace(
                      "_",
                      " ",
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        onExport={() => void exportTrips(
          queryClient,
          params,
        )}
      >
        <div className="overflow-x-auto">
          <DataTable
            columns={TRIP_COLUMNS}
            data={activity?.items ?? []}
            isLoading={activityQuery.isPending}
            isError={activityQuery.isError}
            errorMessage={`Unable to load reports: ${activityQuery.error?.message ?? ""}`}
            onRetry={() => void activityQuery.refetch()}
            emptyState="No trips match your filters"
            pagination={{
              page,
              pageSize: PAGE_SIZE,
              total: activity?.total ?? 0,
              onPageChange: setPage,
            }}
          />
        </div>
      </SectionCard>
    </div>
  );
}
