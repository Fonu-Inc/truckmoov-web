import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/shadcn/button";
import { Calendar } from "@/components/shadcn/calendar";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { cn } from "@/lib/utils";

export interface JobsFilterValue {
  weightEnabled: boolean;
  weightRange: [number, number];
  amountEnabled: boolean;
  amountRange: [number, number];
  deadlineEnabled: boolean;
  deadlineFrom?: Date;
  deadlineTo?: Date;
}

export interface JobsFilterBounds {
  weightMin: number;
  weightMax: number;
  amountMin: number;
  amountMax: number;
}

interface JobsFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bounds: JobsFilterBounds;
  value: JobsFilterValue;
  onApply: (value: JobsFilterValue) => void;
  onReset: () => void;
  trigger: React.ReactNode;
}

export function buildDefaultFilterValue(_bounds: JobsFilterBounds): JobsFilterValue {
  return {
    weightEnabled: false,
    weightRange: [0, 0],
    amountEnabled: false,
    amountRange: [0, 0],
    deadlineEnabled: false,
    deadlineFrom: undefined,
    deadlineTo: undefined,
  };
}

export function countActiveFilters(value: JobsFilterValue): number {
  let n = 0;
  if (value.weightEnabled) n++;
  if (value.amountEnabled) n++;
  if (value.deadlineEnabled) n++;
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
  const [draft, setDraft] = useState<JobsFilterValue>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const safeBounds = useMemo(() => {
    return {
      weightMin: Math.max(0, Math.floor(bounds.weightMin)),
      weightMax: Math.max(Math.ceil(bounds.weightMax), Math.ceil(bounds.weightMin) + 1),
      amountMin: Math.max(0, Math.floor(bounds.amountMin)),
      amountMax: Math.max(Math.ceil(bounds.amountMax), Math.ceil(bounds.amountMin) + 1),
    };
  }, [bounds]);

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const handleShowAll = () => {
    const reset = buildDefaultFilterValue(safeBounds);
    setDraft(reset);
    onReset();
    onOpenChange(false);
  };

  const updateRange = (
    key: "weightRange" | "amountRange",
    index: 0 | 1,
    raw: string,
  ) => {
    const num = raw === "" ? 0 : Number(raw);
    if (Number.isNaN(num)) return;
    setDraft((d) => {
      const next: [number, number] = [...d[key]] as [number, number];
      next[index] = num;
      return { ...d, [key]: next };
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
            Only show shipments by...
          </h4>

          {/* Weight */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={draft.weightEnabled}
                onCheckedChange={(c) =>
                  setDraft((d) => ({ ...d, weightEnabled: !!c }))
                }
                className="h-3.5 w-3.5"
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  !draft.weightEnabled && "text-muted-foreground",
                )}
              >
                Weight (tons)
              </span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="From"
                disabled={!draft.weightEnabled}
                value={draft.weightEnabled ? draft.weightRange[0] : ""}
                onChange={(e) => updateRange("weightRange", 0, e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                type="number"
                inputMode="numeric"
                placeholder="To"
                disabled={!draft.weightEnabled}
                value={draft.weightEnabled ? draft.weightRange[1] : ""}
                onChange={(e) => updateRange("weightRange", 1, e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={draft.amountEnabled}
                onCheckedChange={(c) =>
                  setDraft((d) => ({ ...d, amountEnabled: !!c }))
                }
                className="h-3.5 w-3.5"
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  !draft.amountEnabled && "text-muted-foreground",
                )}
              >
                Amount
              </span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="From"
                disabled={!draft.amountEnabled}
                value={draft.amountEnabled ? draft.amountRange[0] : ""}
                onChange={(e) => updateRange("amountRange", 0, e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                type="number"
                inputMode="numeric"
                placeholder="To"
                disabled={!draft.amountEnabled}
                value={draft.amountEnabled ? draft.amountRange[1] : ""}
                onChange={(e) => updateRange("amountRange", 1, e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={draft.deadlineEnabled}
                onCheckedChange={(c) =>
                  setDraft((d) => ({ ...d, deadlineEnabled: !!c }))
                }
                className="h-3.5 w-3.5"
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  !draft.deadlineEnabled && "text-muted-foreground",
                )}
              >
                Deadline
              </span>
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!draft.deadlineEnabled}
                  className={cn(
                    "w-full justify-start text-left font-normal h-8 px-2.5 text-xs",
                    !draft.deadlineFrom && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {draft.deadlineFrom
                      ? format(draft.deadlineFrom, "dd/MM/yyyy")
                      : "DD/MM/YYYY"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={draft.deadlineFrom}
                  onSelect={(date) =>
                    setDraft((d) => ({
                      ...d,
                      deadlineFrom: date ?? undefined,
                      deadlineTo: date ?? undefined,
                    }))
                  }
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
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
