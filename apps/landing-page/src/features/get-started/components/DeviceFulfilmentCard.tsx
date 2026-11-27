"use client";

import type { DeviceFulfilment } from "@truckmoov/app-core/apply/applyTypes";
import { Package } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { getPickupLocationsQueryOptions } from "@truckmoov/api/auth";
import { pickupLocationLabel } from "@truckmoov/app-core/apply/applyTypes";
import { NIGERIAN_STATES } from "@/features/get-started/schemas/applySchemas";
import {
  CARD_CLASS,
  FIELD_CLASS,
  LABEL_CLASS,
  LINK_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

/**
 * Device Pickup (main app: DeviceFulfilmentCard): both customer types collect their devices
 * from an MTN Connect Store or Service Centre. Pickup points come from
 * `GET …/pickup-locations` (state → area → store); `store` holds the location id.
 */
export function DeviceFulfilmentCard({
  value,
  onChange,
  required = false,
}: {
  value: DeviceFulfilment;
  onChange: (value: DeviceFulfilment) => void;
  /** Pickup is only enforced once devices are requested; the fields are marked required only then. */
  required?: boolean;
}) {
  const locationsQuery = useQuery(getPickupLocationsQueryOptions());
  const locations = locationsQuery.data?.data ?? [];
  const areas = [...new Set(locations.filter(location => location.state === value.state).map(location => location.area))];
  const stores = locations.filter(location => location.state === value.state && location.area === value.area);

  return (
    <section className={CARD_CLASS}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-tint">
          <Package className="size-5 text-brand-deep" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base leading-5 font-semibold text-heading">Device Pickup</h3>
          <p className="mt-1 text-xs leading-[17px] text-muted-foreground">
            Requested devices are collected from an MTN Connect Store or Service Centre.
            {" "}
            {required ? "Required for your device request." : "Only needed if you request devices."}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-[19px]">
        <label className="block space-y-1.5">
          <span className={LABEL_CLASS}>
            State
            {required && (
              <span
                aria-hidden="true"
                className="ml-0.5 text-destructive"
              >
                *
              </span>
            )}
          </span>
          <select
            value={value.state}
            onChange={event => onChange({
              ...value,
              method: "pickup",
              state: event.target.value,
              area: "",
              store: "",
            })}
            className={cn(
              FIELD_CLASS,
              !value.state && "text-faint-foreground",
            )}
          >
            <option value="">Select state</option>
            {NIGERIAN_STATES.map(state => (
              <option
                key={state}
                value={state}
                className="text-heading"
              >
                {state}
              </option>
            ))}
          </select>
          {value.state && !locationsQuery.isLoading && areas.length === 0 && (
            <span className="block text-xs text-muted-foreground">No pickup points in this state yet. Choose another state.</span>
          )}
          {locationsQuery.isError && (
            <span className="block text-xs text-destructive">
              Pickup points couldn't be loaded.
              {" "}
              <button
                type="button"
                className={LINK_CLASS}
                onClick={() => void locationsQuery.refetch()}
              >
                Try again
              </button>
            </span>
          )}
        </label>
        <label className="block space-y-1.5">
          <span className={LABEL_CLASS}>
            Area
            {required && (
              <span
                aria-hidden="true"
                className="ml-0.5 text-destructive"
              >
                *
              </span>
            )}
          </span>
          <select
            value={value.area}
            disabled={!value.state || areas.length === 0}
            onChange={event => onChange({
              ...value,
              method: "pickup",
              area: event.target.value,
              store: "",
            })}
            className={cn(
              FIELD_CLASS,
              !value.area && "text-faint-foreground",
            )}
          >
            <option value="">{value.state ? "Select area" : "Select a state first"}</option>
            {areas.map(area => (
              <option
                key={area}
                value={area}
                className="text-heading"
              >
                {area}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className={LABEL_CLASS}>
            MTN Connect Store / Service Centre
            {required && (
              <span
                aria-hidden="true"
                className="ml-0.5 text-destructive"
              >
                *
              </span>
            )}
          </span>
          <select
            value={value.store}
            disabled={!value.area || stores.length === 0}
            onChange={event => onChange({
              ...value,
              method: "pickup",
              store: event.target.value,
            })}
            className={cn(
              FIELD_CLASS,
              !value.store && "text-faint-foreground",
            )}
          >
            <option value="">{value.area ? "Select location" : "Select an area first"}</option>
            {stores.map(store => (
              <option
                key={store.id}
                value={store.id}
                className="text-heading"
              >
                {pickupLocationLabel(store)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
