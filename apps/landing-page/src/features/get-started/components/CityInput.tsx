"use client";

import type { ComponentProps } from "react";
import { CITIES_BY_STATE } from "@truckmoov/api/auth";
import { useId } from "react";
import { FIELD_CLASS } from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

type CityInputProps = Omit<ComponentProps<"input">, "value" | "onChange"> & {
  /** API state name (`NIGERIAN_STATES`), e.g. "FCT". Empty disables the field. */
  state: string;
  value: string;
  onChange: (city: string) => void;
};

/**
 * City field: suggests the state's LGAs (the main app's CityCombobox list) and still takes
 * any place typed that isn't an LGA name. A native datalist keeps it free of popover code.
 */
export function CityInput({
  state,
  value,
  onChange,
  className,
  disabled,
  ...props
}: CityInputProps) {
  const listId = useId();
  const cities = CITIES_BY_STATE[state] ?? [];

  return (
    <>
      <input
        {...props}
        list={listId}
        value={value}
        autoComplete="off"
        disabled={disabled || !state}
        placeholder={state ? "Search your city" : "Select a state first"}
        onChange={event => onChange(event.target.value)}
        className={cn(
          FIELD_CLASS,
          className,
        )}
      />
      <datalist id={listId}>
        {cities.map(city => (
          <option
            key={city}
            value={city}
          />
        ))}
      </datalist>
    </>
  );
}
