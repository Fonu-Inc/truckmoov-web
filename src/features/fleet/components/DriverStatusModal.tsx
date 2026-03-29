import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSetDriverStatus } from "@/features/fleet/api"
import { Driver, DriverStatus } from "@/features/fleet/api/types"
import { ModalProps } from "@/shared/types"
import { cn } from "@/lib/utils"

type DriverStatusModalProps = ModalProps & {
  driver: Driver | null
}

const STATUS_OPTIONS: { value: DriverStatus; label: string; description: string }[] = [
  { value: "active", label: "Active", description: "Driver is currently on duty" },
  { value: "available", label: "Available", description: "Driver is available for assignment" },
  { value: "offline", label: "Offline", description: "Driver is not currently working" },
  { value: "suspended", label: "Suspended", description: "Driver is suspended from operations" },
]

export default function DriverStatusModal({ open, onOpenChange, driver }: DriverStatusModalProps) {
  const { mutateAsync: setDriverStatus, isPending } = useSetDriverStatus()

  async function handleStatusChange(status: DriverStatus) {
    if (!driver?.id || driver.status === status) return
    await setDriverStatus(
      { id: driver.id, data: { status } },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Driver Status</DialogTitle>
          <DialogDescription>
            {driver?.firstName} {driver?.lastName} · {driver?.licenseNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {STATUS_OPTIONS.map((option) => {
            const isCurrent = driver?.status === option.value
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
