import type {
  FormEvent, KeyboardEvent,
} from "react";
import {
  Loader2, MapPin,
} from "lucide-react";
import {

  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { getBrowserCoordinates } from "@/lib/browserLocation";
import { cn } from "@/lib/utils";

export type MapLocation = {
  address: string;
  lat: number;
  lng: number;
};

type LocationSuggestion = {
  id: string;
  countryCode?: string;
} & MapLocation;

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
  };
};

type PhotonResponse = { features: PhotonFeature[] };

type UserLocationBias = {
  lat: number;
  lng: number;
  countryCode?: string;
};

export type MapLocationInputProps = {
  onLocationSelect: (location: MapLocation) => void;
  value?: MapLocation | null;
  placeholder?: string;
  label?: string;
  /** Marks the label with a red asterisk. */
  required?: boolean;
  pinColor?: string;
  suggestionsSide?: "top" | "bottom";
  inputClassName?: string;
  className?: string;
};

const PHOTON_API_URL = "https://photon.komoot.io";
let userLocationBiasPromise: Promise<UserLocationBias | null> | null = null;

function getUserLocationBias() {
  if (userLocationBiasPromise)
    return userLocationBiasPromise;

  userLocationBiasPromise = (async () => {
    try {
      const coordinates = await getBrowserCoordinates();
      if (!coordinates)
        return null;

      const {
        lat, lng,
      } = coordinates;
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        limit: "1",
      });

      try {
        const response = await fetch(`${PHOTON_API_URL}/reverse?${params}`);
        if (!response.ok) {
          return {
            lat, lng,
          };
        }

        const data = (await response.json()) as PhotonResponse;
        return {
          lat,
          lng,
          countryCode: data.features[0]?.properties.countrycode?.toUpperCase(),
        };
      }
      catch {
        return {
          lat, lng,
        };
      }
    }
    catch {
      return null;
    }
  })();

  return userLocationBiasPromise;
}

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

async function findLocations(query: string, signal?: AbortSignal) {
  const locationBias = await getUserLocationBias();
  const globalParams = new URLSearchParams({
    q: query,
    limit: "10",
  });

  if (locationBias) {
    globalParams.set(
      "lat",
      String(locationBias.lat),
    );
    globalParams.set(
      "lon",
      String(locationBias.lng),
    );
    globalParams.set(
      "zoom",
      "6",
    );
    globalParams.set(
      "location_bias_scale",
      "0.1",
    );
  }

  const fetchFeatures = async (params: URLSearchParams) => {
    const response = await fetch(
      `${PHOTON_API_URL}/api?${params}`,
      { signal },
    );
    if (!response.ok)
      throw new Error("Location search failed");
    return ((await response.json()) as PhotonResponse).features;
  };

  let features: PhotonFeature[];
  if (locationBias?.countryCode) {
    const localParams = new URLSearchParams(globalParams);
    localParams.set(
      "limit",
      "5",
    );
    localParams.set(
      "countrycode",
      locationBias.countryCode,
    );

    const [
      localFeatures,
      globalFeatures,
    ] = await Promise.all([
      fetchFeatures(localParams),
      fetchFeatures(globalParams),
    ]);
    features = [
      ...localFeatures,
      ...globalFeatures,
    ];
  }
  else {
    features = await fetchFeatures(globalParams);
  }

  const suggestions = features.map<LocationSuggestion>((feature, index) => {
    const [
      lng,
      lat,
    ] = feature.geometry.coordinates;
    return {
      id: `${feature.properties.osm_type ?? "place"}-${feature.properties.osm_id ?? index}-${lat}-${lng}`,
      address: formatAddress(feature.properties),
      lat,
      lng,
      countryCode: feature.properties.countrycode?.toUpperCase(),
    };
  });

  return suggestions
    .filter(
      (suggestion, index, allSuggestions) =>
        suggestion.address
        && allSuggestions.findIndex(
          candidate => candidate.address.toLowerCase() === suggestion.address.toLowerCase(),
        ) === index,
    )
    .slice(
      0,
      5,
    );
}

export function MapLocationInput({
  onLocationSelect,
  value,
  placeholder = "Enter a location and press Enter",
  label,
  required,
  pinColor = "hsl(var(--primary))",
  suggestionsSide = "bottom",
  inputClassName,
  className,
}: MapLocationInputProps) {
  const inputId = useId();
  const suggestionsId = `${inputId}-suggestions`;
  const [
    query,
    setQuery,
  ] = useState(value?.address ?? "");
  const [
    selectedAddress,
    setSelectedAddress,
  ] = useState<string | null>(
    value?.address ?? null,
  );
  const [
    suggestions,
    setSuggestions,
  ] = useState<LocationSuggestion[]>([]);
  const [
    isSearching,
    setIsSearching,
  ] = useState(false);
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);
  const [
    highlightedIndex,
    setHighlightedIndex,
  ] = useState(-1);
  const [
    error,
    setError,
  ] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(
    () => {
      void getUserLocationBias();
    },
    [],
  );

  useEffect(
    () => {
      const nextAddress = value?.address ?? "";
      setQuery(nextAddress);
      setSelectedAddress(nextAddress || null);
    },
    [value?.address],
  );

  useEffect(
    () => {
      const location = query.trim();
      if (location.length < 3 || location === selectedAddress) {
        setSuggestions([]);
        setIsOpen(false);
        setIsSearching(false);
        return;
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(
        async () => {
          setIsSearching(true);
          try {
            const results = await findLocations(
              location,
              controller.signal,
            );
            setSuggestions(results);
            setHighlightedIndex(-1);
            setIsOpen(results.length > 0);
          }
          catch (searchError) {
            if ((searchError as Error).name !== "AbortError") {
              setSuggestions([]);
              setIsOpen(false);
            }
          }
          finally {
            if (!controller.signal.aborted)
              setIsSearching(false);
          }
        },
        350,
      );

      return () => {
        window.clearTimeout(timeout);
        controller.abort();
      };
    },
    [
      query,
      selectedAddress,
    ],
  );

  useEffect(
    () => {
      const closeSuggestions = (event: MouseEvent) => {
        if (formRef.current && !formRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener(
        "mousedown",
        closeSuggestions,
      );
      return () => document.removeEventListener(
        "mousedown",
        closeSuggestions,
      );
    },
    [],
  );

  const selectSuggestion = (result: LocationSuggestion) => {
    const location = {
      address: result.address,
      lat: result.lat,
      lng: result.lng,
    };

    setQuery(location.address);
    setSelectedAddress(location.address);
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setError(null);
    onLocationSelect(location);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const suggestedLocation = suggestions[highlightedIndex] ?? suggestions[0];
    if (suggestedLocation) {
      selectSuggestion(suggestedLocation);
      return;
    }

    const location = query.trim();
    if (!location || isSearching)
      return;

    setIsSearching(true);
    setError(null);

    try {
      const [result] = await findLocations(location);
      if (!result) {
        setError("Location not found. Try a more specific address.");
        return;
      }
      selectSuggestion(result);
    }
    catch {
      setError("Unable to find that location right now.");
    }
    finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0)
      return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex(current =>
        current < suggestions.length - 1 ? current + 1 : 0);
    }
    else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex(current =>
        current > 0 ? current - 1 : suggestions.length - 1);
    }
    else if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn(
        "space-y-2",
        isOpen && "relative z-[1200]",
        className,
      )}
    >
      {label && (
        <Label
          htmlFor={inputId}
          className="text-foreground"
          required={required}
        >
          {label}
        </Label>
      )}
      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2"
          style={{ color: pinColor }}
        />
        <Input
          id={inputId}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedAddress(null);
            if (error)
              setError(null);
          }}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-label="Map location"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={suggestionsId}
          aria-activedescendant={
            highlightedIndex >= 0
              ? `${suggestionsId}-${highlightedIndex}`
              : undefined
          }
          aria-invalid={Boolean(error)}
          className={cn(
            "h-10 rounded-md bg-background pl-10 pr-10",
            inputClassName,
          )}
        />
        {isSearching && (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}

        {isOpen && suggestions.length > 0 && (
          <div
            id={suggestionsId}
            role="listbox"
            className={cn(
              "absolute z-[1200] max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl",
              suggestionsSide === "top" ? "bottom-full mb-2" : "mt-2",
            )}
          >
            {suggestions.map((suggestion, index) => (
              <button
                id={`${suggestionsId}-${index}`}
                key={suggestion.id}
                type="button"
                role="option"
                aria-selected={highlightedIndex === index}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => selectSuggestion(suggestion)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                  highlightedIndex === index
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: pinColor }}
                />
                <span className="line-clamp-2">{suggestion.address}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground shadow-md"
        >
          {error}
        </p>
      )}
    </form>
  );
}
