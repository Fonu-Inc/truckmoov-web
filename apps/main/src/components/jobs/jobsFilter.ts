import type {
  JobsFilterBounds, JobsFilterValue,
} from "./JobsFilterDialog";

export function buildDefaultFilterValue(_bounds: JobsFilterBounds): JobsFilterValue {
  return {
    driverId: "",
    vehicleId: "",
  };
}

export function countActiveFilters(value: JobsFilterValue): number {
  let n = 0;
  if (value.driverId.trim())
    n++;
  if (value.vehicleId.trim())
    n++;
  return n;
}
