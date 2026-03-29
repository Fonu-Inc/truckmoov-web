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
  listDriversQueryOptions,
  useAssignDriverToVehicle,
  useUnassignDriverFromVehicle,
} from "@/features/fleet/api"
import { Vehicle } from "@/features/fleet/api/types"
import { ModalProps } from "@/shared/types"
import { useQuery } from "@tanstack/react-query"
import { UserMinus, UserPlus } from "lucide-react"
import { useMemo, useState } from "react"

type AssignDriverModalProps = ModalProps & {
  vehicle: Vehicle | null
}

export default function AssignDriverModal({ open, onOpenChange, vehicle }: AssignDriverModalProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>("")

  const { data: driversData } = useQuery(listDriversQueryOptions({ params: {} }))
  const drivers = useMemo(() => driversData?.data ?? [], [driversData])

  const currentDriver = useMemo(
    () => drivers.find((d) => d.id === vehicle?.assignedDriverId),
    [drivers, vehicle?.assignedDriverId]
  )

  const { mutateAsync: assignDriver, isPending: assigning } = useAssignDriverToVehicle()
  const { mutateAsync: unassignDriver, isPending: unassigning } = useUnassignDriverFromVehicle()

  const isReassign = !!vehicle?.assignedDriverId

  async function handleAssign() {
    if (!vehicle?.id || !selectedDriverId) return
    await assignDriver(
      { id: vehicle.id, data: { driverId: selectedDriverId } },
      { onSuccess: () => { onOpenChange(false); setSelectedDriverId("") } }
    )
  }

  async function handleUnassign() {
    if (!vehicle?.id) return
    await unassignDriver(
      { id: vehicle.id },
      { onSuccess: () => { onOpenChange(false) } }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isReassign ? "Reassign Driver" : "Assign Driver"}</DialogTitle>
          <DialogDescription>
            {vehicle?.make} {vehicle?.model} · {vehicle?.registrationNumber}
          </DialogDescription>
        </DialogHeader>

        {currentDriver && (
          <>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{currentDriver.firstName} {currentDriver.lastName}</p>
                <p className="text-xs text-muted-foreground">{currentDriver.email}</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleUnassign}
                isLoading={unassigning}
                disabled={unassigning || assigning}
              >
                <UserMinus className="h-4 w-4" />
                Unassign
              </Button>
            </div>
            <Separator />
          </>
        )}

        <div className="space-y-4">
          <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a driver" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.firstName} {driver.lastName}
                  {driver.assignedVehicleId && (
                    <span className="ml-2 text-xs text-muted-foreground">(assigned)</span>
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
              disabled={!selectedDriverId || assigning || unassigning}
            >
              <UserPlus className="h-4 w-4" />
              {isReassign ? "Reassign" : "Assign Driver"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
