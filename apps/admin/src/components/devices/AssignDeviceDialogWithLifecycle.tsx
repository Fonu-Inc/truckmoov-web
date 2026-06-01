import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Alert, AlertDescription } from "@/components/shadcn/alert";
import { Truck, Search, Cpu, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeviceLifecycle, DeviceLifecycleStatus } from "@/hooks/useDeviceLifecycle";
import { DeviceLifecycleBadge } from "./DeviceLifecycleBadge";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  status: string;
}

interface Device {
  id: string;
  imei: string;
  manufacturer: string;
  model: string | null;
  lifecycle_status?: DeviceLifecycleStatus | string;
  status?: string; // Legacy status field
  vehicle_id?: string | null;
}

interface AssignDeviceDialogWithLifecycleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
  vehicles: Vehicle[];
  onAssign: (deviceId: string, vehicleId: string) => Promise<void>;
}

export function AssignDeviceDialogWithLifecycle({
  open,
  onOpenChange,
  device,
  vehicles,
  onAssign,
}: AssignDeviceDialogWithLifecycleProps) {
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    can_assign: boolean;
    reason?: string;
  } | null>(null);

  const { canAssignToVehicle, isAssignable } = useDeviceLifecycle();

  // Get lifecycle status (support both new and legacy)
  const lifecycleStatus = device?.lifecycle_status || device?.status || 'registered';
  const canAttemptAssignment = isAssignable(lifecycleStatus as DeviceLifecycleStatus);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedVehicle(null);
      setValidationResult(null);
    }
  }, [open]);

  // Validate when vehicle is selected
  useEffect(() => {
    const validateAssignment = async () => {
      if (device && selectedVehicle) {
        setValidationResult(null);
        const result = await canAssignToVehicle(device.id, selectedVehicle);
        setValidationResult(result);
      } else {
        setValidationResult(null);
      }
    };

    validateAssignment();
  }, [device, selectedVehicle, canAssignToVehicle]);

  const filteredVehicles = vehicles.filter((v) =>
    v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.make.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async () => {
    if (!device || !selectedVehicle) return;
    
    // Double-check validation
    if (validationResult && !validationResult.can_assign) {
      toast.error("Assignment blocked", {
        description: validationResult.reason,
      });
      return;
    }

    setIsAssigning(true);
    try {
      await onAssign(device.id, selectedVehicle);
      onOpenChange(false);
    } finally {
      setIsAssigning(false);
    }
  };

  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Device to Vehicle</DialogTitle>
          <DialogDescription>
            Select a vehicle to assign device {device.imei.slice(-6)} to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Device Info with Lifecycle Status */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{device.manufacturer} {device.model}</p>
              <p className="text-xs text-muted-foreground font-mono">IMEI: {device.imei}</p>
            </div>
            <DeviceLifecycleBadge 
              status={lifecycleStatus as DeviceLifecycleStatus} 
            />
          </div>

          {/* Assignment Eligibility Check */}
          {!canAttemptAssignment && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Assignment Not Allowed</strong>
                <p className="text-sm mt-1">
                  This device cannot be assigned because it has not been verified. 
                  Current status: <strong>{lifecycleStatus}</strong>.
                </p>
                <p className="text-sm mt-2">
                  The device must reach <em>Verified Online</em> or <em>Assignable</em> status 
                  by receiving valid telemetry data first.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {canAttemptAssignment && (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Vehicle List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-all hover:border-primary/50",
                        selectedVehicle === vehicle.id && "border-primary bg-primary/5 ring-1 ring-primary"
                      )}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <Truck className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{vehicle.registrationNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </p>
                      </div>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        vehicle.status === "active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                      )}>
                        {vehicle.status}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Truck className="mx-auto h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">No available vehicles</p>
                  </div>
                )}
              </div>

              {/* Validation Result */}
              {selectedVehicle && validationResult && (
                <Alert variant={validationResult.can_assign ? "default" : "destructive"}>
                  {validationResult.can_assign ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {validationResult.can_assign 
                      ? "Device can be assigned to this vehicle."
                      : validationResult.reason
                    }
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={
                !canAttemptAssignment || 
                !selectedVehicle || 
                isAssigning || 
                (validationResult && !validationResult.can_assign)
              }
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Device"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



