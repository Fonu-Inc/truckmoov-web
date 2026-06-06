import { useCallback } from 'react';

export interface FuelTransaction {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  vehicle_name: string;
  driver_name?: string | null;
  fuel_type: string;
  quantity_liters: number;
  cost_ngn: number;
  odometer_reading?: number | null;
  station_name?: string | null;
  location?: string | null;
  transaction_date: string;
  receipt_number?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FuelTransactionInput {
  vehicle_id: string;
  vehicle_name: string;
  driver_name?: string | null;
  fuel_type?: string;
  quantity_liters: number;
  cost_ngn: number;
  odometer_reading?: number | null;
  station_name?: string | null;
  location?: string | null;
  transaction_date?: string;
  receipt_number?: string | null;
  notes?: string | null;
}

export function useFuelTransactions(_tenantId: string = 'default') {
  const transactions: FuelTransaction[] = [];
  const isLoading = false;
  const error: string | null = null;

  const fetchTransactions = async () => {};
  const addTransaction = async (_transaction: FuelTransactionInput) => null;
  const updateTransaction = async (_id: string, _updates: Partial<FuelTransactionInput>) => null;
  const deleteTransaction = async (_id: string) => {};

  const getStats = useCallback(() => ({
    totalLitres: 0,
    totalCost: 0,
    avgPricePerLitre: 0,
    transactionCount: 0,
  }), []);

  return {
    transactions,
    isLoading,
    error,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getStats,
  };
}
