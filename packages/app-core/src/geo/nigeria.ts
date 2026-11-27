// Same box as the backend; a floor that catches (0,0) and other countries, not proof of a Nigerian address.
export const NIGERIA_BBOX = {
  minLat: 4.2,
  maxLat: 13.9,
  minLng: 2.6,
  maxLng: 14.7,
} as const;

export const NIGERIA_OUT_OF_BOUNDS_MESSAGE = "Choose an address in Nigeria from the suggestions";

export function isInsideNigeria(lat: number, lng: number) {
  return Number.isFinite(lat)
    && Number.isFinite(lng)
    && lat >= NIGERIA_BBOX.minLat
    && lat <= NIGERIA_BBOX.maxLat
    && lng >= NIGERIA_BBOX.minLng
    && lng <= NIGERIA_BBOX.maxLng;
}
