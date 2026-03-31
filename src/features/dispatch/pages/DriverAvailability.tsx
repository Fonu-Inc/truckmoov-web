import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Activity, Coffee, Moon, MoreHorizontal, UserCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type AvailabilityStatus = "on-duty" | "break" | "off-duty";

type DriverAvailability = {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  zone: string;
  lastCheckIn: string;
  status: AvailabilityStatus;
};

const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  "on-duty": "On duty",
  "break": "Break",
  "off-duty": "Off duty",
};

const STATUS_STYLES: Record<AvailabilityStatus, string> = {
  "on-duty": "bg-success/20 text-success border-success/30",
  "break": "bg-warning/20 text-warning border-warning/30",
  "off-duty": "bg-muted text-muted-foreground border-muted",
};

const INITIAL_DRIVERS: DriverAvailability[] = [
  {
    id: "DRV-1023",
    name: "Amina Yusuf",
    phone: "+234 706 812 4031",
    vehicle: "TMV-233",
    zone: "Ikeja",
    lastCheckIn: "08:45",
    status: "on-duty",
  },
  {
    id: "DRV-1078",
    name: "Tunde Balogun",
    phone: "+234 813 902 5542",
    vehicle: "TMV-118",
    zone: "Apapa",
    lastCheckIn: "08:31",
    status: "break",
  },
  {
    id: "DRV-1104",
    name: "Kemi Ojo",
    phone: "+234 701 285 9921",
    vehicle: "TMV-401",
    zone: "Lekki",
    lastCheckIn: "08:12",
    status: "on-duty",
  },
  {
    id: "DRV-1137",
    name: "Bode Adebayo",
    phone: "+234 803 612 7782",
    vehicle: "TMV-090",
    zone: "Mile 12",
    lastCheckIn: "07:54",
    status: "off-duty",
  },
  {
    id: "DRV-1166",
    name: "Rita Nwosu",
    phone: "+234 809 450 3105",
    vehicle: "TMV-512",
    zone: "Ojota",
    lastCheckIn: "08:20",
    status: "on-duty",
  },
];

const STATUS_FILTER_OPTIONS: Array<{ value: AvailabilityStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "on-duty", label: "On duty" },
  { value: "break", label: "On break" },
  { value: "off-duty", label: "Off duty" },
];

export default function DriverAvailability() {
  const [drivers, setDrivers] = useState<DriverAvailability[]>(INITIAL_DRIVERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatus | "all">("all");

  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return drivers.filter((driver) => {
      const matchesStatus = statusFilter === "all" || driver.status === statusFilter;
      const matchesSearch = !query
        || driver.name.toLowerCase().includes(query)
        || driver.vehicle.toLowerCase().includes(query)
        || driver.zone.toLowerCase().includes(query)
        || driver.id.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [drivers, search, statusFilter]);

  const counts = useMemo(() => {
    return drivers.reduce(
      (acc, driver) => {
        acc[driver.status] += 1;
        return acc;
      },
      { "on-duty": 0, "break": 0, "off-duty": 0 } as Record<AvailabilityStatus, number>
    );
  }, [drivers]);

  const updateStatus = (id: string, status: AvailabilityStatus) => {
    setDrivers((prev) => prev.map((driver) => (driver.id === id ? { ...driver, status } : driver)));
  };

  const columns: ColumnDef<DriverAvailability>[] = [
    {
      accessorKey: "name",
      header: "Driver",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-sm text-muted-foreground">{row.original.phone}</p>
        </div>
      ),
    },
    {
      accessorKey: "vehicle",
      header: "Vehicle",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.vehicle}</p>
          <p className="text-xs text-muted-foreground">Zone {row.original.zone}</p>
        </div>
      ),
    },
    {
      accessorKey: "lastCheckIn",
      header: "Last Check-in",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4" />
          {row.original.lastCheckIn}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[row.original.status])}>
          {STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => updateStatus(row.original.id, "on-duty")}>
              <UserCheck className="mr-2 h-4 w-4" />
              Set on duty
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus(row.original.id, "break")}>
              <Coffee className="mr-2 h-4 w-4" />
              Start break
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus(row.original.id, "off-duty")}>
              <Moon className="mr-2 h-4 w-4" />
              Set off duty
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">On duty</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{counts["on-duty"]}</div>
            <UserCheck className="h-5 w-5 text-success" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">On break</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{counts.break}</div>
            <Coffee className="h-5 w-5 text-warning" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Off duty</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{counts["off-duty"]}</div>
            <Moon className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Availability</CardTitle>
          <CardDescription>Update driver availability to keep dispatch decisions accurate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Search drivers, vehicles, zones..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="md:max-w-sm"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AvailabilityStatus | "all")}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={filteredDrivers}
            noResultStatement="No drivers match the selected filters."
          />
        </CardContent>
      </Card>
    </section>
  );
}
