import type { MapLocation } from "@/components/maps/MapLocationInput";
import {
  isInsideNigeria, NIGERIA_OUT_OF_BOUNDS_MESSAGE,
} from "@truckmoov/app-core/geo/nigeria";

/** The error for a typed or picked address whose coordinates are missing or outside Nigeria. */
export function locationError(address: string, lat: number, lng: number) {
  return address.trim() && !isInsideNigeria(
    lat,
    lng,
  ) ? NIGERIA_OUT_OF_BOUNDS_MESSAGE : undefined;
}

/** Hands the picker an address only while its coordinates are valid, so typed text still searches. */
export function pickerValue(address: string, lat: number, lng: number): MapLocation {
  return isInsideNigeria(
    lat,
    lng,
  ) ? {
        address, lat, lng,
      } : {
        address: "", lat: 0, lng: 0,
      };
}
