import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import StatusBadge from "@/shared/components/StatusBadge";
import { FormMode } from "@/shared/types";
import { timeAgo } from "@/shared/utils/time-functions";
import { ColumnDef } from "@tanstack/react-table";
import { Cpu, Edit, Eye, Link, MoreHorizontal, Plus, RefreshCw, Settings, Signal, Trash2, Unlink } from "lucide-react";
import { useState } from "react";
import DeviceFormModal from "./DeviceFormModal";

export default function DeviceTable() {
 const [openDeviceFormModal, setOpenDeviceFormModal] = useState(false)
 const [formMode, setFormMode] = useState<FormMode>("edit");

 function openDeviceForm(mode: FormMode) {
  setOpenDeviceFormModal(true);
  setFormMode(mode)
 }

 const rows = []
 const column: ColumnDef<any>[] = [
  {
   accessorKey: "device",
   header: "Device",
   cell: ({ row }) => (
    <div className="flex items-center gap-3">
     <div className={cn(
      "flex h-10 w-10 items-center justify-center rounded-lg",
      row.original.status === "active"
       ? "bg-success/10"
       : row.original.status === "faulty"
        ? "bg-destructive/10"
        : "bg-secondary"
     )}>
      <Cpu className={cn(
       "h-5 w-5",
       row.original.status === "active"
        ? "text-success"
        : row.original.status === "faulty"
         ? "text-destructive"
         : "text-muted-foreground"
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
    <>
     {row.original.reg ? (
      <span className="text-sm">{row.original.registrationNumber}</span>
     ) : (
      <span className="text-muted-foreground">—</span>
     )}
    </>
   )
  },
  {
   accessorKey: "signal",
   header: "Signal",
   cell: ({ row }) => (
    <>
     {row.original.signal_strength !== undefined && row.original.signal_strength !== null ? (
      <div className="flex items-center gap-2">
       <Signal className={cn(
        "h-4 w-4",
        row.original.signal_strength > 70 ? "text-success" :
         row.original.signal_strength > 40 ? "text-warning" : "text-destructive"
       )} />
       <span className="text-sm">{row.original.signal_strength}%</span>
      </div>
     ) : (
      <span className="text-muted-foreground">—</span>
     )}
    </>
   )
  },
  {
   accessorKey: "last-seen",
   header: "Last Seen",
   cell: ({ row }) => (
    <>
     {row.original.last_seen
      ? timeAgo(row.original.last_seen)
      : "Never"}
    </>
   )
  },
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
      <DropdownMenuItem>
       <Eye className="h-4 w-4" />
       View Details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => openDeviceForm("edit")}>
       <Edit className="h-4 w-4" />
       Edit
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
       <Settings className="h-4 w-4" />
       Mark as Configured
      </DropdownMenuItem>
      <DropdownMenuItem>
       <Link className="h-4 w-4" />
       Assign to Vehicle
      </DropdownMenuItem>
      <DropdownMenuItem>
       <Unlink className="h-4 w-4" />
       Unassign Vehicle
      </DropdownMenuItem>
      <DropdownMenuItem>
       <RefreshCw className="h-4 w-4" />
       Update Firmware
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
       className="text-destructive focus:text-destructive"
      >
       <Trash2 className="h-4 w-4" />
       Delete Device
      </DropdownMenuItem>
     </DropdownMenuContent>
    </DropdownMenu>
   )
  },
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
      <p className="text-sm text-muted-foreground mt-1">
       {/* {searchQuery || statusFilter !== "all" || manufacturerFilter !== "all"
        ? "Try adjusting your filters"
        : "Add your first device to get started"} */}
       Add your first device to get started
      </p>
      {/* {canManage && !searchQuery && statusFilter === "all" && ( */}
      <Button className="mt-4" onClick={() => openDeviceForm("create")}>
       <Plus className="h-4 w-4" />
       Add Device
      </Button>
      {/* )} */}
     </div>
    }
   />

   <DeviceFormModal open={openDeviceFormModal} onOpenChange={setOpenDeviceFormModal} mode={formMode} />
  </div>
 )
}
