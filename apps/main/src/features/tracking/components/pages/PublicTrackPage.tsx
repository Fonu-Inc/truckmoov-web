import { usePublicTrack } from "@truckmoov/api/fleet";
import {
  formatDateTime, formatRelative,
} from "@truckmoov/app-core/utils/time-utils";
import {
  MAP_ATTRIBUTION, MAP_TILES_LIGHT,
} from "@truckmoov/reusables/lib/map";
import L from "leaflet";
import {
  Loader2, Package,
} from "lucide-react";
import {
  useEffect, useRef,
} from "react";
import { useParams } from "react-router";
import "leaflet/dist/leaflet.css";

/**
 * Customer-facing live tracking link (TRU-FE-6 §6). No auth, no app chrome, and the
 * payload carries no driver, plate or tenant. Expired, revoked and never-existed are
 * one "gone" state on purpose — don't try to tell them apart.
 */
export default function PublicTrackPage() {
  const { token = "" } = useParams();
  const {
    data, isLoading, isError, refetch, isFetching,
  } = usePublicTrack(token);
  const mapEl = useRef<HTMLDivElement>(null);
  const track = data && data !== "gone" ? data : null;
  const position = track?.position ?? null;

  useEffect(
    () => {
      if (!mapEl.current || !position)
        return;
      const map = L.map(
        mapEl.current,
        { zoomControl: true },
      ).setView(
        [
          position.lat,
          position.lng,
        ],
        15,
      );
      L.tileLayer(
        MAP_TILES_LIGHT,
        { attribution: MAP_ATTRIBUTION },
      ).addTo(map);
      L.circleMarker(
        [
          position.lat,
          position.lng,
        ],
        {
          radius: 10, color: "#fff", weight: 3, fillColor: "#3b82f6", fillOpacity: 1,
        },
      ).addTo(map);
      return () => {
        map.remove();
      };
    },
    [
      position?.lat,
      position?.lng,
      position,
    ],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Only a 410 is "gone"; a network or server failure is worth retrying.
  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">We couldn't load this tracking link</h1>
          <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
          <button
            type="button"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (data === "gone" || !track) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">This tracking link is no longer available</h1>
          <p className="text-sm text-muted-foreground">Ask the sender for an up-to-date link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b p-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Package className="h-5 w-5 text-primary" />
          {track.job?.reference ? `Delivery ${track.job.reference}` : "Your delivery"}
        </h1>
        <p className="text-xs text-muted-foreground">
          {(track.job?.deliveryAddress ?? track.job?.dropoffAddress) && `To ${track.job?.deliveryAddress ?? track.job?.dropoffAddress} · `}
          {`Link expires ${formatDateTime(track.expiresAt)}`}
        </p>
      </header>
      {position
        ? (
            <>
              <div
                ref={mapEl}
                className="flex-1 min-h-[60vh]"
              />
              <p className="p-3 text-xs text-muted-foreground">{`Last updated ${formatRelative(position.fixedAt)}`}</p>
            </>
          )
        : <p className="p-6 text-sm text-muted-foreground">The vehicle hasn't reported a position yet.</p>}
    </div>
  );
}
