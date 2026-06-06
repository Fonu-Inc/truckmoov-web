import { useAuthStore } from '@/stores/authStore';
import { SIMCard } from '@/types';

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

export function useIOTSIMs(_providedTenantId?: string) {
  const sims: SIMCardExtended[] = [];
  const loading = false;
  const error: Error | null = null;

  const updateSIMStatus = async (_simId: string, _newStatus: SIMCard['status']) => false;
  const assignSIMToDevice = async (_simId: string, _deviceId: string) => false;
  const unassignSIM = async (_simId: string) => false;
  const deleteSIM = async (_simId: string) => false;

  return {
    sims,
    loading,
    error,
    refetch: () => {},
    updateSIMStatus,
    assignSIMToDevice,
    unassignSIM,
    deleteSIM,
  };
}
