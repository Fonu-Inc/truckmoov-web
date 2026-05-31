import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useFuelTransactions } from './useFuelTransactions';
import { isFreshActivation } from "@/lib/freshActivation";

const DEMO_TENANT_ID = "f7f5af88-fd76-4439-aae3-0461be52f63f";
const DEMO_USER_IDS = ["pa1", "ta1", "om1", "s1", "dp1", "vf1", "d1"];

export interface VehicleFuelEfficiency {
  vehicle_id: string;
  vehicle_name: string;
  vehicle_registration: string;
  total_distance_km: number;
  total_fuel_liters: number;
  total_cost_ngn: number;
  efficiency_km_per_liter: number | null;
  cost_per_km_ngn: number | null;
  transaction_count: number;
  has_sufficient_data: boolean;
  is_below_threshold: boolean;
}

export interface FuelAnalytics {
  weeklyConsumption: Array<{
    date: string;
    diesel: number;
    petrol: number;
  }>;
  vehicleEfficiency: VehicleFuelEfficiency[];
  fleetSummary: {
    totalLiters: number;
    totalCost: number;
    avgPricePerLiter: number;
    avgEfficiency: number | null;
    vehiclesWithData: number;
    lowEfficiencyVehicles: number;
    transactionCount: number;
  };
}

export function useFuelEfficiency(startDate?: Date, endDate?: Date) {
  const { transactions, isLoading: transactionsLoading, getStats } = useFuelTransactions();
  const [vehicleEfficiency, setVehicleEfficiency] = useState<VehicleFuelEfficiency[]>([]);
  const [efficiencyThreshold, setEfficiencyThreshold] = useState<number>(7.0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  const isDemoUser = user?.id ? DEMO_USER_IDS.includes(user.id) && !isFreshActivation() : false;
  const tenantId = isDemoUser ? DEMO_TENANT_ID : user?.tenantId;

  // Fetch efficiency threshold from tenant settings
  useEffect(() => {
    const fetchThreshold = async () => {
      if (!tenantId) return;
      
      try {
        const { data } = await supabase
          .from('tenants')
          .select('fuel_efficiency_threshold_km_l')
          .eq('id', tenantId)
          .single();
        
        if (data?.fuel_efficiency_threshold_km_l) {
          setEfficiencyThreshold(Number(data.fuel_efficiency_threshold_km_l));
        }
      } catch (err) {
        console.error('Error fetching efficiency threshold:', err);
      }
    };
    
    fetchThreshold();
  }, [tenantId]);

  // Calculate vehicle-level efficiency from transactions
  const calculateVehicleEfficiency = useCallback(() => {
    if (transactionsLoading) return;

    // Group transactions by vehicle
    const vehicleMap = new Map<string, {
      name: string;
      transactions: typeof transactions;
    }>();

    transactions.forEach(t => {
      const existing = vehicleMap.get(t.vehicle_id) || { name: t.vehicle_name, transactions: [] };
      existing.transactions.push(t);
      vehicleMap.set(t.vehicle_id, existing);
    });

    const results: VehicleFuelEfficiency[] = [];

    vehicleMap.forEach((data, vehicleId) => {
      const sorted = [...data.transactions].sort((a, b) => 
        new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
      );

      // Get odometer readings
      const readings = sorted
        .filter(t => t.odometer_reading !== null && t.odometer_reading !== undefined)
        .map(t => Number(t.odometer_reading));

      const totalLiters = sorted.reduce((sum, t) => sum + Number(t.quantity_liters), 0);
      const totalCost = sorted.reduce((sum, t) => sum + Number(t.cost_ngn), 0);
      
      let distanceKm = 0;
      let efficiencyKmL: number | null = null;
      let costPerKm: number | null = null;
      let hasSufficientData = false;

      if (readings.length >= 2) {
        distanceKm = Math.max(...readings) - Math.min(...readings);
        hasSufficientData = distanceKm > 0 && totalLiters > 0;

        if (hasSufficientData) {
          efficiencyKmL = Math.round((distanceKm / totalLiters) * 100) / 100;
          costPerKm = Math.round((totalCost / distanceKm) * 100) / 100;
        }
      }

      results.push({
        vehicle_id: vehicleId,
        vehicle_name: data.name,
        vehicle_registration: data.name, // Using name as registration for now
        total_distance_km: distanceKm,
        total_fuel_liters: totalLiters,
        total_cost_ngn: totalCost,
        efficiency_km_per_liter: efficiencyKmL,
        cost_per_km_ngn: costPerKm,
        transaction_count: sorted.length,
        has_sufficient_data: hasSufficientData,
        is_below_threshold: efficiencyKmL !== null && efficiencyKmL < efficiencyThreshold,
      });
    });

    // Sort by efficiency (lowest first for attention)
    results.sort((a, b) => {
      if (a.efficiency_km_per_liter === null) return 1;
      if (b.efficiency_km_per_liter === null) return -1;
      return a.efficiency_km_per_liter - b.efficiency_km_per_liter;
    });

    setVehicleEfficiency(results);
    setIsLoading(false);
  }, [transactions, transactionsLoading, efficiencyThreshold]);

  useEffect(() => {
    calculateVehicleEfficiency();
  }, [calculateVehicleEfficiency]);

  // Calculate weekly consumption from transactions
  const weeklyConsumption = useMemo(() => {
    const last7Days: Array<{ date: string; diesel: number; petrol: number }> = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateKey = date.toISOString().split('T')[0];
      
      const dayTransactions = transactions.filter(t => 
        t.transaction_date.split('T')[0] === dateKey
      );
      
      last7Days.push({
        date: dateStr,
        diesel: dayTransactions
          .filter(t => t.fuel_type === 'diesel')
          .reduce((sum, t) => sum + Number(t.quantity_liters), 0),
        petrol: dayTransactions
          .filter(t => t.fuel_type === 'petrol')
          .reduce((sum, t) => sum + Number(t.quantity_liters), 0),
      });
    }
    
    return last7Days;
  }, [transactions]);

  // Fleet-wide summary
  const fleetSummary = useMemo(() => {
    const stats = getStats();
    const vehiclesWithData = vehicleEfficiency.filter(v => v.has_sufficient_data).length;
    const lowEfficiencyVehicles = vehicleEfficiency.filter(v => v.is_below_threshold).length;
    
    const validEfficiencies = vehicleEfficiency
      .filter(v => v.efficiency_km_per_liter !== null)
      .map(v => v.efficiency_km_per_liter as number);
    
    const avgEfficiency = validEfficiencies.length > 0
      ? Math.round((validEfficiencies.reduce((a, b) => a + b, 0) / validEfficiencies.length) * 100) / 100
      : null;

    return {
      totalLiters: stats.totalLitres,
      totalCost: stats.totalCost,
      avgPricePerLiter: stats.avgPricePerLitre,
      avgEfficiency,
      vehiclesWithData,
      lowEfficiencyVehicles,
      transactionCount: stats.transactionCount,
    };
  }, [getStats, vehicleEfficiency]);

  // Update efficiency threshold
  const updateEfficiencyThreshold = async (newThreshold: number) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .update({ fuel_efficiency_threshold_km_l: newThreshold })
        .eq('id', tenantId);

      if (error) throw error;

      setEfficiencyThreshold(newThreshold);
      toast.success('Efficiency threshold updated');
    } catch (err) {
      toast.error('Failed to update threshold');
      throw err;
    }
  };

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = [
      'Vehicle',
      'Transactions',
      'Total Liters',
      'Total Cost (₦)',
      'Distance (km)',
      'Efficiency (km/L)',
      'Cost/km (₦)',
    ];

    const rows = vehicleEfficiency.map(v => [
      v.vehicle_name,
      v.transaction_count,
      v.total_fuel_liters.toFixed(1),
      v.total_cost_ngn.toFixed(0),
      v.total_distance_km.toFixed(0),
      v.efficiency_km_per_liter?.toFixed(2) || 'N/A',
      v.cost_per_km_ngn?.toFixed(2) || 'N/A',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fuel-efficiency-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Report exported');
  }, [vehicleEfficiency]);

  return {
    vehicleEfficiency,
    weeklyConsumption,
    fleetSummary,
    efficiencyThreshold,
    isLoading: isLoading || transactionsLoading,
    updateEfficiencyThreshold,
    exportToCSV,
    refetch: calculateVehicleEfficiency,
  };
}



