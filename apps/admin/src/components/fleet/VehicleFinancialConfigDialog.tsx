import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
// useVehicleFinancials deleted — using inline type alias
type FinancialConfigInput = any;
import { toast } from "sonner";

interface Vehicle {
  id: string;
  registration_number: string;
  make?: string;
  model?: string;
}

interface VehicleFinancialConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
}

export function VehicleFinancialConfigDialog({
  open,
  onOpenChange,
  vehicles,
}: VehicleFinancialConfigDialogProps) {
  // useVehicleFinancials deleted — inline defaults
  const configs: any[] = [];
  const upsertConfig = async (_input: FinancialConfigInput) => {};
  const getConfigForVehicle = (_vehicleId: string): any => null;
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [monthlyInsurance, setMonthlyInsurance] = useState("");
  const [monthlyWage, setMonthlyWage] = useState("");
  const [monthlyParking, setMonthlyParking] = useState("");
  const [monthlyOther, setMonthlyOther] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [usefulLife, setUsefulLife] = useState("60");
  const [salvageValue, setSalvageValue] = useState("");
  const [depreciationMethod, setDepreciationMethod] = useState<"straight_line" | "declining_balance">("straight_line");
  const [perTripWage, setPerTripWage] = useState("");
  const [perKmWage, setPerKmWage] = useState("");
  const [wageMethod, setWageMethod] = useState<"fixed" | "per_trip" | "per_km" | "hybrid">("fixed");

  const loadVehicleConfig = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const config = getConfigForVehicle(vehicleId);
    
    if (config) {
      setMonthlyInsurance(config.monthly_insurance_ngn?.toString() || "");
      setMonthlyWage(config.monthly_driver_wage_ngn?.toString() || "");
      setMonthlyParking(config.monthly_parking_ngn?.toString() || "");
      setMonthlyOther(config.monthly_other_fixed_ngn?.toString() || "");
      setPurchasePrice(config.purchase_price_ngn?.toString() || "");
      setPurchaseDate(config.purchase_date || "");
      setUsefulLife(config.useful_life_months?.toString() || "60");
      setSalvageValue(config.salvage_value_ngn?.toString() || "");
      setDepreciationMethod(config.depreciation_method || "straight_line");
      setPerTripWage(config.per_trip_wage_ngn?.toString() || "");
      setPerKmWage(config.per_km_wage_ngn?.toString() || "");
      setWageMethod(config.wage_allocation_method || "fixed");
    } else {
      // Reset to defaults
      setMonthlyInsurance("");
      setMonthlyWage("");
      setMonthlyParking("");
      setMonthlyOther("");
      setPurchasePrice("");
      setPurchaseDate("");
      setUsefulLife("60");
      setSalvageValue("");
      setDepreciationMethod("straight_line");
      setPerTripWage("");
      setPerKmWage("");
      setWageMethod("fixed");
    }
  };

  const handleSave = async () => {
    if (!selectedVehicleId) {
      toast.error("Please select a vehicle");
      return;
    }

    setIsSaving(true);
    try {
      const input: FinancialConfigInput = {
        vehicle_id: selectedVehicleId,
        monthly_insurance_ngn: parseFloat(monthlyInsurance) || 0,
        monthly_driver_wage_ngn: parseFloat(monthlyWage) || 0,
        monthly_parking_ngn: parseFloat(monthlyParking) || 0,
        monthly_other_fixed_ngn: parseFloat(monthlyOther) || 0,
        purchase_price_ngn: purchasePrice ? parseFloat(purchasePrice) : null,
        purchase_date: purchaseDate || null,
        useful_life_months: parseInt(usefulLife) || 60,
        salvage_value_ngn: parseFloat(salvageValue) || 0,
        depreciation_method: depreciationMethod,
        per_trip_wage_ngn: parseFloat(perTripWage) || 0,
        per_km_wage_ngn: parseFloat(perKmWage) || 0,
        wage_allocation_method: wageMethod,
      };

      await upsertConfig(input);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Label>Select Vehicle</Label>
            <Select value={selectedVehicleId} onValueChange={loadVehicleConfig}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.registration_number} — {vehicle.make} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedVehicleId && (
            <Tabs defaultValue="fixed" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="fixed">Fixed Costs</TabsTrigger>
                <TabsTrigger value="wages">Wage Setup</TabsTrigger>
                <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
              </TabsList>

              <TabsContent value="fixed" className="space-y-4 pt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Monthly Fixed Costs</CardTitle>
                    <CardDescription>Enter recurring monthly expenses</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="insurance">Insurance (₦/month)</Label>
                      <Input
                        id="insurance"
                        type="number"
                        placeholder="0"
                        value={monthlyInsurance}
                        onChange={(e) => setMonthlyInsurance(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parking">Parking (₦/month)</Label>
                      <Input
                        id="parking"
                        type="number"
                        placeholder="0"
                        value={monthlyParking}
                        onChange={(e) => setMonthlyParking(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="other">Other Fixed Costs (₦/month)</Label>
                      <Input
                        id="other"
                        type="number"
                        placeholder="0"
                        value={monthlyOther}
                        onChange={(e) => setMonthlyOther(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="wages" className="space-y-4 pt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Driver Wage Allocation</CardTitle>
                    <CardDescription>Choose how wages are attributed to this vehicle</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Allocation Method</Label>
                      <Select value={wageMethod} onValueChange={(v) => setWageMethod(v as typeof wageMethod)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Monthly</SelectItem>
                          <SelectItem value="per_trip">Per Trip</SelectItem>
                          <SelectItem value="per_km">Per Kilometer</SelectItem>
                          <SelectItem value="hybrid">Hybrid (Fixed + Per Trip)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(wageMethod === "fixed" || wageMethod === "hybrid") && (
                      <div className="space-y-2">
                        <Label htmlFor="monthlyWage">Monthly Driver Wage (₦)</Label>
                        <Input
                          id="monthlyWage"
                          type="number"
                          placeholder="0"
                          value={monthlyWage}
                          onChange={(e) => setMonthlyWage(e.target.value)}
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
                          onChange={(e) => setPerTripWage(e.target.value)}
                        />
                      </div>
                    )}

                    {wageMethod === "per_km" && (
                      <div className="space-y-2">
                        <Label htmlFor="perKmWage">Per Kilometer Rate (₦)</Label>
                        <Input
                          id="perKmWage"
                          type="number"
                          placeholder="0"
                          value={perKmWage}
                          onChange={(e) => setPerKmWage(e.target.value)}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="depreciation" className="space-y-4 pt-4">
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
                        onChange={(e) => setPurchasePrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchaseDate">Purchase Date</Label>
                      <Input
                        id="purchaseDate"
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usefulLife">Useful Life (months)</Label>
                      <Input
                        id="usefulLife"
                        type="number"
                        placeholder="60"
                        value={usefulLife}
                        onChange={(e) => setUsefulLife(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salvageValue">Salvage Value (₦)</Label>
                      <Input
                        id="salvageValue"
                        type="number"
                        placeholder="0"
                        value={salvageValue}
                        onChange={(e) => setSalvageValue(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Depreciation Method</Label>
                      <Select 
                        value={depreciationMethod} 
                        onValueChange={(v) => setDepreciationMethod(v as typeof depreciationMethod)}
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!selectedVehicleId || isSaving}>
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



