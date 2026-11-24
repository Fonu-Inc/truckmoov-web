import type { PlatformDevice } from "./deviceStatus";
import { useQuery } from "@tanstack/react-query";
import {
  DEVICE_CATALOG_PROTOCOLS,
  getSystemDevicesCatalogQueryOptions,
  useUpdateSystemDevice,
} from "@truckmoov/api/auth";
import {
  useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

type Props = {
  device: PlatformDevice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Platform-side corrections to a device's descriptive record. */
export function EditDeviceDialog({
  device,
  open,
  onOpenChange,
}: Props) {
  const updateDevice = useUpdateSystemDevice();
  const catalogQuery = useQuery({
    ...getSystemDevicesCatalogQueryOptions(),
    enabled: open,
  });
  const [
    manufacturer,
    setManufacturer,
  ] = useState("");
  const [
    model,
    setModel,
  ] = useState("");
  const [
    firmwareVersion,
    setFirmwareVersion,
  ] = useState("");
  const [
    protocol,
    setProtocol,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState<"active" | "inactive">("active");
  const [
    error,
    setError,
  ] = useState("");

  useEffect(
    () => {
      if (!open || !device)
        return;
      setManufacturer(device.manufacturer ?? "");
      setModel(device.model ?? "");
      setFirmwareVersion(device.firmwareVersion ?? "");
      setProtocol((device.protocol ?? "").toUpperCase());
      setStatus(device.operationalStatus === "active" ? "active" : "inactive");
      setError("");
    },
    [
      device,
      open,
    ],
  );

  const manufacturers = useMemo(
    () => [
      ...new Set([
        device?.manufacturer,
        ...(catalogQuery.data?.data.models ?? []).map(m => m.manufacturer),
      ].filter((m): m is string => Boolean(m))),
    ].sort(),
    [
      catalogQuery.data,
      device?.manufacturer,
    ],
  );

  const submit = () => {
    if (!device)
      return;
    if (!manufacturer.trim() || !model.trim()) {
      setError("Manufacturer and model are required.");
      return;
    }
    setError("");
    updateDevice.mutate(
      {
        id: device.id,
        data: {
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          firmwareVersion: firmwareVersion.trim() || undefined,
          protocol: protocol || undefined,
          status: status === "active" ? "active" : "registered",
        },
      },
      {
        onSuccess: () => {
          toast.success("Device details updated");
          onOpenChange(false);
        },
        onError: err => setError(err.message),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Device Details</DialogTitle>
          <DialogDescription>
            {device ? `Update the device record for ${device.manufacturer} ${device.model}.` : "Update the device record."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="device-imei">IMEI Number</Label>
            <Input
              id="device-imei"
              value={device?.imei ?? ""}
              disabled
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label required>Manufacturer</Label>
            <Select
              value={manufacturer}
              onValueChange={setManufacturer}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select manufacturer" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map(m => (
                  <SelectItem
                    key={m}
                    value={m}
                  >
                    {m}
                  </SelectItem>
                ))}
                {manufacturer && !manufacturers.includes(manufacturer) && (
                  <SelectItem value={manufacturer}>{manufacturer}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="device-model"
              required
            >
              Model
            </Label>
            <Input
              id="device-model"
              value={model}
              onChange={e => setModel(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="device-firmware">Firmware Version</Label>
            <Input
              id="device-firmware"
              value={firmwareVersion}
              onChange={e => setFirmwareVersion(e.target.value)}
              placeholder="e.g. 1.0.0"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Protocol</Label>
              <Select
                value={protocol || "none"}
                onValueChange={value => setProtocol(value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not recorded" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not recorded</SelectItem>
                  {DEVICE_CATALOG_PROTOCOLS.map(p => (
                    <SelectItem
                      key={p}
                      value={p}
                    >
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={value => setStatus(value as "active" | "inactive")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            loading={updateDevice.isPending}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
