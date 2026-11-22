import type { Vehicle as FleetApiVehicle } from "@truckmoov/api/fleet";
import type { Vehicle } from "@/types";

/** The edit form's starting values for a server vehicle. */
export function toVehicleFormValue(vehicle: FleetApiVehicle): Vehicle {
  return {
    id: vehicle.id,
    plateNumber: vehicle.plateNumber ?? "",
    vin: vehicle.vin ?? "",
    registrationNumber: vehicle.registrationNumber,
    make: vehicle.make ?? "",
    model: vehicle.model,
    year: vehicle.year ?? new Date().getFullYear(),
    type: (String(vehicle.type) as Vehicle["type"]) || "truck",
    status: (String(vehicle.status) as Vehicle["status"]) || "active",
    capacity: vehicle.capacity || 0,
    capacityUnit: (vehicle.capacityUnit ?? undefined) as Vehicle["capacityUnit"],
    currentDriver: vehicle.assignedDriverName ?? vehicle.assignedDriverId ?? undefined,
  };
}

/** The PATCH body for what the edit form submitted. */
export function toVehicleUpdate(updated: Partial<Vehicle>) {
  return {
    plateNumber: updated.plateNumber,
    registrationNumber: updated.registrationNumber,
    vin: updated.vin,
    make: updated.make,
    model: updated.model,
    year: updated.year,
    type: updated.type,
    capacity: updated.capacity,
    capacityUnit: updated.capacityUnit,
  };
}
