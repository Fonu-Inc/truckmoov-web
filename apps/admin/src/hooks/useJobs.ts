import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { logActivity } from "@/hooks/useActivityLogs";
import { useOrgDataScope } from "@/hooks/useOrgDataScope";
import { useWritePermissions } from "@/hooks/useWritePermissions";

export interface JobData {
  id: string;
  tenantId: string;
  reference: string;
  status: "created" | "assigned" | "in_progress" | "completed" | "cancelled";
  pickupAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  deliveryAddress: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  cargoType: string | null;
  cargoWeight: number | null;
  cargoDescription: string | null;
  driverId: string | null;
  vehicleId: string | null;
  amountNgn: number;
  deadline: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Financial fields for P&L
  revenueNgn: number | null;
  billableKm: number | null;
  billableHours: number | null;
  customerChargeNgn: number | null;
  assignedVehicleId: string | null;
  /** Client-side label of who assigned the driver (e.g. "Fleet Provider", "Dispatcher").
   *  Not persisted to the DB — set locally on assignment so each portal can attribute
   *  the assignment when viewing the same job. */
  assignedByRole?: string | null;
}

export function useJobs() {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuthStore();
  const orgScope = useOrgDataScope();
  const { canCreateJobs, canUpdateJobs, canDeleteJobs } = useWritePermissions();

  const tenantId = user?.tenantId ?? null;
  const isPlatformAdmin = user?.role === "platform_admin";

  // Stabilize array references to prevent infinite re-renders
  const jobFilterOrgIdsKey = JSON.stringify(orgScope.jobFilterOrgIds);
  const stableJobFilterOrgIds = useMemo(() => orgScope.jobFilterOrgIds, [jobFilterOrgIdsKey]);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // If the user has no tenant assignment,
    // return an empty dataset (platform admins can see all tenants).
    if (!isPlatformAdmin && !tenantId) {
      setJobs([]);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase.from("jobs").select("*").order("created_at", { ascending: false });
      if (!isPlatformAdmin && tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      // Always apply org-level filter when multi-stakeholder is enabled
      if (orgScope.multiStakeholderEnabled && !isPlatformAdmin) {
        if (orgScope.jobFilterField && stableJobFilterOrgIds.length > 0) {
          query = query.in(orgScope.jobFilterField, stableJobFilterOrgIds);
        } else {
          // No job access — return empty
          setJobs([]);
          setIsLoading(false);
          return;
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const mapped: JobData[] = (data || []).map((j) => ({
        id: j.id,
        tenantId: j.tenant_id,
        reference: j.reference,
        status: j.status as JobData["status"],
        pickupAddress: j.pickup_address,
        pickupLat: j.pickup_lat,
        pickupLng: j.pickup_lng,
        deliveryAddress: j.delivery_address,
        deliveryLat: j.delivery_lat,
        deliveryLng: j.delivery_lng,
        cargoType: j.cargo_type,
        cargoWeight: j.cargo_weight,
        cargoDescription: j.cargo_description,
        driverId: j.driver_id,
        vehicleId: j.vehicle_id,
        amountNgn: j.amount_ngn || 0,
        deadline: j.deadline,
        completedAt: j.completed_at,
        notes: j.notes,
        createdAt: j.created_at,
        updatedAt: j.updated_at,
        revenueNgn: j.revenue_ngn ?? null,
        billableKm: j.billable_km ?? null,
        billableHours: j.billable_hours ?? null,
        customerChargeNgn: j.customer_charge_ngn ?? null,
        assignedVehicleId: (j as any).assigned_vehicle_id ?? j.vehicle_id ?? null,
      }));

      setJobs(mapped);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err as Error);
      toast.error("Failed to fetch jobs");
    } finally {
      setIsLoading(false);
    }
  }, [isPlatformAdmin, tenantId, orgScope.multiStakeholderEnabled, orgScope.jobFilterField, stableJobFilterOrgIds]);

  const addJob = useCallback(async (job: Partial<JobData>) => {
    if (!canCreateJobs) {
      toast.error("You don't have permission to create jobs");
      return null;
    }
    try {
      const insertTenantId = (isPlatformAdmin ? (job.tenantId ?? tenantId) : tenantId) ?? null;
      if (!insertTenantId) {
        toast.error("No tenant assigned to this account");
        return null;
      }

      const { data, error } = await supabase
        .from("jobs")
        .insert({
          tenant_id: insertTenantId,
          reference: job.reference || `JOB-${Date.now()}`,
          status: job.status || "created",
          pickup_address: job.pickupAddress || "",
          pickup_lat: job.pickupLat,
          pickup_lng: job.pickupLng,
          delivery_address: job.deliveryAddress || "",
          delivery_lat: job.deliveryLat,
          delivery_lng: job.deliveryLng,
          cargo_type: job.cargoType,
          cargo_weight: job.cargoWeight,
          cargo_description: job.cargoDescription,
          driver_id: job.driverId,
          vehicle_id: job.vehicleId,
          amount_ngn: job.amountNgn || 0,
          deadline: job.deadline,
          notes: job.notes,
        })
        .select()
        .single();

      if (error) throw error;

      const newJob: JobData = {
        id: data.id,
        tenantId: data.tenant_id,
        reference: data.reference,
        status: data.status as JobData["status"],
        pickupAddress: data.pickup_address,
        pickupLat: data.pickup_lat,
        pickupLng: data.pickup_lng,
        deliveryAddress: data.delivery_address,
        deliveryLat: data.delivery_lat,
        deliveryLng: data.delivery_lng,
        cargoType: data.cargo_type,
        cargoWeight: data.cargo_weight,
        cargoDescription: data.cargo_description,
        driverId: data.driver_id,
        vehicleId: data.vehicle_id,
        amountNgn: data.amount_ngn || 0,
        deadline: data.deadline,
        completedAt: data.completed_at,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        revenueNgn: data.revenue_ngn ?? null,
        billableKm: data.billable_km ?? null,
        billableHours: data.billable_hours ?? null,
        customerChargeNgn: data.customer_charge_ngn ?? null,
        assignedVehicleId: (data as any).assigned_vehicle_id ?? data.vehicle_id ?? null,
      };

      // Log activity
      await logActivity({
        entityType: 'job',
        entityId: newJob.id,
        action: 'created',
        description: `Job ${newJob.reference} created`,
        tenantId: newJob.tenantId,
        actorId: user?.id,
        actorName: user?.name,
        metadata: { reference: newJob.reference, status: newJob.status },
      });

      setJobs((prev) => [newJob, ...prev]);
      toast.success("Job created successfully");
      return newJob;
    } catch (err) {
      console.error("Error adding job:", err);
      toast.error("Failed to create job");
      return null;
    }
  }, [isPlatformAdmin, tenantId]);

  const updateJob = useCallback(async (id: string, updates: Partial<JobData>) => {
    if (!canUpdateJobs) {
      toast.error("You don't have permission to update jobs");
      return false;
    }
    try {
      // Get the current job for comparison
      const currentJob = jobs.find(j => j.id === id);
      
      const dbUpdates: Record<string, unknown> = {};
      if (updates.reference !== undefined) dbUpdates.reference = updates.reference;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.pickupAddress !== undefined) dbUpdates.pickup_address = updates.pickupAddress;
      if (updates.pickupLat !== undefined) dbUpdates.pickup_lat = updates.pickupLat;
      if (updates.pickupLng !== undefined) dbUpdates.pickup_lng = updates.pickupLng;
      if (updates.deliveryAddress !== undefined) dbUpdates.delivery_address = updates.deliveryAddress;
      if (updates.deliveryLat !== undefined) dbUpdates.delivery_lat = updates.deliveryLat;
      if (updates.deliveryLng !== undefined) dbUpdates.delivery_lng = updates.deliveryLng;
      if (updates.cargoType !== undefined) dbUpdates.cargo_type = updates.cargoType;
      if (updates.cargoWeight !== undefined) dbUpdates.cargo_weight = updates.cargoWeight;
      if (updates.cargoDescription !== undefined) dbUpdates.cargo_description = updates.cargoDescription;
      if (updates.driverId !== undefined) dbUpdates.driver_id = updates.driverId;
      if (updates.vehicleId !== undefined) dbUpdates.vehicle_id = updates.vehicleId;
      if (updates.amountNgn !== undefined) dbUpdates.amount_ngn = updates.amountNgn;
      if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      // Financial fields
      if (updates.revenueNgn !== undefined) dbUpdates.revenue_ngn = updates.revenueNgn;
      if (updates.billableKm !== undefined) dbUpdates.billable_km = updates.billableKm;
      if (updates.billableHours !== undefined) dbUpdates.billable_hours = updates.billableHours;
      if (updates.customerChargeNgn !== undefined) dbUpdates.customer_charge_ngn = updates.customerChargeNgn;
      if (updates.assignedVehicleId !== undefined) dbUpdates.assigned_vehicle_id = updates.assignedVehicleId;

      const { error } = await supabase
        .from("jobs")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;

      // Log activity based on what changed
      if (currentJob) {
        let action = 'updated';
        let description = `Job ${currentJob.reference} updated`;
        
        if (updates.status && updates.status !== currentJob.status) {
          action = 'status_changed';
          description = `Job status changed from ${currentJob.status} to ${updates.status}`;
        } else if (updates.driverId && updates.driverId !== currentJob.driverId) {
          action = 'assigned';
          description = `Driver assigned to job ${currentJob.reference}`;
        } else if (updates.vehicleId && updates.vehicleId !== currentJob.vehicleId) {
          action = 'vehicle_assigned';
          description = `Vehicle assigned to job ${currentJob.reference}`;
        }

        await logActivity({
          entityType: 'job',
          entityId: id,
          action,
          description,
          tenantId: currentJob.tenantId,
          actorId: user?.id,
          actorName: user?.name,
          metadata: { 
            previousStatus: currentJob.status, 
            newStatus: updates.status,
            changes: Object.keys(updates),
          },
        });
      }

      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, ...updates } : j))
      );
      toast.success("Job updated successfully");
      return true;
    } catch (err) {
      console.error("Error updating job:", err);
      toast.error("Failed to update job");
      return false;
    }
  }, [jobs, user]);

  const deleteJob = useCallback(async (id: string) => {
    if (!canDeleteJobs) {
      toast.error("You don't have permission to delete jobs");
      return false;
    }
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", id);

      if (error) throw error;

      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast.success("Job deleted successfully");
      return true;
    } catch (err) {
      console.error("Error deleting job:", err);
      toast.error("Failed to delete job");
      return false;
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    isLoading,
    error,
    refetch: fetchJobs,
    addJob,
    updateJob,
    deleteJob,
    canCreate: canCreateJobs,
    canUpdate: canUpdateJobs,
    canDelete: canDeleteJobs,
  };
}



