import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import StatusBadge from "@/shared/components/StatusBadge";
import DeleteDialog from "@/shared/components/DeleteDialog";
import { FormMode } from "@/shared/types";
import { timeAgo } from "@/shared/utils/time-functions";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Cpu, Edit, Link, MoreHorizontal, Plus, Signal, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import DeviceFormModal from "./DeviceFormModal";
import AssignDeviceToVehicleModal from "./AssignDeviceToVehicleModal";
import { Device } from "../api/types";
import { listDevicesQueryOptions, useDeleteDevice } from "../api";
import { useDeviceStore } from "../stores/device";
import { useAuthStore } from "@/stores/authStore";
import { UserRole } from "@/features/auth/api/types";

export default function DeviceTable() {
  const { user } = useAuthStore()
  const [openDeviceFormModal, setOpenDeviceFormModal] = useState(false)
  const [openAssignDevice, setOpenAssignDevice] = useState(false)
  const [openDeleteDevice, setOpenDeleteDevice] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const canAlter = useMemo(() => {
    const rolesWithAccess: UserRole[] = ["FLEET_ADMIN"]
    return rolesWithAccess.includes(user.role)
  }, [user])

  function handleSelectedDevice(device: Device, type: "edit" | "delete" | "assign") {
    setSelectedDevice(device);
    switch (type) {
      case "edit":
        setFormMode("edit");
        setOpenDeviceFormModal(true);
        return;
      case "assign":
        setOpenAssignDevice(true);
        return;
      case "delete":
        setOpenDeleteDevice(true);
        return;
    }
  }

  const { mutateAsync: deleteDevice, isPending: deletingDevice } = useDeleteDevice()
  async function handleDeviceDelete() {
    await deleteDevice(
      { id: selectedDevice.id },
      { onSuccess: () => setOpenDeleteDevice(false) }
    )
  }

  const { search } = useDeviceStore()
  const debouncedSearch = useDebounce(search)

  const { data: devicesData } = useQuery(listDevicesQueryOptions({
    params: { ...(debouncedSearch && { query: debouncedSearch }) }
  }))
  const rows: Device[] = useMemo(() => devicesData?.data ?? [], [devicesData])

  const column: ColumnDef<Device>[] = [
    {
      accessorKey: "device",
      header: "Device",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg bg-secondary",
          )}>
            <Cpu className={cn(
              "h-5 w-5 text-muted-foreground",
            )} />
          </div>
          <div>
            <p className="font-medium">{row.original.manufacturer}</p>
            <p className="text-xs text-muted-foreground">{row.original.model || "—"}</p>
          </div>
        </div>
      )
    },
    {
      accessorKey: "imei",
      header: "IMEI",
      cell: ({ row }) => (
        <span className="rounded bg-secondary px-2 py-1 font-mono text-sm">
          {row.original.imei}
        </span>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} />
      )
    },
    {
      accessorKey: "vehicle",
      header: "Vehicle",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.vehicleId ? "Assigned" : "Unassigned"}</span>
      )
    },
    {
      accessorKey: "signalStrength",
      header: "Signal",
      cell: ({ row }) => (
        <>
          {row.original.signalStrength !== undefined && row.original.signalStrength !== null ? (
            <div className="flex items-center gap-2">
              <Signal className={cn(
                "h-4 w-4",
                row.original.signalStrength > 70 ? "text-success" :
                  row.original.signalStrength > 40 ? "text-warning" : "text-destructive"
              )} />
              <span className="text-sm">{row.original.signalStrength}%</span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </>
      )
    },
    {
      accessorKey: "lastSeen",
      header: "Last Seen",
      cell: ({ row }) => (
        <>
          {row.original.lastSeen
            ? timeAgo(row.original.lastSeen)
            : "Never"}
        </>
      )
    },
    ...(canAlter ? [
      {
        id: "action",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* <DropdownMenuItem>
              <Eye className="h-4 w-4" />
              View Details
            </DropdownMenuItem> */}
              <DropdownMenuItem onClick={() => handleSelectedDevice(row.original, "edit")}>
                <Edit className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSelectedDevice(row.original, "assign")}>
                <Link className="h-4 w-4" />
                Assign to Vehicle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleSelectedDevice(row.original, "delete")}
              >
                <Trash2 className="h-4 w-4" />
                Delete Device
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    ] : []),
  ]

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2">
        <Cpu className="h-5 w-5 text-primary" />
        Devices ({rows.length})
      </p>
      <DataTable
        columns={column}
        data={rows}
        noResultStatement={
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No devices found</h3>
          </div>
        }
      />

      <DeviceFormModal
        open={openDeviceFormModal}
        onOpenChange={setOpenDeviceFormModal}
        mode={formMode}
        device={selectedDevice}
      />
      <AssignDeviceToVehicleModal
        open={openAssignDevice}
        onOpenChange={setOpenAssignDevice}
        device={selectedDevice}
      />
      <DeleteDialog
        open={openDeleteDevice}
        onOpenChange={setOpenDeleteDevice}
        handleDeleteFn={handleDeviceDelete}
        isLoading={deletingDevice}
      />
    </div>
  )
}
