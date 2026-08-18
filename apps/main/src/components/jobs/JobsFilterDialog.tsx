import {
  useEffect, useState,
} from "react";

import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";

export type JobsFilterValue = {
  driverId: string;
  vehicleId: string;
};

export type JobsFilterBounds = {
  weightMin: number;
  weightMax: number;
  amountMin: number;
  amountMax: number;
};

type JobsFilterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bounds: JobsFilterBounds;
  value: JobsFilterValue;
  onApply: (value: JobsFilterValue) => void;
  onReset: () => void;
  trigger: React.ReactNode;
};

export function buildDefaultFilterValue(_bounds: JobsFilterBounds): JobsFilterValue {
  return {
    driverId: "",
    vehicleId: "",
  };
}

export function countActiveFilters(value: JobsFilterValue): number {
  let n = 0;
  if (value.driverId.trim())
    n++;
  if (value.vehicleId.trim())
    n++;
  return n;
}

export function JobsFilterDialog({
  open,
  onOpenChange,
  bounds,
  value,
  onApply,
  onReset,
  trigger,
}: JobsFilterDialogProps) {
  const [
    draft,
    setDraft,
  ] = useState<JobsFilterValue>(value);

  useEffect(
    () => {
      if (open)
        setDraft(value);
    },
    [
      open,
      value,
    ],
  );

  void bounds;

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const handleShowAll = () => {
    const reset = buildDefaultFilterValue(bounds);
    setDraft(reset);
    onReset();
    onOpenChange(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
    >
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[280px] p-3 rounded-xl"
      >
        <div className="space-y-2.5">
          <h4 className="text-xs font-medium text-foreground px-0.5">
            Only show shipments by...
          </h4>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Driver ID
            </label>
            <Input
              placeholder="driver_id"
              value={draft.driverId}
              onChange={e =>
                setDraft(d => ({
                  ...d, driverId: e.target.value,
                }))}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Vehicle ID
            </label>
            <Input
              placeholder="vehicle_id"
              value={draft.vehicleId}
              onChange={e =>
                setDraft(d => ({
                  ...d, vehicleId: e.target.value,
                }))}
              className="h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <Button
              onClick={handleApply}
              size="sm"
              className="flex-1 h-8 text-xs"
            >
              Apply
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowAll}
              className="flex-1 h-8 text-xs"
            >
              Show All
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
