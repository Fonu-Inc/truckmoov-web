import type { ColumnDef } from "@tanstack/react-table";
import {
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import StatusBadge from "@/shared/components/StatusBadge";
import { useMemo, useState } from "react";
import VehicleFormModal from "./VehicleFormModal";
import { Vehicle } from "../api/types";
import { useQuery } from "@tanstack/react-query";
import { RequestPayloadExtractor } from "@/shared/types";
import { listVehiclesQueryOptions, useDeleteVehicle } from "../api";
import { useVehicleStore } from "../stores/vehicle";
import { useDebounce } from "@/shared/hooks/useDebounce";
import DeleteDialog from "@/shared/components/DeleteDialog";
import VehicleDetailSheet from "./VehicleDetailSheet";
import AssignDriverModal from "./AssignDriverModal";
import VehicleStatusModal from "./VehicleStatusModal";


export default function VehicleTable() {
  const [openVehicleForm, setOpenVehicleForm] = useState(false)
  const [openVehicleDetails, setOpenVehicleDetails] = useState(false)
  const [openAssignDriver, setOpenAssignDriver] = useState(false)
  const [openVehicleStatus, setOpenVehicleStatus] = useState(false)
  const [removeVehicle, setRemoveVehicle] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  const { search, status } = useVehicleStore()
  const debouncedSearch = useDebounce(search)

  function handleSelectedVehicle(vehicle: Vehicle, type: "view" | "edit" | "delete" | "assign" | "status") {
    setSelectedVehicle(vehicle);
    switch (type) {
      case "edit":
        setOpenVehicleForm(true);
        return;
      case "view":
        setOpenVehicleDetails(true);
        return;
      case "delete":
        setRemoveVehicle(true);
        return;
      case "assign":
        setOpenAssignDriver(true);
        return;
      case "status":
        setOpenVehicleStatus(true);
        return;
    }
  }

  const { mutateAsync: deleteVehicle, isPending: deletingVehicle } = useDeleteVehicle()
  async function handleVehicleDelete() {
    await deleteVehicle({
      id: selectedVehicle.id
    }, {
      onSuccess: () => {
        setRemoveVehicle(false)
      }
    })
  }

  const listVehiclesParams: RequestPayloadExtractor<typeof listVehiclesQueryOptions> = useMemo(() => ({
    params: {
      ...(debouncedSearch && { query: debouncedSearch }),
      ...(status && { status }),
    }
  }), [debouncedSearch, status])

  const { data: vehicles } = useQuery(listVehiclesQueryOptions(listVehiclesParams))
  const rows: Vehicle[] = useMemo(() => vehicles?.data ?? [], [vehicles])
  const vehicleColumns: ColumnDef<Vehicle>[] = [
    {
      header: "Vehicle",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 py-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium truncate">
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
        <span className="rounded bg-secondary px-2 py-1 font-mono text-sm truncate">
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
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.assignedDriverId ? "Assigned" : "Unassigned"}</span>
      )
    },
    {
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} />
      ),
    },
    // {
    //   header: "Fuel",
    //   cell: ({ row }) =>
    //     row.original.fuelLevel !== null ? (
    //       <div className="flex items-center gap-2">
    //         <div className="h-2 w-16 rounded-full bg-secondary">
    //           <div
    //             className={cn(
    //               "h-full rounded-full",
    //               row.original.fuelLevel > 50
    //                 ? "bg-success"
    //                 : row.original.fuelLevel > 25
    //                   ? "bg-warning"
    //                   : "bg-destructive",
    //             )}
    //             style={{ width: `${row.original.fuelLevel}%` }}
    //           />
    //         </div>
    //         <span className="text-xs text-muted-foreground">{row.original.fuelLevel}%</span>
    //       </div>
    //     ) : (
    //       <span className="text-muted-foreground">N/A</span>
    //     ),
    // },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSelectedVehicle(row.original, "view")}>
                <Eye className="h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSelectedVehicle(row.original, "edit")}>
                <Edit className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSelectedVehicle(row.original, "status")}>
                <Edit className="h-4 w-4" />
                Change Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSelectedVehicle(row.original, "assign")}>
                <Truck className="h-4 w-4" />
                Assign Driver
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleSelectedVehicle(row.original, "delete")}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-primary" />
        Vehicles ({rows.length})
      </p>
      <DataTable
        columns={vehicleColumns}
        data={rows}
        noResultStatement={
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Truck className="h-12 w-12 mb-4 opacity-30" />
            <p>No vehicles found</p>
          </div>
        }
      />

      {/* modals and dialog */}
      <VehicleDetailSheet
        open={openVehicleDetails}
        onOpenChange={setOpenVehicleDetails}
        vehicle={selectedVehicle}
      />
      <VehicleFormModal
        open={openVehicleForm}
        onOpenChange={setOpenVehicleForm}
        mode="edit"
        vehicle={selectedVehicle}
      />
      <VehicleStatusModal
        open={openVehicleStatus}
        onOpenChange={setOpenVehicleStatus}
        vehicle={selectedVehicle}
      />
      <AssignDriverModal
        open={openAssignDriver}
        onOpenChange={setOpenAssignDriver}
        vehicle={selectedVehicle}
      />
      <DeleteDialog
        open={removeVehicle}
        onOpenChange={setRemoveVehicle}
        handleDeleteFn={handleVehicleDelete}
        isLoading={deletingVehicle}
      />
    </div>
  );
}
