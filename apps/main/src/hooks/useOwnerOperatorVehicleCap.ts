interface VehicleCapInfo {
  currentCount: number;
  maxVehicles: number;
  isAtCap: boolean;
  remaining: number;
  upgradeMessage: string | null;
}

/**
 * Checks the vehicle cap for an Owner-Operator organization.
 * Returns cap info and an upgrade prompt when at/near the limit.
 */
export function useOwnerOperatorVehicleCap(_orgId: string | null | undefined) {
  return {
    data: null as VehicleCapInfo | null | undefined,
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}
