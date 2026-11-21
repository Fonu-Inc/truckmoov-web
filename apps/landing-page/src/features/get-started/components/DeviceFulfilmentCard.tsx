"use client";

import type { DeviceFulfilment } from "@/features/get-started/utils/applyTypes";
import {
  Info,
  Package,
  Storefront,
  Truck,
} from "@phosphor-icons/react/dist/ssr";
import { NIGERIAN_STATES } from "@/features/get-started/schemas/applySchemas";
import {
  CARD_CLASS,
  FIELD_CLASS,
  LABEL_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

const METHODS = [
  {
    id: "pickup",
    label: "Pickup",
    description: "Collect from an MTN Connect Store",
    icon: Storefront,
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
 * How the requested devices reach the applicant (main app: DeviceFulfilmentCard). Owner
 * Operators always collect from a store, so their method is derived as "pickup" here (and
 * set in the draft store when the customer type is chosen); Enterprise customers pick
 * pickup or delivery.
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
  const method = isOwnerOperator ? "pickup" : value.method;
  const areas = PICKUP_AREAS[value.state] ?? [];
  const stores = PICKUP_STORES[`${value.state}|${value.area}`] ?? [];

  return (
    <section className={CARD_CLASS}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-tint">
          <Package className="size-5 text-brand-deep" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base leading-5 font-semibold text-heading">Device Fulfilment</h3>
          <p className="mt-1 text-xs leading-[17px] text-muted-foreground">
            {isOwnerOperator
              ? "Requested devices are collected from an MTN Connect Store or Service Centre."
              : "Choose how you would like to receive your requested devices."}
          </p>
        </div>
      </div>

      {!isOwnerOperator && (
        <div
          role="radiogroup"
          aria-label="Device fulfilment method"
          className="mt-4 grid gap-[9px] sm:grid-cols-2"
        >
          {METHODS.map(option => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={method === option.id}
              onClick={() => onChange({
                ...value,
                method: option.id,
              })}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-[15px] bg-background p-4 text-left transition-colors",
                method === option.id
                  ? "border-2 border-brand-bright"
                  : "border-[0.5px] border-border hover:border-border-deep",
              )}
            >
              <option.icon className="mt-0.5 size-4 shrink-0 text-brand-deep" />
              <span>
                <span className="block text-sm font-semibold text-heading">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.description}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {method === "pickup" && (
        <div className="mt-5 space-y-[19px]">
          <label className="block space-y-1.5">
            <span className={LABEL_CLASS}>State</span>
            <select
              value={value.state}
              onChange={event => onChange({
                ...value,
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
          </label>
          <label className="block space-y-1.5">
            <span className={LABEL_CLASS}>Area</span>
            <select
              value={value.area}
              disabled={!value.state || areas.length === 0}
              onChange={event => onChange({
                ...value,
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
            <span className={LABEL_CLASS}>MTN Connect Store / Service Centre</span>
            <select
              value={value.store}
              disabled={!value.area || stores.length === 0}
              onChange={event => onChange({
                ...value,
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
                  key={store}
                  value={store}
                  className="text-heading"
                >
                  {store}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {method === "delivery" && (
        <div className="mt-5 space-y-[19px]">
          <label className="block space-y-1.5">
            <span className={LABEL_CLASS}>Street Address</span>
            <input
              placeholder="e.g. 14 Wharf Road"
              value={value.deliveryStreet}
              onChange={event => onChange({
                ...value,
                deliveryStreet: event.target.value,
              })}
              className={FIELD_CLASS}
            />
          </label>
          <label className="block space-y-1.5">
            <span className={LABEL_CLASS}>City</span>
            <input
              placeholder="e.g. Apapa"
              value={value.deliveryCity}
              onChange={event => onChange({
                ...value,
                deliveryCity: event.target.value,
              })}
              className={FIELD_CLASS}
            />
          </label>
          <label className="block space-y-1.5">
            <span className={LABEL_CLASS}>State</span>
            <select
              value={value.deliveryState}
              onChange={event => onChange({
                ...value,
                deliveryState: event.target.value,
              })}
              className={cn(
                FIELD_CLASS,
                !value.deliveryState && "text-faint-foreground",
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
          </label>
          <p className="flex items-start gap-2 rounded-[15px] bg-surface px-4 py-3 text-xs leading-[17px] text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-brand-deep" />
            <span>
              Delivery and fulfilment fees apply to delivered devices and vary with your delivery
              location and the number of devices being delivered. Any applicable fee will be shown
              to you as an additional charge on your quotation before you make payment, so there
              are no surprise costs later.
            </span>
          </p>
        </div>
      )}
    </section>
  );
}
