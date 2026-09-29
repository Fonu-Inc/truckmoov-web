import {
  formatWithPattern, toDate,
} from "@truckmoov/app-core/utils/time-utils";
import {
  CheckCircle, CreditCard, MapPin, Route, Search,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";

import { Badge } from "@/components/shadcn/badge";

import { Input } from "@/components/shadcn/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";

import { useCurrency } from "@/contexts/CurrencyContext";
import { useReportsData } from "@/features/reports/hooks/useReportsData";
import { exportToCSV } from "@/features/reports/utils/reportsUtils";
import { ReportsGate } from "../ui/ReportsGate";
import {
  SectionCard, SummaryStat,
} from "../ui/ReportsShared";

export default function VehicleActivityPage() {
  const data = useReportsData();
  const {
    vehicles, drivers, jobs,
  } = data;
  const { format: formatCurrency } = useCurrency();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const trips = useMemo(
    () => jobs
      .slice()
      .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0))
      .map((j) => {
        const vehicle = vehicles.find(v => v.id === j.vehicleId);
        const driver = drivers.find(d => d.id === j.driverId);
        return {
          id: j.id,
          reference: j.reference,
          status: j.status,
          date: j.createdAt,
          vehicle: vehicle?.registrationNumber || "Unassigned",
          driver: driver?.name || "Unassigned",
          from: j.pickupAddress ?? "\u2014",
          to: j.deliveryAddress ?? "\u2014",
          amount: j.amountNgn,
        };
      }),
    [
      jobs,
      vehicles,
      drivers,
    ],
  );

  const completed = trips.filter(t => [
    "completed",
    "delivered",
  ].includes(t.status)).length;
  const tripStatuses = Array.from(new Set(trips.map(t => t.status).filter(Boolean)));
  const filteredTrips = trips.filter((t) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [
      t.reference,
      t.vehicle,
      t.driver,
      t.from,
      t.to,
    ]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(q));
    return matchesSearch && (statusFilter === "all" || t.status === statusFilter);
  });

  return (
    <ReportsGate data={data}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryStat
            icon={Route}
            label="Total trips"
            value={`${trips.length}`}
            hint="All recorded movements"
          />
          <SummaryStat
            icon={CheckCircle}
            label="Completed trips"
            value={`${completed}`}
            hint={`${trips.length - completed} open`}
          />
          <SummaryStat
            icon={MapPin}
            label="Locations served"
            value={`${new Set(trips.map(t => t.to)).size}`}
            hint="Unique delivery points"
          />
          <SummaryStat
            icon={CreditCard}
            label="Trip value"
            value={formatCurrency(trips.reduce(
              (s, t) => s + t.amount,
              0,
            ))}
            hint="All trips"
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
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {tripStatuses.map(o => (
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
          onExport={() => exportToCSV(
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
            filteredTrips.map(t => [
              t.reference,
              formatWithPattern(
                t.date,
                "yyyy-MM-dd",
              ),
              t.vehicle,
              t.driver,
              t.from,
              t.to,
              t.status,
            ]),
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
                {filteredTrips.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No trips match your filters
                    </TableCell>
                  </TableRow>
                )}
                {filteredTrips.slice(
                  0,
                  50,
                ).map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.reference}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatWithPattern(
                        t.date,
                        "dd MMM yyyy",
                      )}
                    </TableCell>
                    <TableCell>{t.vehicle}</TableCell>
                    <TableCell>{t.driver}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm">
                      {t.from}
                      {" "}
                      →
                      {" "}
                      {t.to}
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
        </SectionCard>
      </div>
    </ReportsGate>
  );
}
