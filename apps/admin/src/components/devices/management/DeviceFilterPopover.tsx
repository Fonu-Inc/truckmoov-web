import type {
  DeviceFilterDraft,
  DeviceFilterKey,
} from "./deviceStatus";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
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
import { emptyFilters } from "./deviceStatus";

type FieldOption = {
  value: string;
  label: string;
};

type DeviceFilterPopoverProps = {
  value: DeviceFilterDraft;
  tenants: string[];
  manufacturers: string[];
  onApply: (filters: DeviceFilterDraft) => void;
};

const lastSeenOptions: FieldOption[] = [
  {
    value: "7d",
    label: "Last 7 days",
  },
  {
    value: "30d",
    label: "Last 30 days",
  },
  {
    value: "90d",
    label: "Last 90 days",
  },
];

function toOptions(values: string[]): FieldOption[] {
  return values.map(item => ({
    value: item,
    label: item,
  }));
}

export function DeviceFilterPopover({
  value,
  tenants,
  manufacturers,
  onApply,
}: DeviceFilterPopoverProps) {
  const [
    open,
    setOpen,
  ] = useState(false);
  const [
    draft,
    setDraft,
  ] = useState(value);
  const activeCount = Object.values(value).filter(filter => filter.enabled).length;

  const fields: {
    key: DeviceFilterKey;
    label: string;
    placeholder: string;
    options: FieldOption[];
  }[] = [
    {
      key: "lastSeen",
      label: "Last Seen",
      placeholder: "Select range",
      options: lastSeenOptions,
    },
    {
      key: "tenant",
      label: "Tenant",
      placeholder: "Select tenant",
      options: toOptions(tenants),
    },
    {
      key: "manufacturer",
      label: "Manufacturer",
      placeholder: "Select manufacturer",
      options: toOptions(manufacturers),
    },
  ];

  const patch = (key: DeviceFilterKey, change: Partial<DeviceFilterDraft[DeviceFilterKey]>) =>
    setDraft(current => ({
      ...current,
      [key]: {
        ...current[key],
        ...change,
      },
    }));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next)
          setDraft(value);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-start gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-xs"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[324px] rounded-xl p-3"
      >
        <div className="space-y-3">
          <h4 className="px-0.5 text-xs font-semibold text-foreground">
            Only show devices by...
          </h4>
          {fields.map(field => (
            <div
              key={field.key}
              className="space-y-1.5"
            >
              <label className="flex cursor-pointer select-none items-center gap-2">
                <Checkbox
                  checked={draft[field.key].enabled}
                  onCheckedChange={checked => patch(
                    field.key,
                    { enabled: !!checked },
                  )}
                  className="h-3.5 w-3.5"
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {field.label}
                </span>
              </label>
              <Select
                disabled={!draft[field.key].enabled}
                value={draft[field.key].value}
                onValueChange={next => patch(
                  field.key,
                  { value: next },
                )}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="flex gap-2 border-t border-border pt-3">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                onApply(draft);
                setOpen(false);
              }}
            >
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setDraft(emptyFilters);
                onApply(emptyFilters);
                setOpen(false);
              }}
            >
              Show All
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
