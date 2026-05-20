import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { demoFuelTransactions } from '@/lib/demoFleetData';

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

export function useFuelTransactions(tenantId: string = 'default') {
  const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('fuel_transactions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('transaction_date', { ascending: false });

      if (fetchError) throw fetchError;
      const rows = data || [];
      setTransactions(rows.length > 0 ? rows : (demoFuelTransactions as unknown as FuelTransaction[]));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch fuel transactions';
      setError(message);
      console.error('Error fetching fuel transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transaction: FuelTransactionInput) => {
    try {
      const { data, error: insertError } = await supabase
        .from('fuel_transactions')
        .insert({
          ...transaction,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setTransactions(prev => [data, ...prev]);
      toast.success('Fuel transaction recorded');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add fuel transaction';
      toast.error(message);
      throw err;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<FuelTransactionInput>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('fuel_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      setTransactions(prev => prev.map(t => t.id === id ? data : t));
      toast.success('Fuel transaction updated');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update fuel transaction';
      toast.error(message);
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('fuel_transactions')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Fuel transaction deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete fuel transaction';
      toast.error(message);
      throw err;
    }
  };

  const getStats = useCallback(() => {
    const totalLitres = transactions.reduce((sum, t) => sum + Number(t.quantity_liters), 0);
    const totalCost = transactions.reduce((sum, t) => sum + Number(t.cost_ngn), 0);
    const avgPricePerLitre = totalLitres > 0 ? totalCost / totalLitres : 0;

    return {
      totalLitres,
      totalCost,
      avgPricePerLitre,
      transactionCount: transactions.length,
    };
  }, [transactions]);

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
