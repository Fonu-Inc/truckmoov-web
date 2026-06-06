import { useAuthStore } from '@/stores/authStore';

export type MaintenanceIntervalType = 'date' | 'mileage' | 'both';
export type MaintenanceLifecycleStatus = 'upcoming' | 'due' | 'overdue' | 'completed';

export interface MaintenanceProfile {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  service_type: string;
  service_label?: string | null;
  interval_type: MaintenanceIntervalType;
  interval_days?: number | null;
  interval_months?: number | null;
  interval_km?: number | null;
  interval_engine_hours?: number | null;
  last_service_date?: string | null;
  last_service_mileage?: number | null;
  last_service_engine_hours?: number | null;
  next_due_date?: string | null;
  next_due_mileage?: number | null;
  next_due_engine_hours?: number | null;
  due_soon_days: number;
  due_soon_km: number;
  lifecycle_status: MaintenanceLifecycleStatus;
  is_archived: boolean;
  due_alert_sent: boolean;
  overdue_alert_sent: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  vehicle_registration?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  current_mileage?: number | null;
  current_engine_hours?: number | null;
  mileage_source?: string | null;
  engine_hours_source?: string | null;
}

export interface MaintenanceProfileInput {
  vehicle_id: string;
  service_type: string;
  service_label?: string | null;
  interval_type: MaintenanceIntervalType;
  interval_days?: number | null;
  interval_months?: number | null;
  interval_km?: number | null;
  interval_engine_hours?: number | null;
  last_service_date?: string | null;
  last_service_mileage?: number | null;
  last_service_engine_hours?: number | null;
  next_due_date?: string | null;
  next_due_mileage?: number | null;
  next_due_engine_hours?: number | null;
  due_soon_days?: number;
  due_soon_km?: number;
}

export const SERVICE_TYPES = [
  { value: 'oil_change', label: 'Oil Change' },
  { value: 'brake_service', label: 'Brake Service' },
  { value: 'tire_rotation', label: 'Tire Rotation' },
  { value: 'inspection', label: 'General Inspection' },
  { value: 'transmission', label: 'Transmission Service' },
  { value: 'coolant', label: 'Coolant Flush' },
  { value: 'air_filter', label: 'Air Filter' },
  { value: 'battery', label: 'Battery Service' },
  { value: 'custom', label: 'Custom' },
];

export function useMaintenanceProfiles() {
  const profiles: MaintenanceProfile[] = [];
  const isLoading = false;
  const error: string | null = null;

  const addProfile = async (_input: MaintenanceProfileInput) => null;
  const updateProfile = async (_id: string, _updates: Partial<MaintenanceProfileInput>) => null;
  const archiveProfile = async (_id: string) => {};
  const completeService = async (_id: string, _completionMileage?: number, _cost?: number, _notes?: string) => null;

  const stats = {
    upcoming: 0,
    due: 0,
    overdue: 0,
    total: 0,
  };

  const groupedProfiles = {
    overdue: [] as MaintenanceProfile[],
    due: [] as MaintenanceProfile[],
    upcoming: [] as MaintenanceProfile[],
  };

  return {
    profiles,
    groupedProfiles,
    stats,
    isLoading,
    error,
    fetchProfiles: () => {},
    addProfile,
    updateProfile,
    archiveProfile,
    completeService,
  };
}
