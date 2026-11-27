"use client";

import type { PickedLocation } from "./AddressLookupInput";
import type { AddressVerification } from "@/features/get-started/utils/addressVerification";
import {
  useId,
  useState,
} from "react";
import {
  useFormContext,
  useWatch,
} from "react-hook-form";
import { AddressLookupInput } from "@/features/get-started/components/AddressLookupInput";
import {
  isAddressVerified,
  mapPlaceToRegion,
  MAX_ADDRESS_LENGTH,
  regionMismatch,
  regionToPrefill,
} from "@/features/get-started/utils/addressVerification";
import { LABEL_CLASS } from "@/features/get-started/utils/getStartedContent";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { cn } from "@/shared/utils";

/** What the address field reads and writes on the surrounding form. */
type AddressFormValues = {
  streetAddress: string;
  addressVerification?: AddressVerification | null;
  state: string;
  city: string;
};

/**
 * An address that must be picked from the Nigerian lookup, or, while the lookup is down,
 * confirmed by hand (main app: AddressField). Must sit inside a `<Form>` that has
 * `streetAddress`, `addressVerification`, `state` and `city`.
 */
export function AddressField({
  label,
  placeholder,
  className,
  onRegionPrefilled,
}: {
  label: string;
  placeholder: string;
  className?: string;
  /** Called with the state / city that a pick filled in. */
  onRegionPrefilled?: (region: {
    state?: string;
    city?: string;
  }) => void;
}) {
  const form = useFormContext<AddressFormValues>();
  const confirmId = useId();
  const [
    lookupFailed,
    setLookupFailed,
  ] = useState(false);
  const [
    verification,
    state,
    city,
  ] = useWatch({
    control: form.control,
    name: [
      "addressVerification",
      "state",
      "city",
    ],
  });

  function commit(address: string, next: AddressVerification | null) {
    // The verification goes first so the validation of the text sees it.
    form.setValue(
      "addressVerification",
      next,
      { shouldDirty: true },
    );
    form.setValue(
      "streetAddress",
      address,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  }

  function handleSelect(location: PickedLocation) {
    const address = location.address.slice(
      0,
      MAX_ADDRESS_LENGTH,
    );
    const next: AddressVerification = {
      status: "selected",
      address,
      lat: location.lat,
      lng: location.lng,
      ...mapPlaceToRegion(location.place),
    };
    commit(
      address,
      next,
    );
    const prefill = regionToPrefill(
      next,
      {
        state: state ?? "",
        city: city ?? "",
      },
    );
    if (prefill.state) {
      form.setValue(
        "state",
        prefill.state,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
    if (prefill.city) {
      form.setValue(
        "city",
        prefill.city,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
    if (prefill.state || prefill.city)
      onRegionPrefilled?.(prefill);
  }

  return (
    <FormField
      control={form.control}
      name="streetAddress"
      render={({
        field, fieldState,
      }) => {
        const text = field.value ?? "";
        const verified = isAddressVerified(
          text,
          verification,
        );
        const confirmed = verified && verification?.status === "confirmed";
        const mismatch = verified
          ? regionMismatch(
              verification,
              {
                state: state ?? "",
                city: city ?? "",
              },
            )
          : null;

        return (
          <FormItem className={cn(
            "gap-1.5",
            className,
          )}
          >
            <FormLabel
              className={LABEL_CLASS}
              required
            >
              {label}
            </FormLabel>
            <FormControl>
              <AddressLookupInput
                text={text}
                selectedAddress={verification?.status === "selected" ? verification.address : null}
                placeholder={placeholder}
                onTextChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                onSelect={handleSelect}
                onLookupFailedChange={setLookupFailed}
              />
            </FormControl>
            <FormMessage className="text-xs" />

            {text.trim() && !verified && !fieldState.isDirty && !fieldState.error && !lookupFailed && (
              <p className="text-xs text-warning">
                This address needs to be verified. Search for it and select it from the suggestions.
              </p>
            )}

            {mismatch && <p className="text-xs text-warning">{mismatch}</p>}

            {(lookupFailed || confirmed) && (
              <label
                htmlFor={confirmId}
                className="flex cursor-pointer items-start gap-2 text-sm leading-5 text-heading"
              >
                <input
                  id={confirmId}
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-brand-deep"
                  checked={confirmed}
                  disabled={text.trim().length < 5}
                  onChange={(event) => {
                    const address = text.trim().slice(
                      0,
                      MAX_ADDRESS_LENGTH,
                    );
                    commit(
                      event.target.checked ? address : text,
                      event.target.checked
                        ? {
                            status: "confirmed",
                            address,
                          }
                        : null,
                    );
                  }}
                />
                I confirm this address is correct
              </label>
            )}
          </FormItem>
        );
      }}
    />
  );
}
