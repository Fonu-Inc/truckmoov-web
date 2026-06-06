export interface MaintenanceRecord {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  vehicle_name: string;
  maintenance_type: string;
  status: string;
  scheduled_date: string;
  completed_date?: string | null;
  cost_ngn?: number | null;
  technician?: string | null;
  notes?: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecordInput {
  vehicle_id: string;
  vehicle_name: string;
  maintenance_type: string;
  status?: string;
  scheduled_date: string;
  completed_date?: string | null;
  cost_ngn?: number | null;
  technician?: string | null;
  notes?: string | null;
  priority?: string;
}

export function useMaintenanceRecords(_tenantId: string = 'default') {
  const records: MaintenanceRecord[] = [];
  const isLoading = false;
  const error: string | null = null;

  const addRecord = async (_record: MaintenanceRecordInput) => null;
  const updateRecord = async (_id: string, _updates: Partial<MaintenanceRecordInput>) => null;
  const deleteRecord = async (_id: string) => {};
  const markComplete = async (_id: string, _cost?: number) => null;
  const startMaintenance = async (_id: string) => null;

  return {
    records,
    isLoading,
    error,
    fetchRecords: () => {},
    addRecord,
    updateRecord,
    deleteRecord,
    markComplete,
    startMaintenance,
  };
}
