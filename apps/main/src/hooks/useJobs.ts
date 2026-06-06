import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useWritePermissions } from '@/hooks/useWritePermissions';

export interface JobData {
  id: string;
  tenantId: string;
  reference: string;
  status: 'created' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
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
  revenueNgn: number | null;
  billableKm: number | null;
  billableHours: number | null;
  customerChargeNgn: number | null;
  assignedVehicleId: string | null;
  assignedByRole?: string | null;
}

export function useJobs() {
  const [jobs] = useState<JobData[]>([]);
  const isLoading = false;
  const error: Error | null = null;
  const { canCreateJobs, canUpdateJobs, canDeleteJobs } = useWritePermissions();

  const addJob = useCallback(async (_job: Partial<JobData>) => null, []);
  const updateJob = useCallback(async (_id: string, _updates: Partial<JobData>) => false, []);
  const deleteJob = useCallback(async (_id: string) => false, []);

  return {
    jobs,
    isLoading,
    error,
    refetch: () => {},
    addJob,
    updateJob,
    deleteJob,
    canCreate: canCreateJobs,
    canUpdate: canUpdateJobs,
    canDelete: canDeleteJobs,
  };
}
