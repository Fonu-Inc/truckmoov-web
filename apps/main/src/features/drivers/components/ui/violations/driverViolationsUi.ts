import { violationTypeLabel } from "@/features/fleet/components/ui/violations/violationsUi";

/** The driver Violations tab says "Harsh Cornering" where the vehicle tab says "Sharp Turn". */
export function driverViolationTypeLabel(type: string) {
  const label = violationTypeLabel(type);
  return label === "Sharp Turn" ? "Harsh Cornering" : label;
}
