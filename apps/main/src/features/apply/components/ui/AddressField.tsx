import type { MapLocation } from "@/components/maps/MapLocationInput";
import type { AddressVerification } from "@/features/apply/utils/addressVerification";

import {
  useId,
  useState,
} from "react";
import {
  useFormContext,
  useWatch,
} from "react-hook-form";

import { MapLocationInput } from "@/components/maps/MapLocationInput";
import { Checkbox } from "@/components/shadcn/checkbox";
import { FormField } from "@/components/shadcn/form";
import { Label } from "@/components/shadcn/label";
import {
  isAddressVerified,
  mapPlaceToRegion,
  MAX_ADDRESS_LENGTH,
  regionMismatch,
  regionToPrefill,
} from "@/features/apply/utils/addressVerification";

/** What the address field reads and writes on the surrounding form. */
type AddressFormValues = {
  streetAddress: string;
  addressVerification?: AddressVerification | null;
  state: string;
  city: string;
};

type AddressFieldProps = {
  label: string;
  placeholder: string;
  className?: string;
  /** Called with the state / city that a pick filled in. */
  onRegionPrefilled?: (region: {
    state?: string;
    city?: string;
  }) => void;
};

/**
 * An address that must be picked from the Nigerian lookup (the Create Job location input),
 * or, while the lookup is down, confirmed by hand. Must sit inside a `<Form>` that has
 * `streetAddress`, `addressVerification`, `state` and `city`.
 */
export function AddressField({
  label,
  placeholder,
  className,
  onRegionPrefilled,
}: AddressFieldProps) {
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

  function clearPickedRegion(next: string) {
    // State and City came from the pick and go with it, each only if still the picked value.
    if (verification?.status !== "selected" || isAddressVerified(
      next,
      verification,
    )) {
      return;
    }
    if (verification.state && state === verification.state) {
      form.setValue(
        "state",
        "",
        { shouldDirty: true },
      );
    }
    if (verification.city && city === verification.city) {
      form.setValue(
        "city",
        "",
        { shouldDirty: true },
      );
    }
  }

  function handleSelect(location: MapLocation) {
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
      form.getValues(),
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
                state,
                city,
              },
            )
          : null;

        return (
          <div className={className}>
            <MapLocationInput
              embedded
              nigeriaOnly
              label={label}
              required
              placeholder={placeholder}
              text={text}
              value={verification?.status === "selected"
                ? {
                    address: verification.address,
                    lat: verification.lat ?? 0,
                    lng: verification.lng ?? 0,
                  }
                : null}
              error={fieldState.error?.message}
              lookupErrorMessage="Couldn't look up addresses right now"
              onLookupFailedChange={setLookupFailed}
              onTextChange={(next) => {
                clearPickedRegion(next);
                field.onChange(next);
              }}
              inputRef={field.ref}
              onBlur={field.onBlur}
              onLocationSelect={handleSelect}
              inputClassName="h-10"
              pinColor="hsl(var(--muted-foreground))"
            />

            {text.trim() && !verified && !fieldState.isDirty && !fieldState.error && !lookupFailed && (
              <p className="mt-1.5 text-sm text-warning">
                This address needs to be verified. Search for it and select it from the suggestions.
              </p>
            )}

            {mismatch && <p className="mt-1.5 text-sm text-warning">{mismatch}</p>}

            {(lookupFailed || confirmed) && (
              <div className="mt-2 flex items-start gap-2">
                <Checkbox
                  id={confirmId}
                  checked={confirmed}
                  disabled={text.trim().length < 5}
                  onCheckedChange={(checked) => {
                    const address = text.trim().slice(
                      0,
                      MAX_ADDRESS_LENGTH,
                    );
                    commit(
                      checked === true ? address : text,
                      checked === true
                        ? {
                            status: "confirmed",
                            address,
                          }
                        : null,
                    );
                  }}
                />
                <Label
                  htmlFor={confirmId}
                  className="cursor-pointer text-sm leading-5 text-foreground"
                >
                  I confirm this address is correct
                </Label>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
