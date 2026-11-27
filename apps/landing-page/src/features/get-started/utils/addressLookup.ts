/** Nigeria-only address lookup on keyless Photon. Copy of the lookup in apps/main MapLocationInput. */

export type LocationPlace = {
  state?: string;
  city?: string;
  county?: string;
  district?: string;
  locality?: string;
};

export type LocationSuggestion = {
  id: string;
  address: string;
  lat: number;
  lng: number;
  place?: LocationPlace;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    locality?: string;
    county?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
  };
};

const PHOTON_API_URL = "https://photon.komoot.io";
// minLon,minLat,maxLon,maxLat; it spills into neighbours, so results are also filtered by country code.
const NIGERIA_BBOX = "2.6,4.2,14.7,13.9";

export const LOOKUP_DEBOUNCE_MS = 350;
export const LOOKUP_MIN_CHARS = 3;

function formatAddress(properties: PhotonFeature["properties"]) {
  const streetAddress = [
    properties.housenumber,
    properties.street,
  ]
    .filter(Boolean)
    .join(" ");
  const addressParts = [
    properties.name,
    streetAddress,
    properties.district,
    properties.city,
    properties.state,
    properties.postcode,
    properties.country,
  ].filter((part): part is string => Boolean(part));

  return addressParts.filter(
    (part, index) =>
      addressParts.findIndex(
        candidate => candidate.toLowerCase() === part.toLowerCase(),
      ) === index,
  ).join(", ");
}

export async function findLocations(query: string, signal?: AbortSignal) {
  const params = new URLSearchParams({
    q: query,
    limit: "10",
    bbox: NIGERIA_BBOX,
  });
  const response = await fetch(
    `${PHOTON_API_URL}/api?${params}`,
    { signal },
  );
  if (!response.ok)
    throw new Error("Location search failed");
  const { features } = (await response.json()) as { features: PhotonFeature[] };

  return features
    .filter(feature => feature.properties.countrycode?.toUpperCase() === "NG")
    .map<LocationSuggestion>((feature, index) => {
      const [
        lng,
        lat,
      ] = feature.geometry.coordinates;
      return {
        id: `${feature.properties.osm_type ?? "place"}-${feature.properties.osm_id ?? index}-${lat}-${lng}`,
        address: formatAddress(feature.properties),
        lat,
        lng,
        place: {
          state: feature.properties.state,
          city: feature.properties.city,
          county: feature.properties.county,
          district: feature.properties.district,
          locality: feature.properties.locality,
        },
      };
    })
    .filter(
      (suggestion, index, all) =>
        suggestion.address
        && all.findIndex(candidate => candidate.address.toLowerCase() === suggestion.address.toLowerCase()) === index,
    )
    .slice(
      0,
      5,
    );
}
