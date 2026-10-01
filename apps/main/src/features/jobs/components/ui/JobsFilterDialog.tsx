import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  useEffect, useState,
} from "react";

import { Button } from "@/components/shadcn/button";
import { Calendar } from "@/components/shadcn/calendar";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { buildDefaultFilterValue } from "@/features/jobs/utils/jobsFilter";
import { cn } from "@/lib/utils";

export type JobsFilterValue = {
  weightEnabled: boolean;
  weightRange: [number, number];
  amountEnabled: boolean;
  amountRange: [number, number];
  deadlineEnabled: boolean;
  deadlineFrom?: Date;
  deadlineTo?: Date;
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

type RangeKey = "weightRange" | "amountRange";

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

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const handleShowAll = () => {
    setDraft(buildDefaultFilterValue(bounds));
    onReset();
    onOpenChange(false);
  };

  const updateRange = (key: RangeKey, index: 0 | 1, raw: string) => {
    const num = raw === "" ? 0 : Number(raw);
    if (Number.isNaN(num))
      return;
    setDraft((d) => {
      const next: [number, number] = [...d[key]];
      next[index] = num;
      return {
        ...d, [key]: next,
      };
    });
  };

  const rangeSection = (
    label: string,
    enabledKey: "weightEnabled" | "amountEnabled",
    rangeKey: RangeKey,
  ) => (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <Checkbox
          checked={draft[enabledKey]}
          onCheckedChange={c => setDraft(d => ({
            ...d, [enabledKey]: !!c,
          }))}
          className="h-3.5 w-3.5"
        />
        <span
          className={cn(
            "text-xs font-medium",
            !draft[enabledKey] && "text-muted-foreground",
          )}
        >
          {label}
        </span>
      </label>
      <div className="grid grid-cols-2 gap-1.5">
        {([
          0,
          1,
        ] as const).map(i => (
          <Input
            key={i}
            type="number"
            inputMode="numeric"
            placeholder={i === 0 ? "From" : "To"}
            disabled={!draft[enabledKey]}
            value={draft[enabledKey] ? draft[rangeKey][i] : ""}
            onChange={e => updateRange(
              rangeKey,
              i,
              e.target.value,
            )}
            className="h-8 text-xs"
          />
        ))}
      </div>
    </div>
  );

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

          {rangeSection(
            "Weight (tons)",
            "weightEnabled",
            "weightRange",
          )}
          {rangeSection(
            "Amount",
            "amountEnabled",
            "amountRange",
          )}

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={draft.deadlineEnabled}
                onCheckedChange={c => setDraft(d => ({
                  ...d, deadlineEnabled: !!c,
                }))}
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
                      ? format(
                          draft.deadlineFrom,
                          "dd/MM/yyyy",
                        )
                      : "DD/MM/YYYY"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={draft.deadlineFrom}
                  onSelect={date => setDraft(d => ({
                    ...d,
                    deadlineFrom: date ?? undefined,
                    deadlineTo: date ?? undefined,
                  }))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
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
