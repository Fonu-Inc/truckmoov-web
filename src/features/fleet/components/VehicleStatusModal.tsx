import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSetVehicleStatus } from "@/features/fleet/api"
import { FleetStatus, Vehicle } from "@/features/fleet/api/types"
import { ModalProps } from "@/shared/types"
import { cn } from "@/lib/utils"

type VehicleStatusModalProps = ModalProps & {
  vehicle: Vehicle | null
}

const STATUS_OPTIONS: { value: FleetStatus; label: string; description: string }[] = [
  { value: "active", label: "Active", description: "Vehicle is available and operational" },
  { value: "inactive", label: "Inactive", description: "Vehicle is offline or out of service" },
]

export default function VehicleStatusModal({ open, onOpenChange, vehicle }: VehicleStatusModalProps) {
  const { mutateAsync: setVehicleStatus, isPending } = useSetVehicleStatus()

  async function handleStatusChange(status: FleetStatus) {
    if (!vehicle?.id || vehicle.status === status) return
    await setVehicleStatus(
      { id: vehicle.id, data: { status } },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Vehicle Status</DialogTitle>
          <DialogDescription>
            {vehicle?.make} {vehicle?.model} · {vehicle?.registrationNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {STATUS_OPTIONS.map((option) => {
            const isCurrent = vehicle?.status === option.value
            return (
              <button
                key={option.value}
                type="button"
                disabled={isCurrent || isPending}
                onClick={() => handleStatusChange(option.value)}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-left transition-colors",
                  isCurrent
                    ? "border-primary bg-primary/5 cursor-default"
                    : "border-border hover:bg-muted cursor-pointer disabled:opacity-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  {isCurrent && (
                    <span className="text-xs font-medium text-primary">Current</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex justify-end">
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
