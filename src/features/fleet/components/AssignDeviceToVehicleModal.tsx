import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  listVehiclesQueryOptions,
  useAssignDeviceToVehicle,
  useUnassignDeviceFromVehicle,
} from "@/features/fleet/api"
import { Device } from "@/features/fleet/api/types"
import { ModalProps } from "@/shared/types"
import { useQuery } from "@tanstack/react-query"
import { Link, Unlink } from "lucide-react"
import { useMemo, useState } from "react"

type AssignDeviceToVehicleModalProps = ModalProps & {
  device: Device | null
}

export default function AssignDeviceToVehicleModal({ open, onOpenChange, device }: AssignDeviceToVehicleModalProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")

  const { data: vehiclesData } = useQuery(listVehiclesQueryOptions({ params: {} }))
  const vehicles = useMemo(() => vehiclesData?.data ?? [], [vehiclesData])

  const currentVehicle = useMemo(
    () => vehicles.find((v) => v.id === device?.vehicleId),
    [vehicles, device?.vehicleId]
  )

  const { mutateAsync: assignDevice, isPending: assigning } = useAssignDeviceToVehicle()
  const { mutateAsync: unassignDevice, isPending: unassigning } = useUnassignDeviceFromVehicle()

  const isReassign = !!device?.vehicleId

  async function handleAssign() {
    if (!device?.id || !selectedVehicleId) return
    await assignDevice(
      { id: device.id, data: { vehicleId: selectedVehicleId } },
      { onSuccess: () => { onOpenChange(false); setSelectedVehicleId("") } }
    )
  }

  async function handleUnassign() {
    if (!device?.id) return
    await unassignDevice(
      { id: device.id },
      { onSuccess: () => { onOpenChange(false) } }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isReassign ? "Reassign Device" : "Assign Device to Vehicle"}</DialogTitle>
          <DialogDescription>
            {device?.manufacturer} {device?.model} · {device?.imei}
          </DialogDescription>
        </DialogHeader>

        {currentVehicle && (
          <>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{currentVehicle.make} {currentVehicle.model}</p>
                <p className="text-xs text-muted-foreground">{currentVehicle.registrationNumber}</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleUnassign}
                isLoading={unassigning}
                disabled={unassigning || assigning}
              >
                <Unlink className="h-4 w-4" />
                Unassign
              </Button>
            </div>
            <Separator />
          </>
        )}

        <div className="space-y-4">
          <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} · {vehicle.registrationNumber}
                  {vehicle.assignedDriverId && (
                    <span className="ml-2 text-xs text-muted-foreground">(has driver)</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button variant="outline" disabled={assigning || unassigning}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleAssign}
              isLoading={assigning}
              disabled={!selectedVehicleId || assigning || unassigning}
            >
              <Link className="h-4 w-4" />
              {isReassign ? "Reassign" : "Assign to Vehicle"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
