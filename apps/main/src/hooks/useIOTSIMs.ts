import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SIMCard } from "@/types";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

interface IOTSIMFromDB {
  id: string;
  iccid: string;
  imsi: string | null;
  msisdn: string;
  carrier: string;
  plan: string;
  status: string;
  tenant_id: string | null;
  device_id: string | null;
  data_usage_mb: number;
  data_limit_mb: number;
  sms_usage: number;
  sms_limit: number;
  monthly_cost_ngn: number;
  activation_date: string | null;
  expiry_date: string | null;
  last_activity: string | null;
  signal_strength: number | null;
  roaming: boolean | null;
  network_type: string | null;
  fonu_sim_id: string | null;
  fonu_status: string | null;
  created_at: string;
  updated_at: string;
}

// Extended SIM type with additional DB fields
export interface SIMCardExtended extends SIMCard {
  plan: string;
  tenantId: string | null;
  monthlyCostNGN: number;
  smsUsage: number;
  smsLimit: number;
  activationDate: string | null;
  expiryDate: string | null;
  lastActivity: string | null;
  signalStrength: number | null;
  roaming: boolean;
  networkType: string | null;
  fonuSimId: string | null;
  fonuStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapDBToSIMCard(dbSim: IOTSIMFromDB): SIMCardExtended {
  // Map DB status to frontend status type
  const statusMap: Record<string, SIMCard["status"]> = {
    registered: "registered",
    active: "active",
    assigned: "assigned",
    suspended: "suspended",
    deactivated: "deactivated",
    inactive: "deactivated",
  };

  return {
    id: dbSim.id,
    iccid: dbSim.iccid,
    imsi: dbSim.imsi || "",
    mobileNumber: dbSim.msisdn,
    networkOperator: dbSim.carrier,
    status: statusMap[dbSim.status] || "registered",
    dataUsage: dbSim.data_usage_mb / 1024, // Convert MB to GB for display
    dataLimit: dbSim.data_limit_mb / 1024, // Convert MB to GB for display
    deviceId: dbSim.device_id || undefined,
    // Extended fields
    plan: dbSim.plan,
    tenantId: dbSim.tenant_id,
    monthlyCostNGN: dbSim.monthly_cost_ngn,
    smsUsage: dbSim.sms_usage,
    smsLimit: dbSim.sms_limit,
    activationDate: dbSim.activation_date,
    expiryDate: dbSim.expiry_date,
    lastActivity: dbSim.last_activity,
    signalStrength: dbSim.signal_strength,
    roaming: dbSim.roaming || false,
    networkType: dbSim.network_type,
    fonuSimId: dbSim.fonu_sim_id,
    fonuStatus: dbSim.fonu_status,
    createdAt: dbSim.created_at,
    updatedAt: dbSim.updated_at,
  };
}

export function useIOTSIMs(providedTenantId?: string) {
  const { user } = useAuthStore();
  const [sims, setSims] = useState<SIMCardExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Resolve tenant ID
  const tenantId = providedTenantId || user?.tenantId;

  const fetchSIMs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // For production mode, fetch from database
      let query = supabase.from("iot_sims").select("*").order("created_at", { ascending: false });

      // Filter by tenant if available
      if (tenantId && tenantId !== "default") {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const mappedSims = (data || []).map(mapDBToSIMCard);
      setSims(mappedSims);
    } catch (err) {
      console.error("Error fetching IoT SIMs:", err);
      setError(err as Error);
      toast.error("Failed to fetch SIM cards");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const updateSIMStatus = useCallback(async (simId: string, newStatus: SIMCard["status"]) => {
    try {
      const { error } = await supabase
        .from("iot_sims")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", simId);

      if (error) throw error;

      setSims((prev) =>
        prev.map((s) => (s.id === simId ? { ...s, status: newStatus } : s))
      );

      toast.success(`SIM card ${newStatus === "active" ? "activated" : newStatus}`);
      return true;
    } catch (err) {
      console.error("Error updating SIM status:", err);
      toast.error("Failed to update SIM status");
      return false;
    }
  }, []);

  const assignSIMToDevice = useCallback(async (simId: string, deviceId: string) => {
    try {
      const { error } = await supabase
        .from("iot_sims")
        .update({ 
          device_id: deviceId, 
          status: "assigned",
          updated_at: new Date().toISOString() 
        })
        .eq("id", simId);

      if (error) throw error;

      setSims((prev) =>
        prev.map((s) =>
          s.id === simId ? { ...s, deviceId, status: "assigned" } : s
        )
      );

      toast.success("SIM card assigned to device");
      return true;
    } catch (err) {
      console.error("Error assigning SIM to device:", err);
      toast.error("Failed to assign SIM to device");
      return false;
    }
  }, []);

  const unassignSIM = useCallback(async (simId: string) => {
    try {
      const { error } = await supabase
        .from("iot_sims")
        .update({ 
          device_id: null, 
          status: "active",
          updated_at: new Date().toISOString() 
        })
        .eq("id", simId);

      if (error) throw error;

      setSims((prev) =>
        prev.map((s) =>
          s.id === simId ? { ...s, deviceId: undefined, status: "active" } : s
        )
      );

      toast.success("SIM card unassigned from device");
      return true;
    } catch (err) {
      console.error("Error unassigning SIM:", err);
      toast.error("Failed to unassign SIM");
      return false;
    }
  }, []);

  const deleteSIM = useCallback(async (simId: string) => {
    try {
      const { error } = await supabase
        .from("iot_sims")
        .delete()
        .eq("id", simId);

      if (error) throw error;

      setSims((prev) => prev.filter((s) => s.id !== simId));
      toast.success("SIM card deleted");
      return true;
    } catch (err) {
      console.error("Error deleting SIM:", err);
      toast.error("Failed to delete SIM card");
      return false;
    }
  }, []);

  useEffect(() => {
    fetchSIMs();
  }, [fetchSIMs]);

  return {
    sims,
    loading,
    error,
    refetch: fetchSIMs,
    updateSIMStatus,
    assignSIMToDevice,
    unassignSIM,
    deleteSIM,
  };
}
