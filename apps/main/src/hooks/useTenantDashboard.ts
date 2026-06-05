import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";

interface TenantDashboardData {
  name: string;
  vehicleCount: number;
  driverCount: number;
  deviceCount: number;
  simCount: number;
  plan: string;
  status: string;
}

export function useTenantDashboard() {
  const [data, setData] = useState<TenantDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchTenantData = async () => {
      // Users without a tenant assignment
      if (!user?.tenantId) {
        setData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data: tenant, error: tenantError } = await supabase
          .from("tenants")
          .select("name, vehicle_count, driver_count, device_count, sim_count, plan, status")
          .eq("id", user.tenantId)
          .maybeSingle();

        if (tenantError) throw tenantError;

        if (!tenant) {
          setData(null);
          return;
        }

        setData({
          name: tenant.name,
          vehicleCount: tenant.vehicle_count || 0,
          driverCount: tenant.driver_count || 0,
          deviceCount: tenant.device_count || 0,
          simCount: tenant.sim_count || 0,
          plan: tenant.plan,
          status: tenant.status,
        });
      } catch (err) {
        console.error("Error fetching tenant dashboard data:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();
  }, [user?.id, user?.tenantId]);

  return { data, isLoading, error };
}
