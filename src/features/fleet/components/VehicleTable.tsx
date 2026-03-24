import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
 Edit,
 Eye,
 MoreHorizontal,
 Trash2,
 Truck,
} from "lucide-react";

import { listVehiclesQueryOptions } from "@/features/fleet/api";
import type { Vehicle } from "@/features/fleet/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import VehicleTableActionCard from "./VehicleTableActionCard";

type VehicleTableRow = {
 id: string;
 model: string;
 make: string;
 year: string;
 registrationNumber: string;
 type: string;
 driverName: string | null;
 status: string;
 fuelLevel: number | null;
};

function toVehicleTableRow(vehicle: Vehicle): VehicleTableRow {
 return {
  id: vehicle.id,
  model: vehicle.model || "Unknown Model",
  make: "N/A",
  year: "N/A",
  registrationNumber: vehicle.plateNumber || "N/A",
  type: "N/A",
  driverName: null,
  status: vehicle.status || "inactive",
  fuelLevel: null,
 };
}

function getStatusClassName(status: string) {
 if (status === "active") return "bg-success/10 text-success";
 if (status === "maintenance") return "bg-warning/10 text-warning";
 if (status === "decommissioned") return "bg-destructive/10 text-destructive";
 return "bg-muted text-muted-foreground";
}

const vehicleColumns: ColumnDef<VehicleTableRow>[] = [
 {
  header: "Vehicle",
  cell: ({ row }) => (
   <div className="flex items-center gap-3 py-1">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
     <Truck className="h-5 w-5 text-primary" />
    </div>
    <div>
     <p className="font-medium">
      {row.original.make} {row.original.model}
     </p>
     <p className="text-xs text-muted-foreground">{row.original.year}</p>
    </div>
   </div>
  ),
 },
 {
  header: "Registration",
  cell: ({ row }) => (
   <span className="rounded bg-secondary px-2 py-1 font-mono text-sm">
    {row.original.registrationNumber}
   </span>
  ),
 },
 {
  header: "Type",
  cell: ({ row }) => (
   <span className="capitalize">{row.original.type}</span>
  ),
 },
 {
  header: "Driver",
  cell: ({ row }) =>
   row.original.driverName || <span className="text-muted-foreground">Unassigned</span>,
 },
 {
  header: "Status",
  cell: ({ row }) => (
   <Badge
    className={cn(
     "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
     getStatusClassName(row.original.status),
    )}
   >
    {row.original.status}
   </Badge>
  ),
 },
 {
  header: "Fuel",
  cell: ({ row }) =>
   row.original.fuelLevel !== null ? (
    <div className="flex items-center gap-2">
     <div className="h-2 w-16 rounded-full bg-secondary">
      <div
       className={cn(
        "h-full rounded-full",
        row.original.fuelLevel > 50
         ? "bg-success"
         : row.original.fuelLevel > 25
          ? "bg-warning"
          : "bg-destructive",
       )}
       style={{ width: `${row.original.fuelLevel}%` }}
      />
     </div>
     <span className="text-xs text-muted-foreground">{row.original.fuelLevel}%</span>
    </div>
   ) : (
    <span className="text-muted-foreground">N/A</span>
   ),
 },
 {
  id: "actions",
  header: "Actions",
  cell: () => (
   <div className="flex justify-end">
    <DropdownMenu>
     <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm">
       <MoreHorizontal className="h-4 w-4" />
      </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => {}}>
       <Eye className="mr-2 h-4 w-4" />
       View Details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => {}}>
       <Edit className="mr-2 h-4 w-4" />
       Edit
      </DropdownMenuItem>
      <DropdownMenuItem
       className="text-destructive focus:text-destructive"
       onClick={() => {}}
      >
       <Trash2 className="mr-2 h-4 w-4" />
       Delete
      </DropdownMenuItem>
     </DropdownMenuContent>
    </DropdownMenu>
   </div>
  ),
 },
];

export default function VehicleTable() {
 const { data, isLoading } = useQuery(
  listVehiclesQueryOptions({
   params: {},
  }),
 );

 const rows = useMemo(
  () => (data?.data ?? []).map(toVehicleTableRow),
  [data?.data],
 );

 return (
  <section className="space-y-6">
   <VehicleTableActionCard />

   <Card>
    <CardHeader>
     <CardTitle className="flex items-center gap-2">
      <Truck className="h-5 w-5 text-primary" />
      Vehicles ({rows.length})
     </CardTitle>
    </CardHeader>
    <CardContent>
     <DataTable
      columns={vehicleColumns}
      data={rows}
      isLoading={isLoading}
      noResultStatement={
       <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Truck className="h-12 w-12 mb-4 opacity-30" />
        <p>No vehicles found</p>
        <p className="text-sm">Try adjusting your search or filters</p>
       </div>
      }
     />
    </CardContent>
   </Card>
  </section>
 );
}
