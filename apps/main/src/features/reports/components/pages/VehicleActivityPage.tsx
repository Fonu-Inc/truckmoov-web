import type { QueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";

import { useCurrency } from "@/contexts/CurrencyContext";
import { useDebouncedValue } from "@/features/data-bundle/utils/dataBundle";
import { exportToCSV } from "@/features/reports/utils/reportsUtils";
import { ReportsGate } from "../ui/ReportsGate";
import {
  SectionCard, SummaryStat,
} from "../ui/ReportsShared";

const PAGE_SIZE = 50;
const EXPORT_PAGE_SIZE = 200;

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
  const pageCount = Math.max(
    1,
    Math.ceil((activity?.total ?? 0) / PAGE_SIZE),
  );

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
        <ReportsGate
          query={activityQuery}
          skeleton={(
            <div className="space-y-2">
              {Array.from(
                { length: 8 },
                (_, i) => (
                  <Skeleton
                    key={i}
                    className="h-10 w-full"
                  />
                ),
              )}
            </div>
          )}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity?.items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No trips match your filters
                    </TableCell>
                  </TableRow>
                )}
                {activity?.items.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.reference}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatWithPattern(
                        t.date,
                        "dd MMM yyyy",
                      )}
                    </TableCell>
                    <TableCell>{t.vehicle ?? "Unassigned"}</TableCell>
                    <TableCell>{t.driver ?? "Unassigned"}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm">
                      {t.from ?? "\u2014"}
                      {" "}
                      →
                      {" "}
                      {t.to ?? "\u2014"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="rounded-full capitalize"
                      >
                        {t.status.replace(
                          "_",
                          " ",
                        )}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
              <span>
                Page
                {" "}
                {page}
                {" "}
                of
                {" "}
                {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </ReportsGate>
      </SectionCard>
    </div>
  );
}
