import type { DeviceSetupFilters } from "./deviceSetupConfig";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Label } from "@/components/shadcn/label";
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
import {
  cloneFilters,
  countActiveFilters,

  EMPTY_FILTERS,
} from "./deviceSetupConfig";

type Props = {
  applied: DeviceSetupFilters;
  onApply: (filters: DeviceSetupFilters) => void;
  organisations: string[];
  manufacturers: string[];
};

export function DeviceSetupFilterPopover({
  applied, onApply, organisations, manufacturers,
}: Props) {
  const [
    open,
    setOpen,
  ] = useState(false);
  const [
    draft,
    setDraft,
  ] = useState<DeviceSetupFilters>(() => cloneFilters(applied));
  const activeCount = countActiveFilters(applied);

  function patchManufacturer(patch: Partial<DeviceSetupFilters["manufacturer"]>) {
    setDraft(current => ({
      ...current, manufacturer: {
        ...current.manufacturer, ...patch,
      },
    }));
  }

  function patchOrganisation(patch: Partial<DeviceSetupFilters["organisation"]>) {
    setDraft(current => ({
      ...current, organisation: {
        ...current.organisation, ...patch,
      },
    }));
  }

  function commit(next: DeviceSetupFilters) {
    onApply(cloneFilters(next));
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next)
          setDraft(cloneFilters(applied));
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 font-semibold"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filter
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 px-1.5"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 space-y-4"
      >
        <p className="text-sm font-semibold">Only show requests by...</p>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="device-setup-organisation-filter"
              checked={draft.organisation.enabled}
              onCheckedChange={checked => patchOrganisation({ enabled: checked === true })}
            />
            <Label
              htmlFor="device-setup-organisation-filter"
              className="font-medium"
            >
              Organisation
            </Label>
          </div>
          <Select
            value={draft.organisation.value}
            disabled={!draft.organisation.enabled}
            onValueChange={value => patchOrganisation({ value })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select organisation" />
            </SelectTrigger>
            <SelectContent>
              {organisations.map(name => (
                <SelectItem
                  key={name}
                  value={name}
                >
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="device-setup-manufacturer-filter"
              checked={draft.manufacturer.enabled}
              onCheckedChange={checked => patchManufacturer({ enabled: checked === true })}
            />
            <Label
              htmlFor="device-setup-manufacturer-filter"
              className="font-medium"
            >
              Manufacturer
            </Label>
          </div>
          <Select
            value={draft.manufacturer.value}
            disabled={!draft.manufacturer.enabled}
            onValueChange={value => patchManufacturer({ value })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select manufacturer" />
            </SelectTrigger>
            <SelectContent>
              {manufacturers.map(name => (
                <SelectItem
                  key={name}
                  value={name}
                >
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            size="sm"
            className="font-semibold"
            onClick={() => commit(draft)}
          >
            Apply
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="font-semibold"
            onClick={() => commit(EMPTY_FILTERS)}
          >
            Show All
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
