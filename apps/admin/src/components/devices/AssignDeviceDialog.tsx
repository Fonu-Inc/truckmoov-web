import { IoTDevice, Vehicle } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Truck, Search, Cpu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AssignDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: IoTDevice | null;
  vehicles: Vehicle[];
  onAssign: (deviceId: string, vehicleId: string) => void;
}

export function AssignDeviceDialog({
  open,
  onOpenChange,
  device,
  vehicles,
  onAssign,
}: AssignDeviceDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const filteredVehicles = vehicles.filter((v) =>
    v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.make.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = () => {
    if (device && selectedVehicle) {
      onAssign(device.id, selectedVehicle);
      setSelectedVehicle(null);
      setSearch("");
    }
  };

  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Assign Device to Vehicle</DialogTitle>
          <DialogDescription>
            Select a vehicle to assign device {device.imei.slice(-6)} to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Device Info */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{device.manufacturer} {device.model}</p>
              <p className="text-xs text-muted-foreground font-mono">IMEI: {device.imei}</p>
            </div>
          </div>

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
                    vehicle.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
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

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedVehicle}>
              Assign Device
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



