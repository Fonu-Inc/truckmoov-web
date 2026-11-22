import type { DeviceFulfilment } from "@/features/apply/utils/applyTypes";

import {
  Info,
  PackageCheck,
  Store,
  Truck,
} from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { NIGERIAN_STATES } from "@/features/apply/utils/applySchemas";
import { cn } from "@/lib/utils";

const METHODS = [
  {
    id: "pickup",
    label: "Pickup",
    description: "Collect from an MTN Connect Store",
    icon: Store,
  },
  {
    id: "delivery",
    label: "Delivery",
    description: "Delivered to your address",
    icon: Truck,
  },
] as const;

// TODO(api): MTN Connect Store / Service Centre locations — areas per state and stores per
// area. Until the endpoint lands these lists are empty, so the pickup selects stay disabled.
const PICKUP_AREAS: Record<string, string[]> = {};
const PICKUP_STORES: Record<string, string[]> = {};

/**
 * How the requested devices reach the applicant. Owner Operators always collect from a
 * store; Enterprise customers pick pickup or delivery.
 *
 * TODO(api): the choice isn't sent anywhere yet — it lives in the apply draft store until
 * the onboarding API takes a fulfilment method.
 */
export function DeviceFulfilmentCard({
  value,
  onChange,
  isOwnerOperator,
}: {
  value: DeviceFulfilment;
  onChange: (value: DeviceFulfilment) => void;
  isOwnerOperator: boolean;
}) {
  useEffect(
    () => {
      if (isOwnerOperator && value.method !== "pickup") {
        onChange({
          ...value,
          method: "pickup",
        });
      }
    },
    // Only when the customer type changes, as the design does.
    // eslint-disable-next-line react/exhaustive-deps
    [isOwnerOperator],
  );

  const method = isOwnerOperator ? "pickup" : value.method;
  const areas = PICKUP_AREAS[value.state] ?? [];
  const stores = PICKUP_STORES[`${value.state}|${value.area}`] ?? [];

  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <PackageCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Device Fulfilment</h3>
          <p className="text-sm text-muted-foreground">
            {isOwnerOperator
              ? "Requested devices are collected from an MTN Connect Store or Service Centre."
              : "Choose how you would like to receive your requested devices."}
          </p>
        </div>
      </div>

      {!isOwnerOperator && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {METHODS.map(option => (
            <Button
              key={option.id}
              type="button"
              variant="outline"
              onClick={() => onChange({
                ...value,
                method: option.id,
              })}
              className={cn(
                "h-auto w-full justify-start items-start gap-3 rounded-xl border p-4 text-left whitespace-normal transition-colors",
                method === option.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border/70 hover:border-primary/40",
              )}
            >
              <option.icon className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </Button>
          ))}
        </div>
      )}

      {method === "pickup" && (
        <div className="mt-6 max-w-xl space-y-5">
          <div className="space-y-2">
            <Label>State</Label>
            <Select
              value={value.state}
              onValueChange={state => onChange({
                ...value,
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
          </div>
          <div className="space-y-2">
            <Label>Area</Label>
            <Select
              value={value.area}
              disabled={!value.state || areas.length === 0}
              onValueChange={area => onChange({
                ...value,
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
                store,
              })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder={value.area ? "Select location" : "Select an area first"} />
              </SelectTrigger>
              <SelectContent>
                {stores.map(store => (
                  <SelectItem
                    key={store}
                    value={store}
                  >
                    {store}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {method === "delivery" && (
        <div className="mt-6 max-w-xl space-y-5">
          <div className="space-y-2">
            <Label>Street Address</Label>
            <Input
              placeholder="e.g. 14 Wharf Road"
              value={value.deliveryStreet}
              onChange={event => onChange({
                ...value,
                deliveryStreet: event.target.value,
              })}
            />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              placeholder="e.g. Apapa"
              value={value.deliveryCity}
              onChange={event => onChange({
                ...value,
                deliveryCity: event.target.value,
              })}
            />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Select
              value={value.deliveryState}
              onValueChange={deliveryState => onChange({
                ...value,
                deliveryState,
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
          </div>
          <p className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Delivery and fulfilment fees apply to delivered devices and vary with your delivery
              location and the number of devices being delivered. Any applicable fee will be shown
              to you as an additional charge on your quotation before you make payment, so there
              are no surprise costs later.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
