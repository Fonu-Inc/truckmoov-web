import type { VehiclesFilterValue } from "./VehiclesFilterDialog";

export function buildDefaultVehiclesFilterValue(): VehiclesFilterValue {
  return {
    statusEnabled: false,
    status: "all",
    assignedEnabled: false,
    assigned: "all",
    typeEnabled: false,
    type: "all",
    yearEnabled: false,
    yearRange: [
      0,
      0,
    ],
  };
}

export function countActiveVehicleFilters(value: VehiclesFilterValue): number {
  let n = 0;
  if (value.statusEnabled && value.status !== "all")
    n++;
  if (value.assignedEnabled && value.assigned !== "all")
    n++;
  if (value.typeEnabled && value.type !== "all")
    n++;
  if (value.yearEnabled)
    n++;
  return n;
}
