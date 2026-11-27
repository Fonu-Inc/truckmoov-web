import {
  Clock, Package, Send, Truck, User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  locationError, pickerValue,
} from "@/components/jobs/jobLocation";
import { MapLocationInput } from "@/components/maps/MapLocationInput";

import { Badge } from "@/components/shadcn/badge";
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
import { Textarea } from "@/components/shadcn/textarea";

type Vehicle = {
  id: string;
  registrationNumber: string;
  status: string;
  currentDriver?: string;
};

type Driver = {
  id: string;
  name: string;
  status: string;
};

type DispatchPanelProps = {
  vehicles: Vehicle[];
  drivers: Driver[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVehicleId?: string | null;
};

export function DispatchPanel({
  vehicles,
  drivers,
  open,
  onOpenChange,
  selectedVehicleId,
}: DispatchPanelProps) {
  const [
    formData,
    setFormData,
  ] = useState({
    vehicleId: selectedVehicleId || "",
    driverId: "",
    pickupLocation: "",
    pickupLat: 0,
    pickupLng: 0,
    deliveryLocation: "",
    deliveryLat: 0,
    deliveryLng: 0,
    cargoDescription: "",
    priority: "normal",
    notes: "",
  });
  const [
    showErrors,
    setShowErrors,
  ] = useState(false);
  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const availableVehicles = vehicles.filter(
    v => v.status === "active" || v.status === "idle",
  );
  const availableDrivers = drivers.filter(d => d.status === "available" || d.status === "active");

  const handleSubmit = async () => {
    if (!formData.vehicleId || !formData.pickupLocation || !formData.deliveryLocation) {
      setShowErrors(true);
      toast.error("Please fill in all required fields");
      return;
    }

    if (
      locationError(
        formData.pickupLocation,
        formData.pickupLat,
        formData.pickupLng,
      )
      || locationError(
        formData.deliveryLocation,
        formData.deliveryLat,
        formData.deliveryLng,
      )
    ) {
      setShowErrors(true);
      toast.error("Choose an address in Nigeria from the suggestions");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(
      resolve,
      1500,
    ));

    toast.success(
      "Dispatch created successfully",
      {
        description: `Job assigned to ${
          availableVehicles.find(v => v.id === formData.vehicleId)?.registrationNumber
        }`,
      },
    );

    setIsSubmitting(false);
    onOpenChange(false);
    setFormData({
      vehicleId: "",
      driverId: "",
      pickupLocation: "",
      pickupLat: 0,
      pickupLng: 0,
      deliveryLocation: "",
      deliveryLat: 0,
      deliveryLng: 0,
      cargoDescription: "",
      priority: "normal",
      notes: "",
    });
    setShowErrors(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Create New Dispatch
          </DialogTitle>
          <DialogDescription>
            Assign a job to a vehicle and driver for immediate dispatch.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="vehicle"
                className="flex items-center gap-1"
                required
              >
                <Truck className="h-3 w-3" />
                {" "}
                Vehicle
              </Label>
              <Select
                value={formData.vehicleId}
                onValueChange={value => setFormData({
                  ...formData, vehicleId: value,
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map(vehicle => (
                    <SelectItem
                      key={vehicle.id}
                      value={vehicle.id}
                    >
                      <div className="flex items-center gap-2">
                        {vehicle.registrationNumber}
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {vehicle.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="driver"
                className="flex items-center gap-1"
              >
                <User className="h-3 w-3" />
                {" "}
                Driver
              </Label>
              <Select
                value={formData.driverId}
                onValueChange={value => setFormData({
                  ...formData, driverId: value,
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign driver" />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map(driver => (
                    <SelectItem
                      key={driver.id}
                      value={driver.id}
                    >
                      <div className="flex items-center gap-2">
                        {driver.name}
                        <Badge
                          variant={driver.status === "available" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {driver.status.replace(
                            "_",
                            " ",
                          )}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <MapLocationInput
            embedded
            nigeriaOnly
            required
            label="Pickup Location"
            placeholder="Enter pickup address"
            error={showErrors ? locationError(
              formData.pickupLocation,
              formData.pickupLat,
              formData.pickupLng,
            ) : undefined}
            value={pickerValue(
              formData.pickupLocation,
              formData.pickupLat,
              formData.pickupLng,
            )}
            text={formData.pickupLocation}
            onTextChange={pickupLocation => setFormData(prev => ({
              ...prev, pickupLocation, pickupLat: 0, pickupLng: 0,
            }))}
            onLocationSelect={v => setFormData(prev => ({
              ...prev, pickupLocation: v.address, pickupLat: v.lat, pickupLng: v.lng,
            }))}
          />

          <MapLocationInput
            embedded
            nigeriaOnly
            required
            label="Delivery Location"
            placeholder="Enter delivery address"
            error={showErrors ? locationError(
              formData.deliveryLocation,
              formData.deliveryLat,
              formData.deliveryLng,
            ) : undefined}
            value={pickerValue(
              formData.deliveryLocation,
              formData.deliveryLat,
              formData.deliveryLng,
            )}
            text={formData.deliveryLocation}
            onTextChange={deliveryLocation => setFormData(prev => ({
              ...prev, deliveryLocation, deliveryLat: 0, deliveryLng: 0,
            }))}
            onLocationSelect={v => setFormData(prev => ({
              ...prev, deliveryLocation: v.address, deliveryLat: v.lat, deliveryLng: v.lng,
            }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="cargo"
                className="flex items-center gap-1"
              >
                <Package className="h-3 w-3" />
                {" "}
                Cargo Description
              </Label>
              <Input
                id="cargo"
                placeholder="e.g., Electronics, 50kg"
                value={formData.cargoDescription}
                onChange={e => setFormData({
                  ...formData, cargoDescription: e.target.value,
                })}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="priority"
                className="flex items-center gap-1"
              >
                <Clock className="h-3 w-3" />
                {" "}
                Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={value => setFormData({
                  ...formData, priority: value,
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions..."
              value={formData.notes}
              onChange={e => setFormData({
                ...formData, notes: e.target.value,
              })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Dispatch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
