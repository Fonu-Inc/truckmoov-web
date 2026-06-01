import { useEffect, useState } from "react";

import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { cn } from "@/lib/utils";

export interface VehiclesFilterValue {
  typeEnabled: boolean;
  type: string;
  yearEnabled: boolean;
  yearRange: [number, number];
}

interface VehiclesFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: VehiclesFilterValue;
  onApply: (value: VehiclesFilterValue) => void;
  onReset: () => void;
  trigger: React.ReactNode;
}

export function buildDefaultVehiclesFilterValue(): VehiclesFilterValue {
  return {
    typeEnabled: false,
    type: "all",
    yearEnabled: false,
    yearRange: [0, 0],
  };
}

export function countActiveVehicleFilters(value: VehiclesFilterValue): number {
  let n = 0;
  if (value.typeEnabled && value.type !== "all") n++;
  if (value.yearEnabled) n++;
  return n;
}

export function VehiclesFilterDialog({
  open,
  onOpenChange,
  value,
  onApply,
  onReset,
  trigger,
}: VehiclesFilterDialogProps) {
  const [draft, setDraft] = useState<VehiclesFilterValue>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const handleShowAll = () => {
    setDraft(buildDefaultVehiclesFilterValue());
    onReset();
    onOpenChange(false);
  };

  const updateYear = (index: 0 | 1, raw: string) => {
    const num = raw === "" ? 0 : Number(raw);
    if (Number.isNaN(num)) return;
    setDraft((d) => {
      const next: [number, number] = [...d.yearRange] as [number, number];
      next[index] = num;
      return { ...d, yearRange: next };
    });
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[280px] p-3 rounded-xl"
      >
        <div className="space-y-2.5">
          <h4 className="text-xs font-medium text-foreground px-0.5">
            Only show vehicles by...
          </h4>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={draft.typeEnabled}
                onCheckedChange={(c) =>
                  setDraft((d) => ({ ...d, typeEnabled: !!c }))
                }
                className="h-3.5 w-3.5"
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  !draft.typeEnabled && "text-muted-foreground",
                )}
              >
                Type
              </span>
            </label>
            <Select
              value={draft.type}
              onValueChange={(v) => setDraft((d) => ({ ...d, type: v }))}
              disabled={!draft.typeEnabled}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="truck">Truck</SelectItem>
                <SelectItem value="van">Van</SelectItem>
                <SelectItem value="trailer">Trailer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={draft.yearEnabled}
                onCheckedChange={(c) =>
                  setDraft((d) => ({ ...d, yearEnabled: !!c }))
                }
                className="h-3.5 w-3.5"
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  !draft.yearEnabled && "text-muted-foreground",
                )}
              >
                Year
              </span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="From"
                disabled={!draft.yearEnabled}
                value={draft.yearEnabled ? draft.yearRange[0] || "" : ""}
                onChange={(e) => updateYear(0, e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                type="number"
                inputMode="numeric"
                placeholder="To"
                disabled={!draft.yearEnabled}
                value={draft.yearEnabled ? draft.yearRange[1] || "" : ""}
                onChange={(e) => updateYear(1, e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <Button onClick={handleApply} size="sm" className="flex-1 h-8 text-xs">
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



