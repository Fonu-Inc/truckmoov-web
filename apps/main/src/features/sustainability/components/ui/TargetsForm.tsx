import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";

export function TargetsForm({
  existing,
  tenantId,
  onSave,
  isSaving,
}: {
  existing: any;
  tenantId: string;
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const [
    baseline,
    setBaseline,
  ] = useState(existing?.baseline_co2_kg_per_month?.toString() || "");
  const [
    target,
    setTarget,
  ] = useState(existing?.target_co2_kg_per_month?.toString() || "");
  const [
    reduction,
    setReduction,
  ] = useState(existing?.target_co2_reduction_percent?.toString() || "20");
  const [
    targetYear,
    setTargetYear,
  ] = useState(existing?.target_year?.toString() || "2030");
  const [
    evTarget,
    setEvTarget,
  ] = useState(existing?.ev_adoption_target_percent?.toString() || "30");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Baseline CO₂ (kg/month)</Label>
        <Input
          type="number"
          value={baseline}
          onChange={e => setBaseline(e.target.value)}
          placeholder="e.g. 5000"
        />
      </div>
      <div className="space-y-2">
        <Label>Target CO₂ (kg/month)</Label>
        <Input
          type="number"
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="e.g. 3500"
        />
      </div>
      <div className="space-y-2">
        <Label>Reduction Target (%)</Label>
        <Input
          type="number"
          value={reduction}
          onChange={e => setReduction(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Target Year</Label>
        <Input
          type="number"
          value={targetYear}
          onChange={e => setTargetYear(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>EV Adoption Target (%)</Label>
        <Input
          type="number"
          value={evTarget}
          onChange={e => setEvTarget(e.target.value)}
        />
      </div>
      <div className="flex items-end">
        <Button
          onClick={() => onSave({
            tenant_id: tenantId,
            baseline_co2_kg_per_month: baseline ? Number(baseline) : null,
            target_co2_kg_per_month: target ? Number(target) : null,
            target_co2_reduction_percent: Number(reduction),
            target_year: Number(targetYear),
            ev_adoption_target_percent: Number(evTarget),
          })}
          disabled={isSaving}
          className="bg-success hover:bg-success/90"
        >
          {isSaving ? "Saving..." : "Save Targets"}
        </Button>
      </div>
    </div>
  );
}
