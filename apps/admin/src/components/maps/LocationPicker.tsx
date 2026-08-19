import L from "leaflet";
import {
  Loader2,
  MapPin,
  Search,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Input } from "@/components/shadcn/input";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

export type LocationValue = {
  address: string;
  lat: number;
  lng: number;
};

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
};

type LocationPickerProps = {
  label?: string;
  placeholder?: string;
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  /** Color used for the marker pin (CSS color). */
  pinColor?: string;
  /** Optional initial center if value is empty. Defaults to Lagos. */
  defaultCenter?: [number, number];
  className?: string;
  /** Show the embedded map preview under the input. Default true. */
  showMap?: boolean;
  mapHeightClassName?: string;
};

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

async function searchAddress(query: string): Promise<NominatimResult[]> {
  if (query.trim().length < 3)
    return [];
  const url = `${NOMINATIM_BASE}/search?format=json&addressdetails=0&limit=6&q=${encodeURIComponent(query)}`;
  const res = await fetch(
    url,
    { headers: { "Accept-Language": "en" } },
  );
  if (!res.ok)
    return [];
  return res.json();
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}`;
  const res = await fetch(
    url,
    { headers: { "Accept-Language": "en" } },
  );
  if (!res.ok)
    return null;
  const data = await res.json();
  return data?.display_name ?? null;
}

function createPinIcon(color: string) {
  return L.divIcon({
    className: "location-picker-pin",
    html: `
      <div style="position:relative;width:32px;height:42px;">
        <svg viewBox="0 0 32 42" width="32" height="42" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26C32 7.2 24.8 0 16 0z" fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [
      32,
      42,
    ],
    iconAnchor: [
      16,
      42,
    ],
  });
}

export function LocationPicker({
  label,
  placeholder = "Search address...",
  value,
  onChange,
  pinColor = "#22c55e",
  defaultCenter = [
    6.5244,
    3.3792,
  ],
  className,
  showMap = true,
  mapHeightClassName = "h-[220px]",
}: LocationPickerProps) {
  const [
    query,
    setQuery,
  ] = useState(value.address || "");
  const [
    results,
    setResults,
  ] = useState<NominatimResult[]>([]);
  const [
    isSearching,
    setIsSearching,
  ] = useState(false);
  const [
    showResults,
    setShowResults,
  ] = useState(false);
  const [
    isReverseLoading,
    setIsReverseLoading,
  ] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const debounceRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Keep input in sync if value changes externally
  useEffect(
    () => {
      if (value.address && value.address !== query) {
        setQuery(value.address);
      }
    },
    [value.address],
  );

  // Initialize map
  useEffect(
    () => {
      if (!showMap || !mapContainerRef.current || mapRef.current)
        return;

      const initialCenter: [number, number]
        = value.lat && value.lng
          ? [
              value.lat,
              value.lng,
            ]
          : defaultCenter;

      const map = L.map(
        mapContainerRef.current,
        {
          zoomControl: true,
          attributionControl: false,
        },
      ).setView(
        initialCenter,
        value.lat && value.lng ? 14 : 11,
      );

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 },
      ).addTo(map);

      const marker = L.marker(
        initialCenter,
        {
          draggable: true,
          icon: createPinIcon(pinColor),
        },
      ).addTo(map);

      marker.on(
        "dragend",
        async () => {
          const pos = marker.getLatLng();
          setIsReverseLoading(true);
          try {
            const address = await reverseGeocode(
              pos.lat,
              pos.lng,
            );
            const newAddress = address || `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
            setQuery(newAddress);
            onChange({
              address: newAddress,
              lat: pos.lat,
              lng: pos.lng,
            });
          }
          finally {
            setIsReverseLoading(false);
          }
        },
      );

      // Click on map to move pin
      map.on(
        "click",
        async (e) => {
          marker.setLatLng(e.latlng);
          setIsReverseLoading(true);
          try {
            const address = await reverseGeocode(
              e.latlng.lat,
              e.latlng.lng,
            );
            const newAddress
              = address || `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
            setQuery(newAddress);
            onChange({
              address: newAddress,
              lat: e.latlng.lat,
              lng: e.latlng.lng,
            });
          }
          finally {
            setIsReverseLoading(false);
          }
        },
      );

      mapRef.current = map;
      markerRef.current = marker;

      // Force a resize pass after mount (dialog animation can mis-size the canvas)
      setTimeout(
        () => map.invalidateSize(),
        200,
      );

      return () => {
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    },
    [showMap],
  );

  // Sync marker when value updates from outside (e.g., autocomplete pick)
  useEffect(
    () => {
      if (!mapRef.current || !markerRef.current)
        return;
      if (value.lat && value.lng) {
        markerRef.current.setLatLng([
          value.lat,
          value.lng,
        ]);
        mapRef.current.setView(
          [
            value.lat,
            value.lng,
          ],
          14,
          { animate: true },
        );
      }
    },
    [
      value.lat,
      value.lng,
    ],
  );

  // Debounced search
  useEffect(
    () => {
      if (debounceRef.current)
        window.clearTimeout(debounceRef.current);
      if (query.trim().length < 3 || query === value.address) {
        setResults([]);
        return;
      }
      debounceRef.current = window.setTimeout(
        async () => {
          setIsSearching(true);
          try {
            const r = await searchAddress(query);
            setResults(r);
            setShowResults(true);
          }
          finally {
            setIsSearching(false);
          }
        },
        350,
      );
      return () => {
        if (debounceRef.current)
          window.clearTimeout(debounceRef.current);
      };
    },
    [
      query,
      value.address,
    ],
  );

  // Close dropdown on outside click
  useEffect(
    () => {
      const handler = (e: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setShowResults(false);
        }
      };
      document.addEventListener(
        "mousedown",
        handler,
      );
      return () => document.removeEventListener(
        "mousedown",
        handler,
      );
    },
    [],
  );

  const handleSelectResult = useCallback(
    (r: NominatimResult) => {
      const lat = Number.parseFloat(r.lat);
      const lng = Number.parseFloat(r.lon);
      setQuery(r.display_name);
      setShowResults(false);
      setResults([]);
      onChange({
        address: r.display_name,
        lat,
        lng,
      });
    },
    [onChange],
  );

  return (
    <div className={cn(
      "space-y-2",
      className,
    )}
    >
      {label && (
        <label className="text-sm font-medium leading-none flex items-center gap-2">
          <MapPin
            className="h-3.5 w-3.5"
            style={{ color: pinColor }}
          />
          {label}
        </label>
      )}

      <div
        ref={wrapperRef}
        className="relative"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            placeholder={placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="pl-9 pr-9"
          />
          {(isSearching || isReverseLoading) && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {showResults && results.length > 0 && (
          <div className="absolute z-[1000] mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-auto">
            {results.map(r => (
              <button
                key={r.place_id}
                type="button"
                onClick={() => handleSelectResult(r)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground border-b border-border/50 last:border-0 flex items-start gap-2"
              >
                <MapPin
                  className="h-3.5 w-3.5 mt-0.5 flex-shrink-0"
                  style={{ color: pinColor }}
                />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showMap && (
        <div
          ref={mapContainerRef}
          className={cn(
            "w-full rounded-md overflow-hidden border border-border bg-muted",
            mapHeightClassName,
          )}
        />
      )}
    </div>
  );
}
