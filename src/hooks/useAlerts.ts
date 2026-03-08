import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import type { Json } from "@/integrations/supabase/types";
import { mockAlerts } from "@/data/mockData";
import { useOrgDataScope } from "@/hooks/useOrgDataScope";

// Stabilize org scope arrays

// Lagos Express Logistics tenant UUID (for demo mode)
const DEMO_TENANT_ID = "f7f5af88-fd76-4439-aae3-0461be52f63f";

// Demo user IDs from authStore mockUsers
const DEMO_USER_IDS = ["pa1", "ta1", "om1", "s1", "dp1", "vf1", "d1"];

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
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuthStore();
  const orgScope = useOrgDataScope();
  const assetOrgIdsKey = JSON.stringify(orgScope.assetOrgIds);
  const stableAssetOrgIds = useMemo(() => orgScope.assetOrgIds, [assetOrgIdsKey]);

  // Check if this is a demo user (mock login)
  const isDemoUser = user?.id ? DEMO_USER_IDS.includes(user.id) : false;
  
  // For demo users, always use the demo tenant; otherwise use real tenant ID
  const tenantId = isDemoUser ? DEMO_TENANT_ID : (user?.tenantId ?? null);
  const isPlatformAdmin = user?.role === "platform_admin";

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (isDemoUser) {
      const mapped: AlertData[] = (mockAlerts || []).map((a) => ({
        id: a.id,
        tenantId: DEMO_TENANT_ID,
        type: a.type as AlertData["type"],
        severity: a.severity as AlertData["severity"],
        message: a.message,
        vehicleId: a.vehicleId ?? null,
        driverId: (a as any).driverId ?? null,
        deviceId: null,
        acknowledged: Boolean(a.acknowledged),
        acknowledgedBy: null,
        acknowledgedAt: a.acknowledged ? new Date((a as any).timestamp ?? Date.now()).toISOString() : null,
        metadata: {},
        createdAt: new Date((a as any).timestamp ?? Date.now()).toISOString(),
      }));

      setAlerts(mapped);
      setIsLoading(false);
      return;
    }

    if (!isPlatformAdmin && !tenantId) {
      setAlerts([]);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase.from("alerts").select("*").order("created_at", { ascending: false });
      if (!isPlatformAdmin && tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      // Always apply org-level filter when multi-stakeholder is enabled
      if (orgScope.multiStakeholderEnabled && !isPlatformAdmin) {
        if (stableAssetOrgIds.length > 0) {
          query = query.in("org_id", stableAssetOrgIds);
        } else {
          // No org access to alerts — return empty
          setAlerts([]);
          setIsLoading(false);
          return;
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const mapped: AlertData[] = (data || []).map((a) => ({
        id: a.id,
        tenantId: a.tenant_id,
        type: a.type as AlertData["type"],
        severity: a.severity as AlertData["severity"],
        message: a.message,
        vehicleId: a.vehicle_id,
        driverId: a.driver_id,
        deviceId: a.device_id,
        acknowledged: a.acknowledged,
        acknowledgedBy: a.acknowledged_by,
        acknowledgedAt: a.acknowledged_at,
        metadata: (a.metadata as Record<string, unknown>) || {},
        createdAt: a.created_at,
      }));

      setAlerts(mapped);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError(err as Error);
      toast.error("Failed to fetch alerts");
    } finally {
      setIsLoading(false);
    }
  }, [isDemoUser, isPlatformAdmin, tenantId, orgScope.multiStakeholderEnabled, stableAssetOrgIds]);

  const acknowledgeAlert = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user?.id || null,
        })
        .eq("id", id);

      if (error) throw error;

      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                acknowledged: true,
                acknowledgedAt: new Date().toISOString(),
                acknowledgedBy: user?.id || null,
              }
            : a
        )
      );
      toast.success("Alert acknowledged");
      return true;
    } catch (err) {
      console.error("Error acknowledging alert:", err);
      toast.error("Failed to acknowledge alert");
      return false;
    }
  }, [user?.id]);

  const createAlert = useCallback(async (alert: Partial<AlertData>) => {
    try {
      const insertTenantId = (isPlatformAdmin ? (alert.tenantId ?? tenantId) : tenantId) ?? null;
      if (!insertTenantId) {
        toast.error("No tenant assigned");
        return null;
      }

      const { data, error } = await supabase
        .from("alerts")
        .insert([{
          tenant_id: insertTenantId,
          type: alert.type || "device",
          severity: alert.severity || "low",
          message: alert.message || "",
          vehicle_id: alert.vehicleId || null,
          driver_id: alert.driverId || null,
          device_id: alert.deviceId || null,
          metadata: (alert.metadata || {}) as Json,
        }])
        .select()
        .single();

      if (error) throw error;

      const newAlert: AlertData = {
        id: data.id,
        tenantId: data.tenant_id,
        type: data.type as AlertData["type"],
        severity: data.severity as AlertData["severity"],
        message: data.message,
        vehicleId: data.vehicle_id,
        driverId: data.driver_id,
        deviceId: data.device_id,
        acknowledged: data.acknowledged,
        acknowledgedBy: data.acknowledged_by,
        acknowledgedAt: data.acknowledged_at,
        metadata: (data.metadata as Record<string, unknown>) || {},
        createdAt: data.created_at,
      };

      setAlerts((prev) => [newAlert, ...prev]);
      return newAlert;
    } catch (err) {
      console.error("Error creating alert:", err);
      toast.error("Failed to create alert");
      return null;
    }
  }, [isPlatformAdmin, tenantId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Computed values
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalAlerts = alerts.filter((a) => a.severity === "critical" || a.severity === "high");

  return {
    alerts,
    unacknowledgedAlerts,
    criticalAlerts,
    isLoading,
    error,
    refetch: fetchAlerts,
    acknowledgeAlert,
    createAlert,
  };
}
