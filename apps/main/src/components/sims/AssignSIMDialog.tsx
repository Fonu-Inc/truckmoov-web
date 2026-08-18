import type {
  IoTDevice, SIMCard,
} from "@/types";
import {
  Cpu, Search, Wifi,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { cn } from "@/lib/utils";

type AssignSIMDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sim: SIMCard | null;
  devices: IoTDevice[];
  onAssign: (simId: string, deviceId: string) => void;
};

export function AssignSIMDialog({
  open, onOpenChange, sim, devices, onAssign,
}: AssignSIMDialogProps) {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    selectedDevice,
    setSelectedDevice,
  ] = useState<string | null>(null);

  const filteredDevices = devices.filter(d => d.imei.includes(search) || d.manufacturer.toLowerCase().includes(search.toLowerCase()));

  if (!sim)
    return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Assign SIM to Device</DialogTitle>
          <DialogDescription>
            Select a device to assign SIM
            {sim.mobileNumber}
            {" "}
            to.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border bg-secondary/30 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Wifi className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="font-medium">{sim.mobileNumber}</p>
              <p className="text-xs text-muted-foreground">{sim.networkOperator}</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredDevices.length > 0
              ? filteredDevices.map(device => (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDevice(device.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary/50",
                      selectedDevice === device.id && "border-primary bg-primary/5 ring-1 ring-primary",
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary"><Cpu className="h-5 w-5 text-muted-foreground" /></div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {device.manufacturer}
                        {" "}
                        {device.model}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        IMEI:
                        {device.imei}
                      </p>
                    </div>
                  </button>
                ))
              : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Cpu className="mx-auto h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">No available devices</p>
                  </div>
                )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (sim && selectedDevice) {
                  onAssign(
                    sim.id,
                    selectedDevice,
                  ); setSelectedDevice(null);
                }
              }}
              disabled={!selectedDevice}
            >
              Assign SIM
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
