import type { DeviceFulfilment } from "@/features/apply/utils/applyTypes";

import { useQuery } from "@tanstack/react-query";
import { getPickupLocationsQueryOptions } from "@truckmoov/api/auth";
import { PackageCheck } from "lucide-react";

import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { NIGERIAN_STATES } from "@/features/apply/utils/applySchemas";

/**
 * Device Pickup, as the design has it for onboarding: both customer types collect their
 * devices from an MTN Connect Store or Service Centre. Pickup points come from
 * `GET …/pickup-locations` (state → area → store); `store` holds the location id.
 */
export function DeviceFulfilmentCard({
  value,
  onChange,
}: {
  value: DeviceFulfilment;
  onChange: (value: DeviceFulfilment) => void;
}) {
  const locationsQuery = useQuery(getPickupLocationsQueryOptions());
  const locations = locationsQuery.data?.data ?? [];
  const areas = [...new Set(locations.filter(location => location.state === value.state).map(location => location.area))];
  const stores = locations.filter(location => location.state === value.state && location.area === value.area);

  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <PackageCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Device Pickup</h3>
          <p className="text-sm text-muted-foreground">
            Requested devices are collected from an MTN Connect Store or Service Centre.
          </p>
        </div>
      </div>

      <div className="mt-6 max-w-xl space-y-5">
        <div className="space-y-2">
          <Label>State</Label>
          <Select
            value={value.state}
            onValueChange={state => onChange({
              ...value,
              method: "pickup",
              state,
              area: "",
              store: "",
            })}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {NIGERIAN_STATES.map(state => (
                <SelectItem
                  key={state}
                  value={state}
                >
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {value.state && !locationsQuery.isLoading && areas.length === 0 && (
            <p className="text-xs text-muted-foreground">No pickup points in this state yet. Choose another state.</p>
          )}
          {locationsQuery.isError && (
            <p className="text-xs text-destructive">
              Pickup points couldn't be loaded.
              {" "}
              <button
                type="button"
                className="font-medium underline"
                onClick={() => void locationsQuery.refetch()}
              >
                Try again
              </button>
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Area</Label>
          <Select
            value={value.area}
            disabled={!value.state || areas.length === 0}
            onValueChange={area => onChange({
              ...value,
              method: "pickup",
              area,
              store: "",
            })}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder={value.state ? "Select area" : "Select a state first"} />
            </SelectTrigger>
            <SelectContent>
              {areas.map(area => (
                <SelectItem
                  key={area}
                  value={area}
                >
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>MTN Connect Store / Service Centre</Label>
          <Select
            value={value.store}
            disabled={!value.area || stores.length === 0}
            onValueChange={store => onChange({
              ...value,
              method: "pickup",
              store,
            })}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder={value.area ? "Select location" : "Select an area first"} />
            </SelectTrigger>
            <SelectContent>
              {stores.map(store => (
                <SelectItem
                  key={store.id}
                  value={store.id}
                >
                  {store.isDemo ? `${store.name} (demo)` : store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
