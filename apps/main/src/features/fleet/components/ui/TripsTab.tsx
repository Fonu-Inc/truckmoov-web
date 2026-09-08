import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle, Download, Eye, MapPin, Route, Search, Truck,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

// ponytail: static placeholder rows, wire to real trips API when endpoint exists.
type TripRow = { id: number };
const PLACEHOLDER_ROWS: TripRow[] = Array.from(
  { length: 5 },
  (_, i) => ({ id: i }),
);

const dashCell = () => <span className="text-muted-foreground">-</span>;
const columns: ColumnDef<TripRow>[] = [
  {
    id: "ref", header: "Job Reference ID", cell: dashCell, meta: { className: "font-mono" },
  },
  {
    id: "date", header: "Date", cell: dashCell,
  },
  {
    id: "vehicle", header: "Vehicle", cell: dashCell,
  },
  {
    id: "driver", header: "Driver", cell: dashCell,
  },
  {
    id: "route", header: "Route", cell: dashCell,
  },
  {
    id: "stops", header: "Stops", cell: dashCell, meta: { className: "text-right" },
  },
  {
    id: "progress", header: "Progress", cell: dashCell,
  },
  {
    id: "status", header: "Status", cell: dashCell,
  },
  {
    id: "action",
    header: "",
    meta: { className: "w-[110px] text-right" },
    cell: () => (
      <Button
        variant="ghost"
        size="sm"
        disabled
      >
        <Eye className="mr-1 h-3 w-3" />
        View Trip
      </Button>
    ),
  },
];

export function TripsTab() {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("all");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Route className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">Total trips</p>
                <p className="text-2xl font-bold mt-1">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">Active trips</p>
                <p className="text-2xl font-bold mt-1">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">Scheduled trips</p>
                <p className="text-2xl font-bold mt-1">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 shrink-0">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">Completed trips</p>
                <p className="text-2xl font-bold mt-1">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5 text-primary" />
                Recent Trips
              </CardTitle>
              <CardDescription className="mt-1">Jobs each vehicle has been on, with routes and locations.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-input"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search trips, vehicles, routes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>
            <Select
              value={status}
              onValueChange={setStatus}
            >
              <SelectTrigger className="w-[160px] bg-card/50 border-border/50">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <DataTable
            columns={columns}
            data={PLACEHOLDER_ROWS}
          />
        </CardContent>
      </Card>
    </div>
  );
}
