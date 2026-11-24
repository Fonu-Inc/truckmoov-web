import type { FleetDriver } from "@truckmoov/api/fleet";
import { useUpdateDriver } from "@truckmoov/api/fleet";
import { toDateParam } from "@truckmoov/app-core/utils/time-utils";
import { useState } from "react";
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

/** Edits a driver's licence number and expiry via PATCH /fleet/drivers/:id. */
export function UpdateDriverLicenceDialog(props: {
  driver: FleetDriver | null;
  onOpenChange: (open: boolean) => void;
}) {
  // Keyed so the form's initial state is re-read for each driver.
  return (
    <UpdateDriverLicenceForm
      key={props.driver?.id ?? "none"}
      {...props}
    />
  );
}

function UpdateDriverLicenceForm({
  driver, onOpenChange,
}: {
  driver: FleetDriver | null;
  onOpenChange: (open: boolean) => void;
}) {
  const updateDriver = useUpdateDriver();
  const [
    licenseNumber,
    setLicenseNumber,
  ] = useState(driver?.licenseNumber ?? "");
  const [
    expiryDate,
    setExpiryDate,
  ] = useState(() => (driver?.licenseExpiryDate ? toDateParam(driver.licenseExpiryDate) : ""));

  const handleSave = async () => {
    if (!driver)
      return;
    if (!licenseNumber.trim()) {
      toast.error("Licence number is required");
      return;
    }
    try {
      await updateDriver.mutateAsync({
        id: driver.id,
        data: {
          licenseNumber: licenseNumber.trim(),
          ...(expiryDate ? { licenseExpiryDate: expiryDate } : {}),
        },
      });
      toast.success("Licence updated");
      onOpenChange(false);
    }
    catch {
      toast.error("Failed to update licence");
    }
  };

  return (
    <Dialog
      open={!!driver}
      onOpenChange={(open) => {
        if (!updateDriver.isPending)
          onOpenChange(open);
      }}
    >
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Update Licence</DialogTitle>
          <DialogDescription>{driver?.name || "-"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label
              htmlFor="drv-licence-number"
              required
            >
              Licence Number
            </Label>
            <Input
              id="drv-licence-number"
              value={licenseNumber}
              onChange={e => setLicenseNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="drv-licence-expiry">Expiry Date</Label>
            <Input
              id="drv-licence-expiry"
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={updateDriver.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            loading={updateDriver.isPending}
            onClick={() => void handleSave()}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
