import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {FileText, Eye, Download} from "lucide-react";
import type { VehicleProfitability } from "@/hooks/useVehicleFinancials";
import { exportVehiclePLToPDF, exportVehiclePLToExcel, exportVehiclePLToCSV, type StatementOptions } from "@/lib/vehiclePLExport";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: VehicleProfitability[];
  vehicleNameLookup: (id: string) => string;
  defaultPeriodLabel: string;
}

export function VehiclePLStatementBuilder({ open, onOpenChange, data, vehicleNameLookup, defaultPeriodLabel }: Props) {
  const [title, setTitle] = useState("Vehicle Profit & Loss Statement");
  const [companyName, setCompanyName] = useState("");
  const [periodLabel, setPeriodLabel] = useState(defaultPeriodLabel);
  const [preparedBy, setPreparedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [includeCover, setIncludeCover] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includePerVehicle, setIncludePerVehicle] = useState(true);
  const [accent, setAccent] = useState<"blue" | "green" | "amber" | "slate">("blue");

  const buildOptions = (): StatementOptions => ({
    title,
    companyName,
    periodLabel,
    preparedBy,
    notes,
    includeCover,
    includeSummary,
    includePerVehicle,
    accent });

  const openPreview = () => {
    const payload = {
      options: buildOptions(),
      rows: data.map((d) => ({
        vehicle_id: d.vehicle_id,
        vehicle_name: vehicleNameLookup(d.vehicle_id),
        revenue: d.revenue?.total || 0,
        costs: d.costs?.total || 0,
        net_profit: d.profitability?.net_profit || 0,
        margin: d.profitability?.margin_percent || 0,
        score: d.profitability?.score || 0,
        tier: d.profitability?.tier || "marginal",
        fuel: d.costs?.fuel || 0,
        maintenance: d.costs?.maintenance || 0,
        wages: d.costs?.wages || 0,
        insurance: d.costs?.insurance || 0,
        depreciation: d.costs?.depreciation || 0,
        jobs: d.revenue?.jobs_completed || 0,
        km: d.revenue?.total_km || 0 })) };
    sessionStorage.setItem("vpl_statement_preview", JSON.stringify(payload));
    window.open("/admin/fleet/pl-statement", "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Statement Builder
          </DialogTitle>
          <DialogDescription>
            Configure the cover page, period, and branding for the Vehicle P&L statement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Statement Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" placeholder="e.g. Lagos Express Logistics" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Reporting Period</Label>
              <Input id="period" value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prepared">Prepared By</Label>
              <Input id="prepared" placeholder="Optional" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes / Disclaimer</Label>
              <Textarea id="notes" rows={3} placeholder="Optional notes printed at the end of the statement" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Accent Color</Label>
              <Select value={accent} onValueChange={(v) => setAccent(v as typeof accent)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="amber">Amber</SelectItem>
                  <SelectItem value="slate">Slate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Sections to Include</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm">Cover Page</span>
              <Switch checked={includeCover} onCheckedChange={setIncludeCover} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Fleet Summary</span>
              <Switch checked={includeSummary} onCheckedChange={setIncludeSummary} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Per-Vehicle Breakdown</span>
              <Switch checked={includePerVehicle} onCheckedChange={setIncludePerVehicle} />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={openPreview}>
            <Eye className="h-4 w-4 mr-2" /> Preview
          </Button>
          <Button variant="outline" onClick={() => exportVehiclePLToCSV(data, vehicleNameLookup, buildOptions())}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" onClick={() => exportVehiclePLToExcel(data, vehicleNameLookup, buildOptions())}>
            <Download className="h-4 w-4 mr-2" /> Excel
          </Button>
          <Button onClick={() => exportVehiclePLToPDF(data, vehicleNameLookup, buildOptions())}>
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
