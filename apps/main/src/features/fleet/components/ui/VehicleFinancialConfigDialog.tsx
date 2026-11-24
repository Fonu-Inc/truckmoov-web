import type { FleetFinancialConfig } from "@truckmoov/api/fleet";
import {

  useFleetFinancialConfig,
  useUpdateFleetFinancialConfig,
  useVehicles,
} from "@truckmoov/api/fleet";
import {
  useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { optionalNumber } from "@/features/fleet/utils/fleetFinancials";

// Blank → null (cleared); "0" stays 0. The old `parseFloat(x) || null` dropped zeros.
const toNullableNumber = (value: string) => optionalNumber(value.trim()) ?? null;
// GET returns decimals as strings ("5000.00") — show them as plain numbers.
const toInputValue = (value: number | string | null | undefined) => (value == null ? "" : String(Number(value)));

type Vehicle = {
  id: string;
  registration_number: string;
  make?: string;
  model?: string;
};

type VehicleFinancialConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
};

export function VehicleFinancialConfigDialog({
  open,
  onOpenChange,
  vehicles,
}: VehicleFinancialConfigDialogProps) {
  const vehiclesQuery = useVehicles();
  const updateConfigMutation = useUpdateFleetFinancialConfig();
  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState<string>("");
  const configQuery = useFleetFinancialConfig({ vehicleId: selectedVehicleId });
  const vehicleOptions = useMemo(
    () => {
      const apiVehicles = vehiclesQuery.data?.data?.map(vehicle => ({
        id: vehicle.id,
        registration_number: vehicle.registrationNumber || vehicle.plateNumber || vehicle.id,
        make: vehicle.make || undefined,
        model: vehicle.model || undefined,
      })) ?? [];
      return apiVehicles.length > 0 ? apiVehicles : vehicles;
    },
    [
      vehicles,
      vehiclesQuery.data?.data,
    ],
  );

  // Form state
  const [
    fuelEstimate,
    setFuelEstimate,
  ] = useState("");
  const [
    maintenanceEstimate,
    setMaintenanceEstimate,
  ] = useState("");
  const [
    monthlyInsurance,
    setMonthlyInsurance,
  ] = useState("");
  const [
    monthlyWage,
    setMonthlyWage,
  ] = useState("");
  const [
    monthlyDepreciation,
    setMonthlyDepreciation,
  ] = useState("");
  const [
    monthlyParking,
    setMonthlyParking,
  ] = useState("");
  const [
    monthlyOther,
    setMonthlyOther,
  ] = useState("");
  const [
    purchasePrice,
    setPurchasePrice,
  ] = useState("");
  const [
    purchaseDate,
    setPurchaseDate,
  ] = useState("");
  const [
    usefulLife,
    setUsefulLife,
  ] = useState("60");
  const [
    salvageValue,
    setSalvageValue,
  ] = useState("");
  const [
    depreciationMethod,
    setDepreciationMethod,
  ] = useState<"straight_line" | "declining_balance">("straight_line");
  const [
    perTripWage,
    setPerTripWage,
  ] = useState("");
  const [
    perKmWage,
    setPerKmWage,
  ] = useState("");
  const [
    wageMethod,
    setWageMethod,
  ] = useState<"fixed_monthly" | "per_trip" | "per_kilometer" | "hybrid">("fixed_monthly");

  const resetForm = () => {
    setFuelEstimate("");
    setMaintenanceEstimate("");
    setMonthlyInsurance("");
    setMonthlyWage("");
    setMonthlyDepreciation("");
    setMonthlyParking("");
    setMonthlyOther("");
    setPurchasePrice("");
    setPurchaseDate("");
    setUsefulLife("60");
    setSalvageValue("");
    setDepreciationMethod("straight_line");
    setPerTripWage("");
    setPerKmWage("");
    setWageMethod("fixed_monthly");
  };

  const populateForm = (config: FleetFinancialConfig) => {
    setFuelEstimate(toInputValue(config.fuelEstimateNgnPerMonth));
    setMaintenanceEstimate(toInputValue(config.maintenanceEstimateNgnPerMonth));
    setMonthlyInsurance(toInputValue(config.monthlyInsuranceNgn));
    setMonthlyWage(toInputValue(config.monthlyDriverWageNgn ?? config.monthlyWagesNgn));
    setMonthlyDepreciation(toInputValue(config.monthlyDepreciationNgn));
    setMonthlyParking(toInputValue(config.monthlyParkingNgn));
    setMonthlyOther(toInputValue(config.monthlyOtherNgn));
    setPurchasePrice(toInputValue(config.assetPurchasePriceNgn));
    setPurchaseDate(config.assetPurchaseDate || "");
    setUsefulLife(toInputValue(config.assetUsefulLifeMonths) || "60");
    setSalvageValue(toInputValue(config.assetSalvageValueNgn));
    setDepreciationMethod(config.depreciationMethod || "straight_line");
    setPerTripWage("");
    setPerKmWage("");
    setWageMethod((config.driverWageAllocationMethod as typeof wageMethod) || "fixed_monthly");
  };

  useEffect(
    () => {
      const config = configQuery.data?.data;
      if (config)
        populateForm(config);
    },
    [configQuery.data?.data],
  );

  const loadVehicleConfig = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    resetForm();
  };

  const handleSave = async () => {
    if (!selectedVehicleId) {
      toast.error("Please select a vehicle");
      return;
    }

    try {
      await updateConfigMutation.mutateAsync({
        vehicleId: selectedVehicleId,
        data: {
          fuelEstimateNgnPerMonth: toNullableNumber(fuelEstimate),
          maintenanceEstimateNgnPerMonth: toNullableNumber(maintenanceEstimate),
          monthlyDriverWageNgn: toNullableNumber(monthlyWage),
          monthlyInsuranceNgn: toNullableNumber(monthlyInsurance),
          monthlyDepreciationNgn: toNullableNumber(monthlyDepreciation),
          monthlyParkingNgn: toNullableNumber(monthlyParking),
          monthlyOtherNgn: toNullableNumber(monthlyOther),
          driverWageAllocationMethod: wageMethod,
          assetPurchasePriceNgn: toNullableNumber(purchasePrice),
          assetPurchaseDate: purchaseDate || null,
          assetUsefulLifeMonths: toNullableNumber(usefulLife),
          assetSalvageValueNgn: toNullableNumber(salvageValue),
          depreciationMethod,
        },
      });
      toast.success("Vehicle financial configuration saved");
      onOpenChange(false);
    }
    catch (error) {
      const err = error as { message?: string };
      toast.error(err?.message ?? "Failed to save vehicle financial configuration");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Vehicle Financials</DialogTitle>
          <DialogDescription>
            Set up cost parameters for profitability analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vehicle Selector */}
          <div className="space-y-2">
            <Label required>Select Vehicle</Label>
            <Select
              value={selectedVehicleId}
              onValueChange={loadVehicleConfig}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicleOptions.map(vehicle => (
                  <SelectItem
                    key={vehicle.id}
                    value={vehicle.id}
                  >
                    {vehicle.registration_number}
                    {" "}
                    -
                    {vehicle.make}
                    {" "}
                    {vehicle.model}
                  </SelectItem>
                ))}
                {vehiclesQuery.isLoading && (
                  <SelectItem
                    value="loading"
                    disabled
                  >
                    Loading vehicles...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedVehicleId && (
            <Tabs
              defaultValue="fixed"
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="fixed">Fixed Costs</TabsTrigger>
                <TabsTrigger value="wages">Wage Setup</TabsTrigger>
                <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
              </TabsList>

              <TabsContent
                value="fixed"
                className="space-y-4 pt-4"
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Monthly Fixed Costs</CardTitle>
                    <CardDescription>Enter recurring monthly expenses</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fuelEstimate">Fuel Estimate (N/month)</Label>
                      <Input
                        id="fuelEstimate"
                        type="number"
                        placeholder="0"
                        value={fuelEstimate}
                        onChange={e => setFuelEstimate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceEstimate">Maintenance Estimate (N/month)</Label>
                      <Input
                        id="maintenanceEstimate"
                        type="number"
                        placeholder="0"
                        value={maintenanceEstimate}
                        onChange={e => setMaintenanceEstimate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insurance">Insurance (₦/month)</Label>
                      <Input
                        id="insurance"
                        type="number"
                        placeholder="0"
                        value={monthlyInsurance}
                        onChange={e => setMonthlyInsurance(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parking">Parking (₦/month)</Label>
                      <Input
                        id="parking"
                        type="number"
                        placeholder="0"
                        value={monthlyParking}
                        onChange={e => setMonthlyParking(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyDepreciation">Depreciation (N/month)</Label>
                      <Input
                        id="monthlyDepreciation"
                        type="number"
                        placeholder="0"
                        value={monthlyDepreciation}
                        onChange={e => setMonthlyDepreciation(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="other">Other Fixed Costs (₦/month)</Label>
                      <Input
                        id="other"
                        type="number"
                        placeholder="0"
                        value={monthlyOther}
                        onChange={e => setMonthlyOther(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="wages"
                className="space-y-4 pt-4"
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Driver Wage Allocation</CardTitle>
                    <CardDescription>Choose how wages are attributed to this vehicle</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Allocation Method</Label>
                      <Select
                        value={wageMethod}
                        onValueChange={v => setWageMethod(v as typeof wageMethod)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed_monthly">Fixed Monthly</SelectItem>
                          <SelectItem value="per_trip">Per Trip</SelectItem>
                          <SelectItem value="per_kilometer">Per Kilometer</SelectItem>
                          <SelectItem value="hybrid">Hybrid (Fixed + Per Trip)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(wageMethod === "fixed_monthly" || wageMethod === "hybrid") && (
                      <div className="space-y-2">
                        <Label htmlFor="monthlyWage">Monthly Driver Wage (₦)</Label>
                        <Input
                          id="monthlyWage"
                          type="number"
                          placeholder="0"
                          value={monthlyWage}
                          onChange={e => setMonthlyWage(e.target.value)}
                        />
                      </div>
                    )}

                    {(wageMethod === "per_trip" || wageMethod === "hybrid") && (
                      <div className="space-y-2">
                        <Label htmlFor="perTripWage">Per Trip Rate (₦)</Label>
                        <Input
                          id="perTripWage"
                          type="number"
                          placeholder="0"
                          value={perTripWage}
                          onChange={e => setPerTripWage(e.target.value)}
                        />
                      </div>
                    )}

                    {wageMethod === "per_kilometer" && (
                      <div className="space-y-2">
                        <Label htmlFor="perKmWage">Per Kilometer Rate (₦)</Label>
                        <Input
                          id="perKmWage"
                          type="number"
                          placeholder="0"
                          value={perKmWage}
                          onChange={e => setPerKmWage(e.target.value)}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="depreciation"
                className="space-y-4 pt-4"
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Asset Depreciation</CardTitle>
                    <CardDescription>Configure depreciation for accurate P&L</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice">Purchase Price (₦)</Label>
                      <Input
                        id="purchasePrice"
                        type="number"
                        placeholder="0"
                        value={purchasePrice}
                        onChange={e => setPurchasePrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchaseDate">Purchase Date</Label>
                      <Input
                        id="purchaseDate"
                        type="date"
                        value={purchaseDate}
                        onChange={e => setPurchaseDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usefulLife">Useful Life (months)</Label>
                      <Input
                        id="usefulLife"
                        type="number"
                        placeholder="60"
                        value={usefulLife}
                        onChange={e => setUsefulLife(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salvageValue">Salvage Value (₦)</Label>
                      <Input
                        id="salvageValue"
                        type="number"
                        placeholder="0"
                        value={salvageValue}
                        onChange={e => setSalvageValue(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Depreciation Method</Label>
                      <Select
                        value={depreciationMethod}
                        onValueChange={v => setDepreciationMethod(v as typeof depreciationMethod)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="straight_line">Straight Line</SelectItem>
                          <SelectItem value="declining_balance">Declining Balance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedVehicleId || updateConfigMutation.isPending}
            >
              {updateConfigMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
