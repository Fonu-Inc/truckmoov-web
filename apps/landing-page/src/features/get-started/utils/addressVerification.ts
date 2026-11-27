/** Copy of apps/main/src/features/apply/utils/addressVerification.ts. Keep the two in step. */
import {
  CITIES_BY_STATE,
  NIGERIAN_STATES,
} from "@truckmoov/api/auth";

export const ADDRESS_NOT_SELECTED = "Select your address from the suggestions";

/** Where the address text came from: picked from a lookup result, or confirmed by hand while the lookup was down. */
export type AddressVerification = {
  status: "selected" | "confirmed";
  address: string;
  lat?: number;
  lng?: number;
  /** The wizard's own state / city (LGA) the geocoder result maps to, when it maps confidently. */
  state?: string;
  city?: string;
};

type Region = {
  state?: string;
  city?: string;
};

/** The server stores at most 200 characters. */
export const MAX_ADDRESS_LENGTH = 200;

function normalizeText(value: string) {
  return value.trim().replace(
    /\s+/g,
    " ",
  ).toLowerCase();
}

function compact(value: string) {
  return value.toLowerCase().replace(
    /[^a-z0-9]/g,
    "",
  );
}

/** A verification only counts for the exact text it was made for; any edit voids it. */
export function isAddressVerified(address: string, verification?: AddressVerification | null) {
  return Boolean(
    verification
    && typeof verification.address === "string"
    && verification.address.trim()
    && normalizeText(verification.address) === normalizeText(address ?? ""),
  );
}

export function stateFromGeocoder(name?: string) {
  if (!name)
    return null;
  const key = name.trim().replace(
    /\s+state$/i,
    "",
  ).toLowerCase();
  if (key === "federal capital territory")
    return "FCT";
  return NIGERIAN_STATES.find(state => state.toLowerCase() === key) ?? null;
}

/** An LGA of `state` that `candidate` names: exactly, or as a part of its name when only one LGA fits. */
function matchLga(state: string, candidate: string) {
  const key = compact(candidate);
  if (key.length < 3)
    return null;
  const lgas = CITIES_BY_STATE[state] ?? [];
  const exact = lgas.find(lga => compact(lga) === key);
  if (exact)
    return exact;
  if (key.length < 5)
    return null;
  const partial = lgas.filter(lga => compact(lga).includes(key));
  return partial.length === 1 ? partial[0] : null;
}

/** Geocoder fields -> the wizard's state and city (LGA) lists; a field is left out when it doesn't map confidently. */
export function mapPlaceToRegion(place?: {
  state?: string;
  city?: string;
  county?: string;
  district?: string;
  locality?: string;
}): Region {
  const state = stateFromGeocoder(place?.state);
  if (!state || !place)
    return {};
  for (const candidate of [
    place.city,
    place.county,
    place.district,
    place.locality,
  ]) {
    const city = candidate ? matchLga(
      state,
      candidate,
    ) : null;
    if (city) {
      return {
        state,
        city,
      };
    }
  }
  return { state };
}

/** Values to prefill after a pick. A value the user already chose is never replaced. */
export function regionToPrefill(
  verification: AddressVerification,
  current: {
    state: string;
    city: string;
  },
): Region {
  if (!verification.state)
    return {};
  const currentState = stateFromGeocoder(current.state);
  if (currentState && currentState !== verification.state)
    return {};
  const cityInState = (CITIES_BY_STATE[verification.state] ?? []).includes(current.city);
  const prefill: Region = {};
  if (!currentState)
    prefill.state = verification.state;
  if (verification.city && !(currentState && cityInState))
    prefill.city = verification.city;
  return prefill;
}

/** A warning (not an error) when the picked address sits in another state / city than the form says. */
export function regionMismatch(
  verification: AddressVerification | null | undefined,
  current: {
    state: string;
    city: string;
  },
) {
  if (!verification?.state)
    return null;
  const currentState = stateFromGeocoder(current.state);
  if (currentState && currentState !== verification.state)
    return `This address is in ${verification.state}, but the state is set to ${currentState}.`;
  if (currentState && verification.city && current.city && current.city !== verification.city)
    return `This address is in ${verification.city}, but the city is set to ${current.city}.`;
  return null;
}
