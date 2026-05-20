import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { mockVehicles, mockDrivers, mockDevices, mockSIMCards } from "@/data/mockData";
import { isFreshActivation } from "@/lib/freshActivation";

// Lagos Express Logistics tenant UUID (for demo mode)
const DEMO_TENANT_ID = "f7f5af88-fd76-4439-aae3-0461be52f63f";

// Demo user IDs from authStore mockUsers
const DEMO_USER_IDS = ["pa1", "ta1", "om1", "s1", "dp1", "vf1", "d1"];

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

  // Check if this is a demo user (mock login)
  const isDemoUser = user?.id ? DEMO_USER_IDS.includes(user.id) && !isFreshActivation() : false;

  useEffect(() => {
    const fetchTenantData = async () => {
      // Demo users get Lagos Express fixtures (no backend auth needed)
      if (isDemoUser) {
        setData({
          name: "Lagos Express Logistics",
          vehicleCount: mockVehicles.length,
          driverCount: mockDrivers.length,
          deviceCount: mockDevices.length,
          simCount: mockSIMCards.length,
          plan: "enterprise",
          status: "active",
        });
        setError(null);
        setIsLoading(false);
        return;
      }

      // Real users without a tenant assignment
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
  }, [isDemoUser, user?.id, user?.tenantId]);

  return { data, isLoading, error };
}
