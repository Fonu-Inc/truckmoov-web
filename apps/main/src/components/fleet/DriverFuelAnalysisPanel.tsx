import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDriverFuelEfficiency } from '@/hooks/useDriverFuelEfficiency';
import { useDrivers } from '@/hooks/useDrivers';
import { useCurrency } from '@/contexts/CurrencyContext';
import {Fuel, TrendingUp, TrendingDown, Minus, User, Download} from 'lucide-react';

export function DriverFuelAnalysisPanel() {
  const { efficiencyData, isLoading, getEfficiencyIndicator, getTotalPotentialSavings, getFleetAverageEfficiency } = useDriverFuelEfficiency();
  const { drivers } = useDrivers();
  const { format: formatCurrency } = useCurrency();

  const getDriverName = (driverId: string) => {
    const driver = drivers?.find(d => d.id === driverId);
    return driver?.name || 'Unknown Driver';
  };

  const getTrendIcon = (vsFleet: number) => {
    if (vsFleet > 5) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (vsFleet < -5) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const handleExport = () => {
    if (!efficiencyData) return;
    
    const csvContent = [
      ['Driver', 'Distance (km)', 'Fuel (L)', 'Efficiency (km/L)', 'vs Fleet (%)', 'Potential Savings'].join(','),
      ...efficiencyData.map(d => [
        getDriverName(d.driver_id),
        d.total_distance_km.toFixed(1),
        d.total_fuel_consumed_liters.toFixed(1),
        d.avg_fuel_efficiency_km_per_liter.toFixed(2),
        d.efficiency_vs_fleet_percent.toFixed(1),
        d.potential_savings_ngn.toFixed(0)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `driver-fuel-efficiency-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Driver Fuel Efficiency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Driver Fuel Behavior Analysis
          </CardTitle>
          <CardDescription>
            Aggregated efficiency metrics by driver (not for individual shaming)
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground">Fleet Average</div>
            <div className="text-xl font-bold">
              {getFleetAverageEfficiency().toFixed(2)} km/L
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground">Total Potential Savings</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(getTotalPotentialSavings())}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground">Drivers Analyzed</div>
            <div className="text-xl font-bold">
              {efficiencyData?.length || 0}
            </div>
          </div>
        </div>

        {/* Efficiency Table */}
        {efficiencyData && efficiencyData.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Efficiency</TableHead>
                  <TableHead className="text-right">vs Fleet</TableHead>
                  <TableHead className="text-right">Trips</TableHead>
                  <TableHead className="text-right">Potential Savings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {efficiencyData.map((efficiency) => {
                  const indicator = getEfficiencyIndicator(efficiency);
                  return (
                    <TableRow key={efficiency.id}>
                      <TableCell>
                        <Badge variant="outline">#{efficiency.efficiency_rank}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {getDriverName(efficiency.driver_id)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {efficiency.avg_fuel_efficiency_km_per_liter.toFixed(2)} km/L
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {getTrendIcon(efficiency.efficiency_vs_fleet_percent)}
                          <span className={indicator.color}>
                            {efficiency.efficiency_vs_fleet_percent > 0 ? '+' : ''}
                            {efficiency.efficiency_vs_fleet_percent.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {efficiency.trips_analyzed}
                      </TableCell>
                      <TableCell className="text-right">
                        {efficiency.potential_savings_ngn > 0 ? (
                          <span className="text-green-600">
                            {formatCurrency(efficiency.potential_savings_ngn)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Fuel className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No fuel efficiency data available</p>
            <p className="text-xs mt-1">Data will appear once drivers complete trips with fuel tracking</p>
          </div>
        )}

        {/* Privacy Note */}
        <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded">
          This data is aggregated for operational insights only. 
          Individual performance should be discussed privately.
        </div>
      </CardContent>
    </Card>
  );
}
