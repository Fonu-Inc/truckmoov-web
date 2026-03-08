import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { mockVehicles } from "@/data/mockData";
import { useOrgDataScope } from "@/hooks/useOrgDataScope";
import { useWritePermissions } from "@/hooks/useWritePermissions";

// Lagos Express Logistics tenant UUID (for demo mode)
const DEMO_TENANT_ID = "f7f5af88-fd76-4439-aae3-0461be52f63f";

// Demo user IDs from authStore mockUsers
const DEMO_USER_IDS = ["pa1", "ta1", "om1", "s1", "dp1", "vf1", "d1"];

export interface VehicleData {
  id: string;
  tenantId: string;
  vin: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  type: string;
  status: "active" | "inactive" | "maintenance" | "decommissioned";
  capacity: number | null;
  currentDriverId: string | null;
  deviceId: string | null;
  fuelLevel: number | null;
  currentMileage: number | null;
  mileageSource: 'telemetry' | 'manual' | null;
  lastMileageUpdate: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuthStore();
  const orgScope = useOrgDataScope();
  const { canCreateAssets, canUpdateAssets, canDeleteAssets } = useWritePermissions();

  // Stabilize array reference to prevent infinite re-renders
  const assetOrgIdsKey = JSON.stringify(orgScope.assetOrgIds);
  const stableAssetOrgIds = useMemo(() => orgScope.assetOrgIds, [assetOrgIdsKey]);

  // Check if this is a demo user (mock login)
  const isDemoUser = user?.id ? DEMO_USER_IDS.includes(user.id) : false;
  
  // For demo users, always use the demo tenant; otherwise use real tenant ID
  const tenantId = isDemoUser ? DEMO_TENANT_ID : user?.tenantId;

  const fetchVehicles = useCallback(async () => {
    // For demo users, use DEMO_TENANT_ID to fetch from database
    const effectiveTenantId = isDemoUser ? DEMO_TENANT_ID : tenantId;

    if (!effectiveTenantId) {
      setVehicles([]);
      setIsLoading(false);
      return;
    }

    // When multi-stakeholder is enabled, Enterprise orgs have no asset access
    if (orgScope.multiStakeholderEnabled && stableAssetOrgIds.length === 0 && !orgScope.canManageAssets && user?.role !== 'platform_admin') {
      setVehicles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("vehicles")
        .select("*")
        .eq("tenant_id", effectiveTenantId)
        .order("created_at", { ascending: false });

      // Always apply org-level filter when multi-stakeholder is enabled
      if (orgScope.multiStakeholderEnabled && stableAssetOrgIds.length > 0 && user?.role !== 'platform_admin') {
        query = query.in("owning_org_id", stableAssetOrgIds);
      }

      const { data, error: fetchError } = await query;

      const mapped: VehicleData[] = (data || []).map((v) => ({
        id: v.id,
        tenantId: v.tenant_id,
        vin: v.vin,
        registrationNumber: v.registration_number,
        make: v.make,
        model: v.model,
        year: v.year,
        type: v.type,
        status: v.status as VehicleData["status"],
        capacity: v.capacity,
        currentDriverId: v.current_driver_id,
        deviceId: v.device_id,
        fuelLevel: v.fuel_level,
        currentMileage: v.current_mileage ?? null,
        mileageSource: v.mileage_source as VehicleData['mileageSource'] ?? null,
        lastMileageUpdate: v.last_mileage_update ?? null,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      }));

      setVehicles(mapped);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError(err as Error);
      toast.error("Failed to fetch vehicles");
    } finally {
      setIsLoading(false);
    }
  }, [isDemoUser, tenantId, orgScope.multiStakeholderEnabled, stableAssetOrgIds, orgScope.canManageAssets, user?.role]);

  const addVehicle = useCallback(async (vehicle: Partial<VehicleData>) => {
    if (!canCreateAssets) {
      toast.error("You don't have permission to add vehicles");
      return false;
    }
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .insert({
          tenant_id: tenantId,
          vin: vehicle.vin || "",
          registration_number: vehicle.registrationNumber || "",
          make: vehicle.make || "",
          model: vehicle.model || "",
          year: vehicle.year || new Date().getFullYear(),
          type: vehicle.type || "truck",
          status: vehicle.status || "active",
          capacity: vehicle.capacity || null,
          fuel_level: vehicle.fuelLevel || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newVehicle: VehicleData = {
        id: data.id,
        tenantId: data.tenant_id,
        vin: data.vin,
        registrationNumber: data.registration_number,
        make: data.make,
        model: data.model,
        year: data.year,
        type: data.type,
        status: data.status as VehicleData["status"],
        capacity: data.capacity,
        currentDriverId: data.current_driver_id,
        deviceId: data.device_id,
        fuelLevel: data.fuel_level,
        currentMileage: data.current_mileage ?? null,
        mileageSource: data.mileage_source as VehicleData['mileageSource'] ?? null,
        lastMileageUpdate: data.last_mileage_update ?? null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setVehicles((prev) => [newVehicle, ...prev]);
      toast.success("Vehicle added successfully");
      return true;
    } catch (err) {
      console.error("Error adding vehicle:", err);
      toast.error("Failed to add vehicle");
      return false;
    }
  }, [tenantId]);

  const updateVehicle = useCallback(async (id: string, updates: Partial<VehicleData>) => {
    if (!canUpdateAssets) {
      toast.error("You don't have permission to update vehicles");
      return false;
    }
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.vin !== undefined) dbUpdates.vin = updates.vin;
      if (updates.registrationNumber !== undefined) dbUpdates.registration_number = updates.registrationNumber;
      if (updates.make !== undefined) dbUpdates.make = updates.make;
      if (updates.model !== undefined) dbUpdates.model = updates.model;
      if (updates.year !== undefined) dbUpdates.year = updates.year;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.capacity !== undefined) dbUpdates.capacity = updates.capacity;
      if (updates.fuelLevel !== undefined) dbUpdates.fuel_level = updates.fuelLevel;
      if (updates.currentDriverId !== undefined) dbUpdates.current_driver_id = updates.currentDriverId;
      if (updates.currentMileage !== undefined) {
        dbUpdates.current_mileage = updates.currentMileage;
        dbUpdates.mileage_source = 'manual';
        dbUpdates.last_mileage_update = new Date().toISOString();
      }

      const { error } = await supabase
        .from("vehicles")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;

      setVehicles((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
      );
      toast.success("Vehicle updated successfully");
      return true;
    } catch (err) {
      console.error("Error updating vehicle:", err);
      toast.error("Failed to update vehicle");
      return false;
    }
  }, []);

  const deleteVehicle = useCallback(async (id: string) => {
    if (!canDeleteAssets) {
      toast.error("You don't have permission to delete vehicles");
      return false;
    }
    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);

      if (error) throw error;

      setVehicles((prev) => prev.filter((v) => v.id !== id));
      toast.success("Vehicle deleted successfully");
      return true;
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      toast.error("Failed to delete vehicle");
      return false;
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    isLoading,
    error,
    refetch: fetchVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    canCreate: canCreateAssets,
    canUpdate: canUpdateAssets,
    canDelete: canDeleteAssets,
  };
}
