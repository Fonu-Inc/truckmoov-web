import { useCallback } from 'react';

export type CatalogStatus = 'supported' | 'deprecated' | 'blocked';
export type ProtocolType = 'tcp' | 'http' | 'mqtt' | 'udp';

export interface DeviceCatalogEntry {
  id: string;
  manufacturer: string;
  model: string;
  protocol_type: ProtocolType;
  default_port: number | null;
  payload_schema_reference: string | null;
  supports_obd: boolean;
  supports_fuel: boolean;
  supports_sos: boolean;
  supports_mileage: boolean;
  supports_engine_hours: boolean;
  supports_fuel_level: boolean;
  config_instructions: string | null;
  status: CatalogStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateCatalogEntry {
  manufacturer: string;
  model: string;
  protocol_type: ProtocolType;
  default_port?: number;
  payload_schema_reference?: string;
  supports_obd?: boolean;
  supports_fuel?: boolean;
  supports_sos?: boolean;
  supports_mileage?: boolean;
  supports_engine_hours?: boolean;
  supports_fuel_level?: boolean;
  config_instructions?: string;
  status?: CatalogStatus;
}

export function useDeviceCatalog() {
  const getSupportedModels = useCallback(() => [] as DeviceCatalogEntry[], []);
  const getManufacturers = useCallback(() => [] as string[], []);
  const getModelsForManufacturer = useCallback((_manufacturer: string) => [] as DeviceCatalogEntry[], []);

  return {
    catalog: [] as DeviceCatalogEntry[],
    loading: false,
    error: null as string | null,
    refetch: () => {},
    createEntry: async (_entry: CreateCatalogEntry) => null,
    updateEntry: async (_id: string, _updates: Partial<CreateCatalogEntry>) => {},
    deleteEntry: async (_id: string) => {},
    getSupportedModels,
    getManufacturers,
    getModelsForManufacturer,
  };
}
