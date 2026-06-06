export interface AlertData {
  id: string;
  tenantId: string;
  type: "speed" | "geofence" | "fuel" | "maintenance" | "sos" | "device" | "driver";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  vehicleId: string | null;
  driverId: string | null;
  deviceId: string | null;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export function useAlerts() {
  const alerts: AlertData[] = [];
  const unacknowledgedAlerts: AlertData[] = [];
  const criticalAlerts: AlertData[] = [];

  return {
    alerts,
    unacknowledgedAlerts,
    criticalAlerts,
    isLoading: false,
    error: null,
    refetch: () => {},
    acknowledgeAlert: async (_id: string) => false,
    createAlert: async (_alert: Partial<AlertData>) => null,
  };
}
