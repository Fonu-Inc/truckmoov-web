import type { MaintenanceProfileIntervalType } from "@truckmoov/api/fleet";
import {
  useCreateMaintenanceProfile,
  useMaintenanceServiceCategories,
  useVehicles,
} from "@truckmoov/api/fleet";
import {
  addDays, addMonths,
} from "@truckmoov/app-core/utils/time-utils";
import {
  useMemo, useState,
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
  RadioGroup, RadioGroupItem,
} from "@/components/shadcn/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { formatMaintenanceServiceLabel } from "@/features/fleet/utils/maintenanceProfile";

type NewProfileState = {
  vehicleId: string;
  serviceType: string;
  customLabel: string;
  intervalType: MaintenanceProfileIntervalType;
  timeUnit: "days" | "months";
  intervalDays: string;
  intervalMonths: string;
  intervalKm: string;
  lastServiceDate: string;
  lastServiceMileage: string;
};

function buildDefaultProfile(): NewProfileState {
  return {
    vehicleId: "",
    serviceType: "",
    customLabel: "",
    intervalType: "date",
    timeUnit: "days",
    intervalDays: "",
    intervalMonths: "",
    intervalKm: "",
    lastServiceDate: "",
    lastServiceMileage: "",
  };
}

/**
 * "Add Maintenance Profile" dialog — creates a recurring maintenance profile
 * via `useCreateMaintenanceProfile`. Opened from the Maintenance tab header.
 */
export function MaintenanceProfileFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [
    newProfile,
    setNewProfile,
  ] = useState<NewProfileState>(() => buildDefaultProfile());
  const vehiclesQuery = useVehicles();
  const categoriesQuery = useMaintenanceServiceCategories();
  const createProfileMutation = useCreateMaintenanceProfile();

  const vehicles = useMemo(
    () => vehiclesQuery.data?.data ?? [],
    [vehiclesQuery.data?.data],
  );
  const serviceCategories = useMemo(
    () => categoriesQuery.data?.data ?? [],
    [categoriesQuery.data?.data],
  );

  const getVehicleLabel = (vehicleId: string) => {
    const vehicle = vehicles.find(item => item.id === vehicleId);
    if (!vehicle)
      return vehicleId;
    return vehicle.registrationNumber
      || vehicle.plateNumber
      || `${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim()
      || vehicle.id;
  };

  const handleAddProfile = async () => {
    if (!newProfile.vehicleId || !newProfile.serviceType) {
      toast.error("Please fill in required fields");
      return;
    }

    if (newProfile.serviceType === "custom" && !newProfile.customLabel.trim()) {
      toast.error("Please enter a custom service category");
      return;
    }

    let nextDueDate: string | null = null;
    if (newProfile.intervalType !== "mileage") {
      const baseDate = newProfile.lastServiceDate ? new Date(newProfile.lastServiceDate) : new Date();
      if (newProfile.intervalDays) {
        nextDueDate = addDays(
          baseDate,
          Number(newProfile.intervalDays),
        )!.toISOString();
      }
      else if (newProfile.intervalMonths) {
        nextDueDate = addMonths(
          baseDate,
          Number(newProfile.intervalMonths),
        )!.toISOString();
      }
    }

    let nextDueMileage: number | null = null;
    if (newProfile.intervalType !== "date" && newProfile.intervalKm) {
      const baseMileage = newProfile.lastServiceMileage ? Number(newProfile.lastServiceMileage) : 0;
      nextDueMileage = baseMileage + Number(newProfile.intervalKm);
    }

    const serviceType
      = newProfile.serviceType === "custom" ? newProfile.customLabel.trim() : newProfile.serviceType;

    try {
      await createProfileMutation.mutateAsync({
        data: {
          vehicleId: newProfile.vehicleId,
          serviceType,
          serviceLabel: newProfile.serviceType === "custom" ? newProfile.customLabel.trim() : serviceType,
          intervalType: newProfile.intervalType,
          intervalDays: newProfile.intervalDays ? Number(newProfile.intervalDays) : null,
          intervalMonths: newProfile.intervalMonths ? Number(newProfile.intervalMonths) : null,
          intervalKm: newProfile.intervalKm ? Number(newProfile.intervalKm) : null,
          lastServiceDate: newProfile.lastServiceDate || null,
          lastServiceMileage: newProfile.lastServiceMileage ? Number(newProfile.lastServiceMileage) : null,
          mileageSource: "manual",
          nextDueDate,
          nextDueMileage,
        },
      });
      toast.success("Maintenance profile created");
      onOpenChange(false);
      setNewProfile(buildDefaultProfile());
    }
    catch (error) {
      toast.error(error.message || "Failed to create maintenance profile");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Maintenance Profile</DialogTitle>
          <DialogDescription>Create a recurring maintenance schedule for a vehicle.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label required>Vehicle</Label>
            <Select
              value={newProfile.vehicleId}
              onValueChange={value => setNewProfile({
                ...newProfile, vehicleId: value,
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder={vehiclesQuery.isPending ? "Loading vehicles..." : "Select vehicle"} />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map(vehicle => (
                  <SelectItem
                    key={vehicle.id}
                    value={vehicle.id}
                  >
                    {getVehicleLabel(vehicle.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label required>Service Category</Label>
            <Select
              value={newProfile.serviceType}
              onValueChange={value => setNewProfile({
                ...newProfile, serviceType: value,
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder={categoriesQuery.isPending ? "Loading categories..." : "Select service category"} />
              </SelectTrigger>
              <SelectContent>
                {serviceCategories.map(category => (
                  <SelectItem
                    key={category}
                    value={category}
                  >
                    {formatMaintenanceServiceLabel(category)}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newProfile.serviceType === "custom" && (
            <div className="space-y-2">
              <Label required>Custom Category</Label>
              <Input
                placeholder="e.g., Suspension Check"
                value={newProfile.customLabel}
                onChange={e => setNewProfile({
                  ...newProfile, customLabel: e.target.value,
                })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label required>Schedule Based On</Label>
            <Select
              value={newProfile.intervalType}
              onValueChange={value =>
                setNewProfile({
                  ...newProfile, intervalType: value as MaintenanceProfileIntervalType,
                })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Time (Days/Months)</SelectItem>
                <SelectItem value="mileage">Mileage (Kilometers)</SelectItem>
                <SelectItem value="both">Both (Whichever comes first)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newProfile.intervalType !== "mileage" && (
            <div className="space-y-3 rounded-lg border border-border/50 p-3">
              <Label className="text-xs text-muted-foreground">Choose time unit</Label>
              <RadioGroup
                value={newProfile.timeUnit}
                onValueChange={value =>
                  setNewProfile({
                    ...newProfile,
                    timeUnit: value as "days" | "months",
                    intervalDays: value === "days" ? newProfile.intervalDays : "",
                    intervalMonths: value === "months" ? newProfile.intervalMonths : "",
                  })}
                className="grid grid-cols-2 gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="days"
                      id="unit-days"
                    />
                    <Label
                      htmlFor="unit-days"
                      className="cursor-pointer"
                    >
                      By Day
                    </Label>
                  </div>
                  <Input
                    type="number"
                    placeholder="e.g., 90"
                    value={newProfile.intervalDays}
                    disabled={newProfile.timeUnit !== "days"}
                    onChange={e => setNewProfile({
                      ...newProfile, intervalDays: e.target.value,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="months"
                      id="unit-months"
                    />
                    <Label
                      htmlFor="unit-months"
                      className="cursor-pointer"
                    >
                      By Month
                    </Label>
                  </div>
                  <Input
                    type="number"
                    placeholder="e.g., 3"
                    value={newProfile.intervalMonths}
                    disabled={newProfile.timeUnit !== "months"}
                    onChange={e => setNewProfile({
                      ...newProfile, intervalMonths: e.target.value,
                    })}
                  />
                </div>
              </RadioGroup>
            </div>
          )}

          {newProfile.intervalType !== "date" && (
            <div className="space-y-2">
              <Label>Interval (Kilometers)</Label>
              <Input
                type="number"
                placeholder="e.g., 5000"
                value={newProfile.intervalKm}
                onChange={e => setNewProfile({
                  ...newProfile, intervalKm: e.target.value,
                })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Last Service Date</Label>
              <Input
                type="date"
                value={newProfile.lastServiceDate}
                onChange={e => setNewProfile({
                  ...newProfile, lastServiceDate: e.target.value,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Service Mileage</Label>
              <Input
                type="number"
                placeholder="e.g., 45000"
                value={newProfile.lastServiceMileage}
                onChange={e => setNewProfile({
                  ...newProfile, lastServiceMileage: e.target.value,
                })}
              />
            </div>
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
            onClick={handleAddProfile}
            loading={createProfileMutation.isPending}
          >
            Create Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
